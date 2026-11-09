package ae.androidhost

import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

fun ShellPalette.toColorScheme(): ColorScheme = darkColorScheme(
    primary = Color(primary),
    secondary = Color(secondary),
    background = Color(background),
    surface = Color(surface),
    onPrimary = Color(onPrimary),
)

// The one activity of the application. The application subclasses it, names its permissions,
// language and palette, and supplies the content.
abstract class ShellActivity : ComponentActivity() {
    // Permissions asked at start; the result is reported to onPermissionsChecked.
    protected open val permissions: List<String> = emptyList()

    // Null follows the phone's language.
    protected open val language: ShellLanguage? = null

    protected abstract val palette: ShellPalette

    @Composable
    protected abstract fun Content()

    protected open fun onShellCreated() {}

    // Called with whether every requested permission is granted, and the result per permission.
    protected open fun onPermissionsChecked(allGranted: Boolean, result: Map<String, Boolean>) {}

    protected open fun onShellResumed() {}

    protected open fun onShellPaused() {}

    private val askPermissions = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        onPermissionsChecked(permissions.all { result[it] == true }, result)
    }

    override fun attachBaseContext(newBase: Context) {
        super.attachBaseContext(language?.wrap(newBase) ?: newBase)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        onShellCreated()
        setContent {
            MaterialTheme(colorScheme = palette.toColorScheme()) {
                Surface { Content() }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        if (permissions.isEmpty()) return
        if (permissions.all { checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }) {
            onPermissionsChecked(true, permissions.associateWith { true })
        } else {
            askPermissions.launch(permissions.toTypedArray())
        }
    }

    override fun onResume() {
        super.onResume()
        onShellResumed()
    }

    override fun onPause() {
        super.onPause()
        onShellPaused()
    }
}
