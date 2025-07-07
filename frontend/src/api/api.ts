import { UploadResponse } from "./types";
import { QRCodeRecord } from "./types";

export const getMappings = async (): Promise<QRCodeRecord[]> => {
  const response = await fetch(`/api/mapping`, {
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
    targetUrl: item.target_url,
    timestamp: new Date(item.timestamp),
    userID: item.user_id,
    dynamic: !!item.dynamic,
  }));
};

export const updateMapping = async (
  code_id: string,
  changes: { label?: string; target_url?: string }
): Promise<{ status: string; entry: any }> => {
  const response = await fetch(`/api/update_mapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code_id, changes }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update mapping");
  }
  return data;
};

export const deleteMapping = async (code_id: string): Promise<void> => {
  const res = await fetch(`/api/delete_mapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code_id }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to delete mapping");
  }
};

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/upload_file`, {
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
  label: string,
  dynamic: boolean
): Promise<{
  entry: {
    code_id: string;
    label: string;
    img_url: string;
    target_url: string;
    dynamic: boolean;
    timestamp: string;
    user_id: string;
  };
}> => {
  const body = { url } as any;
  if (label) body.label = label;
  body.dynamic = dynamic;
  const response = await fetch(`/create_qr_code`, {
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
  const response = await fetch("/api/auth/status", {
    credentials: "include",
  });

  if (!response.ok) {
    return { isAuthenticated: false };
  }

  return response.json();
};

export const login = (): void => {
  window.location.href = "/login";
};

export const logout = async (): Promise<void> => {
  await fetch("/logout", {
    credentials: "include",
  });
  window.location.href = "/";
};
