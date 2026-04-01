import React from "react";
import { type MediaItem } from "../../../services/media";
import { useMediaGridMock } from "./useMediaGridMock";
import { MediaGridPresentation } from "./MediaGridPresentation";

interface MediaGridStoryProps {
  selectable?: boolean;
  onSelectionChange?: (selectedFiles: MediaItem[]) => void;
  onFileClick?: (file: MediaItem) => void;
  pageSize?: number;
  showActions?: boolean;
  mockFiles?: MediaItem[];
}

export const MediaGridStory: React.FC<MediaGridStoryProps> = ({
  selectable = false,
  onSelectionChange,
  pageSize = 20,
  showActions = true,
  mockFiles,
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
  } = useMediaGridMock({ onSelectionChange, mockFiles });

  // Mock getFileUrl function for stories
  const getFileUrl = (file: MediaItem) => {
    if (file.url && file.url.startsWith("http")) {
      return file.url;
    }
    return `https://picsum.photos/400/300?random=${file.id}`;
  };

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
      getFileUrl={getFileUrl}
      // Selection counts
      selectedFoldersCount={selectedFoldersCount}
      selectedImagesCount={selectedImagesCount}
      selectedFilesCount={selectedFilesCount}
    />
  );
};
