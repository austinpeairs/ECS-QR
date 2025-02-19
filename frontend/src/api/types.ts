export interface UploadResponse {
    status: 'success' | 'error';
    filename: string;
    message?: string;
    path?: string;
  }
  
  export interface QRCodeRecord {
    codeID: string;
    imgUrl: string;
    linkUrl: string;
    createdAt: Date;
    createdBy?: string;
  }