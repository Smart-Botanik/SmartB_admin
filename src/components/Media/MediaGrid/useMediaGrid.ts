import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { mediaApi, type MediaItem } from "../../../services/media";

interface UseMediaGridProps {
  pageSize?: number;
  onSelectionChange?: (selectedFiles: MediaItem[]) => void;
  onFileClick?: (file: MediaItem) => void;
}

interface UseMediaGridReturn {
  // State
  files: MediaItem[];
  selectedFiles: string[];
  searchTerm: string;
  pagination: { current: number; total: number };
  previewFile: MediaItem | null;
  currentFolder: string;
  canGoBack: boolean;
  isLoading: boolean;

  // Actions
  loadFiles: () => Promise<void>;
  handleSelect: (fileId: string, checked: boolean) => void;
  handleSelectAll: (checked: boolean) => void;
  handleDelete: (fileId: string) => Promise<void>;
  handleBatchDelete: () => Promise<void>;
  handleSearch: (term: string) => void;
  handleFileClick: (file: MediaItem) => void;
  handleOpenFolder: (folder: MediaItem) => void;
  handleGoBack: () => void;
  handlePreview: (file: MediaItem) => void;
  handlePreviewClose: () => void;
  handlePageChange: (page: number) => void;

  // Utilities
  formatFileSize: (bytes?: number) => string;
  selectedFileObjects: MediaItem[];
  selectedFoldersCount: number;
  selectedImagesCount: number;
  selectedFilesCount: number;
}

export const useMediaGrid = ({
  pageSize = 20,
  onSelectionChange,
  onFileClick,
}: UseMediaGridProps): UseMediaGridReturn => {
  // State
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ current: 1, total: 0 });
  const [previewFile, setPreviewFile] = useState<MediaItem | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string>("root");
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load files
  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await mediaApi.getMediaList({
        page: pagination.current,
        pageSize,
        folder: currentFolder === "root" ? undefined : currentFolder,
        search: searchTerm,
      });

      const filteredItems = response.media.filter((item) => {
        const parentFolder = item.folder || "root";
        if (currentFolder === "root") {
          return parentFolder === "root";
        }
        return parentFolder === currentFolder;
      });

      setFiles(filteredItems);
      setPagination((prev) => ({ ...prev, total: filteredItems.length }));
    } catch (error) {
      message.error("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.current, pageSize, currentFolder, searchTerm]);

  // Effects
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Selection handlers
  const handleSelect = useCallback(
    (fileId: string, checked: boolean) => {
      const newSelection = checked
        ? [...selectedFiles, fileId]
        : selectedFiles.filter((id) => id !== fileId);

      setSelectedFiles(newSelection);
      const selectedFileObjects = files.filter((f) =>
        newSelection.includes(f.id),
      );
      onSelectionChange?.(selectedFileObjects);
    },
    [selectedFiles, files, onSelectionChange],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const newSelection = checked ? files.map((f) => f.id) : [];
      setSelectedFiles(newSelection);
      const selectedFileObjects = files.filter((f) =>
        newSelection.includes(f.id),
      );
      onSelectionChange?.(selectedFileObjects);
    },
    [files, onSelectionChange],
  );

  // Delete handlers
  const handleDelete = useCallback(
    async (fileId: string) => {
      try {
        await mediaApi.deleteMediaItem(fileId);
        message.success("File deleted successfully");
        await loadFiles();
      } catch (error) {
        message.error("Failed to delete file");
      }
    },
    [loadFiles],
  );

  const handleBatchDelete = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      await Promise.all(
        selectedFiles.map((id) => mediaApi.deleteMediaItem(id)),
      );
      message.success(`${selectedFiles.length} files deleted successfully`);
      setSelectedFiles([]);
      await loadFiles();
    } catch (error) {
      message.error("Failed to delete files");
    }
  }, [selectedFiles, loadFiles]);

  // Search handler
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPagination((prev) => ({ ...prev, current: 1 })); // Reset to first page
  }, []);

  const handleOpenFolder = useCallback(
    (folder: MediaItem) => {
      const nextFolder = folder.key || folder.folder || folder.name || "root";
      setFolderStack((prev) => [...prev, currentFolder]);
      setCurrentFolder(nextFolder);
      setPagination((prev) => ({ ...prev, current: 1 }));
      setSearchTerm("");
      setSelectedFiles([]);
      onSelectionChange?.([]);
    },
    [currentFolder, onSelectionChange],
  );

  const handleGoBack = useCallback(() => {
    setFolderStack((prev) => {
      const copy = [...prev];
      const previousFolder = copy.pop() ?? "root";
      setCurrentFolder(previousFolder);
      return copy;
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchTerm("");
    setSelectedFiles([]);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // File click handler
  const handleFileClick = useCallback(
    (file: MediaItem) => {
      onFileClick?.(file);
    },
    [onFileClick],
  );

  // Preview handlers
  const handlePreview = useCallback((file: MediaItem) => {
    setPreviewFile(file);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setPreviewFile(null);
  }, []);

  // Pagination handler
  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, current: page }));
  }, []);

  // Utility
  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Computed values
  const selectedFileObjects = files.filter((f) => selectedFiles.includes(f.id));
  const selectedFoldersCount = selectedFileObjects.filter(
    (f) => f.type === "folder",
  ).length;
  const selectedImagesCount = selectedFileObjects.filter(
    (f) => f.type === "image",
  ).length;
  const selectedFilesCount = selectedFileObjects.filter(
    (f) => f.type !== "folder",
  ).length;
  const canGoBack = folderStack.length > 0;

  return {
    // State
    files,
    selectedFiles,
    searchTerm,
    pagination,
    previewFile,
    currentFolder,
    canGoBack,
    isLoading,

    // Actions
    loadFiles,
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

    // Utilities
    formatFileSize,
    selectedFileObjects,
    selectedFoldersCount,
    selectedImagesCount,
    selectedFilesCount,
  };
};
