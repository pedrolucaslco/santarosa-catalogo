#!/usr/bin/env bash

set -e

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
        ImageMagick
}

install_ubuntu() {
    echo "Ambiente Ubuntu detectado"

    sudo apt update

    sudo apt install -y \
        libheif1 \
        libheif-examples \
        libde265-0 \
        imagemagick
}

ensure_dependencies() {
    if command -v heif-convert >/dev/null 2>&1; then
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

convert_images() {
    find ./products -type f \( -iname "*.heic" -o -iname "*.HEIC" \) | while read -r file; do
        output="${file%.*}.jpg"

        echo "Convertendo:"
        echo "$file"
        echo "→ $output"

        if heif-convert "$file" "$output"; then
            rm -f "$file"
        else
            echo "✖ Erro ao converter: $file"
        fi
    done

    echo "Processo finalizado."
}

ensure_dependencies
convert_images
