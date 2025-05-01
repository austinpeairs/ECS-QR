import React, { useState } from "react";
import { createQRCode } from "../../api/api";
import { QRCodeRecord } from "../../api/types";
import { Box, TextField, Button } from "@mui/material";

interface InputUrlProps {
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

const InputUrl: React.FC<InputUrlProps> = ({ onQRCodeGenerated }) => {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
    setError(null);
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError("Please enter a label");
      return;
    }
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      const qrResult = await createQRCode(url);
      onQRCodeGenerated({
        codeID: label.trim(),
        imgUrl: qrResult.qr_code_url,
        linkUrl: url,
        createdAt: new Date(),
        createdBy: "Admin",
      });
      setUrl("");
    } catch (err) {
      setError("QR code generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        width: "100%",
        height: 30,
      }}
    >
      <TextField
        size="small"
        value={label}
        onChange={handleLabelChange}
        label="Label"
        placeholder="My Document"
        variant="standard"
        error={!!error && !label.trim()}
        required
        disabled={loading}
      />
      <TextField
        size="small"
        value={url}
        onChange={handleUrlChange}
        label="Enter URL"
        placeholder="https://example.com"
        variant="standard"
        error={!!error}
        helperText={error}
        disabled={loading}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Generating..." : "Generate QR Code"}
      </Button>
      {error && url.trim() && label.trim() && (
        <div style={{ color: "red" }}>{error}</div>
      )}
    </Box>
  );
};

export default InputUrl;
