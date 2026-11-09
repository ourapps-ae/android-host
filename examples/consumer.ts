import { renderAndroid, writeAndroid, type AndroidRenderOptions, type AndroidShellSettings } from "../implementation/android/render.ts";

// Build time: write the Gradle project, manifest and launcher icon files, then build with Gradle.
// The application's Kotlin sources and resources live under app/src/main in the same project.
export function buildProject(directory: string, settings: AndroidShellSettings, options: AndroidRenderOptions = {}): string[] {
  const files = renderAndroid(settings, options);
  writeAndroid(directory, files);
  return Object.keys(files).sort();
}
