#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILED_STEPS=()

cd "$SCRIPT_DIR" || exit 1

run_step() {
    local title="$1"
    local script="$2"
    local target="$3"

    echo " -> $title ($target)..."

    if bash "$SCRIPT_DIR/$script" "$target"; then
        echo " ✓ Concluído: $script ($target)"
    else
        local status=$?
        echo " ✖ Erro em: $script ($target) (status $status)"
        echo "   Continuando para o próximo script..."
        FAILED_STEPS+=("$script ($target)")
    fi
}

# Descobre as subpastas de 1º nível que contêm arquivos de imagem (buscando recursivamente)
IMAGE_DIRS=()
while IFS= read -r -d '' dir; do
    has_image=0

    if find "$dir" -type f | grep -qEi '\.(jpg|jpeg|png|gif|webp|bmp|heic|heif)$'; then
        has_image=1
    else
        # Sem extensão conhecida: verifica se algum arquivo é imagem pelo conteúdo
        while IFS= read -r -d '' f; do
            case "$(file --brief --mime-type "$f" 2>/dev/null)" in
                image/*) has_image=1; break ;;
            esac
        done < <(find "$dir" -type f -print0)
    fi

    if [ "$has_image" -eq 1 ]; then
        IMAGE_DIRS+=("$dir")
    fi
done < <(find "$SCRIPT_DIR" -mindepth 1 -maxdepth 1 -type d -print0)

if [ "${#IMAGE_DIRS[@]}" -eq 0 ]; then
    echo "Nenhuma subpasta com imagens encontrada em: $SCRIPT_DIR"
    exit 1
fi

echo "Subpastas com imagens encontradas:"
printf ' - %s\n' "${IMAGE_DIRS[@]}"
echo

for dir in "${IMAGE_DIRS[@]}"; do
    echo ""
    echo "==== Processando: $dir ===="
    run_step "CONVERTENDO ARQUIVOS HEIC" "convert-heic.sh" "$dir"
    run_step "ORDENANDO IMAGENS" "ordenar-imagens-recursive.sh" "$dir"
    run_step "OTIMIZANDO TAMANHO DAS IMAGENS" "otimizar-imagens-recursive.sh" "$dir"
    run_step "OTIMIZANDO NOME DOS ARQUIVOS" "script-otimizar-nomes-arquivos.sh" "$dir"
done

echo ""
echo "FIM"

if [ "${#FAILED_STEPS[@]}" -gt 0 ]; then
    echo "Scripts com erro:"
    printf ' - %s\n' "${FAILED_STEPS[@]}"
    exit 1
fi
