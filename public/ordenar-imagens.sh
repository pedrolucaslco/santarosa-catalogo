#!/bin/bash
cd ./products || exit 1 # Entra na pasta products, ou sai se falhar

i=0
for file in *; do
    # Skip if it's not a regular file
    [ -f "$file" ] || continue

    # Corrige R$129,90 -> R$ 129,90 no nome do arquivo
    corrected_name="$(echo "$file" | sed 's/R\$\([0-9]\)/R$ \1/g')"

    # Adiciona número antes do nome
    new_name="$(printf "%d. %s" "$i" "$corrected_name")"

    # Renomeia
    mv -- "$file" "$new_name"
    
    # Increment counter
    ((i++))
done
