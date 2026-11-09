# Local workflow

Local only: repository `ourapps-ae/android-host` has no commits, pushes, remote changes or publishing without George's say-so. Licence wording remains deferred (`licenceStatus: "deferred"`).
Do not edit `mcinpoker/`, `skull/`, `aepm/`, `OurPoker/proof/` or `OurPoker/recipe/`.
Regenerate: `python3.12 -B /Users/george/Projects/com/my/tools/scaffold_component.py components/android-host --spec components/android-host/authoring/spec.json --render`.
Check: `python3.12 -B /Users/george/Projects/com/my/tools/check_component.py components/android-host`. Suite commands (from the package root): `node --test tests/render.test.ts`; `python3 tests/native.py android`.
Always run Python with `-B`; never write bytecode into the repository.
