#!/bin/bash

# Percorre arquivos do diretório atual (não recursivo)
for file in *; do
  # Ignora se não for arquivo
  [ -f "$file" ] || continue

  # Conta ocorrências de R$
  count=$(echo "$file" | grep -o 'R\$' | wc -l)

  if [ "$count" -eq 1 ]; then

    # Nome da pasta atual
    folder=$(basename "$PWD")

    # Remove extensão
    name="${file%.*}"
    ext="${file##*.}"

    # Separa antes e depois do R$
    before=$(echo "$name" | sed -E 's/(.*)R\$[[:space:]]*[0-9]+,[0-9]+/\1/')
    value=$(echo "$name" | grep -oE 'R\$[[:space:]]*[0-9]+,[0-9]+' | head -1)

    # Remove espaços extras no final
    before=$(echo "$before" | sed 's/[[:space:]]*$//')

    # Monta novo nome
    newname="${before} de ${value} por ${folder}.${ext}"

    echo "Renomeando:"
    echo "$file"
    echo "→ $newname"
    echo

    mv "$file" "$newname"
  fi
done
