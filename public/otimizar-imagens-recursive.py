from PIL import Image
import os

def resize_images_recursive(root_dir, max_size):
    # Caminha por todas as subpastas e arquivos
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.heic')):
                img_path = os.path.join(dirpath, filename)
                try:
                    with Image.open(img_path) as img:
                        # Ignora arquivos que já estão otimizados (opcional)
                        if max(img.width, img.height) <= max_size:
                            continue

                        # Calcula nova largura e altura mantendo proporção
                        if img.width > img.height:
                            new_width = max_size
                            new_height = int(max_size * (img.height / img.width))
                        else:
                            new_height = max_size
                            new_width = int(max_size * (img.width / img.height))

                        # Redimensiona e salva no mesmo local
                        img = img.resize((new_width, new_height), Image.LANCZOS)
                        img.save(img_path, optimize=True, quality=85)  # Você pode ajustar a qualidade aqui

                        print(f"Resized {img_path} to {new_width}x{new_height}.")
                except Exception as e:
                    print(f"Error processing {img_path}: {e}")

if __name__ == "__main__":
    directory = "products"  # Pasta raiz (pode ser "public/products" se for o seu caso)
    max_size = 800          # Tamanho máximo em pixels para o lado maior
    resize_images_recursive(directory, max_size)
