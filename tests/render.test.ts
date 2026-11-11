import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fill, renderAndroid, renderManifest, signingPrefix, SettingsError, validateSettings } from "../implementation/android/render.ts";
import { chooseLanguage, resolveLanguage } from "../implementation/android/language.ts";
import { buildProject } from "../examples/consumer.ts";

const fixture = JSON.parse(readFileSync(new URL("fixtures/application.json", import.meta.url), "utf8"));
const languages = JSON.parse(readFileSync(new URL("fixtures/languages.json", import.meta.url), "utf8"));
const { settings, options } = fixture;
const files = renderAndroid(settings, options);

test("every Gradle, manifest and icon file is written", () => {
  assert.deepEqual(Object.keys(files).sort(), [
    "app/build.gradle.kts", "app/src/main/AndroidManifest.xml", "app/src/main/res/drawable/ic_launcher_background.xml",
    "app/src/main/res/drawable/ic_launcher_foreground.xml", "app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
    "build.gradle.kts", "gradle.properties", "gradle/wrapper/gradle-wrapper.properties", "settings.gradle.kts"]);
  for (const text of Object.values(files)) assert.doesNotMatch(text, /\{\{|\}\}/);
});

test("application build file carries package id, name, minimum version and signing names", () => {
  const build = files["app/build.gradle.kts"];
  assert.match(build, /namespace = "app.example.demo"/);
  assert.match(build, /applicationId = "app.example.demo"/);
  assert.match(build, /manifestPlaceholders\["applicationName"\] = "Demo App"/);
  assert.match(build, /minSdk = 26/);
  assert.match(build, /compileSdk = 36/);
  assert.match(build, /System.getenv\("DEMO_KEYSTORE"\)/);
  assert.match(build, /System.getenv\("DEMO_KEY_PASSWORD"\)/);
  assert.match(build, /listOf\("\.\.\/components\/other\/android"\)/);
  assert.match(build, /implementation\("com.squareup.okhttp3:okhttp:4.12.0"\)/);
  assert.doesNotMatch(build, /livekit|serialization|ourpoker/i);
});

