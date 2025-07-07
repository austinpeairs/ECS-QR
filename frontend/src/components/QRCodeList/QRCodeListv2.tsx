import React, { useState } from "react";
import { QRCodeRecord } from "../../api/types";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CodeGenerator from "../GenerateCode/CodeGenerator";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import CollapsibleRow from "./CollapsibleRow";

interface QRCodeListProps {
  qrCodes: QRCodeRecord[];
  onDelete?: (index: number) => Promise<any>;
  onEdit?: (index: number, newLabel: string) => Promise<any>;
  onQRCodeGenerated: (qrCode: QRCodeRecord) => Promise<any>;
}

const QRCodeList: React.FC<QRCodeListProps> = ({
  qrCodes,
  onDelete,
  onEdit,
  onQRCodeGenerated,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const openConfirm = (i: number) => {
    setDeleteIndex(i);
    setIsConfirmOpen(true);
  };
  const closeConfirm = () => {
    setDeleteIndex(null);
    setIsConfirmOpen(false);
  };
  const handleConfirmDelete = async () => {
    if (deleteIndex !== null && onDelete) await onDelete(deleteIndex);
    closeConfirm();
  };

  const handleGenerated = async (qr: QRCodeRecord) => {
    try {
      await onQRCodeGenerated(qr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell colSpan={4}>
                <CodeGenerator
                  loading={loading}
                  onStart={() => setLoading(true)}
                  onQRCodeGenerated={handleGenerated}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell />
              <TableCell>QR Code ID</TableCell>
              <TableCell align="right">Modified</TableCell>
              <TableCell align="right">Modified By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {qrCodes.map((qr, idx) => (
              <CollapsibleRow
                key={qr.codeID}
                row={qr}
                index={idx}
                onDelete={onDelete ? () => openConfirm(idx) : undefined}
                onEdit={onEdit}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Confirm Delete"
        message="Are you sure?"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirm}
      />
    </>
  );
};

export default QRCodeList;
