import { UploadResponse } from "./types";
import { QRCodeRecord } from "./types";

export const getMappings = async (): Promise<QRCodeRecord[]> => {
  const response = await fetch(`http://localhost:5000/api/mapping`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to load QR code mappings");
  }
  const raw = await response.json();
  // map your backend fields to QRCodeRecord
  return raw.map((item: any) => ({
    codeID: item.code_id,
    label: item.label,
    imgUrl: item.img_url,
    linkUrl: item.target_url,
    createdAt: new Date(item.timestamp),
    createdBy: item.user_id,
  }));
};

export const updateMapping = async (
  qr_id: string,
  changes: { label?: string; target_url?: string }
): Promise<{ status: string; entry: any }> => {
  const response = await fetch(`http://localhost:5000/api/update_mapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ qr_id, changes }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update mapping");
  }
  return data;
};

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`http://localhost:5000/upload_file`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
};

export const createQRCode = async (
  url: string,
  label: string
): Promise<{ qr_code_url: string; user_id: string }> => {
  const body = { url } as any;
  if (label) body.label = label;
  const response = await fetch(`http://localhost:5000/create_qr_code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to generate QR code");
  }

  return response.json();
};

export const checkAuthStatus = async (): Promise<{
  isAuthenticated: boolean;
  user?: any;
}> => {
  const response = await fetch("http://localhost:5000/api/auth/status", {
    credentials: "include",
  });

  if (!response.ok) {
    return { isAuthenticated: false };
  }

  return response.json();
};

export const login = (): void => {
  window.location.href = "http://localhost:5000/login";
};

export const logout = async (): Promise<void> => {
  await fetch("http://localhost:5000/logout", {
    credentials: "include",
  });
  window.location.href = "/";
};
