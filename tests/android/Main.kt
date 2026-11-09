import ae.androidhost.chooseLanguage
import ae.androidhost.parseColour
import ae.androidhost.resolveLanguage

fun main() {
    val supported = listOf("en", "fr", "de", "es")
    check(resolveLanguage("fr", supported, "en") == "fr")
    check(resolveLanguage("fr-CA", supported, "en") == "fr")
    check(resolveLanguage("de-AT", supported, "en") == "de")
    check(resolveLanguage("ja", supported, "en") == "en")
    check(resolveLanguage("", supported, "en") == "en")
    check(resolveLanguage("pt-BR", supported, "es") == "es")
    check(chooseLanguage("es", "fr-FR", supported, "en") == "es")
    check(chooseLanguage(null, "fr-FR", supported, "en") == "fr")
    check(chooseLanguage(null, "ja-JP", supported, "en") == "en")
    check(parseColour("#E0B35A") == 0xFFE0B35AL)
    check(parseColour("#80E0B35A") == 0x80E0B35AL)
    check(parseColour("#120a10") == 0xFF120A10L)
    check(parseColour("120a10") == null)
    check(parseColour("#12") == null)
    check(parseColour("#12345g") == null)
    println("15 android-host assertions passed")
}
