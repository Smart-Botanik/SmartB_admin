import React from "react";
import { Button, Card, Space, Typography } from "antd";
import { CopyOutlined, PictureOutlined } from "@ant-design/icons";

import { MediaUpload } from "@/components/Media/MediaUpload/MediaUpload";
import type { MediaUploadResponse } from "@/services/media";

const { Text } = Typography;

type GuideMediaPanelProps = {
  guideId?: string;
  onInsert: (snippet: string, field: "site" | "telegram") => void;
  activeField: "site" | "telegram";
  onMediaUploaded?: (file: MediaUploadResponse) => void;
  uploadedFiles?: MediaUploadResponse[];
};

export const GuideMediaPanel: React.FC<GuideMediaPanelProps> = ({
  guideId,
  onInsert,
  activeField,
  onMediaUploaded,
  uploadedFiles = [],
}) => {
  const storageFolder = guideId ? `guides/${guideId}` : "guides";

  const handleInsert = (file: MediaUploadResponse) => {
    const alt = file.name?.replace(/\.[^.]+$/, "") ?? "image";
    const snippet = `![${alt}](media://${file.id})`;
    onInsert(snippet, activeField);
  };

  return (
    <Card size="small" title="Медиа для статьи">
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Text type="secondary">
          Загрузите изображение, затем вставьте тег в{" "}
          {activeField === "site" ? "Site MD" : "Telegram MD"}.
        </Text>
        <MediaUpload
          maxFiles={10}
          multiple
          accept="image/*"
          storageFolder={storageFolder}
          uploadedFiles={uploadedFiles}
          onUploadComplete={files => {
            const last = files[files.length - 1];
            if (last) onMediaUploaded?.(last);
          }}
        />
        {uploadedFiles.length > 0 ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            {uploadedFiles.map(file => (
              <Space key={file.id} wrap>
                <PictureOutlined />
                <Text ellipsis style={{ maxWidth: 180 }}>
                  {file.name ?? file.id}
                </Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleInsert(file)}
                >
                  Вставить
                </Button>
              </Space>
            ))}
          </Space>
        ) : null}
      </Space>
    </Card>
  );
};
