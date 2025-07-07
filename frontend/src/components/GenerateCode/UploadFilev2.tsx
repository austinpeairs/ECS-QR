import React, { useState } from "react";
import { uploadFile, createQRCode } from "../../api/api";
import { QRCodeRecord } from "../../api/types";
import {
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";

interface UploadFileProps {
  onStart?: () => void;
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
  loading?: boolean;
}

const UploadFile: React.FC<UploadFileProps> = ({
  onStart,
  onQRCodeGenerated,
  loading = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dynamic, setDynamic] = useState(false);

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
    onStart?.();
    try {
      if (!file) {
        setError("Please select a file");
        return;
      }

      const uploadResult = await uploadFile(file);

      if (uploadResult.status === "success" && uploadResult.path) {
        const qrResult = await createQRCode(
          uploadResult.path,
          label.trim() || file.name,
          dynamic
        );
        onQRCodeGenerated({
          codeID: qrResult.entry.code_id,
          label: qrResult.entry.label,
          imgUrl: qrResult.entry.img_url,
          targetUrl: qrResult.entry.target_url,
          dynamic,
          timestamp: new Date(qrResult.entry.timestamp),
          userID: qrResult.entry.user_id,
        });
        setFile(null);
        setLabel("");
        setDynamic(false);
      } else {
        setError(uploadResult.message || "Upload failed");
      }
    } catch (err) {
      setError("An error occurred during the upload");
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
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={dynamic}
            onChange={(e) => setDynamic(e.target.checked)}
            disabled={loading}
          />
        }
        label="Dynamic QR Code"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading..." : "Generate QR Code"}
      </Button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </Box>
  );
};

export default UploadFile;
