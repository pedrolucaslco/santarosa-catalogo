#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRODUCTS_DIR="${PRODUCTS_DIR:-$SCRIPT_DIR/products}"

detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    fi
}

install_fedora() {
    echo "Ambiente Fedora detectado"

    # RPM Fusion (caso não exista)
    if ! rpm -qa | grep -q rpmfusion-free-release; then
        sudo dnf install -y \
          https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
          https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
    fi

    sudo dnf install -y \
        libheif \
        libheif-tools \
        libheif-freeworld \
        file \
        ImageMagick
}

install_ubuntu() {
    echo "Ambiente Ubuntu detectado"

    sudo apt update

    sudo apt install -y \
        libheif1 \
        libheif-examples \
        libde265-0 \
        file \
        imagemagick
}

ensure_dependencies() {
    if command -v heif-convert >/dev/null 2>&1 && command -v file >/dev/null 2>&1; then
        return
    fi

    DISTRO=$(detect_distro)

    case "$DISTRO" in
        fedora)
            install_fedora
            ;;
        ubuntu|debian)
            install_ubuntu
            ;;
        *)
            echo "Distro não suportada automaticamente: $DISTRO"
            exit 1
            ;;
    esac
}

target_jpg_path() {
    local file="$1"

    case "$file" in
        *.[Hh][Ee][Ii][Cc])
            printf '%s.jpg' "${file%.*}"
            ;;
        *" HEIC")
            printf '%s.jpg' "${file% HEIC}"
            ;;
        *)
            printf '%s.jpg' "$file"
            ;;
    esac
}

convert_or_rename_image() {
    local file="$1"
    local output

    output="$(target_jpg_path "$file")"

    echo "Convertendo:"
    echo "$file"
    echo "→ $output"

    if [ -e "$output" ]; then
        echo "⚠ Já existe: $output"
        echo "  Pulando para não sobrescrever."
        return
    fi

    if [ "$(file --brief --mime-type "$file")" = "image/jpeg" ]; then
        mv "$file" "$output"
        echo "✓ Arquivo já era JPEG; renomeado."
        return
    fi

    if heif-convert "$file" "$output"; then
        rm -f "$file"
    else
        rm -f "$output"
        echo "✖ Erro ao converter: $file"
    fi
}

convert_images() {
    if [ ! -d "$PRODUCTS_DIR" ]; then
        echo "Pasta de produtos não encontrada: $PRODUCTS_DIR"
        exit 1
    fi

    find "$PRODUCTS_DIR" -type f \( -iname "*.heic" -o -iname "* HEIC" \) -print0 | while IFS= read -r -d '' file; do
        convert_or_rename_image "$file"
    done

    echo "Processo finalizado."
}

ensure_dependencies
convert_images
