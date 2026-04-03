import type { Meta, StoryObj } from "@storybook/react";
import { MediaUpload } from "../MediaUpload";
import type { MediaUploadResponse } from "../../../../services/media";

// Mock data
const mockFiles: MediaUploadResponse[] = [
  {
    id: "1",
    name: "image1.jpg",
    url: "https://via.placeholder.com/150",
    size: 1024000,
    mimeType: "image/jpeg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "document.pdf",
    url: "#",
    size: 2048000,
    mimeType: "application/pdf",
    createdAt: new Date().toISOString(),
  },
];

const meta: Meta<typeof MediaUpload> = {
  title: "Media/MediaUpload",
  component: MediaUpload,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A drag-and-drop file upload component with progress tracking and file management.",
      },
    },
  },
  argTypes: {
    maxFiles: {
      control: { type: "number", min: 1, max: 50 },
      description: "Maximum number of files that can be uploaded",
    },
    accept: {
      control: "text",
      description: "Accepted file types (comma-separated)",
    },
    maxSize: {
      control: { type: "number", min: 1024 },
      description: "Maximum file size in bytes",
    },
    multiple: {
      control: "boolean",
      description: "Allow multiple file selection",
    },
    showProgress: {
      control: "boolean",
      description: "Show upload progress bar",
    },
    uploadedFiles: {
      control: "object",
      description: "Pre-populated uploaded files (for stories/testing)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    maxFiles: 5,
    accept: "image/*",
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    showProgress: true,
  },
};

// Single file upload
export const SingleFile: Story = {
  args: {
    maxFiles: 1,
    multiple: false,
    accept: "image/*",
  },
};

// Document upload
export const DocumentsOnly: Story = {
  args: {
    accept: ".pdf,.doc,.docx,.txt",
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: true,
  },
};

// No progress indicator
export const NoProgress: Story = {
  args: {
    showProgress: false,
  },
};

// With uploaded files
export const WithUploadedFiles: Story = {
  args: {
    maxFiles: 3,
    uploadedFiles: mockFiles,
  },
};

// Interactive story with controls
export const Interactive: Story = {
  args: {
    maxFiles: 10,
    accept: "image/*,video/*",
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    showProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Try uploading different files to see the component in action. Use the controls to adjust the behavior.",
      },
    },
  },
};
