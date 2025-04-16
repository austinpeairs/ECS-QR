import React, { useState } from "react";
import { createQRCode } from "../../api/api";
import { QRCodeRecord } from "../../api/types";
import { Box, TextField, Button } from "@mui/material";

interface InputUrlProps {
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

const InputUrl: React.FC<InputUrlProps> = ({ onQRCodeGenerated }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!url.trim()) {
        setError("Please enter a URL");
        return;
      }

      const qrResult = await createQRCode(url);
      onQRCodeGenerated({
        codeID: new URL(url).hostname,
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
        maxWidth: "30%",
        width: "100%",
        height: 30,
      }}
    >
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
    </Box>
  );
};

export default InputUrl;
