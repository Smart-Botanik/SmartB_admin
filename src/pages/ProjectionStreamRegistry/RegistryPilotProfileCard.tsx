import React from "react";
import { Button, Card, Space, Tag, Typography } from "antd";
import type { RegistryProfile } from "@/services/registryProfiles";
import type { RegistryPilotProfileCardConfig } from "./registryHubConfig";

const { Text } = Typography;

type RegistryPilotProfileCardProps = {
  config: RegistryPilotProfileCardConfig;
  profile: RegistryProfile | null;
  onOpenBuilder: (entity: RegistryPilotProfileCardConfig["builderEntity"]) => void;
};

export const RegistryPilotProfileCard: React.FC<RegistryPilotProfileCardProps> = ({
  config,
  profile,
  onOpenBuilder,
}) => (
  <Card
    title={`Pilot Profile: ${config.title}`}
    extra={profile ? <Tag color="green">ready</Tag> : <Tag color="gold">not found</Tag>}
    actions={[
      <Button type="link" onClick={() => onOpenBuilder(config.builderEntity)}>
        Open Profile Builder ({config.builderEntity})
      </Button>,
    ]}
  >
    <Space direction="vertical" size={6}>
      <Text>{config.description}</Text>
      <Text>
        Fields: {profile?.fields.length ?? 0} selected | Entity: {config.entity} | Kind:{" "}
        {profile?.kind ?? config.kind}
      </Text>
      <Text type="secondary">Gate: {config.gate}</Text>
    </Space>
  </Card>
);
