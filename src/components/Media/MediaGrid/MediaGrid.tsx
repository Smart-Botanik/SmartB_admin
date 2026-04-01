import React from "react";
import { type MediaItem, mediaApi } from "../../../services/media";
import { useMediaGrid } from "./useMediaGrid";
import { MediaGridPresentation } from "./MediaGridPresentation";

interface MediaGridProps {
  selectable?: boolean;
  onSelectionChange?: (selectedFiles: MediaItem[]) => void;
  onFileClick?: (file: MediaItem) => void;
  pageSize?: number;
  showActions?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  selectable = false,
  onSelectionChange,
  onFileClick,
  pageSize = 20,
  showActions = true,
}) => {
  const {
    files,
    selectedFiles,
    pagination,
    previewFile,
    currentFolder,
    canGoBack,
    isLoading,
    handleSelect,
    handleSelectAll,
    handleDelete,
    handleBatchDelete,
    handleSearch,
    handleFileClick,
    handleOpenFolder,
    handleGoBack,
    handlePreview,
    handlePreviewClose,
    handlePageChange,
    formatFileSize,
    selectedFoldersCount,
    selectedImagesCount,
    selectedFilesCount,
  } = useMediaGrid({ pageSize, onSelectionChange, onFileClick });

  return (
    <MediaGridPresentation
      // Data
      files={files}
      selectedFiles={selectedFiles}
      pagination={pagination}
      previewFile={previewFile}
      pageSize={pageSize}
      currentFolder={currentFolder}
      canGoBack={canGoBack}
      isLoading={isLoading}
      // Configuration
      selectable={selectable}
      showActions={showActions}
      // Actions
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      onDelete={handleDelete}
      onBatchDelete={handleBatchDelete}
      onSearch={handleSearch}
      onFileClick={handleFileClick}
      onOpenFolder={handleOpenFolder}
      onGoBack={handleGoBack}
      onPreview={handlePreview}
      onPreviewClose={handlePreviewClose}
      onPageChange={handlePageChange}
      // Utilities
      formatFileSize={formatFileSize}
      getFileUrl={mediaApi.getPreviewUrl}
      // Selection counts
      selectedFoldersCount={selectedFoldersCount}
      selectedImagesCount={selectedImagesCount}
      selectedFilesCount={selectedFilesCount}
    />
  );
};
