package app.example.demo

import android.Manifest
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import ae.androidhost.ShellActivity
import ae.androidhost.ShellLanguage
import ae.androidhost.ShellPalette

// Run time: the application's one activity; the shell handles the window, theme, language and permissions.
class MainActivity : ShellActivity() {
    override val permissions = listOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
    override val language = ShellLanguage("demo", listOf("en" to "English", "fr" to "Français"))
    override val palette = ShellPalette(primary = 0xFFE0B35A, secondary = 0xFF9FB3C8, background = 0xFF120A10, surface = 0xFF26241F, onPrimary = 0xFF1B1A17)

    @Composable
    override fun Content() {
        Text("Demo")
    }

    override fun onPermissionsChecked(allGranted: Boolean, result: Map<String, Boolean>) {
        // Tell the application whether camera and microphone may be used.
    }
}
