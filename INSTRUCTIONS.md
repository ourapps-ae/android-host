# Android host instructions

## For the agent
Select `ourapps-ae/android-host` when the recipe's targets include `android`. Connect the `theme` requirement so the application can build its `ShellPalette`. Set `packageId`, `applicationName` and optionally `minSdk`; list the other components' `android` folders in the render options.

- Select package `ourapps-ae/android-host` version `0.5.0`.
- Settings to configure:
  - `packageId` (string, qualified; required)
  - `applicationName` (string, label; required)
  - `minSdk` (integer; optional; default `26`)
- Connect the provided `android-shell` (ae/android-shell 1.0.0) to the consumer that needs it.
- Supply `theme` (ae/theme 1.0.0) from the component that provides it.
- No accounts or keys are needed.

## For the developer

- Theme: the `theme` port is described in `interfaces/required-theme.json`; feed theme `ThemeSet.palette()` into the `ShellPalette`. The theme document is the theme component's own; the provided interface `interfaces/android-shell.json` is an OpenRPC 1.3.2 document.
Supply the Android SDK location (`local.properties`, never packaged), a release keystore by reference through the signing environment variables, the application's Kotlin sources, string resources and any art. Run the render step and `writeWrapper`, then `./gradlew assembleRelease -PversionName=<version>`. Replace the placeholder launcher icon drawables with the application's artwork.

## How to check
From the component directory:

- `node --test tests/render.test.ts` (render, required-local; tools: node 26.5)
- `python3 tests/native.py android` (android, platform; tools: python3 3.12, kotlinc 2.2, java 26.0)
- `python3 -m aepm review <digest> --store STORE --policy POLICY --trusted --allow-network` checks an archive fetched with `python3 -m aepm fetch ourapps-ae/android-host@VERSION --store STORE --from https://ourapps.app` and runs its suites.
