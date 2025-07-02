import React, { useState, useEffect } from "react";
import QRCodeList from "../../components/QRCodeList/QRCodeList";
import { QRCodeRecord } from "../../api/types";
import { getMappings, updateMapping, deleteMapping } from "../../api/api";
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

  const handleNewQRCode = async () => {
    try {
      const newData = await getMappings();
      setQRCodes(newData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (err) {
      console.error("Failed to fetch new QR codes:", err);
    }
  };

  const handleDeleteQRCode = async (index: number) => {
    const qr = qrCodes[index];
    try {
      await deleteMapping(qr.codeID);
      setQRCodes((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Failed to delete mapping:", err);
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "tile" ? "list" : "tile"));
  };

  const handleEditQRCode = async (
    index: number,
    newLabel: string,
    newUrl?: string
  ) => {
    const current = qrCodes[index];
    if (
      newLabel === current.label &&
      (!current.dynamic || newUrl === current.targetUrl)
    )
      return;

    try {
      const changes: any = { label: newLabel };
      if (current.dynamic && newUrl) changes.target_url = newUrl;

      const { entry } = await updateMapping(current.codeID, changes);
      // map backend entry back to your record
      const updated: QRCodeRecord = {
        codeID: entry.code_id,
        label: entry.label,
        imgUrl: entry.img_url,
        targetUrl: entry.target_url,
        dynamic: entry.dynamic,
        timestamp: new Date(entry.timestamp),
        userID: entry.user_id,
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
