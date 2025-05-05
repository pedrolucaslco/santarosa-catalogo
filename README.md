# 🛍️ Santa Rosa Catalog

A real-world digital product catalog developed for a client from **Santa Rosa** store, aiming to **optimize the creation and publishing process** for promotional campaigns. This project was part of my learning in **React and Next.js**, and focuses on automating catalog generation by extracting product information directly from image filenames — reducing the need for manual input.

In addition to the frontend, two automation scripts were developed:
- A **Bash script** to rename image files sequentially;
- A **Python script** to resize and compress images, improving load time and overall performance.

## ✨ Overview

By using only the image filenames (e.g., `product-59.90.jpg`), the system automatically extracts the product name and price, displaying them dynamically as responsive cards on the page.

## 🚀 Technologies Used

- **Next.js** – Server-side rendering and internal API.
- **TypeScript** – Safer, statically typed code.
- **Tailwind CSS** – Fast and modern utility-first styling.
- **Next Image** – Built-in image optimization.
- **Lucide Icons** – Lightweight and flexible icon set.
- **Bash + Python** – Automation for repetitive tasks.

## 🧪 Key Features

- 🖼️ **Automatic cards** generated from image filenames.  
- 📁 **Dynamic listing** of uploaded product images.  
- 🧾 **Info extraction** based on naming conventions.  
- ⚡ **Optimized images** for fast loading.  
- 📲 **Responsive layout** for both mobile and desktop.  

## 🛠️ Getting Started Locally

### Clone the repository

```bash
git clone https://github.com/pedrolucaslcosta/santarosa-catalogo.git
cd santarosa-catalogo
```

### Install dependencies
```
npm install
```

### Start the development server
```
npm run dev
```

### Access at http://localhost:3000

## 🐚 Automation Scripts
🔁 Rename image files sequentially
🗜️ Resize and optimize images

These scripts streamline asset preparation, reducing manual effort before uploading.

## 🎯 Project Goal
To save time in creating and publishing product catalogs by using automation to turn image files directly into ready-to-display product cards — with minimal technical steps required from the client.

## 📄 License
All rights reserved to Santa Rosa and its collaborators.

## 📅 Used In
- 2025 Mother’s Day Campaign
- 2024 Father’s Day Campaign
- 2024 Valentine’s Day Campaign

## 🧾 Instructions

Catalog Banner: Save as PNG, 4000×1000 px.

Products: Save in ./products, then run:

```bash

./ordenar-imagens.sh

python3 ./otimizar-imagens.sh

```
