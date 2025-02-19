import React, { useState } from "react";
import { uploadFile, createQRCode } from "../../api/api";
import { QRCodeRecord } from "../../api/types";
import Button from "@mui/material/Button";

interface UploadFileProps {
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

const UploadFile: React.FC<UploadFileProps> = ({ onQRCodeGenerated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!file) {
        setError("Please select a file");
        return;
      }

      const uploadResult = await uploadFile(file);

      if (uploadResult.status === "success" && uploadResult.path) {
        const qrResult = await createQRCode(uploadResult.path);
        onQRCodeGenerated({
          codeID: file.name,
          imgUrl: qrResult.qr_code_url,
          linkUrl: uploadResult.path,
          createdAt: new Date(),
          createdBy: "Admin",
        });
        setFile(null);
      } else {
        setError(uploadResult.message || "Upload failed");
      }
    } catch (err) {
      setError("An error occurred during the upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        accept="*"
        style={{ display: "none" }}
        id="contained-button-file"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="contained-button-file">
        <Button size="small" variant="contained" component="span">
          Select File
        </Button>
      </label>
      <span style={{ marginLeft: 8 }}>
        {file ? file.name : "No file chosen"}
      </span>
      {error && <p className="error">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Generate QR Code"}
      </Button>
    </form>
  );
};

export default UploadFile;
