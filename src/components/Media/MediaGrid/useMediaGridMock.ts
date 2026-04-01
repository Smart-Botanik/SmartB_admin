import { useState, useCallback, useEffect } from "react";
import { type MediaItem } from "../../../services/media";

interface UseMediaGridMockProps {
  onSelectionChange?: (selectedFiles: MediaItem[]) => void;
  mockFiles?: MediaItem[];
}

interface UseMediaGridMockReturn {
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

// Mock data for stories
const mockMediaFiles: MediaItem[] = [
  {
    id: "1",
    name: "landscape.jpg",
    type: "image",
    mime: "image/jpeg",
    size: 2048576,
    url: "https://picsum.photos/400/300?random=1",
    createdAt: "2024-01-15T10:30:00Z",
    key: "images/landscape.jpg",
  },
  {
    id: "root_1",
    name: "logo.png",
    type: "image",
    mime: "image/png",
    size: 256000,
    url: "https://picsum.photos/200/200?random=10",
    createdAt: "2024-01-16T08:00:00Z",
    key: "logo.png",
  },
  {
    id: "3",
    name: "document.pdf",
    type: "folder",
    mime: "application/pdf",
    size: 512000,
    url: "/files/document.pdf",
    createdAt: "2024-01-13T09:20:00Z",
    key: "documents/document.pdf",
  },
];

export const useMediaGridMock = ({
  onSelectionChange,
  mockFiles = mockMediaFiles,
}: UseMediaGridMockProps): UseMediaGridMockReturn => {
  // State
  const [files, setFiles] = useState<MediaItem[]>(mockFiles);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    total: mockFiles.length,
  });
  const [previewFile, setPreviewFile] = useState<MediaItem | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string>("root");
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getFolderFromKey = useCallback((key?: string) => {
    if (!key) return "root";
    if (!key.includes("/")) return "root";
    return key.split("/").slice(0, -1).join("/") || "root";
  }, []);

  const extractFoldersAtLevel = useCallback(
    (items: MediaItem[], folder: string) => {
      const folderMap = new Map<string, MediaItem>();

      items.forEach((item) => {
        const key = item.key;
        if (!key || !key.includes("/")) return;

        const parts = key.split("/");
        if (folder === "root") {
          if (parts.length < 2) return;
          const childName = parts[0];
          const childKey = childName;
          if (!folderMap.has(childKey)) {
            folderMap.set(childKey, {
              id: `folder_${childKey}`,
              name: childName,
              type: "folder",
              mime: "folder",
              size: 0,
              url: "",
              createdAt: new Date().toISOString(),
              key: childKey,
            } as MediaItem);
          }
          return;
        }

        if (!key.startsWith(`${folder}/`)) return;
        const rest = key.slice(folder.length + 1);
        if (!rest.includes("/")) return;

        const childName = rest.split("/")[0];
        const childKey = `${folder}/${childName}`;
        if (!folderMap.has(childKey)) {
          folderMap.set(childKey, {
            id: `folder_${childKey.replace(/\//g, "_")}`,
            name: childName,
            type: "folder",
            mime: "folder",
            size: 0,
            url: "",
            createdAt: new Date().toISOString(),
            key: childKey,
            folder,
          } as MediaItem);
        }
      });

      return Array.from(folderMap.values());
    },
    [],
  );

  // Mock load files (simulates API call)
  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filesInFolder = mockFiles.filter((file) => {
      if (file.type === "folder") {
        // ignore 'folder' typed non-folders in mock data
        return true;
      }
      return true;
    });

    const visibleFiles = filesInFolder.filter((file) => {
      const fileFolder = getFolderFromKey(file.key);
      if (fileFolder !== currentFolder) return false;
      if (!normalizedSearch) return true;
      return (file.name || "").toLowerCase().includes(normalizedSearch);
    });

    const foldersAtLevel = extractFoldersAtLevel(mockFiles, currentFolder);
    const allItems = [...foldersAtLevel, ...visibleFiles].sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    setFiles(allItems);
    setPagination((prev) => ({ ...prev, total: allItems.length }));
    setIsLoading(false);
  }, [
    searchTerm,
    mockFiles,
    currentFolder,
    extractFoldersAtLevel,
    getFolderFromKey,
  ]);

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

  // Mock delete handlers
  const handleDelete = useCallback(
    async (fileId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newFiles = files.filter((f) => f.id !== fileId);
      setFiles(newFiles);
      setPagination((prev) => ({ ...prev, total: newFiles.length }));

      // Remove from selection if selected
      if (selectedFiles.includes(fileId)) {
        const newSelection = selectedFiles.filter((id) => id !== fileId);
        setSelectedFiles(newSelection);
        const selectedFileObjects = newFiles.filter((f) =>
          newSelection.includes(f.id),
        );
        onSelectionChange?.(selectedFileObjects);
      }
    },
    [files, selectedFiles, onSelectionChange],
  );

  const handleBatchDelete = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newFiles = files.filter((f) => !selectedFiles.includes(f.id));
    setFiles(newFiles);
    setPagination((prev) => ({ ...prev, total: newFiles.length }));
    setSelectedFiles([]);
    onSelectionChange?.([]);
  }, [selectedFiles, files, onSelectionChange]);

  // Search handler
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPagination((prev) => ({ ...prev, current: 1 })); // Reset to first page
  }, []);

  const handleFileClick = useCallback((_file: MediaItem) => {
    // noop for story
  }, []);

  const handleOpenFolder = useCallback(
    (folder: MediaItem) => {
      const nextFolder = folder.key || folder.name || "root";
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
