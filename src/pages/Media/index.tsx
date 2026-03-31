import React, { useState, useEffect } from "react";
import {
  Table,
  Image,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Upload,
  Card,
  Row,
  Col,
  Typography,
  Empty,
  Tooltip,
  Popconfirm,
  Breadcrumb,
  Input,
  Select,
  List,
} from "antd";
import {
  PlusOutlined,
  FolderOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  UploadOutlined,
  HomeOutlined,
  SearchOutlined,
  FilterOutlined,
  FolderAddOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigation } from "@refinedev/core";
import ImgCrop from "antd-img-crop";
import mediaApi, { MediaItem } from "@/services/media";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Search } = Input;
const { Option } = Select;

interface UploadPreview {
  file: File;
  preview: string;
  name: string;
  size: number;
}

const MediaLibrary: React.FC = () => {
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isNewFolderModalVisible, setIsNewFolderModalVisible] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string>("root");
  const [folderPath, setFolderPath] = useState<string[]>(["root"]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<UploadPreview[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [mediaData, setMediaData] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedUploadFolder, setSelectedUploadFolder] =
    useState<string>("root");

  const { edit, show } = useNavigation();

  // Load media data on component mount and when folder changes
  useEffect(() => {
    loadMediaData();
  }, [currentFolder, searchTerm, filterType]);

  const loadMediaData = async () => {
    setLoading(true);
    try {
      const response = await mediaApi.getMediaList({
        folder: currentFolder === "root" ? undefined : currentFolder,
        search: searchTerm || undefined,
        type: filterType as "all" | "folder" | "image",
      });
      setMediaData(response.media);
    } catch (error) {
      console.error("Failed to load media data:", error);
      message.error("Failed to load media files");
      // Use mock data as fallback
      setMediaData(mockMediaData);
    } finally {
      setLoading(false);
    }
  };

  // Get available folders for upload dropdown
  const getAvailableFolders = () => {
    const folders = new Set<string>(["root"]);

    mediaData.forEach((item) => {
      if (item.type === "folder" && item.name) {
        const folderPath = item.key || item.name;
        folders.add(folderPath);
      }
    });

    return Array.from(folders).sort();
  };

  // Mock data for demonstration - matches backend structure
  const mockMediaData: MediaItem[] = [
    {
      id: "cmndtac2v0002dmz25py3lufy",
      provider: "local",
      bucket: "uploads",
      key: "general/2026/03/d73cf1e4-8a8c-4ab7-9984-a0acec45f947-631769c4fef357b6e61e4a5296a9f093.jpg",
      url: "http://localhost:3001/uploads/general/2026/03/d73cf1e4-8a8c-4ab7-9984-a0acec45f947-631769c4fef357b6e61e4a5296a9f093.jpg",
      mime: "image/jpeg",
      size: 267286,
      width: undefined,
      height: undefined,
      createdAt: "2026-03-30T23:20:55.207Z",
      name: "d73cf1e4-8a8c-4ab7-9984-a0acec45f947-631769c4fef357b6e61e4a5296a9f093.jpg",
      type: "image",
      folder: "general/2026/03",
    },
    {
      id: "cmndta1p60001dmz2z0ve5qmn",
      provider: "local",
      bucket: "uploads",
      key: "general/2026/03/83300d4b-9d65-4d32-9502-e4143253339d-70a59f26bb77c67ada2166e6b9865c30.jpg",
      url: "http://localhost:3001/uploads/general/2026/03/83300d4b-9d65-4d32-9502-e4143253339d-70a59f26bb77c67ada2166e6b9865c30.jpg",
      mime: "image/jpeg",
      size: 121142,
      width: undefined,
      height: undefined,
      createdAt: "2026-03-30T23:20:41.743Z",
      name: "83300d4b-9d65-4d32-9502-e4143253339d-70a59f26bb77c67ada2166e6b9865c30.jpg",
      type: "image",
      folder: "general/2026/03",
    },
    {
      id: "cmndta1ox0000dmz2netetn9c",
      provider: "local",
      bucket: "uploads",
      key: "general/2026/03/15916859-e186-46a2-b14a-90af64fae41b-631769c4fef357b6e61e4a5296a9f093.jpg",
      url: "http://localhost:3001/uploads/general/2026/03/15916859-e186-46a2-b14a-90af64fae41b-631769c4fef357b6e61e4a5296a9f093.jpg",
      mime: "image/jpeg",
      size: 267286,
      width: undefined,
      height: undefined,
      createdAt: "2026-03-30T23:20:41.741Z",
      name: "15916859-e186-46a2-b14a-90af64fae41b-631769c4fef357b6e61e4a5296a9f093.jpg",
      type: "image",
      folder: "general/2026/03",
    },
    {
      id: "cmnc7aakta0000szsoufk3zidi",
      provider: "local",
      bucket: "uploads",
      key: "brands/brands/02788192-7a14-4a02-b464-d02c2fce90f1-Trikoma_Seeds.png",
      url: "http://localhost:3001/uploads/brands/brands/02788192-7a14-4a02-b464-d02c2fce90f1-Trikoma_Seeds.png",
      mime: "image/png",
      size: 4391,
      width: undefined,
      height: undefined,
      createdAt: "2026-03-29T20:17:28.796Z",
      name: "02788192-7a14-4a02-b464-d02c2fce90f1-Trikoma_Seeds.png",
      type: "image",
      folder: "brands/brands",
    },
  ];

  // Filter data based on current folder, search term, and filter type
  const getFilteredData = () => {
    let filtered = mediaData;

    // Filter by current folder
    if (currentFolder !== "root") {
      filtered = filtered.filter((item) => {
        if (item.type === "folder") {
          // Show subfolders of current folder
          return (
            item.folder === currentFolder ||
            (!item.folder && currentFolder === "root")
          );
        } else {
          // Show files in current folder
          return (
            item.folder === currentFolder ||
            (!item.folder && currentFolder === "root")
          );
        }
      });
    } else {
      // In root, show folders without parent and files without folder
      filtered = filtered.filter((item) => {
        if (item.type === "folder") {
          return !item.folder || item.folder === "";
        } else {
          return !item.folder || item.folder === "";
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    return filtered;
  };

  const handleBreadcrumbClick = (path: string[]) => {
    const validPath = path.filter(Boolean);
    setFolderPath(validPath);
    if (
      validPath.length <= 1 ||
      (validPath.length === 1 && validPath[0] === "root")
    ) {
      setCurrentFolder("root");
    } else {
      setCurrentFolder(validPath.join("/"));
    }
  };

  const handleFolderClick = (folder: MediaItem) => {
    const folderName = folder.name || "unknown";
    const folderPath = folder.key || folderName; // Use the key which contains the full path
    const newPath = folderPath.split("/");
    setFolderPath(newPath);
    setCurrentFolder(folderPath);
    message.info(`Navigating to folder: ${folderName}`);
  };

  const handleBackToRoot = () => {
    setFolderPath(["root"]);
    setCurrentFolder("root");
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.warning("Please enter a folder name");
      return;
    }

    try {
      const parentFolder =
        selectedUploadFolder === "root" ? undefined : selectedUploadFolder;
      await mediaApi.createFolder(newFolderName, parentFolder);
      message.success(
        `Folder "${newFolderName}" created successfully in ${selectedUploadFolder === "root" ? "root" : selectedUploadFolder}`,
      );
      setNewFolderName("");
      setIsNewFolderModalVisible(false);
      loadMediaData(); // Reload data to show new folder
    } catch (error: any) {
      message.error(error.message || "Failed to create folder");
    }
  };

  const handleRefresh = () => {
    loadMediaData();
    message.info("Refreshing media library...");
  };

  const columns = [
    {
      title: "Preview",
      dataIndex: "type",
      key: "preview",
      width: 80,
      render: (type: string, record: MediaItem) => (
        <div
          style={{
            width: 50,
            height: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {type === "folder" ? (
            <FolderOutlined style={{ fontSize: 32, color: "#1890ff" }} />
          ) : (
            <Image
              width={50}
              height={50}
              src={mediaApi.getPreviewUrl(record)}
              preview={false}
              style={{ objectFit: "cover", borderRadius: 4 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8O+L"
            />
          )}
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: MediaItem) => (
        <Space>
          {record.type === "folder" ? (
            <Button
              type="link"
              icon={<FolderOutlined />}
              onClick={() => handleFolderClick(record)}
            >
              {name}
            </Button>
          ) : (
            <Text>{name}</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "folder" ? "blue" : "green"}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (size?: number) => mediaApi.formatFileSize(size),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: MediaItem) => (
        <Space>
          {record.type === "image" && (
            <>
              <Tooltip title="View">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handleView(record)}
                />
              </Tooltip>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            </>
          )}
          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleView = (record: MediaItem) => {
    show("media", record.id);
  };

  const handleEdit = (record: MediaItem) => {
    edit("media", record.id);
  };

  const handleDelete = async (record: MediaItem) => {
    try {
      if (record.type === "folder") {
        await mediaApi.deleteFolder(record.id);
      } else {
        await mediaApi.deleteMediaItem(record.id);
      }
      message.success("Item deleted successfully");
      loadMediaData(); // Reload data
    } catch (error: any) {
      message.error(error.message || "Failed to delete item");
    }
  };

  const handleUpload = () => {
    setSelectedUploadFolder(currentFolder);
    setIsUploadModalVisible(true);
  };

  const handleUploadChange = (info: any) => {
    const { fileList } = info;
    const files = fileList
      .map((file: any) => file.originFileObj)
      .filter(Boolean);

    setSelectedFiles(files);

    // Create previews for image files
    const previews: UploadPreview[] = files
      .filter((file: File) => mediaApi.isImageFile(file))
      .map((file: File) => ({
        file,
        preview: mediaApi.createPreviewUrl(file),
        name: file.name,
        size: file.size,
      }));

    setUploadPreviews(previews);
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      message.warning("Please select files to upload");
      return;
    }

    setUploading(true);
    try {
      await mediaApi.uploadFiles(selectedFiles, selectedUploadFolder);
      message.success(
        `${selectedFiles.length} files uploaded successfully to ${selectedUploadFolder === "root" ? "root folder" : selectedUploadFolder}`,
      );
      setIsUploadModalVisible(false);
      setSelectedFiles([]);
      setUploadPreviews([]);
      loadMediaData(); // Reload data to show uploaded files
    } catch (error: any) {
      message.error(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    name: "file",
    multiple: true,
    onChange: handleUploadChange,
    beforeUpload: () => false, // Prevent automatic upload
    showUploadList: true,
    accept: "image/*",
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Media Library
          </Title>
          <Breadcrumb style={{ marginTop: 8 }}>
            <Breadcrumb.Item>
              <Button
                type="link"
                icon={<HomeOutlined />}
                onClick={handleBackToRoot}
                style={{ padding: 0, height: "auto" }}
              >
                Home
              </Button>
            </Breadcrumb.Item>
            {folderPath.slice(1).map((folder, index) => (
              <Breadcrumb.Item key={index}>
                <Button
                  type="link"
                  onClick={() =>
                    handleBreadcrumbClick(folderPath.slice(0, index + 2))
                  }
                  style={{ padding: 0, height: "auto" }}
                >
                  {folder}
                </Button>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button
            icon={<FolderAddOutlined />}
            onClick={() => setIsNewFolderModalVisible(true)}
          >
            New Folder
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleUpload}>
            Upload Files
          </Button>
        </Space>
      </div>

      {/* Search and Filter Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search media files..."
              allowClear
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All</Option>
              <Option value="folder">Folders</Option>
              <Option value="image">Images</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredData()}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  currentFolder === "root"
                    ? "No media files found. Upload some files to get started!"
                    : "No files in this folder."
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Files"
        open={isUploadModalVisible}
        onOk={handleUploadSubmit}
        onCancel={() => {
          setIsUploadModalVisible(false);
          setSelectedFiles([]);
          setUploadPreviews([]);
          // Clean up object URLs
          uploadPreviews.forEach((preview) => {
            mediaApi.revokePreviewUrl(preview.preview);
          });
        }}
        confirmLoading={uploading}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Text strong>Upload to folder:</Text>
            </Col>
            <Col flex="auto">
              <Select
                value={selectedUploadFolder}
                onChange={setSelectedUploadFolder}
                style={{ width: "100%" }}
                placeholder="Select a folder"
              >
                {getAvailableFolders().map((folder) => (
                  <Option key={folder} value={folder}>
                    {folder === "root" ? "🏠 Root" : `📁 ${folder}`}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Button
                type="default"
                icon={<FolderAddOutlined />}
                onClick={() => setIsNewFolderModalVisible(true)}
              >
                New Folder
              </Button>
            </Col>
          </Row>
        </div>

        <ImgCrop rotationSlider>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            </p>
            <p className="ant-upload-text">
              Click or drag files to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for single or bulk upload. Images can be cropped before
              upload.
            </p>
          </Dragger>
        </ImgCrop>

        {uploadPreviews.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Preview:</Text>
            <List
              style={{ marginTop: 8 }}
              grid={{ gutter: 8, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
              dataSource={uploadPreviews}
              renderItem={(preview) => (
                <List.Item>
                  <Card
                    size="small"
                    cover={
                      <div
                        style={{
                          height: 120,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f5f5f5",
                        }}
                      >
                        <Image
                          src={preview.preview}
                          alt={preview.name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                          preview={false}
                        />
                      </div>
                    }
                  >
                    <Card.Meta
                      title={
                        <Text ellipsis style={{ fontSize: 12 }}>
                          {preview.name}
                        </Text>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {mediaApi.formatFileSize(preview.size)}
                        </Text>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      {/* New Folder Modal */}
      <Modal
        title="Create New Folder"
        open={isNewFolderModalVisible}
        onOk={handleCreateFolder}
        onCancel={() => {
          setIsNewFolderModalVisible(false);
          setNewFolderName("");
        }}
        confirmLoading={false}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>
            Parent folder:{" "}
            {selectedUploadFolder === "root"
              ? "🏠 Root"
              : `📁 ${selectedUploadFolder}`}
          </Text>
        </div>
        <Input
          placeholder="Enter folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          prefix={<FolderOutlined />}
        />
      </Modal>
    </div>
  );
};

export default MediaLibrary;
