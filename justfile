alias p := publish

publish version:
  #!/usr/bin/env bash
  set -euo pipefail
  pnpm build
  newversion=`pnpm version {{version}} -m "Release %s" --tag-version-prefix=`
  echo Preparing $newversion
  pnpm publish --access public --no-git-checks
