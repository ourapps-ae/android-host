package ae.androidhost

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import android.os.LocaleList
import java.util.Locale

// The application's language: the one picked inside the application, else the phone's. The
// activity's context carries it, so a change takes effect when the activity is recreated.
class ShellLanguage(
    private val preferencesName: String,
    // Language code to display name, for a picker.
    val all: List<Pair<String, String>>,
    private val fallback: String = "en",
) {
    fun picked(context: Context): String? = context.getSharedPreferences(preferencesName, 0).getString("lang", null)

    // null goes back to the phone's language.
    fun pick(context: Context, code: String?) {
        context.getSharedPreferences(preferencesName, 0).edit().apply {
            if (code == null) remove("lang") else putString("lang", code)
        }.commit()
    }

    // The language the text is in.
    fun current(context: Context): String =
        chooseLanguage(picked(context), Resources.getSystem().configuration.locales[0].toLanguageTag(), all.map { it.first }, fallback)

    fun wrap(base: Context): Context {
        val code = picked(base) ?: return base
        val configuration = Configuration(base.resources.configuration)
        configuration.setLocales(LocaleList(Locale.forLanguageTag(code)))
        return base.createConfigurationContext(configuration)
    }
}
