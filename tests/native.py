"""Compile the pure Kotlin sources (no Android library) with the Kotlin check and run it. Needs kotlinc and java."""
from pathlib import Path
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
if sys.argv[1:] != ["android"]:
    raise SystemExit("expected android")
sources = [p for p in sorted((root / "implementation/android/src/main/java").rglob("*.kt"))
           if "import android" not in p.read_text() and "import androidx" not in p.read_text()]
with tempfile.TemporaryDirectory() as directory:
    jar = str(Path(directory) / "checks.jar")
    subprocess.run(["kotlinc", *map(str, sources), str(root / "tests/android/Main.kt"), "-include-runtime", "-d", jar], check=True)
    subprocess.run(["java", "-jar", jar], cwd=root, check=True)
