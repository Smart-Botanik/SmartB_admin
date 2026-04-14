import React, { useEffect, useMemo, useState } from "react";
import { Button, List, Modal, Select, Space, Tag, Typography, message } from "antd";

import { actionPathRegistryService } from "@/services/actionPathRegistry";
import type { TagItem } from "@/services/tags";

const { Text } = Typography;

type RegistryListResponse = Awaited<
  ReturnType<typeof actionPathRegistryService.list>
>;
type RegistryItem = RegistryListResponse["items"][number];

type RegistryTagEventMappingModalProps = {
  open: boolean;
  tag: TagItem | null;
  onCancel: () => void;
  onChanged: () => Promise<void>;
};

function toJsonString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return JSON.stringify(value);
}

const RegistryTagEventMappingModal: React.FC<RegistryTagEventMappingModalProps> = ({
  open,
  tag,
  onCancel,
  onChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [selectedActionPath, setSelectedActionPath] = useState<string>();

  const load = async () => {
    if (!tag) return;
    setLoading(true);
    try {
      const resp = await actionPathRegistryService.list({
        limit: 500,
        offset: 0,
        targetType: tag.targetType ?? undefined,
      });
      setItems(resp.items);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load event mappings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !tag) {
      setSelectedActionPath(undefined);
      return;
    }
    void load();
  }, [open, tag?.id]);

  const assignedItems = useMemo(() => {
    if (!tag) return [] as RegistryItem[];
    return items.filter((item) => item.tagId === tag.id);
  }, [items, tag]);

  const availableItems = useMemo(
    () => items.filter((item) => !item.tagId),
    [items],
  );

  const assignTag = async (item: RegistryItem, nextTagId: string | null) => {
    setSaving(true);
    try {
      await actionPathRegistryService.upsert({
        actionPath: item.actionPath,
        description: item.description ?? undefined,
        targetType: item.targetType,
        mappingJson: JSON.stringify(item.mapping ?? {}),
        conditionsJson: toJsonString(item.conditions),
        autoTagRulesJson: toJsonString(item.autoTagRules),
        schemaJson: toJsonString(item.schema),
        tagId: nextTagId,
      });
      await load();
      await onChanged();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to update mapping");
    } finally {
      setSaving(false);
    }
  };

  const handleAttach = async () => {
    if (!tag || !selectedActionPath) return;
    const target = availableItems.find(
      (item) => item.actionPath === selectedActionPath,
    );
    if (!target) {
      message.warning("Select an available action path first");
      return;
    }
    await assignTag(target, tag.id);
    setSelectedActionPath(undefined);
  };

  return (
    <Modal
      title={tag ? `Tag mapping: ${tag.label}` : "Tag mapping"}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={820}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <Space wrap style={{ width: "100%" }}>
          <Select
            style={{ minWidth: 380 }}
            value={selectedActionPath}
            onChange={setSelectedActionPath}
            placeholder="Select event (action path) to attach"
            loading={loading}
            disabled={!tag || saving}
            options={availableItems.map((item) => ({
              value: item.actionPath,
              label: `${item.actionPath} (${item.targetType})`,
            }))}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            allowClear
          />
          <Button type="primary" onClick={handleAttach} loading={saving}>
            Attach
          </Button>
          <Button onClick={() => void load()} loading={loading}>
            Refresh
          </Button>
        </Space>

        <div>
          <Text strong>Assigned events ({assignedItems.length})</Text>
          <List
            style={{ marginTop: 8 }}
            bordered
            loading={loading}
            dataSource={assignedItems}
            locale={{ emptyText: "No events assigned to this tag" }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key={`detach-${item.id}`}
                    danger
                    size="small"
                    loading={saving}
                    onClick={() => void assignTag(item, null)}
                  >
                    Detach
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={2}>
                  <Space>
                    <Tag color="blue">{item.targetType}</Tag>
                    <Text code>{item.actionPath}</Text>
                  </Space>
                  {item.description ? (
                    <Text type="secondary">{item.description}</Text>
                  ) : null}
                </Space>
              </List.Item>
            )}
          />
        </div>
      </Space>
    </Modal>
  );
};

export default RegistryTagEventMappingModal;
