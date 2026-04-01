import React from "react";
import {
  Card,
  Image,
  Checkbox,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Pagination,
  Skeleton,
} from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { type MediaItem } from "../../../services/media";

const { Search } = Input;
const { Option } = Select;

interface MediaGridPresentationProps {
  // Data
  files: MediaItem[];
  selectedFiles: string[];
  pagination: { current: number; total: number };
  previewFile: MediaItem | null;
  pageSize: number;
  currentFolder: string;
  canGoBack: boolean;
  isLoading: boolean;

  // Configuration
  selectable?: boolean;
  showActions?: boolean;

  // Actions
  onSelectionChange?: (selectedFiles: MediaItem[]) => void;
  onFileClick?: (file: MediaItem) => void;
  onSelect: (fileId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDelete: (fileId: string) => void;
  onBatchDelete: () => void;
  onSearch: (term: string) => void;
  onOpenFolder: (folder: MediaItem) => void;
  onGoBack: () => void;
  onPreview: (file: MediaItem) => void;
  onPreviewClose: () => void;
  onPageChange: (page: number) => void;

  // Utilities
  formatFileSize: (bytes?: number) => string;
  getFileUrl: (file: MediaItem) => string;

  // Selection counts
  selectedFoldersCount: number;
  selectedImagesCount: number;
  selectedFilesCount: number;
}

export const MediaGridPresentation: React.FC<MediaGridPresentationProps> = ({
  files,
  selectedFiles,
  pagination,
  previewFile,
  pageSize,
  currentFolder,
  canGoBack,
  isLoading,
  selectable = false,
  showActions = true,
  onFileClick,
  onSelect,
  onSelectAll,
  onDelete,
  onBatchDelete,
  onSearch,
  onOpenFolder,
  onGoBack,
  onPreview,
  onPreviewClose,
  onPageChange,
  formatFileSize,
  getFileUrl,
  selectedFoldersCount,
  selectedImagesCount,
  selectedFilesCount,
}) => {
  return (
    <div className="media-grid">
      {/* Filters and Actions */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          {canGoBack && <Button onClick={onGoBack}>Back</Button>}
          {currentFolder !== "root" && (
            <Tag color="geekblue">{currentFolder}</Tag>
          )}
          <Search
            placeholder="Search files..."
            allowClear
            style={{ width: 250 }}
            onSearch={onSearch}
            onChange={(e) => !e.target.value && onSearch("")}
          />
          <Select
            placeholder="File type"
            allowClear
            style={{ width: 150 }}
            onChange={() => {
              // Filter by type logic here
            }}
          >
            <Option value="image">Images</Option>
            <Option value="folder">Folders</Option>
          </Select>
        </Space>

        {selectable && selectedFiles.length > 0 && (
          <Space>
            <span>
              {selectedFiles.length} selected
              {selectedFoldersCount > 0 && (
                <span style={{ color: "#1890ff", marginLeft: 8 }}>
                  ({selectedFoldersCount} folders, {selectedFilesCount} files
                  {selectedImagesCount > 0 && `, ${selectedImagesCount} images`}
                  )
                </span>
              )}
            </span>
            <Button danger onClick={onBatchDelete}>
              Delete Selected
            </Button>
          </Space>
        )}
      </div>

      {/* Select All */}
      {selectable && (
        <div style={{ marginBottom: 16 }}>
          <Checkbox
            checked={selectedFiles.length === files.length && files.length > 0}
            indeterminate={
              selectedFiles.length > 0 && selectedFiles.length < files.length
            }
            onChange={(e) => onSelectAll(e.target.checked)}
          >
            Select All
          </Checkbox>
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={`skeleton_${i}`}>
                <Skeleton active avatar paragraph={{ rows: 2 }} />
              </Card>
            ))
          : files.map((file) => (
              <Card
                key={file.id}
                hoverable
                onClick={() => {
                  if (file.type === "folder") {
                    onOpenFolder(file);
                    return;
                  }
                  onFileClick?.(file);
                }}
                cover={
                  <div
                    style={{
                      position: "relative",
                      height: 150,
                      background: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {file.type === "image" && file.url ? (
                      <Image
                        src={getFileUrl(file)}
                        alt={file.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        preview={false}
                      />
                    ) : (
                      <div style={{ textAlign: "center", padding: 16 }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>
                          {file.type === "folder" ? "📁" : "📄"}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {file.type === "folder"
                            ? "Folder"
                            : file.mime?.split("/")[1]?.toUpperCase()}
                        </div>
                      </div>
                    )}

                    {selectable && (
                      <Checkbox
                        style={{ position: "absolute", top: 8, left: 8 }}
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => onSelect(file.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                }
                actions={
                  showActions
                    ? [
                        <EyeOutlined
                          key="preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreview(file);
                          }}
                        />,
                        <EditOutlined
                          key="edit"
                          onClick={(e) => e.stopPropagation()}
                        />,
                        <DeleteOutlined
                          key="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file.id);
                          }}
                        />,
                      ]
                    : undefined
                }
              >
                <Card.Meta
                  title={
                    <div
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: 14,
                      }}
                    >
                      {file.name}
                    </div>
                  }
                  description={
                    <div>
                      <Tag color="blue">{formatFileSize(file.size)}</Tag>
                      <div
                        style={{ fontSize: 12, color: "#666", marginTop: 4 }}
                      >
                        {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  }
                />
              </Card>
            ))}
      </div>

      {/* Preview Modal */}
      <Modal
        open={!!previewFile}
        title={previewFile?.name}
        footer={null}
        onCancel={onPreviewClose}
        width="80%"
      >
        {previewFile && (
          <div style={{ textAlign: "center" }}>
            {previewFile.type === "image" && previewFile.url ? (
              <Image
                src={getFileUrl(previewFile)}
                alt={previewFile.name}
                style={{ maxWidth: "100%" }}
              />
            ) : (
              <div style={{ padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                  {previewFile.type === "folder" ? "📁" : "📄"}
                </div>
                <div>
                  <a
                    href={getFileUrl(previewFile)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open File
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Pagination */}
      {pagination.total > pageSize && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pageSize}
            onChange={onPageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>
      )}
    </div>
  );
};
