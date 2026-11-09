package ae.androidhost

// Colours as 0xAARRGGBB numbers, so they come from a theme without any Android type.
data class ShellPalette(
    val primary: Long,
    val secondary: Long,
    val background: Long,
    val surface: Long,
    val onPrimary: Long,
)

// "#rrggbb" or "#aarrggbb" to 0xAARRGGBB; null when the text is not a colour.
fun parseColour(text: String): Long? {
    if (!text.startsWith("#")) return null
    val digits = text.substring(1)
    if (digits.length != 6 && digits.length != 8) return null
    if (!digits.all { it in '0'..'9' || it in 'a'..'f' || it in 'A'..'F' }) return null
    val value = digits.toLong(16)
    return if (digits.length == 6) 0xFF000000L or value else value
}
