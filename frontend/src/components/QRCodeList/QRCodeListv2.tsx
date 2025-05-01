import React from "react";
import { QRCodeRecord } from "../../api/types";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import CodeGenerator from "../GenerateCode/CodeGenerator";
import EditIcon from "@mui/icons-material/Edit";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { useState } from "react";

interface QRCodeListProps {
  qrCodes: QRCodeRecord[];
  onDelete?: (index: number) => void;
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

function Row(props: { row: QRCodeRecord; onDelete?: () => void }) {
  const { row, onDelete } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Link
            href={row.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            {row.codeID}
          </Link>
        </TableCell>
        <TableCell align="right">
          {new Date(row.createdAt).toLocaleString()}
        </TableCell>
        <TableCell align="right">{row.createdBy || "N/A"}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={onDelete ? 5 : 4}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                margin: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <img
                src={row.imgUrl}
                alt={row.codeID}
                style={{ maxWidth: "100px", height: "100px" }}
              />
              <div style={{ marginTop: "8px" }}>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={row.imgUrl}
                  download={`${row.codeID}.png`}
                >
                  <Button startIcon={<DownloadIcon />}>Download</Button>
                </a>
                {onDelete && (
                  <Button
                    onClick={onDelete}
                    startIcon={<DeleteIcon />}
                    style={{ marginLeft: "8px" }}
                  >
                    Delete
                  </Button>
                )}
                <Button startIcon={<EditIcon />} style={{ marginLeft: "8px" }}>
                  Edit
                </Button>
              </div>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const QRCodeList: React.FC<QRCodeListProps> = ({
  qrCodes,
  onDelete,
  onQRCodeGenerated,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const openConfirm = (idx: number) => {
    setDeleteIndex(idx);
    setIsConfirmOpen(true);
  };
  const closeConfirm = () => {
    setDeleteIndex(null);
    setIsConfirmOpen(false);
  };
  const handleConfirmDelete = () => {
    if (deleteIndex !== null && onDelete) {
      onDelete(deleteIndex);
    }
    closeConfirm();
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell colSpan={4}>
                <CodeGenerator onQRCodeGenerated={onQRCodeGenerated} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell />
              <TableCell>QR Code ID</TableCell>
              <TableCell align="right">Created At</TableCell>
              <TableCell align="right">Created By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {qrCodes.map((qr, index) => (
              <Row
                key={index}
                row={qr}
                onDelete={onDelete ? () => openConfirm(index) : undefined}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmDialog
        open={isConfirmOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this QR code?"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirm}
      />
    </>
  );
};

export default QRCodeList;
