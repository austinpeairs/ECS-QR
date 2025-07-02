import qrcode
from PIL import Image
import os

def create_qr_with_logo(url, code_id, logo_path=None):   
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
    
    # Save the QR code image to the temp folder
    filename = f"{code_id}.png"
    img_path = os.path.join('temp', filename)
    img.save(img_path)
    
    return img_path, filename

# Example usage:
# create_qr_with_logo("https://www.ecsbr.com/contact", "path/to/logo.png")
