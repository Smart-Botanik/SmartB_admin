import React, { useState } from "react";
import { Upload, Button, Progress, message, type UploadProps } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { mediaApi, type MediaUploadResponse } from "../../../services/media";

interface MediaUploadProps {
  onUploadComplete?: (files: MediaUploadResponse[]) => void;
  maxFiles?: number;
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  showProgress?: boolean;
  uploadedFiles?: MediaUploadResponse[]; // For initialization in stories/testing
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onUploadComplete,
  maxFiles = 10,
  accept = "image/*,video/*,.pdf",
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  showProgress = true,
  uploadedFiles: initialUploadedFiles = [],
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] =
    useState<MediaUploadResponse[]>(initialUploadedFiles);

  const handleUpload = async (file: File) => {
    if (file.size > maxSize) {
      message.error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return false;
    }

    setUploading(true);
    setProgress(0);

    try {
      const response = await mediaApi.uploadFiles([file]);
      const newFiles = [...uploadedFiles, ...response];
      setUploadedFiles(newFiles);
      onUploadComplete?.(newFiles);
      message.success("File uploaded successfully");
      return true;
    } catch (error) {
      message.error("Upload failed");
      return false;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = (file: MediaUploadResponse) => {
    const newFiles = uploadedFiles.filter((f) => f.id !== file.id);
    setUploadedFiles(newFiles);
    onUploadComplete?.(newFiles);
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple,
    accept,
    beforeUpload: handleUpload,
    showUploadList: false,
    disabled: uploading || uploadedFiles.length >= maxFiles,
  };

  return (
    <div className="media-upload">
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag files to this area to upload
        </p>
        <p className="ant-upload-hint">
          Support for single or bulk upload. Maximum {maxFiles} files.
        </p>
      </Upload.Dragger>

      {showProgress && uploading && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={progress} status="active" />
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4>Uploaded Files:</h4>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span>{file.name}</span>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(file)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
