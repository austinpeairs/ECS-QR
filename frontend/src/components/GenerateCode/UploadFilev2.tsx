import React, { useState } from "react";
import { uploadFile, createQRCode } from "../../api/api";
import { QRCodeRecord } from "../../api/types";
import { Box, TextField, Button } from "@mui/material";

interface UploadFileProps {
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

const UploadFile: React.FC<UploadFileProps> = ({ onQRCodeGenerated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
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
        const qrResult = await createQRCode(
          uploadResult.path,
          label.trim() || file.name
        );
        onQRCodeGenerated({
          codeID: file.name,
          label: label.trim() || file.name,
          imgUrl: qrResult.qr_code_url,
          linkUrl: uploadResult.path,
          createdAt: new Date(),
          createdBy: qrResult.user_id,
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
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", gap: 1 }}
    >
      <TextField
        size="small"
        value={label}
        onChange={handleLabelChange}
        label="Label (optional)"
        variant="standard"
        disabled={loading}
      />
      <input
        accept="*"
        style={{ display: "none" }}
        id="contained-button-file"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="contained-button-file">
        <Button
          size="small"
          variant="contained"
          component="span"
          disabled={loading}
        >
          Select File
        </Button>
      </label>
      <span>{file?.name || "No file chosen"}</span>
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Generate QR Code"}
      </Button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </Box>
  );
};

export default UploadFile;
