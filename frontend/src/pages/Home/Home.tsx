import React, { useState, useEffect } from "react";
import QRCodeList from "../../components/QRCodeList/QRCodeList";
import { QRCodeRecord } from "../../api/types";
import { getMappings, updateMapping } from "../../api/api";
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

  const handleEditQRCode = async (index: number, newLabel: string) => {
    const current = qrCodes[index];
    if (newLabel === current.label) return; // no change

    try {
      const { entry } = await updateMapping(current.codeID, {
        label: newLabel,
      });
      // map backend entry back to QRCodeRecord
      const updated: QRCodeRecord = {
        codeID: entry.code_id,
        label: entry.label,
        imgUrl: entry.img_url,
        linkUrl: entry.target_url,
        createdAt: entry.timestamp,
        createdBy: entry.user_id,
      };
      setQRCodes((prev) => {
        const next = [...prev];
        next[index] = updated;
        return next;
      });
    } catch (err) {
      console.error("Update failed:", err);
    }
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
          onEdit={handleEditQRCode}
          onQRCodeGenerated={handleNewQRCode}
        />
      )}
    </div>
  );
};

export default Home;
