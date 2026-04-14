import React from "react";
import {
  FireOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  BugOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  StarOutlined,
  ToolOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";

export const TAG_ICON_ITEMS: Array<{ key: string; icon: React.ReactNode }> = [
  { key: "leaf", icon: <ExperimentOutlined /> },
  { key: "experiment", icon: <ExperimentOutlined /> },
  { key: "fire", icon: <FireOutlined /> },
  { key: "lightning", icon: <ThunderboltOutlined /> },
  { key: "bolt", icon: <ThunderboltOutlined /> },
  { key: "bug", icon: <BugOutlined /> },
  { key: "heart", icon: <HeartOutlined /> },
  { key: "check", icon: <CheckCircleOutlined /> },
  { key: "alert", icon: <AlertOutlined /> },
  { key: "star", icon: <StarOutlined /> },
  { key: "tool", icon: <ToolOutlined /> },
  { key: "drop", icon: <BgColorsOutlined /> },
];

const ICON_RENDERERS: Record<string, React.ReactNode> = {
  leaf: <ExperimentOutlined />,
  experiment: <ExperimentOutlined />,
  fire: <FireOutlined />,
  lightning: <ThunderboltOutlined />,
  bolt: <ThunderboltOutlined />,
  bug: <BugOutlined />,
  heart: <HeartOutlined />,
  check: <CheckCircleOutlined />,
  alert: <AlertOutlined />,
  star: <StarOutlined />,
  tool: <ToolOutlined />,
  drop: <BgColorsOutlined />,
};

export const TAG_ICON_OPTIONS = TAG_ICON_ITEMS.map((item) => ({
  value: item.key,
  label: item.key,
}));

export function renderTagIcon(iconKey?: string | null): React.ReactNode {
  if (!iconKey) {
    return null;
  }
  return ICON_RENDERERS[iconKey.toLowerCase()] ?? null;
}
