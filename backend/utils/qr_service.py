import qrcode
import tempfile
import os, uuid, json, tempfile
from datetime import datetime
from flask import url_for
from utils.onedrive import OneDriveManager
from PIL import Image

def create_and_upload_qr(odm: OneDriveManager, target: str, dynamic: bool,
                         label: str, user_id: str, folder_name: str) -> dict:
    code_id = uuid.uuid4().hex
    url = (dynamic
           and url_for('dynamic_redirect', code_id=code_id, _external=True)
           or target)
    
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        img = qrcode.QRCode(
            version=1, box_size=10, border=5
        )
        img.add_data(url)
        img.make(fit=True)
        qr_img = img.make_image(fill_color="#152348", back_color="white").convert("RGBA")
        qr_img.save(tmp.name)
        tmp_path = tmp.name

    try:
        folder_id = next((f["id"] for f in odm.list_folders()
                if f["name"] == folder_name), None) \
            or odm.create_folder(folder_name)
        qr_item = odm.upload_file(tmp_path, folder_id, file_name=f"{code_id}.png")
        img_url = url_for('qr_content', item_id=qr_item['id'], _external=True)

        # handle mapping.json in “Mappings” folder
        map_fid = next((f["id"] for f in odm.list_folders()
                        if f["name"] == "Mappings" and "folder" in f),
                    None) or odm.create_folder("Mappings")

        # pull + update mappings
        children = odm.list_children(map_fid)
        mf = next((i for i in children if i["name"] == "mapping.json"), None)
        mappings = json.loads(odm.download_file(mf["id"])) if mf else []

        mappings.append({
        "code_id":    code_id,
        "label":      label,
        "img_url":    img_url,
        "target_url": target,
        "dynamic":    dynamic,
        "timestamp":  datetime.utcnow().isoformat() + "Z",
        "user_id":    user_id
        })
        odm.upload_content(map_fid, "mapping.json", json.dumps(mappings, indent=2))

        return {"qr_code_url": img_url}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)