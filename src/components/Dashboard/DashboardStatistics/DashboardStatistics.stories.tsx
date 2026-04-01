import type { Meta, StoryObj } from "@storybook/react";
import { DashboardStatistics } from "./DashboardStatistics";

const meta: Meta<typeof DashboardStatistics> = {
  title: "Components/Dashboard/DashboardStatistics",
  component: DashboardStatistics,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Dashboard Statistics component displaying key metrics with growth indicators and trends.",
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "gray", value: "#f5f5f5" },
        { name: "dark", value: "#333333" },
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    stats: {
      description: "Statistics data to display",
      control: { type: "object" },
    },
    loading: {
      description: "Whether the component is in loading state",
      control: { type: "boolean" },
    },
    title: {
      description: "Title displayed above the statistics",
      control: { type: "text" },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "16px",
          background: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with normal stats
export const Default: Story = {
  args: {
    stats: {
      users: { total: 1234, growth: 12.5, trend: "up" },
      brands: { total: 56, growth: 8.3, trend: "up" },
      products: { total: 789, growth: -2.1, trend: "down" },
      views: { total: 45678, growth: 15.7, trend: "up" },
    },
    loading: false,
    title: "Dashboard Statistics",
  },
};

// Loading state
export const Loading: Story = {
  args: {
    stats: {
      users: { total: 1234, growth: 12.5, trend: "up" },
      brands: { total: 56, growth: 8.3, trend: "up" },
      products: { total: 789, growth: -2.1, trend: "down" },
      views: { total: 45678, growth: 15.7, trend: "up" },
    },
    loading: true,
    title: "Loading Statistics",
  },
};

// High growth scenario
export const HighGrowth: Story = {
  args: {
    stats: {
      users: { total: 5678, growth: 45.2, trend: "up" },
      brands: { total: 234, growth: 67.8, trend: "up" },
      products: { total: 3456, growth: 89.3, trend: "up" },
      views: { total: 123456, growth: 123.4, trend: "up" },
    },
    loading: false,
    title: "High Growth Metrics",
  },
};

// Declining metrics
export const Declining: Story = {
  args: {
    stats: {
      users: { total: 890, growth: -15.3, trend: "down" },
      brands: { total: 23, growth: -8.7, trend: "down" },
      products: { total: 456, growth: -23.4, trend: "down" },
      views: { total: 12345, growth: -34.2, trend: "down" },
    },
    loading: false,
    title: "Declining Metrics",
  },
};

// Mixed trends
export const MixedTrends: Story = {
  args: {
    stats: {
      users: { total: 2345, growth: 23.4, trend: "up" },
      brands: { total: 78, growth: -5.6, trend: "down" },
      products: { total: 1234, growth: 12.3, trend: "up" },
      views: { total: 56789, growth: -8.9, trend: "down" },
    },
    loading: false,
    title: "Mixed Performance Metrics",
  },
};

// Large numbers
export const LargeNumbers: Story = {
  args: {
    stats: {
      users: { total: 1234567, growth: 5.6, trend: "up" },
      brands: { total: 12345, growth: 12.3, trend: "up" },
      products: { total: 234567, growth: 8.9, trend: "up" },
      views: { total: 9876543, growth: 15.7, trend: "up" },
    },
    loading: false,
    title: "Large Scale Metrics",
  },
};
