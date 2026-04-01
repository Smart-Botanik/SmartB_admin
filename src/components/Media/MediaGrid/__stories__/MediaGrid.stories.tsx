import type { Meta, StoryObj } from "@storybook/react";
import { MediaGridStory } from "../MediaGridStory";
import type { MediaItem } from "../../../../services/media";

// Mock data
const mockFiles: MediaItem[] = [
  {
    id: "1",
    name: "Beautiful Landscape.jpg",
    url: "https://picsum.photos/400/300?random=1",
    mime: "image/jpeg",
    size: 2048576,
    createdAt: "2024-01-15T10:30:00Z",
    type: "image",
    key: "images/landscape.jpg",
  },
  {
    id: "2",
    name: "Product Screenshot.png",
    url: "https://picsum.photos/300/400?random=2",
    mime: "image/png",
    size: 1536000,
    createdAt: "2024-01-14T15:45:00Z",
    type: "image",
    key: "images/screenshot.png",
  },
  {
    id: "3",
    name: "User Guide.pdf",
    url: "/files/guide.pdf",
    mime: "application/pdf",
    size: 5120000,
    createdAt: "2024-01-13T09:20:00Z",
    type: "folder",
    key: "documents/guide.pdf",
  },
  {
    id: "4",
    name: "Demo Video.mp4",
    url: "/files/demo.mp4",
    mime: "video/mp4",
    size: 15728640,
    createdAt: "2024-01-12T14:10:00Z",
    type: "folder",
    key: "videos/demo.mp4",
  },
];

const meta: Meta<typeof MediaGridStory> = {
  title: "Media/MediaGrid",
  component: MediaGridStory,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A responsive grid component for displaying and managing media files with selection, filtering, and preview capabilities. This component is separated into container (logic) and presentation (UI) layers for better testability.",
      },
    },
  },
  argTypes: {
    selectable: {
      control: "boolean",
      description: "Enable file selection with checkboxes",
    },
    onSelectionChange: {
      action: "selectionChanged",
      description: "Callback when selection changes",
    },
    onFileClick: {
      action: "fileClicked",
      description: "Callback when a file is clicked",
    },
    pageSize: {
      control: { type: "number", min: 5, max: 50 },
      description: "Number of files per page",
    },
    showActions: {
      control: "boolean",
      description: "Show action buttons on cards",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default grid view
export const Default: Story = {
  args: {
    pageSize: 20,
    showActions: true,
    selectable: false,
  },
  render: (args) => (
    <div style={{ padding: 24 }}>
      <MediaGridStory {...args} />
    </div>
  ),
};

// Selectable grid
export const Selectable: Story = {
  args: {
    selectable: true,
    showActions: true,
  },
  render: (args) => (
    <div style={{ padding: 24 }}>
      <MediaGridStory {...args} />
    </div>
  ),
};

// Grid without actions
export const ReadOnly: Story = {
  args: {
    selectable: false,
    showActions: false,
  },
  render: (args) => (
    <div style={{ padding: 24 }}>
      <MediaGridStory {...args} />
    </div>
  ),
};

// Large grid with many files
export const LargeGrid: Story = {
  args: {
    selectable: true,
    pageSize: 50,
  },
  render: (args) => {
    const manyFiles = Array.from({ length: 24 }, (_, i) => {
      const mockFile = mockFiles[i % mockFiles.length];
      const nameParts = mockFile.name?.split(".") || ["", "jpg"];
      return {
        ...mockFile,
        id: `${i + 1}`,
        name: `File ${i + 1}.${nameParts[1] || "jpg"}`,
        url: mockFile.url?.includes("picsum")
          ? `https://picsum.photos/400/300?random=${i + 1}`
          : mockFile.url,
        key: mockFile.key?.includes(mockFile.id)
          ? mockFile.key.replace(mockFile.id, `${i + 1}`)
          : `files/file-${i + 1}`,
      };
    });

    return (
      <div style={{ padding: 24 }}>
        <MediaGridStory {...args} mockFiles={manyFiles} />
      </div>
    );
  },
};

// Interactive story
export const Interactive: Story = {
  args: {
    selectable: true,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Try selecting files, using the search, and clicking the action buttons. The grid is fully interactive with mock data - no API calls needed.",
      },
    },
  },
  render: (args) => (
    <div style={{ padding: 24 }}>
      <MediaGridStory {...args} />
    </div>
  ),
};
