#!/bin/bash
cd ./products || exit 1  # entra na pasta products, ou sai se der erro

i=0
for file in *; do
  [ -f "$file" ] || continue

  # Corrige o símbolo R$ grudado
  corrected_name="$(echo "$file" | sed 's/R\$\([0-9]\)/R$ \1/g')"

  # Remove todos os prefixos tipo "123. ", "001. ", "9. ", etc., mesmo que venham repetidos
  clean_name="$(echo "$corrected_name" | sed -E 's/^([0-9]+\.\s*)+//')"

  # Adiciona novo prefixo sequencial
  new_name="$(printf "%03d. %s" "$i" "$clean_name")"

  mv -- "$file" "$new_name"
  ((i++))
done

