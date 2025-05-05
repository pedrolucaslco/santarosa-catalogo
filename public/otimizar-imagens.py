from PIL import Image
import os

def resize_images(directory, max_size):
    # List all files in the given directory
    for filename in os.listdir(directory):
        if filename.endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
            img_path = os.path.join(directory, filename)
            try:
                with Image.open(img_path) as img:
                    # Determine the new dimensions
                    if img.width > img.height:
                        new_width = max_size
                        new_height = int(max_size * (img.height / img.width))
                    else:
                        new_height = max_size
                        new_width = int(max_size * (img.width / img.height))
                    
                    # Resize the image
                    img = img.resize((new_width, new_height), Image.LANCZOS)
                    
                    # Save the image back to the same path
                    img.save(img_path)
                    print(f"Resized {filename} to {new_width}x{new_height}.")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    # Define the directory and max size
    directory = "products"
    max_size = 800

    # Call the resize function
    resize_images(directory, max_size)
