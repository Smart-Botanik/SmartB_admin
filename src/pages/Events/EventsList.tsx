import React, { useEffect, useMemo, useState } from "react";
import {
  AutoComplete,
  Button,
  Card,
  Input,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import {
  actionPathEventsService,
  type ActionPathEvent,
} from "@/services/actionPathEvents";
import { actionPathRegistryService } from "@/services/actionPathRegistry";
import { tagsService, type TagItem } from "@/services/tags";
import { renderTagIcon } from "@/pages/RegistryTags/iconRegistry";

const { Title, Text } = Typography;

type RegistryListResponse = Awaited<
  ReturnType<typeof actionPathRegistryService.list>
>;
type EventDefinition = RegistryListResponse["items"][number];

const EventsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"definitions" | "runtime">("definitions");

  const [definitions, setDefinitions] = useState<EventDefinition[]>([]);
  const [definitionsLoading, setDefinitionsLoading] = useState(false);
  const [definitionQuery, setDefinitionQuery] = useState("");
  const [definitionTargetType, setDefinitionTargetType] = useState<
    string | undefined
  >("Plant");
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [mappingSaving, setMappingSaving] = useState(false);
  const [selectedDefinition, setSelectedDefinition] =
    useState<EventDefinition | null>(null);
  const [mappingTagId, setMappingTagId] = useState<string | undefined>(undefined);
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);

  const [items, setItems] = useState<ActionPathEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<string | undefined>("Plant");
  const [targetId, setTargetId] = useState<string>("");
  const [actionPath, setActionPath] = useState<string>("");
  const [isSystem, setIsSystem] = useState<boolean | undefined>(undefined);
  const [actionPathOptionsLoading, setActionPathOptionsLoading] =
    useState(false);
  const [actionPathOptions, setActionPathOptions] = useState<
    Array<{ value: string }>
  >([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const loadDefinitions = async () => {
    setDefinitionsLoading(true);
    try {
      const resp = await actionPathRegistryService.list({
        limit: 500,
        offset: 0,
        targetType: definitionTargetType,
      });
      setDefinitions(resp.items);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load event definitions");
    } finally {
      setDefinitionsLoading(false);
    }
  };

  const loadAvailableTags = async (targetType?: string) => {
    try {
      const [entityResp, commonResp] = await Promise.all([
        tagsService.list({
          limit: 300,
          offset: 0,
          targetType: targetType || undefined,
        }),
        tagsService.list({
          limit: 300,
          offset: 0,
          targetType: undefined,
        }),
      ]);

      const seen = new Set<string>();
      const merged = [...entityResp.items, ...commonResp.items].filter((tag) => {
        if (seen.has(tag.id)) {
          return false;
        }
        seen.add(tag.id);
        return true;
      });
      setAvailableTags(merged);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load tags");
    }
  };

  const openMappingModal = async (definition: EventDefinition) => {
    setSelectedDefinition(definition);
    setMappingTagId(definition.tagId ?? undefined);
    setMappingModalOpen(true);
    await loadAvailableTags(definition.targetType);
  };

  const applyDefinitionTagMapping = async () => {
    if (!selectedDefinition) {
      return;
    }
    setMappingSaving(true);
    try {
      await actionPathRegistryService.upsert({
        actionPath: selectedDefinition.actionPath,
        description: selectedDefinition.description ?? undefined,
        targetType: selectedDefinition.targetType,
        mappingJson: JSON.stringify(selectedDefinition.mapping ?? {}),
        conditionsJson:
          selectedDefinition.conditions == null
            ? undefined
            : JSON.stringify(selectedDefinition.conditions),
        autoTagRulesJson:
          selectedDefinition.autoTagRules == null
            ? undefined
            : JSON.stringify(selectedDefinition.autoTagRules),
        schemaJson:
          selectedDefinition.schema == null
            ? undefined
            : JSON.stringify(selectedDefinition.schema),
        tagId: mappingTagId ?? null,
      });
      message.success("Tag mapping updated");
      setMappingModalOpen(false);
      setSelectedDefinition(null);
      await loadDefinitions();
    } catch (e: any) {
      message.error(e?.message ?? "Failed to update mapping");
    } finally {
      setMappingSaving(false);
    }
  };

  const loadRuntime = async () => {
    setLoading(true);
    try {
      const resp = await actionPathEventsService.list({
        limit: pageSize,
        offset,
        targetType,
        targetId: targetId || undefined,
        actionPath: actionPath || undefined,
        isSystem,
      });
      setItems(resp.items);
      setTotal(resp.total);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const loadActionPathOptions = async () => {
    setActionPathOptionsLoading(true);
    try {
      const resp = await actionPathRegistryService.list({
        limit: 200,
        offset: 0,
        targetType,
      });
      setActionPathOptions(
        resp.items
          .map((r) => r.actionPath)
          .filter((v): v is string => Boolean(v))
          .sort()
          .map((v) => ({ value: v })),
      );
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load action paths");
    } finally {
      setActionPathOptionsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "definitions") {
      void loadDefinitions();
    }
  }, [mode, definitionTargetType]);

  useEffect(() => {
    if (mode === "runtime") {
      void loadRuntime();
    }
  }, [mode, pageSize, offset, targetType, targetId, actionPath, isSystem]);

  const filteredDefinitions = useMemo(() => {
    const query = definitionQuery.trim().toLowerCase();
    if (!query) {
      return definitions;
    }
    return definitions.filter((item) => {
      return (
        item.actionPath.toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query) ||
        (item.tag?.label ?? "").toLowerCase().includes(query)
      );
    });
  }, [definitionQuery, definitions]);

  const runtimePagination: TablePaginationConfig = useMemo(
    () => ({
      current: page,
      pageSize,
      total,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (count, range) => `${range[0]}-${range[1]} of ${count} items`,
      onChange: (nextPage, nextPageSize) => {
        setPage(nextPage);
        if (nextPageSize && nextPageSize !== pageSize) {
          setPageSize(nextPageSize);
          setPage(1);
        }
      },
    }),
    [page, pageSize, total],
  );

  const definitionColumns: ColumnsType<EventDefinition> = useMemo(
    () => [
      {
        title: "Action path",
        dataIndex: "actionPath",
        key: "actionPath",
        width: 280,
        render: (value: string) => <Text code>{value}</Text>,
      },
      {
        title: "Target type",
        dataIndex: "targetType",
        key: "targetType",
        width: 140,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        render: (value?: string | null) => value || <Text type="secondary">-</Text>,
      },
      {
        title: "Tag",
        key: "tag",
        width: 220,
        render: (_, record) => {
          const tag = record.tag as TagItem | null | undefined;
          if (!tag) {
            return <Text type="secondary">-</Text>;
          }
          return (
            <Space size={8}>
              <Tag color={tag.color ?? undefined}>{tag.label}</Tag>
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                {renderTagIcon(tag.icon)}
              </span>
            </Space>
          );
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 280,
        render: (_, record) => (
          <Space>
            <Button onClick={() => navigate(`/registry/edit/${record.actionPath}`)}>
              Edit definition
            </Button>
            <Button onClick={() => void openMappingModal(record)}>Map tag</Button>
          </Space>
        ),
      },
    ],
    [navigate],
  );

  const runtimeColumns: ColumnsType<ActionPathEvent> = useMemo(
    () => [
      {
        title: "When",
        dataIndex: "timestamp",
        key: "timestamp",
        width: 180,
        render: (value: string) => new Date(value).toLocaleString(),
      },
      {
        title: "Action path",
        dataIndex: "actionPath",
        key: "actionPath",
        width: 260,
        render: (value: string) => <Text code>{value}</Text>,
      },
      {
        title: "Target",
        key: "target",
        width: 300,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Space>
              <Tag color={record.targetType === "Plant" ? "green" : "default"}>
                {record.targetType}
              </Tag>
              {record.isSystem ? <Tag color="gold">system</Tag> : null}
            </Space>
            <Text type="secondary">{record.targetId}</Text>
          </Space>
        ),
      },
      {
        title: "Payload",
        dataIndex: "payload",
        key: "payload",
        render: (value: unknown) => (
          <pre
            style={{
              margin: 0,
              maxWidth: 520,
              maxHeight: 120,
              overflow: "auto",
            }}
          >
            {JSON.stringify(value, null, 2)}
          </pre>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Events
        </Title>
        <Space>
          {mode === "definitions" ? (
            <>
              <Button onClick={() => navigate("/registry/new")}>
                Create definition
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => void loadDefinitions()}
              >
                Refresh
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate("/events/create-plant")}>
                Create Plant Event
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => void loadRuntime()}>
                Refresh
              </Button>
            </>
          )}
        </Space>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%", marginBottom: 12 }}>
          <Segmented
            value={mode}
            onChange={(value) => setMode(value as "definitions" | "runtime")}
            options={[
              { label: "Definitions", value: "definitions" },
              { label: "Runtime", value: "runtime" },
            ]}
          />
        </Space>

        {mode === "definitions" ? (
          <Space wrap style={{ width: "100%" }}>
            <Input
              value={definitionQuery}
              onChange={(e) => setDefinitionQuery(e.target.value)}
              placeholder="Search action path, description, tag"
              allowClear
              style={{ width: 360 }}
            />
            <Select
              value={definitionTargetType}
              onChange={setDefinitionTargetType}
              placeholder="Target type"
              style={{ width: 180 }}
              allowClear
              options={[
                { value: "Plant", label: "Plant" },
                { value: "Diary", label: "Diary" },
                { value: "Location", label: "Location" },
                { value: "Global", label: "Global" },
              ]}
            />
          </Space>
        ) : (
          <Space wrap style={{ width: "100%" }}>
            <Select
              value={targetType}
              onChange={(value) => {
                setTargetType(value);
                setPage(1);
                setActionPathOptions([]);
              }}
              placeholder="Target type"
              style={{ width: 160 }}
              allowClear
              options={[{ value: "Plant", label: "Plant" }]}
            />

            <Input
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setPage(1);
              }}
              placeholder="Target id (plantId)"
              style={{ width: 320 }}
              allowClear
            />

            <AutoComplete
              value={actionPath}
              options={actionPathOptions}
              style={{ width: 300 }}
              placeholder="Action path"
              allowClear
              onFocus={() => {
                if (!actionPathOptions.length && !actionPathOptionsLoading) {
                  void loadActionPathOptions();
                }
              }}
              onChange={(value) => {
                setActionPath(value);
                setPage(1);
              }}
              filterOption={(inputValue, option) =>
                String(option?.value ?? "")
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
            />

            <Select
              value={isSystem}
              onChange={(value) => {
                setIsSystem(value);
                setPage(1);
              }}
              placeholder="System"
              style={{ width: 140 }}
              allowClear
              options={[
                { value: true, label: "system" },
                { value: false, label: "user" },
              ]}
            />
          </Space>
        )}
      </Card>

      <Card>
        {mode === "definitions" ? (
          <Table
            rowKey="id"
            columns={definitionColumns}
            dataSource={filteredDefinitions}
            loading={definitionsLoading}
            pagination={{
              showSizeChanger: true,
              pageSize: 20,
              showTotal: (count) => `${count} definitions`,
            }}
          />
        ) : (
          <Table
            rowKey="id"
            columns={runtimeColumns}
            dataSource={items}
            loading={loading}
            pagination={runtimePagination}
          />
        )}
      </Card>
      <Modal
        title={
          selectedDefinition
            ? `Map tag for ${selectedDefinition.actionPath}`
            : "Map tag"
        }
        open={mappingModalOpen}
        onCancel={() => {
          if (mappingSaving) return;
          setMappingModalOpen(false);
          setSelectedDefinition(null);
        }}
        onOk={() => void applyDefinitionTagMapping()}
        confirmLoading={mappingSaving}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary">
            Select tag for this event definition. Empty value detaches mapping.
          </Text>
          <Select
            value={mappingTagId}
            onChange={setMappingTagId}
            allowClear
            placeholder="Select tag"
            style={{ width: "100%" }}
            options={availableTags.map((tag) => ({
              value: tag.id,
              label: `${tag.label}${tag.targetType ? ` (${tag.targetType})` : ""}`,
            }))}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Space>
      </Modal>
    </div>
  );
};

export default EventsListPage;
