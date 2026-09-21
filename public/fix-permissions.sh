#!/bin/bash

CAMINHO="${1:-.}"

echo "Corrigindo permissões em: $CAMINHO"

# Garante que seu usuário seja dono dos arquivos
sudo chown -R "$USER:$USER" "$CAMINHO"

# Diretórios: leitura + execução
find "$CAMINHO" -type d -exec chmod 755 {} \;

# Arquivos: leitura + escrita para o dono
find "$CAMINHO" -type f -exec chmod 644 {} \;

# Se for um diretório usado pelo Podman com SELinux
sudo chcon -R -t container_file_t "$CAMINHO"

echo "Permissões corrigidas."
