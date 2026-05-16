import os
from PIL import Image

def create_pwa_icons(source_image_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Membuat folder: {output_dir}")

    try:
        # Buka gambar sumber
        img = Image.open(source_image_path)
        width, height = img.size
        
        # 1. Logika Crop Otomatis menjadi Kotak Sempurna (1:1) berbasis titik tengah
        min_dimension = min(width, height)
        left = (width - min_dimension) / 2
        top = (height - min_dimension) / 2
        right = (width + min_dimension) / 2
        bottom = (height + min_dimension) / 2
        
        # Crop gambar tepat di tengah fokus maskot Nur
        square_img = img.crop((left, top, right, bottom))
        print("✓ Gambar berhasil dipotong menjadi rasio 1:1 (Square).")

        # 2. Generate Ukuran PWA 192x192
        icon_192 = square_img.resize((192, 192), Image.Resampling.LANCZOS)
        icon_192.save(os.path.join(output_dir, "icon-192x192.png"), "PNG")
        print("✓ Berhasil membuat: icon-192x192.png")

        # 3. Generate Ukuran PWA 512x512
        icon_512 = square_img.resize((512, 512), Image.Resampling.LANCZOS)
        icon_512.save(os.path.join(output_dir, "icon-512x512.png"), "PNG")
        print("✓ Berhasil membuat: icon-512x512.png")

        # 4. Generate Favicon .ico standar browser (berisi multi-resolusi internal)
        # Kita letakkan langsung di root folder public nanti
        favicon_path = os.path.join(output_dir, "../favicon.ico")
        square_img.resize((32, 32)).save(favicon_path, format="ICO")
        print("✓ Berhasil membuat: favicon.ico (di luar folder icons)")
        
        print("\n🎉 Semua aset PWA untuk Istiqo siap digunakan!")

    except Exception as e:
        print(f"Waduh, ada error: {e}")

# Jalankan fungsi (sesuaikan nama file mentah maskot Anda)
# Pastikan file gambar mentah berada di folder yang sama dengan skrip ini
create_pwa_icons("nur_master.png", "public/assets/icons")