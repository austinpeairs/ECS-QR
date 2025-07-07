import React, { useState } from "react";
import { Button, ButtonGroup } from "@mui/material";
import UploadFile from "./UploadFilev2";
import InputUrl from "./InputUrl";
import { QRCodeRecord } from "../../api/types";
import LinkIcon from "@mui/icons-material/Link";
import UploadIcon from "@mui/icons-material/Upload";

interface CodeGeneratorProps {
  onQRCodeGenerated: (qrCode: QRCodeRecord) => Promise<any>;
  onStart: () => void;
  loading: boolean;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({
  onQRCodeGenerated,
  onStart,
  loading,
}) => {
  const [mode, setMode] = useState<"file" | "url">("file");

  return (
    <div>
      <ButtonGroup
        size="small"
        variant="text"
        aria-label="split button"
        disabled={loading}
      >
        <Button onClick={() => setMode("file")} startIcon={<UploadIcon />}>
          File
        </Button>
        <Button onClick={() => setMode("url")} startIcon={<LinkIcon />}>
          URL
        </Button>
      </ButtonGroup>
      {mode === "file" ? (
        <UploadFile
          onStart={onStart}
          onQRCodeGenerated={onQRCodeGenerated}
          loading={loading}
        />
      ) : (
        <InputUrl
          onStart={onStart}
          onQRCodeGenerated={onQRCodeGenerated}
          loading={loading}
        />
      )}
    </div>
  );
};

export default CodeGenerator;
