import os, secrets, time, httpx, json
from datetime import datetime
from flask import Flask, request, render_template, url_for, jsonify, redirect, session, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from utils.qr_code import create_qr_with_logo
from utils.onedrive import OneDriveManager
from utils.ms_graph import get_auth_url, get_token_from_code
from utils.ms_graph import MS_GRAPH_BASE_URL

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'Test'
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx'}
app.secret_key = secrets.token_hex(16)  # Generate a random secret key
CORS(app, supports_credentials=True)

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

onedrive_manager = None
try:
    onedrive_manager = OneDriveManager()
except Exception as e:
    print(f"Failed to initialize OneDrive manager: {e}")

# Load environment variables
from dotenv import load_dotenv
load_dotenv()
APPLICATION_ID = os.getenv('APPLICATION_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
SCOPES = ['User.Read', 'Files.ReadWrite.All']
REDIRECT_URI = "http://localhost:5000/auth_callback"  # Update with your actual URL
DEV_URL = "http://localhost:5173"

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Authentication routes
@app.route('/login')
def login():
    # Check if already authenticated
    if 'access_token' in session:
        return redirect(url_for('index'))
        
    # Generate authorization URL
    auth_url = get_auth_url(APPLICATION_ID, REDIRECT_URI, SCOPES)
    return redirect(auth_url)

@app.route('/auth_callback')
def auth_callback():
    # Get authorization code from the callback
    code = request.args.get('code')
    if not code:
        return jsonify({'status': 'error', 'message': 'No authorization code received'}), 400
    
    try:
        # Exchange code for tokens
        token_response = get_token_from_code(APPLICATION_ID, CLIENT_SECRET, REDIRECT_URI, code, SCOPES)
        
        # Store tokens in session
        session['access_token'] = token_response['access_token']
        session['refresh_token'] = token_response.get('refresh_token', '')
        session['token_expires'] = token_response['expires_in'] + int(time.time())
        
        # Also store user info if available
        if 'id_token_claims' in token_response:
            session['user'] = token_response['id_token_claims']
        
        if app.debug:
            return redirect(DEV_URL + "/")
        else:
            return redirect(url_for('index'))
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/logout')
def logout():
    # Clear session
    session.clear()
    return redirect(url_for('index'))

# Check if user is authenticated
def is_authenticated():
    return 'access_token' in session

# Add a middleware to check authentication
@app.before_request
def check_auth():

    if request.method == 'OPTIONS':
        return
    
    # Skip authentication for specific routes
    if request.endpoint in ['login', 'auth_callback', 'logout', 'static']:
        return
        
    # Check if user is authenticated
    if not is_authenticated():
        if request.path.startswith('/api/'):
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
        else:
            return redirect(url_for('login'))

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/qr_content/<item_id>')
def qr_content(item_id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    headers = {'Authorization': f"Bearer {session['access_token']}"}
    resp = httpx.get(
        f"{MS_GRAPH_BASE_URL}me/drive/items/{item_id}/content",
        headers=headers,
        follow_redirects=True
    )

    flask_resp = make_response(resp.content)
    flask_resp.headers['Content-Type'] = resp.headers.get('Content-Type', 'application/octet-stream')
    flask_resp.headers['Cache-Control'] = 'public, max-age=3600'
    return flask_resp

@app.route('/create_qr_code', methods=['POST'])
def create_qr_code():
    data = request.get_json()
    url = data.get('url')
    label = data.get('label')
    dynamic = data.get('dynamic', False)
    
    if not url:
        return jsonify({'status': 'error', 'message': 'URL is required'}), 400
    
    access_token = session.get('access_token')
    if not access_token:
        return redirect(url_for('login'))

    try:
        user_id = session.get('user', {}).get('name', 'N/A')
        logo_path = 'eagle.jpg'
        qr_path, filename = create_qr_with_logo(url)

        onedrive_manager = OneDriveManager(access_token)

        folder_name = 'QRcodes'
        folder_id = None
        folders = onedrive_manager.list_folders()

        for folder in folders:  
            if folder['name'] == folder_name:
                folder_id = folder['id']
                break

        if not folder_id:
            folder_id = onedrive_manager.create_folder(folder_name)

        QRcode = onedrive_manager.upload_file(qr_path, folder_id)
        img_url = url_for('qr_content', item_id=QRcode['id'], _external=True)

        MAP_FOLDER = "Mappings"
        folders = onedrive_manager.list_folders()
        map_fid = next((f["id"] for f in folders 
                        if f["name"]==MAP_FOLDER and "folder" in f), None)
        if not map_fid:
            map_fid = onedrive_manager.create_folder(MAP_FOLDER)

        # 2) pull down existing mapping.json (if any)
        items = onedrive_manager.list_children(map_fid)
        map_file = next((i for i in items if i["name"]=="mapping.json"), None)
        if map_file:
            raw = onedrive_manager.download_file(map_file["id"])
            mappings = json.loads(raw)
        else:
            mappings = []

        # 3) append your new record
        mappings.append({
            "code_id":      QRcode["name"].rsplit(".",1)[0],
            "label":        label,
            "img_url":      img_url,
            "target_url":   url,
            "dynamic":      dynamic,
            "timestamp":    datetime.utcnow().isoformat() + "Z",
            "user_id":      user_id
        })

        # 4) push it back up (JSON overwrite)
        onedrive_manager.upload_content(
            map_fid,
            "mapping.json",
            json.dumps(mappings, indent=2)
        )

        if os.path.exists(qr_path):
            os.remove(qr_path)

        return jsonify({'status': 'success', 'qr_code_url': img_url, 'user_id': user_id}), 200
    except Exception as e:
        print(f"Error creating QR code: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/upload_file', methods=['POST'])
def upload_file():
    try:
        # Use token from session
        access_token = session.get('access_token')
        if not access_token:
            return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
            
        # Initialize OneDrive manager with the session token
        onedrive_manager = OneDriveManager(access_token)
        
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file was selected
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
            
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({'status': 'error', 'message': 'Invalid file type'}), 400
            
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Save temporarily to a temp file
        temp_path = os.path.join('temp', filename)
        os.makedirs('temp', exist_ok=True)
        file.save(temp_path)
        
        try:
            # Get target folder name from app config
            folder_name = app.config['UPLOAD_FOLDER']
            
            # Look up folder ID for the target folder
            folder_id = None
            folders = onedrive_manager.list_folders()
            for folder in folders:
                if folder['name'] == folder_name:
                    folder_id = folder['id']
                    break
            
            # If folder doesn't exist, create it
            if not folder_id:
                folder_id = onedrive_manager.create_folder(folder_name)
            
            # Upload to OneDrive
            result = onedrive_manager.upload_file(temp_path, folder_id)
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            if not result:
                return jsonify({'status': 'error', 'message': 'Failed to upload to OneDrive'}), 500
                
            # Get shareable link
            onedrive_url = onedrive_manager.get_shared_link(result['id'])
                
            return jsonify({
                'status': 'success',
                'filename': filename,
                'path': onedrive_url,
                'item_id': result['id']
            }), 200
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'File upload failed: {str(e)}'}), 500
    
def get_or_create_folder(odm, name):
    for f in odm.list_folders():
        if f["name"] == name and "folder" in f:
            return f["id"]
    return odm.create_folder(name)

@app.route("/api/update_mapping", methods=["POST"])
def update_mapping():
    data      = request.get_json() or {}
    qr_id     = data.get("qr_id")
    changes   = data.get("changes")
    if not qr_id or not isinstance(changes, dict):
        return jsonify({'status':'error','message':'qr_id + changes required'}), 400

    odm      = OneDriveManager(session["access_token"])
    map_fid  = get_or_create_folder(odm, "Mappings")
    items    = odm.list_children(map_fid)
    map_item = next((i for i in items if i["name"]=="mapping.json"), None)

    mappings = []
    if map_item:
        raw      = odm.download_file(map_item["id"])
        mappings = json.loads(raw)

    updated = False
    for entry in mappings:
        if entry.get("code_id") == qr_id:
            entry.update(changes)    # merge in any fields: label, target_url, …
            updated = True
            break

    if not updated:
        return jsonify({'status':'error','message':'code_id not found'}), 404

    odm.upload_content(
        map_fid,
        "mapping.json",
        json.dumps(mappings, indent=2)
    )
    return jsonify({"status":"ok","entry":entry}), 200

@app.route('/api/mapping', methods=['GET'])
def get_mapping():
    access_token = session.get('access_token')
    if not access_token:
        return jsonify([]), 200

    od = OneDriveManager(access_token)
    # 1) get or create the Mappings folder
    map_fid = get_or_create_folder(od, "Mappings")

    # 2) find mapping.json
    items = od.list_children(map_fid)
    map_file = next((i for i in items if i["name"] == "mapping.json"), None)
    if not map_file:
        return jsonify([]), 200

    # 3) download + parse
    try:
        raw = od.download_file(map_file["id"])
        data = json.loads(raw)
    except Exception:
        data = []

    return jsonify(data)

@app.route('/delete_qr_code', methods=['POST'])
def delete_qr_code():
    data = request.get_json()
    filename = data.get('filename')
    if filename:
        img_path = os.path.join('static', filename)
        if os.path.exists(img_path):
            os.remove(img_path)
            return jsonify({'status': 'success'}), 200
    return jsonify({'status': 'error'}), 400

@app.route('/api/auth/status')
def auth_status():
    if 'access_token' in session:
        return jsonify({
            'isAuthenticated': True,
            'user': session.get('user')
        })
    else:
        return jsonify({
            'isAuthenticated': False
        })

if __name__ == '__main__':
    app.run(debug=True)

