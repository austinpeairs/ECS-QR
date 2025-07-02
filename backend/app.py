import os, secrets, time, json, tempfile
from datetime import datetime
from flask import Flask, request, render_template, url_for, jsonify, redirect, session, make_response, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
from utils.onedrive import OneDriveManager
from utils.ms_graph import get_auth_url, get_token_from_code
from utils.qr_service import create_and_upload_qr
from functools import wraps
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'Test'
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx'}
app.secret_key = secrets.token_hex(16)  # Generate a random secret key
CORS(app, supports_credentials=True)

# Load environment variables
APPLICATION_ID = os.getenv('APPLICATION_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
SCOPES = ['User.Read', 'Files.ReadWrite.All']
REDIRECT_URI = "http://localhost:5000/auth_callback"  # Update with your actual URL
DEV_URL = "http://localhost:5173"

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def get_odm():
    """Always call this inside a login_required view."""
    token = session.get('access_token')
    if not token:
        return redirect(url_for('login'))
    return OneDriveManager(token)

def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if 'access_token' not in session:
            return redirect(url_for('login'))
        # optionally refresh token here if expired
        return f(*args, **kwargs)
    return wrapped

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
@login_required
def qr_content(item_id):
    odm = get_odm()
    resp = odm.get_item_content(item_id)
    flask_resp = make_response(resp.content)
    flask_resp.headers['Content-Type'] = resp.headers.get('Content-Type', 'application/octet-stream')
    flask_resp.headers['Cache-Control'] = 'public, max-age=3600'
    return flask_resp

@app.route("/r/<code_id>")
@login_required
def dynamic_redirect(code_id):
    """Redirect a dynamic QR scan to its current target_url."""
    resp = get_mapping()
    if resp.status_code != 200:
        abort(404)
    mappings = resp.get_json()

    entry = next((e for e in mappings if e["code_id"] == code_id), None)
    if not entry:
        abort(404)

    target_url = entry["target_url"]
    # if no scheme, assume https
    if not target_url.startswith(("http://", "https://")):
        target_url = "https://" + target_url

    return redirect(target_url)

@app.route('/create_qr_code', methods=['POST'])
@login_required
def create_qr_code():
    data = request.get_json()
    target = data.get('url')
    label = data.get('label')
    dynamic = data.get('dynamic', False)
    
    if not target:
        return jsonify({'status': 'error', 'message': 'URL is required'}), 400
    odm = get_odm()

    try:
        user_id = session.get('user', {}).get('name', 'N/A')
        result = create_and_upload_qr(
            odm, target, dynamic, label, user_id, 'QRcodes'
        )

        return jsonify({
            'status': 'success',
            'entry': result,
        }), 200
    
    except Exception as e:
        print(f"Error creating QR code: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/upload_file', methods=['POST'])
@login_required
def upload_file():
    try:
        # Use token from session
        access_token = session.get('access_token')
        if not access_token:
            return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
            
        # Initialize OneDrive manager with the session token
        odm = get_odm()
        
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
        suffix = os.path.splitext(filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = tmp.name
        file.save(temp_path)
        
        try:
            # Get target folder name from app config
            folder_name = app.config['UPLOAD_FOLDER']
            
            # Look up folder ID for the target folder
            folder_id = None
            folders = odm.list_folders()
            for folder in folders:
                if folder['name'] == folder_name:
                    folder_id = folder['id']
                    break
            
            # If folder doesn't exist, create it
            if not folder_id:
                folder_id = odm.create_folder(folder_name)
            
            # Upload to OneDrive
            result = odm.upload_file(temp_path, folder_id, file_name=filename)
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            if not result:
                return jsonify({'status': 'error', 'message': 'Failed to upload to OneDrive'}), 500
                
            # Get shareable link
            onedrive_url = odm.get_shared_link(result['id'])
                
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
@login_required
def update_mapping():
    data      = request.get_json() or {}
    code_id     = data.get("code_id")
    changes   = data.get("changes")
    if not code_id or not isinstance(changes, dict):
        return jsonify({'status':'error','message':'code_id + changes required'}), 400

    odm = get_odm()
    map_fid  = get_or_create_folder(odm, "Mappings")
    items    = odm.list_children(map_fid)
    map_item = next((i for i in items if i["name"]=="mapping.json"), None)

    mappings = []
    if map_item:
        raw      = odm.download_file(map_item["id"])
        mappings = json.loads(raw)

    updated = False
    for entry in mappings:
        if entry.get("code_id") == code_id:
            entry.update(changes)    # merge in any fields: label, target_url, …
            entry["timestamp"] = datetime.utcnow().isoformat() + "Z"
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

@app.route('/api/delete_mapping', methods=['POST'])
@login_required
def delete_mapping():
    data = request.get_json() or {}
    code_id = data.get('code_id')
    if not code_id:
        return jsonify({'status': 'error', 'message': 'code_id required'}), 400
    odm = get_odm()
    map_fid = get_or_create_folder(odm, "Mappings")
    items = odm.list_children(map_fid)
    map_item = next((i for i in items if i["name"] == "mapping.json"), None)

    mappings = []
    if map_item:
        raw = odm.download_file(map_item["id"])
        mappings = json.loads(raw)

    new_mappings = [entry for entry in mappings if entry.get("code_id") != code_id]
    if len(new_mappings) == len(mappings):
        return jsonify({'status': 'error', 'message': 'code_id not found'}), 404
    
    odm.upload_content(
        map_fid,
        "mapping.json",
        json.dumps(new_mappings, indent=2)
    )
    return jsonify({'status': 'success', 'message': 'Code deleted successfully'}), 200

@app.route('/api/mapping', methods=['GET'])
@login_required
def get_mapping():
    odm = get_odm()
    # 1) get or create the Mappings folder
    map_fid = get_or_create_folder(odm, "Mappings")

    # 2) find mapping.json
    items = odm.list_children(map_fid)
    map_file = next((i for i in items if i["name"] == "mapping.json"), None)
    if not map_file:
        return jsonify([]), 200

    # 3) download + parse
    try:
        raw = odm.download_file(map_file["id"])
        data = json.loads(raw)
    except Exception:
        data = []

    return jsonify(data)

@app.route('/delete_qr_code', methods=['POST'])
@login_required
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
@login_required
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