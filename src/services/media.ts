import axios, { AxiosInstance, AxiosError } from "axios";
import { envConfig } from "@/config/env";
import { getAccessToken } from "@/utils/token";

export interface MediaItem {
  id: string;
  provider?: string;
  bucket?: string;
  key: string;
  url: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
  // Add computed properties for compatibility
  name?: string;
  type?: "folder" | "image";
  folder?: string;
}

export interface MediaUploadResponse {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface MediaListResponse {
  media: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

class MediaApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: envConfig.apiUrl,
      timeout: envConfig.apiTimeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: false,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_token_expires_at");
          localStorage.removeItem("admin_user_data");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Upload media files
   */
  async uploadFiles(
    files: File[],
    folder?: string,
  ): Promise<MediaUploadResponse[]> {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      if (folder && folder !== "root") {
        formData.append("folder", folder);
      }

      try {
        const response = await this.api.post<{
          id: string;
          url: string;
          mime?: string;
          mimeType?: string;
          size?: number;
          width?: number;
          height?: number;
          createdAt: string;
        }>("/media/admin/media/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        const raw = response.data;
        const mapped: MediaUploadResponse = {
          id: raw.id,
          name: file.name,
          url: raw.url,
          size: raw.size ?? file.size,
          mimeType:
            (raw.mimeType ?? raw.mime ?? file.type) || "application/octet-stream",
          width: raw.width,
          height: raw.height,
          createdAt:
            typeof raw.createdAt === "string"
              ? raw.createdAt
              : new Date(raw.createdAt).toISOString(),
        };
        return mapped;
      } catch (error) {
        throw this.handleError(error);
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Загрузка с серверной обрезкой/ресайзом (после клиентского crop — передать координаты в пикселях исходника).
   * См. Nest `POST /media/admin/media/upload-with-crop` (поля cropOptions/resizeOptions как JSON-строки в FormData).
   */
  async uploadWithCrop(
    file: File,
    options: {
      cropOptions: { x: number; y: number; width: number; height: number };
      resizeOptions?: { width?: number; height?: number; fit?: string };
      generateThumbnail?: boolean;
      folder?: string;
      entityType?: string;
      entityId?: string;
    },
  ): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (options.folder && options.folder !== "root") {
      formData.append("folder", options.folder);
    }
    if (options.entityType) {
      formData.append("entityType", options.entityType);
    }
    if (options.entityId) {
      formData.append("entityId", options.entityId);
    }
    formData.append("cropOptions", JSON.stringify(options.cropOptions));
    if (options.resizeOptions) {
      formData.append("resizeOptions", JSON.stringify(options.resizeOptions));
    }
    if (options.generateThumbnail != null) {
      formData.append("generateThumbnail", String(options.generateThumbnail));
    }

    try {
      const response = await this.api.post<{
        id: string;
        url: string;
        mime?: string;
        mimeType?: string;
        size?: number;
        width?: number;
        height?: number;
        createdAt: string;
      }>("/media/admin/media/upload-with-crop", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const raw = response.data;
      return {
        id: raw.id,
        name: file.name,
        url: raw.url,
        size: raw.size ?? file.size,
        mimeType:
          (raw.mimeType ?? raw.mime ?? file.type) || "application/octet-stream",
        width: raw.width,
        height: raw.height,
        createdAt:
          typeof raw.createdAt === "string"
            ? raw.createdAt
            : new Date(raw.createdAt).toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get media list
   */
  async getMediaList(params?: {
    page?: number;
    pageSize?: number;
    folder?: string;
    search?: string;
    type?: "all" | "folder" | "image";
  }): Promise<MediaListResponse> {
    try {
      const response = await this.api.get<any>("/media/admin/media", {
        params,
      });
      return this.transformMediaList(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get media item by ID
   */
  async getMediaItem(id: string): Promise<MediaItem> {
    try {
      const response = await this.api.get<MediaItem>(
        `/media/admin/media/${id}`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update media item
   */
  async updateMediaItem(
    id: string,
    data: Partial<MediaItem>,
  ): Promise<MediaItem> {
    try {
      const response = await this.api.put<MediaItem>(
        `/media/admin/media/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete media item
   */
  async deleteMediaItem(id: string): Promise<void> {
    try {
      await this.api.delete(`/media/admin/media/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create folder - Note: This might need to be implemented in the backend
   */
  async createFolder(name: string, parentFolder?: string): Promise<MediaItem> {
    // For now, we'll simulate folder creation
    // In a real implementation, this would call a backend endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `folder_${Date.now()}`,
          name,
          type: "folder",
          createdAt: new Date().toISOString(),
          folder: parentFolder,
        } as MediaItem);
      }, 500);
    });
  }

  /**
   * Delete folder - Note: This might need to be implemented in the backend
   */
  async deleteFolder(_id: string): Promise<void> {
    // For now, we'll simulate folder deletion
    // In a real implementation, this would call a backend endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 300);
    });
  }

  /**
   * Handle API errors and return standardized error format
   */
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      const message =
        response?.data?.message || error.message || "An error occurred";

      return {
        message,
        statusCode: response?.status,
        code: response?.data?.code,
      };
    }

    return {
      message: error.message || "An unexpected error occurred",
    };
  }

  /**
   * Transform backend media data to frontend format
   */
  private transformMediaItem(item: any): MediaItem {
    const fileName = item.key.split("/").pop() || "unknown";
    const isImage = item.mime.startsWith("image/");

    return {
      ...item,
      name: fileName,
      type: isImage ? "image" : "folder",
      folder: item.key.includes("/")
        ? item.key.split("/").slice(0, -1).join("/")
        : undefined,
    };
  }

  /**
   * Extract unique folders from media items
   */
  private extractFolders(mediaItems: MediaItem[]): MediaItem[] {
    const folderMap = new Map<string, MediaItem>();

    mediaItems.forEach((item) => {
      if (item.key && item.key.includes("/")) {
        const pathParts = item.key.split("/");
        let currentPath = "";

        // Create folder items for each level of the path
        for (let i = 0; i < pathParts.length - 1; i++) {
          const folderName = pathParts[i];
          currentPath = currentPath
            ? `${currentPath}/${folderName}`
            : folderName;

          if (!folderMap.has(currentPath)) {
            folderMap.set(currentPath, {
              id: `folder_${currentPath.replace(/\//g, "_")}`,
              name: folderName,
              type: "folder",
              url: "",
              mime: "folder",
              size: 0,
              width: undefined,
              height: undefined,
              createdAt: new Date().toISOString(),
              folder: i > 0 ? pathParts.slice(0, i).join("/") : undefined,
              key: currentPath,
              provider: "local",
              bucket: "uploads",
            });
          }
        }
      }
    });

    return Array.from(folderMap.values());
  }

  /**
   * Transform media list response
   */
  private transformMediaList(response: any): MediaListResponse {
    const transformedFiles = response.media.map((item: any) =>
      this.transformMediaItem(item),
    );
    const folders = this.extractFolders(transformedFiles);

    // Combine folders and files, sort by type (folders first) then by name
    const allItems = [...folders, ...transformedFiles].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1; // Folders first
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    return {
      media: allItems,
      pagination: response.pagination,
    };
  }

  /**
   * Get file preview URL
   */
  getPreviewUrl(item: MediaItem): string {
    if (item.url) {
      // If it's already a full URL, return as is
      if (item.url.startsWith("http")) {
        return item.url;
      }
      // Otherwise, construct full URL from backend
      return `${envConfig.apiUrl.replace("/api", "")}${item.url}`;
    }
    return "";
  }

  /**
   * Format file size
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return "-";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Check if file is an image
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
  }

  /**
   * Create object URL for preview
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke object URL
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const mediaApi = new MediaApiService();
export default mediaApi;
