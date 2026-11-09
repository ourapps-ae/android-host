// The language choice of ShellLanguage in LanguageChoice.kt, for build tools and tests that
// must agree with the application: exact tag, then base language, then the fallback.
export function resolveLanguage(requested: string, supported: string[], fallback: string): string {
  if (supported.includes(requested)) return requested;
  const base = requested.split("-")[0];
  return supported.includes(base) ? base : fallback;
}

export function chooseLanguage(picked: string | null, systemTag: string, supported: string[], fallback: string): string {
  return resolveLanguage(picked ?? systemTag, supported, fallback);
}
