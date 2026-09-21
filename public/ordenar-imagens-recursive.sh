#!/bin/bash
TARGET_DIR="${1:-products}"
cd "$TARGET_DIR" || exit 1  # entra na pasta alvo, ou sai se der erro

# percorre todos os arquivos (exceto diretórios) dentro de $TARGET_DIR recursivamente
while IFS= read -r -d '' file; do
  dir="$(dirname "$file")"
  base="$(basename "$file")"

  # Separa nome e extensão para não conflitar com o "." da extensão
  ext="${base##*.}"
  name="${base%.*}"

  # Corrige o símbolo R$ grudado
  corrected_name="$(echo "$name" | sed 's/R\$\([0-9]\)/R$ \1/g')"

  # Remove todos os prefixos tipo "123. ", "001. ", "9. ", etc., mesmo que venham repetidos
  clean_name="$(echo "$corrected_name" | sed -E 's/^([0-9]+\.\s*)+//')"

  new_name="$clean_name.$ext"

  # Renomeia dentro da mesma pasta (silencioso em caso de sobrescrita)
  if [ "$new_name" != "$base" ]; then
    mv -- "$file" "$dir/$new_name"
  fi
done < <(find . -type f -print0)

