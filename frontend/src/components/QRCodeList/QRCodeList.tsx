// frontend/src/components/QRCodeList/QRCodeList.tsx
import React from "react";
import { QRCodeRecord } from "../../api/types";
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Link,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";

interface QRCodeListProps {
  qrCodes: QRCodeRecord[];
  onDelete?: (index: number) => void;
}

const QRCodeList: React.FC<QRCodeListProps> = ({ qrCodes, onDelete }) => {
  if (qrCodes.length === 0) return null;

  return (
    <>
      <Grid container spacing={2}>
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
    </>
  );
};

export default QRCodeList;
