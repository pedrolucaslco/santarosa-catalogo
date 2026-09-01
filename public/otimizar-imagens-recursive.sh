#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -x "$SCRIPT_DIR/.venv-img/bin/python" ]; then
    PYTHON="$SCRIPT_DIR/.venv-img/bin/python"
else
    PYTHON="python3"
fi

"$PYTHON" "$SCRIPT_DIR/otimizar-imagens-recursive.py" "$@"