test("no signing value is written, only environment variable names", () => {
  for (const text of Object.values(files)) assert.doesNotMatch(text, /storePassword = "|keyPassword = "|keyAlias = "/);
});

test("manifest has the permissions, the activity and the label placeholder", () => {
  const manifest = files["app/src/main/AndroidManifest.xml"];
  assert.match(manifest, /<uses-permission android:name="android.permission.CAMERA" \/>/);
  assert.match(manifest, /android.hardware.camera" android:required="false"/);
  assert.match(manifest, /android:label="\$\{applicationName\}"/);
  assert.match(manifest, /android:name="\.MainActivity"/);
  assert.match(manifest, /android:screenOrientation="portrait"/);
  assert.doesNotMatch(manifest, /usesCleartextTraffic/);
  assert.match(renderManifest(validateSettings(settings), { allowCleartext: true, activityName: "app.example.demo.Start", orientation: "unspecified" }), /usesCleartextTraffic="true"[\s\S]*android:name="app.example.demo.Start"[\s\S]*unspecified/);
});

test("the Kotlin serialization plugin is applied only when asked for", () => {
  assert.match(renderAndroid(settings, { ...options, kotlinSerialization: true })["app/build.gradle.kts"], /\n    id\("org.jetbrains.kotlin.plugin.serialization"\)\n\}/);
  assert.match(files["build.gradle.kts"], /id\("org.jetbrains.kotlin.plugin.serialization"\) version "2.3.20" apply false/);
});

test("settings.ts is rendered by aepm at install from every setting", { skip: !existsSync(new URL("../component.json", import.meta.url)) && "component.json is not in this copy" }, () => {
  const manifest = JSON.parse(readFileSync(new URL("../component.json", import.meta.url), "utf8"));
  assert.deepEqual(manifest.artefacts.find((item: { source: string }) => item.source === "implementation/android/settings.ts"),
    { source: "implementation/android/settings.ts", destination: "components/android-host/android/settings.ts", template: true, executable: false });
  const text = readFileSync(new URL("../implementation/android/settings.ts", import.meta.url), "utf8");
  assert.deepEqual([...text.matchAll(/\{\{([A-Za-z]+)\}\}/g)].map((match) => match[1]), manifest.collect.map((item: { id: string }) => item.id));
});

test("optional parts are left out when not asked for", () => {
  const plain = renderAndroid(settings, {});
  assert.doesNotMatch(plain["app/build.gradle.kts"], /listOf\(|okhttp|plugin.serialization/);
  assert.doesNotMatch(plain["app/src/main/AndroidManifest.xml"], /uses-permission|uses-feature/);
});

test("settings are validated", () => {
  const bad = (change: Record<string, unknown>) => assert.throws(() => renderAndroid({ ...settings, ...change }, options), SettingsError);
  bad({ packageId: "Demo" });
  bad({ packageId: "app.Example.demo" });
  bad({ packageId: "app" });
  bad({ applicationName: 'Demo"App' });
  bad({ minSdk: 20 });
  bad({ minSdk: 26.5 });
  bad({ minSdk: 99 });
  bad({ minSdk: "26" });
  assert.throws(() => renderAndroid(settings, { compileSdk: 25 }), SettingsError);
});

test("options that could inject text are refused", () => {
  const bad = (change: Record<string, unknown>) => assert.throws(() => renderAndroid(settings, change as never), SettingsError);
  bad({ componentFolders: ["/abs"] });
  bad({ componentFolders: ["a/../b"] });
  bad({ dependencies: ['x:y:1") ; evil("'] });
  bad({ permissions: ['x"/><evil'] });
  bad({ activityName: "bad name" });
  bad({ signingPrefix: "lower" });
  bad({ orientation: "sideways" });
});

test("signing prefix defaults to the last word of the package id", () => {
  assert.equal(signingPrefix("app.ourapps.ourpoker"), "OURPOKER");
  assert.match(renderAndroid(settings, { signingPrefix: "RELEASE" })["app/build.gradle.kts"], /getenv\("RELEASE_KEYSTORE"\)/);
});

test("template filler refuses unknown and malformed tokens", () => {
  assert.equal(fill("a {{x}} b", { x: 3 }), "a 3 b");
  assert.throws(() => fill("{{nope}}", {}), SettingsError);
  assert.throws(() => fill("{{ x }}", { x: 1 }), SettingsError);
});

test("language choice agrees with the Kotlin implementation's cases", () => {
  for (const [requested, expected] of languages.cases) assert.equal(resolveLanguage(requested, languages.supported, languages.fallback), expected, requested);
  assert.equal(chooseLanguage("es", "fr-FR", languages.supported, "en"), "es");
  assert.equal(chooseLanguage(null, "fr-FR", languages.supported, "en"), "fr");
});

test("the Kotlin check covers the same cases as the fixture", () => {
  const kotlin = readFileSync(new URL("android/Main.kt", import.meta.url), "utf8");
  for (const [requested, expected] of languages.cases) if (requested) assert.ok(kotlin.includes(`resolveLanguage("${requested}", supported`) || kotlin.includes(`"${requested}"`), `Main.kt checks ${requested}`);
});

test("consumer writes the project to disk", () => {
  const directory = mkdtempSync(join(tmpdir(), "android-host-"));
  const written = buildProject(directory, settings, options);
  assert.equal(written.length, 9);
  assert.deepEqual(readdirSync(directory).sort(), ["app", "build.gradle.kts", "gradle", "gradle.properties", "settings.gradle.kts"]);
  assert.equal(readFileSync(join(directory, "app/build.gradle.kts"), "utf8"), files["app/build.gradle.kts"]);
});
