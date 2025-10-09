#!/bin/bash

# Caminho da pasta base
BASE_DIR="products"

# Faz varredura recursiva na pasta e subpastas
find "$BASE_DIR" -type f | while read -r file; do
    # Extrai diretório e nome do arquivo
    dir=$(dirname "$file")
    filename=$(basename "$file")

    # Verifica se contém o símbolo +
    if [[ "$filename" == *"+"* ]]; then
        # Substitui + por "mais"
        new_filename="${filename//+/_mais_}"
        # (se quiser sem underline: new_filename="${filename//+/"mais"}")

        # Renomeia o arquivo
        mv "$file" "$dir/$new_filename"
        echo "Renomeado: $file → $dir/$new_filename"
    fi
done
