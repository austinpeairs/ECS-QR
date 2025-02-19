import React, { useState } from "react";
import { Button, ButtonGroup } from "@mui/material";
import UploadFile from "./UploadFilev2";
import InputUrl from "./InputUrl";
import { QRCodeRecord } from "../../api/types";
import LinkIcon from "@mui/icons-material/Link";
import UploadIcon from "@mui/icons-material/Upload";

interface CodeGeneratorProps {
  onQRCodeGenerated: (qrCode: QRCodeRecord) => void;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ onQRCodeGenerated }) => {
  const [mode, setMode] = useState<"file" | "url">("file");

  const handleModeChange = (newMode: "file" | "url") => {
    setMode(newMode);
  };

  return (
    <div>
      <ButtonGroup size="small" variant="outlined" aria-label="split button">
        <Button
          onClick={() => handleModeChange("file")}
          startIcon={<UploadIcon />}
        >
          File
        </Button>
        <Button
          onClick={() => handleModeChange("url")}
          startIcon={<LinkIcon />}
        >
          URL
        </Button>
      </ButtonGroup>
      {mode === "file" ? (
        <UploadFile onQRCodeGenerated={onQRCodeGenerated} />
      ) : (
        <InputUrl onQRCodeGenerated={onQRCodeGenerated} />
      )}
    </div>
  );
};

export default CodeGenerator;
