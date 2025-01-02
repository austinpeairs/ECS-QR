from flask import Flask, request, render_template, url_for, jsonify
from werkzeug.utils import secure_filename
from utils.qr_code import create_qr_with_logo
from flask_cors import CORS
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx'}
CORS(app)

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

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
            
        # Secure the filename and save
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        file_url = url_for('upload_file', filename=filename, _external=True)
        
        return jsonify({'status': 'success', 'filename': filename, 'path': file_url}), 200
        
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

