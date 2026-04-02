import type { Meta, StoryObj } from "@storybook/react";
import type { Brand } from "@/types/brand";
import { BrandsTableStory } from "../BrandsTableStory";

const mockBrands: Brand[] = [
  {
    id: "b1",
    name: "Trikoma Seeds",
    category: "breader",
    createdAt: "2026-03-29T20:17:28.796Z",
    avatar: {
      id: "m1",
      url: "https://picsum.photos/80/80?random=11",
    },
  },
  {
    id: "b2",
    name: "Organic Nutrients",
    category: "common",
    createdAt: "2026-03-28T10:05:12.000Z",
    avatar: {
      id: "m2",
      url: "https://picsum.photos/80/80?random=12",
    },
  },
  {
    id: "b3",
    name: "Grow Tent Pro",
    category: "tent",
    createdAt: "2026-03-20T08:10:00.000Z",
    avatar: null,
  },
];

const meta: Meta<typeof BrandsTableStory> = {
  title: "Brands/BrandsTable",
  component: BrandsTableStory,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialBrands: mockBrands,
    showBackButton: false,
  },
  render: (args) => (
    <div style={{ padding: 24 }}>
      <BrandsTableStory {...args} />
    </div>
  ),
};

export const WithBackButton: Story = {
  args: {
    initialBrands: mockBrands,
    showBackButton: true,
  },
  render: (args) => (
    <div style={{ padding: 24 }}>
      <BrandsTableStory {...args} />
    </div>
  ),
};
