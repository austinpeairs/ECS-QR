// frontend/src/components/QRCodeList/QRCodeList.tsx
import React, { useState } from "react";
import { QRCodeRecord } from "../../api/types";
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Link,
  Dialog,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CodeGenerator from "../GenerateCode/CodeGenerator";

interface QRCodeListProps {
  qrCodes: QRCodeRecord[];
  onDelete?: (index: number) => void;
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

const QRCodeList: React.FC<QRCodeListProps> = ({
  qrCodes,
  onDelete,
  onQRCodeGenerated,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);
  const handleQRCodeGenerated = (qrCode: QRCodeRecord) => {
    onQRCodeGenerated(qrCode);
    handleCloseDialog();
  };
  if (qrCodes.length === 0) return null;

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={2}>
          <Card
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              minHeight: 200,
            }}
            onClick={handleOpenDialog}
          >
            <AddIcon sx={{ fontSize: 60, color: "text.secondary" }} />
          </Card>
        </Grid>
        {qrCodes.map((qr, index) => (
          <Grid size={2}>
            <Card
              sx={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              <CardMedia
                component="img"
                image={qr.imgUrl}
                alt={`QR Code for ${qr.codeID}`}
                sx={{ height: 200, width: 200 }}
              />
              <CardContent>
                <Typography variant="h6">
                  <Link
                    href={qr.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    {qr.codeID}
                  </Link>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {new Date(qr.createdAt).toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center", mt: "auto" }}>
                <IconButton
                  size="small"
                  component="a"
                  href={qr.imgUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DownloadIcon />
                </IconButton>
                {onDelete && (
                  <IconButton size="small" onClick={() => onDelete(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
                <IconButton size="small">
                  <EditIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <CodeGenerator onQRCodeGenerated={handleQRCodeGenerated} />
      </Dialog>
    </>
  );
};

export default QRCodeList;
