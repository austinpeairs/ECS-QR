from flask import Flask, request, render_template, url_for, jsonify
from werkzeug.utils import secure_filename
from utils.qr_code import create_qr_with_logo
from utils.onedrive import OneDriveManager
from flask_cors import CORS
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'Test'
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx'}
CORS(app)

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

onedrive_manager = None
try:
    onedrive_manager = OneDriveManager()
except Exception as e:
    print(f"Failed to initialize OneDrive manager: {e}")

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/create_qr_code', methods=['POST'])
def create_qr_code():
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({'status': 'error', 'message': 'URL is required'}), 400

    try:
        logo_path = 'eagle.jpg'
        qr_path, filename = create_qr_with_logo(url)
        qr_code_url = url_for('static', filename=filename, _external=True)
        
        return jsonify({'status': 'success', 'qr_code_url': qr_code_url})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/upload_file', methods=['POST'])
def upload_file():
    try:
        # Check if OneDrive manager is available
        if not onedrive_manager:
            return jsonify({'status': 'error', 'message': 'OneDrive service unavailable'}), 503
        
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
            # Ensure temp file is deleted even if upload fails
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'File upload failed: {str(e)}'}), 500

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

if __name__ == '__main__':
    app.run(debug=True)

