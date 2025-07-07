import React, { useState } from "react";
import { createQRCode } from "../../api/api";
import { QRCodeRecord } from "../../api/types";
import {
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";

interface InputUrlProps {
  onStart?: () => void;
  onQRCodeGenerated: (qrCode: QRCodeRecord) => Promise<any>;
  loading?: boolean;
}

const InputUrl: React.FC<InputUrlProps> = ({
  onStart,
  onQRCodeGenerated,
  loading = false,
}) => {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dynamic, setDynamic] = useState(false);

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
    onStart?.();
    try {
      const qrResult = await createQRCode(url, label, dynamic);
      onQRCodeGenerated({
        codeID: qrResult.entry.code_id,
        label: qrResult.entry.label,
        imgUrl: qrResult.entry.img_url,
        targetUrl: qrResult.entry.target_url,
        dynamic,
        timestamp: new Date(qrResult.entry.timestamp),
        userID: qrResult.entry.user_id,
      });
      setUrl("");
      setLabel("");
      setDynamic(false);
    } catch (err) {
      setError("QR code generation failed");
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
        sx={{ mr: 2 }}
      />
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
        {loading ? "Generating..." : "Generate QR Code"}
      </Button>
      {error && url.trim() && label.trim() && (
        <div style={{ color: "red" }}>{error}</div>
      )}
    </Box>
  );
};

export default InputUrl;
