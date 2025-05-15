import React, { useState, useEffect } from "react";
import QRCodeList from "../../components/QRCodeList/QRCodeList";
import { QRCodeRecord } from "../../api/types";
import { getMappings } from "../../api/api";
import CollapsibleTable from "../../components/QRCodeList/QRCodeListv2";
import Button from "@mui/material/Button";

const STORAGE_KEY = "qr_codes";

const Home: React.FC = () => {
  const [qrCodes, setQRCodes] = useState<QRCodeRecord[]>([]);
  const [viewMode, setViewMode] = useState<"tile" | "list">("tile");

  useEffect(() => {
    getMappings()
      .then((data) => {
        setQRCodes(data);
        // also persist locally if you like
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      })
      .catch((err) => {
        console.error("Failed to fetch mappings:", err);
        // fallback to any saved in localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setQRCodes(JSON.parse(saved));
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(qrCodes));
  }, [qrCodes]);

  const handleNewQRCode = (newQRCode: QRCodeRecord) => {
    setQRCodes((prev) => [...prev, newQRCode]);
  };

  const handleDeleteQRCode = (index: number) => {
    setQRCodes((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "tile" ? "list" : "tile"));
  };

  return (
    <div>
      <h1>ECS QR Generator</h1>
      <Button onClick={toggleViewMode}>
        Switch to {viewMode === "tile" ? "List" : "Tile"} View
      </Button>
      {viewMode === "tile" ? (
        <QRCodeList
          qrCodes={qrCodes}
          onDelete={handleDeleteQRCode}
          onQRCodeGenerated={handleNewQRCode}
        />
      ) : (
        <CollapsibleTable
          qrCodes={qrCodes}
          onDelete={handleDeleteQRCode}
          onQRCodeGenerated={handleNewQRCode}
        />
      )}
    </div>
  );
};

export default Home;
