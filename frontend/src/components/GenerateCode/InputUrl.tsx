import React, { useState } from "react";
import { createQRCode } from "../../api/api";
import { QRCodeRecord } from "../../api/types";
import Button from "@mui/material/Button";

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
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={url}
        onChange={handleUrlChange}
        placeholder="Enter URL"
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Generating..." : "Generate QR Code"}
      </Button>
      {error && <p className="error">{error}</p>}
    </form>
  );
};

export default InputUrl;
