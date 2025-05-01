import { UploadResponse } from "./types";

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
  url: string
): Promise<{ qr_code_url: string; user_id: string }> => {
  const response = await fetch(`http://localhost:5000/create_qr_code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
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
