#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILED_STEPS=()

cd "$SCRIPT_DIR" || exit 1

run_step() {
    local title="$1"
    local script="$2"

    echo " -> $title..."

    if bash "$script"; then
        echo " ✓ Concluído: $script"
    else
        local status=$?
        echo " ✖ Erro em: $script (status $status)"
        echo "   Continuando para o próximo script..."
        FAILED_STEPS+=("$script")
    fi
}

run_step "CONVERTENDO ARQUIVOS HEIC" "convert-heic.sh"
run_step "ORDENANDO IMAGENS" "ordenar-imagens-recursive.sh"
run_step "OTIMIZANDO TAMANHO DAS IMAGENS" "otimizar-imagens-recursive.sh"
run_step "OTIMIZANDO NOME DOS ARQUIVOS" "script-otimizar-nomes-arquivos.sh"

echo "FIM"

if [ "${#FAILED_STEPS[@]}" -gt 0 ]; then
    echo "Scripts com erro:"
    printf ' - %s\n' "${FAILED_STEPS[@]}"
    exit 1
fi
