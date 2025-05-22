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
  onDelete?: (index: number) => void;
  onEdit?: (index: number, newLabel: string) => void;
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

const QRCodeList: React.FC<QRCodeListProps> = ({
  qrCodes,
  onDelete,
  onEdit,
  onQRCodeGenerated,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const openConfirm = (i: number) => {
    setDeleteIndex(i);
    setIsConfirmOpen(true);
  };
  const closeConfirm = () => {
    setDeleteIndex(null);
    setIsConfirmOpen(false);
  };
  const handleConfirmDelete = () => {
    if (deleteIndex !== null && onDelete) onDelete(deleteIndex);
    closeConfirm();
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell colSpan={4}>
                <CodeGenerator onQRCodeGenerated={onQRCodeGenerated} />
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
                key={idx}
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
