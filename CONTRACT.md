# Android host component

## Purpose and facilities
The Android side of an application: one Compose activity base class (`ShellActivity`) that applies the colour palette, the chosen language and the permission request, and reports lifecycle events; a language holder (`ShellLanguage`) that remembers the pick and wraps the activity context; and the Gradle project (settings, root and application build files, wrapper properties), manifest and adaptive launcher icon rendered from typed settings. The application supplies its screens, resources and component source folders.

Facilities: `android-shell` (Android Compose application shell).

## User inputs
The installer collects `packageId` (lower-case words separated by dots), `applicationName` and `minSdk` (default 26). Render options (not collected) name component source folders, extra Gradle dependencies, permissions, orientation, the activity class and the signing variable prefix.

- `packageId` (string, qualified; required)
- `applicationName` (string, label; required)
- `minSdk` (integer; optional; default `26`)

## Artefacts and dependencies
`component.json` maps every `implementation/` source into `components/android-host/`:

- `implementation/android/language.ts` -> `components/android-host/android/language.ts`
- `implementation/android/render.ts` -> `components/android-host/android/render.ts`
- `implementation/android/settings.ts` -> `components/android-host/android/settings.ts` (template: aepm renders `androidHostSettings` from the three settings)
- `implementation/android/src/main/java/ae/androidhost/LanguageChoice.kt` -> `components/android-host/android/src/main/java/ae/androidhost/LanguageChoice.kt`
- `implementation/android/src/main/java/ae/androidhost/ShellActivity.kt` -> `components/android-host/android/src/main/java/ae/androidhost/ShellActivity.kt`
- `implementation/android/src/main/java/ae/androidhost/ShellLanguage.kt` -> `components/android-host/android/src/main/java/ae/androidhost/ShellLanguage.kt`
- `implementation/android/src/main/java/ae/androidhost/ShellPalette.kt` -> `components/android-host/android/src/main/java/ae/androidhost/ShellPalette.kt`
- `implementation/android/templates/AndroidManifest.xml.template` -> `components/android-host/android/templates/AndroidManifest.xml.template`
- `implementation/android/templates/app.build.gradle.kts.template` -> `components/android-host/android/templates/app.build.gradle.kts.template`
- `implementation/android/templates/app/src/main/res/drawable/ic_launcher_background.xml.template` -> `components/android-host/android/templates/app/src/main/res/drawable/ic_launcher_background.xml.template`
- `implementation/android/templates/app/src/main/res/drawable/ic_launcher_foreground.xml.template` -> `components/android-host/android/templates/app/src/main/res/drawable/ic_launcher_foreground.xml.template`
- `implementation/android/templates/build.gradle.kts.template` -> `components/android-host/android/templates/build.gradle.kts.template`
- `implementation/android/templates/gradle.properties.template` -> `components/android-host/android/templates/gradle.properties.template`
- `implementation/android/templates/gradle/wrapper/gradle-wrapper.properties.template` -> `components/android-host/android/templates/gradle/wrapper/gradle-wrapper.properties.template`
- `implementation/android/templates/ic_launcher.xml.template` -> `components/android-host/android/templates/ic_launcher.xml.template`
- `implementation/android/templates/settings.gradle.kts.template` -> `components/android-host/android/templates/settings.gradle.kts.template`

Dependencies: none.
`tools.lock.json` pins verification tools: node 26.5.0, python3 3.12.8, kotlinc 2.2.0, java 26.0.1. Licence wording remains deferred.

## Provided interfaces
- `interfaces/android-shell.json` defines `android-shell` (ae/android-shell) version 1.0.0 as an OpenRPC 1.3.2 document. Methods tagged `typescript` are the build-time functions of `android/render.ts` and `android/language.ts` (`renderAndroid`, `writeAndroid`, `validateSettings`, `resolveLanguage`, `chooseLanguage`); methods tagged `kotlin` are the public Kotlin API of package `ae.androidhost` (`resolveLanguage`, `chooseLanguage`, `parseColour`, `ShellPalette.toColorScheme`, `ShellActivity`, `ShellLanguage` and its methods). Parameters and results are JSON Schema 2020-12; Android values with no JSON form (Context, composables, callbacks) are described by name. `SettingsError` is listed where a setting breaks its grammar.

## Required interfaces
- `theme` (ae/theme) version 1.0.0, supplied by the recipe or application. `interfaces/required-theme.json` is a copy of the theme component's interface document; android-host uses theme `ThemeSet.palette()` for the `ShellPalette`.

## Integration
In an installed application, `settings` is `androidHostSettings` from the rendered `android/settings.ts`; `options.kotlinSerialization` applies the Kotlin serialization compiler plugin. At build time call `renderAndroid(settings, options)` from `android/render.ts` and write the result with `writeAndroid` into the Android project folder. `options.componentFolders` lists the folders of other components (each with `src/main/java` and optionally `src/main/res`) compiled into the application. In Kotlin subclass `ShellActivity`, override `palette`, `Content()` and optionally `permissions`, `language` and the lifecycle hooks (`examples/MainActivity.kt`). Build with Gradle; the wrapper jar and `gradlew` scripts are not shipped, so run `gradle wrapper` once or use a local Gradle. `examples/consumer.ts` writes the project without any game.

## Visual definition and connected examples
`visual/definition.json` maps its ports to the provided and required interfaces. `visual/examples/connected.json` connects the component to an illustrative application consumer. Both image formats and a text description are in `visual/output/`.

## Infrastructure
No service is deployed. Building needs a JDK 17, the Android SDK and network access to Google's Maven repository and Maven Central. Release signing reads a keystore path and passwords from environment variables named `<PREFIX>_KEYSTORE`, `<PREFIX>_KEYSTORE_PASSWORD`, `<PREFIX>_KEY_ALIAS` and `<PREFIX>_KEY_PASSWORD`, supplied by reference at release time; no signing material is stored here. Play Store publishing belongs to the release pipeline.

## Verification
`node --test tests/render.test.ts` renders the fixture application and checks the Gradle files, manifest, icon files, option validation and that no signing value is written; it also checks the language rules against the same fixture as the Kotlin check. `python3 tests/native.py android` compiles the pure Kotlin sources (language choice and colour parsing) with kotlinc 2.2.0 and runs the Kotlin check on the JVM; kotlinc is not installed on the authoring machine, so that suite and the Compose activity were not compiled or run, and the generated Gradle project was not built.

- `node --test tests/render.test.ts` (render, required-local; tools: node 26.5.0)
- `python3 tests/native.py android` (android, platform; tools: python3 3.12.8, kotlinc 2.2.0, java 26.0.1)

## Scenarios and presentation
A portrait phone application asks for camera and microphone at start and is told whether they were granted; a language picked in the application takes effect when the activity is recreated; with no pick the phone's language is used, falling back to English.

## Updates and removal
Patch updates replace the owned files; render the project again after each update, keeping any hand-edited Gradle files out of the rendered set. Removal deletes the owned sources and the rendered project files. No application data is held.
