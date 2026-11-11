import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Build-time rendering of the Android Gradle project files from typed settings.

export interface AndroidShellSettings {
  packageId: string;
  applicationName: string;
  minSdk: number;
}

export interface AndroidRenderOptions {
  // Folders (relative to the Android project) whose Kotlin and resource sources join the application, each containing src/main/java and optionally src/main/res.
  componentFolders?: string[];
  // Gradle dependency coordinates added to the application, for example "com.squareup.okhttp3:okhttp:4.12.0".
  dependencies?: string[];
  // Android permission names such as "android.permission.INTERNET".
  permissions?: string[];
  // Declares the camera as optional hardware (for applications that ask for CAMERA).
  cameraOptional?: boolean;
  // Activity class: ".MainActivity" is relative to packageId.
  activityName?: string;
  orientation?: "portrait" | "landscape" | "unspecified";
  compileSdk?: number;
  projectName?: string;
  // Prefix of the environment variables that carry the signing keystore, by reference (default: packageId's last word in capitals).
  signingPrefix?: string;
  allowCleartext?: boolean;
  // Applies the Kotlin serialization compiler plugin (for @Serializable classes).
  kotlinSerialization?: boolean;
}

export class SettingsError extends Error {}

const QUALIFIED = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;
const LABEL = /^[A-Za-z][A-Za-z0-9 -]{0,63}$/;
const MIN_SDK = 21;
const MAX_SDK = 36;

export interface ResolvedAndroidSettings extends AndroidShellSettings {
  compileSdk: number;
}

export function validateSettings(settings: AndroidShellSettings, options: AndroidRenderOptions = {}): ResolvedAndroidSettings {
  if (typeof settings.packageId !== "string" || !QUALIFIED.test(settings.packageId)) throw new SettingsError("packageId must be lower-case words separated by dots");
  if (typeof settings.applicationName !== "string" || !LABEL.test(settings.applicationName)) throw new SettingsError("applicationName must be a label");
  const compileSdk = options.compileSdk ?? MAX_SDK;
  if (!Number.isInteger(compileSdk) || compileSdk < MIN_SDK || compileSdk > 99) throw new SettingsError("compileSdk must be a whole number");
  if (!Number.isInteger(settings.minSdk) || settings.minSdk < MIN_SDK || settings.minSdk > compileSdk) throw new SettingsError(`minSdk must be a whole number from ${MIN_SDK} to compileSdk`);
  return { ...settings, compileSdk };
}

const TOKEN = /\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g;

// {{name}} inserts the named value as written; the caller validates values first. Unknown or malformed tokens are errors.
export function fill(template: string, values: Record<string, string | number>): string {
  if (template.replace(TOKEN, "").includes("{{")) throw new SettingsError("template has a malformed token");
  return template.replace(TOKEN, (_match, name: string) => {
    if (!Object.hasOwn(values, name)) throw new SettingsError(`template names unknown value ${name}`);
    return String(values[name]);
  });
}

const template = (name: string) => readFileSync(new URL(`./templates/${name}.template`, import.meta.url), "utf8");

function checkOptions(options: AndroidRenderOptions): void {
  for (const folder of options.componentFolders ?? []) if (!/^(\.\.\/)*[A-Za-z0-9_][A-Za-z0-9_./-]*$/.test(folder) || folder.includes("/../")) throw new SettingsError(`component folder ${folder} must be a plain relative path`);
  for (const dependency of options.dependencies ?? []) if (!/^[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+:[A-Za-z0-9_.+-]+$/.test(dependency)) throw new SettingsError(`dependency ${dependency} must be group:name:version`);
  for (const permission of options.permissions ?? []) if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(permission)) throw new SettingsError(`permission ${permission} is not a permission name`);
  if (options.activityName !== undefined && !/^\.?[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)*$/.test(options.activityName)) throw new SettingsError("activityName must be a class name");
  if (options.signingPrefix !== undefined && !/^[A-Z][A-Z0-9_]{0,63}$/.test(options.signingPrefix)) throw new SettingsError("signingPrefix must be capitals, digits and underscores");
  if (options.projectName !== undefined && !LABEL.test(options.projectName)) throw new SettingsError("projectName must be a label");
  if (options.orientation !== undefined && !["portrait", "landscape", "unspecified"].includes(options.orientation)) throw new SettingsError("orientation must be portrait, landscape or unspecified");
}

export function renderAppBuild(settings: ResolvedAndroidSettings, options: AndroidRenderOptions = {}): string {
  checkOptions(options);
  const folders = options.componentFolders ?? [];
  const sourceSets = folders.length
    ? "\n" + ["    listOf(" + folders.map((folder) => JSON.stringify(folder)).join(", ") + ").forEach { folder ->",
      '        sourceSets.getByName("main").java.srcDir("../$folder/src/main/java")',
      '        sourceSets.getByName("main").res.srcDir("../$folder/src/main/res")',
      "    }"].join("\n") + "\n"
    : "";
  const dependencies = (options.dependencies ?? []).map((dependency) => `    implementation(${JSON.stringify(dependency)})\n`).join("");
  return fill(template("app.build.gradle.kts"), {
    packageId: settings.packageId, applicationName: settings.applicationName, minSdk: settings.minSdk, compileSdk: settings.compileSdk,
    signingPrefix: options.signingPrefix ?? signingPrefix(settings.packageId), componentSourceSets: sourceSets, dependencies,
    plugins: options.kotlinSerialization ? '    id("org.jetbrains.kotlin.plugin.serialization")\n' : "",
  });
}

export function signingPrefix(packageId: string): string {
  return packageId.split(".").pop()!.toUpperCase();
}

export function renderManifest(settings: ResolvedAndroidSettings, options: AndroidRenderOptions = {}): string {
  checkOptions(options);
  const permissions = (options.permissions ?? []).map((name) => `    <uses-permission android:name="${name}" />\n`).join("")
    + (options.cameraOptional ? '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n' : "");
  let manifest = fill(template("AndroidManifest.xml"), {
    permissions, activityName: options.activityName ?? ".MainActivity", orientation: options.orientation ?? "portrait",
  });
  if (options.allowCleartext) manifest = manifest.replace('android:allowBackup="false"', 'android:allowBackup="false"\n        android:usesCleartextTraffic="true"');
  return manifest.replace("\n\n\n", "\n\n");
}

// Output path (relative to the Android project folder) to file text.
export function renderAndroid(settings: AndroidShellSettings, options: AndroidRenderOptions = {}): Record<string, string> {
  const resolved = validateSettings(settings, options);
  checkOptions(options);
  return {
    "settings.gradle.kts": fill(template("settings.gradle.kts"), { projectName: options.projectName ?? settings.applicationName }),
    "build.gradle.kts": template("build.gradle.kts"),
    "gradle.properties": template("gradle.properties"),
    "gradle/wrapper/gradle-wrapper.properties": template("gradle/wrapper/gradle-wrapper.properties"),
    "app/build.gradle.kts": renderAppBuild(resolved, options),
    "app/src/main/AndroidManifest.xml": renderManifest(resolved, options),
    "app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml": template("ic_launcher.xml"),
    "app/src/main/res/drawable/ic_launcher_background.xml": template("app/src/main/res/drawable/ic_launcher_background.xml"),
    "app/src/main/res/drawable/ic_launcher_foreground.xml": template("app/src/main/res/drawable/ic_launcher_foreground.xml"),
  };
}

export function writeAndroid(directory: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    const target = join(directory, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  }
}
