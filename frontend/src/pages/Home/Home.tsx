import React, { useState, useEffect } from 'react';
import UploadFile from '../../components/UploadFile/UploadFile';
import QRCodeList from '../../components/QRCodeList/QRCodeList';
import { QRCodeRecord } from '../../api/types';

const STORAGE_KEY = 'qr_codes';

const Home: React.FC = () => {
  const [qrCodes, setQRCodes] = useState<QRCodeRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(qrCodes));
  }, [qrCodes]);

  const handleNewQRCode = (newQRCode: QRCodeRecord) => {
    setQRCodes(prev => [...prev, newQRCode]);
  };

  const handleDeleteQRCode = (index: number) => {
    setQRCodes(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h1>ECS QR Generator</h1>
      <UploadFile onQRCodeGenerated={handleNewQRCode} />
      <QRCodeList qrCodes={qrCodes} onDelete={handleDeleteQRCode} />
    </div>
  );
};

export default Home;