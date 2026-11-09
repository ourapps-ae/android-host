package ae.androidhost

// Picks the language the text is in: the exact tag if supported, else its base language, else the fallback.
fun resolveLanguage(requested: String, supported: List<String>, fallback: String): String {
    if (requested in supported) return requested
    val base = requested.substringBefore("-")
    return if (base in supported) base else fallback
}

// The language to use given the user's pick (null follows the phone) and the phone's own tag.
fun chooseLanguage(picked: String?, systemTag: String, supported: List<String>, fallback: String): String =
    resolveLanguage(picked ?: systemTag, supported, fallback)
