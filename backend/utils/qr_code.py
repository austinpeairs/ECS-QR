import qrcode
from PIL import Image
from urllib.parse import urlparse

def create_qr_with_logo(url, logo_path):
    # Extract the document ID from the URL path
    parsed_url = urlparse(url)
    doc_id = parsed_url.path.split('/')[3]
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=5
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#152348", back_color="white").convert("RGBA")
    
    # Load the logo image
    logo = Image.open(logo_path).convert("RGBA")
    
    # Calculate the size of the logo
    basewidth = 60
    wpercent = (basewidth / float(logo.size[0]))
    hsize = int((float(logo.size[1]) * float(wpercent)))
    logo = logo.resize((basewidth, hsize), Image.LANCZOS)
    
    # Create a mask from the logo's alpha channel
    mask = logo.split()[3]
    
    # Calculate the position to place the logo
    pos = ((img.size[0] - logo.size[0]) // 2, (img.size[1] - logo.size[1]) // 2)
    
    # Paste the logo onto the QR code
    img.paste(logo, pos, mask=mask)
    
    # Save the final image
    img.save(f"{doc_id}_qr_code.png")

# Main program
if __name__ == "__main__":
    url = input("Enter the Google Docs URL: ")
    logo_path = 'eagle.jpg'  # You can also use input() to get the logo path if needed
    create_qr_with_logo(url, logo_path)
