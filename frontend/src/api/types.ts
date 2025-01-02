export interface UploadResponse {
    status: 'success' | 'error';
    filename: string;
    message?: string;
    path?: string;
  }
  
  export interface QRCodeRecord {
    url: string;
    filename?: string;
    documentName: string;
    createdAt: Date;
  }