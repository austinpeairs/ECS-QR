import React, { useState } from 'react';
import { uploadFile, createQRCode } from '../../api/api';
import { QRCodeRecord } from '../../api/types';
import './UploadFile.css';

interface UploadFileProps {
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

const UploadFile: React.FC<UploadFileProps> = ({ onQRCodeGenerated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'url'>('file');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'file') {
        if (!file) {
          setError('Please select a file');
          return;
        }

        const uploadResult = await uploadFile(file);
        
        if (uploadResult.status === 'success' && uploadResult.path) {
          const qrResult = await createQRCode(uploadResult.path);
          onQRCodeGenerated({
            documentName: file.name,
            url: qrResult.qr_code_url,
            createdAt: new Date()
          });
          setFile(null);
        } else {
          setError(uploadResult.message || 'Upload failed');
        }
      } else {
        if (!url.trim()) {
          setError('Please enter a URL');
          return;
        }

        const qrResult = await createQRCode(url);
        onQRCodeGenerated({
          documentName: new URL(url).hostname,
          url: qrResult.qr_code_url,
          createdAt: new Date()
        });
        setUrl('');
      }

      if (event.target instanceof HTMLFormElement) {
        event.target.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-file">
      <div className="mode-selector">
        <button 
          className={`mode-btn ${mode === 'file' ? 'active' : ''}`}
          onClick={() => setMode('file')}
          type="button"
        >
          Upload File
        </button>
        <button 
          className={`mode-btn ${mode === 'url' ? 'active' : ''}`}
          onClick={() => setMode('url')}
          type="button"
        >
          Enter URL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="upload-file-form">
        {mode === 'file' ? (
          <input 
            type="file" 
            onChange={handleFileChange}
            accept=".pdf,.docx"
            disabled={loading}
          />
        ) : (
          <input 
            type="url" 
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter URL here"
            disabled={loading}
          />
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Generate QR Code'}
        </button>
      </form>
      
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default UploadFile;