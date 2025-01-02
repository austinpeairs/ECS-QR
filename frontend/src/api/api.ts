import { UploadResponse } from './types';

export const uploadFile = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
  
    const response = await fetch(`http://localhost:5000/upload_file`, {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
  
    return response.json();
  };

  export const createQRCode = async (url: string): Promise<{ qr_code_url: string }> => {
    const response = await fetch(`http://localhost:5000/create_qr_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }
  
    return response.json();
  };