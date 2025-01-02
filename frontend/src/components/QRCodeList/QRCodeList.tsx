import React from 'react';
import { QRCodeRecord } from '../../api/types';
import './QRCodeList.css';

interface QRCodeListProps {
  qrCodes: QRCodeRecord[];
  onDelete?: (index: number) => void;
}

const QRCodeList: React.FC<QRCodeListProps> = ({ qrCodes, onDelete }) => {
  if (qrCodes.length === 0) return null;

  return (
    <div className="qr-codes-list">
      <h3>Generated QR Codes</h3>
      <div className="qr-codes-grid">
        {qrCodes.map((qr, index) => (
          <div key={index} className="qr-code-item">
            <img src={qr.url} alt={`QR Code for ${qr.documentName}`} />
            <p>{qr.documentName}</p>
            <p>{new Date(qr.createdAt).toLocaleDateString()}</p>
            <a href={qr.url} download>Download QR Code</a>
            {onDelete && (
              <button onClick={() => onDelete(index)} className="delete-btn">
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRCodeList;