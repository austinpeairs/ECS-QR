export interface UploadResponse {
  status: "success" | "error";
  filename: string;
  message?: string;
  path?: string;
}

export interface QRCodeRecord {
  codeID: string;
  label: string;
  imgUrl: string;
  linkUrl: string;
  createdAt: Date;
  createdBy?: string;
  dynamic?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}
