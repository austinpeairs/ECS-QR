import React, { useState, useEffect } from "react";
import { QRCodeRecord } from "../../api/types";
import {
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Box,
  Link,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

interface CollapsibleRowProps {
  row: QRCodeRecord;
  index: number;
  onDelete?: () => void;
  onEdit?: (index: number, newLabel: string, newUrl?: string) => Promise<any>;
}

const CollapsibleRow: React.FC<CollapsibleRowProps> = ({
  row,
  index,
  onDelete,
  onEdit,
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(row.label);
  const [url, setUrl] = useState(row.targetUrl);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open && editing) {
      setEditing(false);
      setLabel(row.label);
      setUrl(row.targetUrl);
    }
  }, [open, editing, row.label, row.targetUrl]);

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen((o) => !o)}
            disabled={loading}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          {editing ? (
            <TextField
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              size="small"
              fullWidth
              disabled={loading}
            />
          ) : (
            <Link
              href={row.dynamic ? `/r/${row.codeID}` : row.targetUrl}
              target="_blank"
              rel="noopener"
            >
              {row.label || row.codeID}
            </Link>
          )}
        </TableCell>
        <TableCell align="right">{row.timestamp.toLocaleString()}</TableCell>
        <TableCell align="right">{row.userID || "N/A"}</TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ padding: 0 }} colSpan={onDelete ? 5 : 4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <img
                src={row.imgUrl}
                alt={row.codeID}
                style={{ maxWidth: 100, height: 100 }}
              />
              <div style={{ display: "flex", flexDirection: "row", gap: 1 }}>
                {/* download / delete */}
                {!editing && (
                  <Box>
                    <a href={row.imgUrl} download={`${row.codeID}.png`}>
                      <Button startIcon={<DownloadIcon />}>Download</Button>
                    </a>
                    {onDelete && (
                      <Button
                        onClick={onDelete}
                        startIcon={<DeleteIcon />}
                        sx={{ ml: 1 }}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                )}

                {/* when editing, show the URL field too for dynamic codes */}
                {editing && row.dynamic && (
                  <TextField
                    label="Target URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    size="small"
                    fullWidth
                    disabled={loading}
                  />
                )}

                {/* edit / save / cancel buttons */}
                {editing && onEdit ? (
                  <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                    <Button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onEdit(
                            index,
                            label,
                            row.dynamic ? url : undefined
                          );
                          setEditing(false);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      startIcon={
                        loading ? <CircularProgress size={16} /> : undefined
                      }
                    >
                      {loading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={() => {
                        setLabel(row.label);
                        setUrl(row.targetUrl);
                        setEditing(false);
                      }}
                      disabled={loading}
                      sx={{ ml: 1 }}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  onEdit && (
                    <Button
                      onClick={() => setEditing(true)}
                      startIcon={<EditIcon />}
                      sx={{ ml: 1 }}
                    >
                      Edit
                    </Button>
                  )
                )}
              </div>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default CollapsibleRow;
