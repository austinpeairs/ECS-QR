import qrcode
import hashlib
from PIL import Image
from urllib.parse import urlparse
import os

def create_qr_with_logo(url, logo_path=None):
    print(url)
    
    # Generate a unique ID for the URL
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    
    # Create a QR code
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=5
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#152348", back_color="white").convert("RGBA")
    
    # If a logo is provided, add it to the QR code
    if logo_path and os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        logo.thumbnail((70, 70), Image.LANCZOS)
        mask = logo.split()[3]
        pos = ((img.size[0] - logo.size[0]) // 2, (img.size[1] - logo.size[1]) // 2 + 5)
        img.paste(logo, pos, mask=mask)
    
    # Save the QR code image to the static folder
    filename = f"{url_hash}_qr_code.png"
    img_path = os.path.join('static', filename)
    img.save(img_path)
    
    return img_path, filename

# Example usage:
# create_qr_with_logo("https://www.ecsbr.com/contact", "path/to/logo.png")
