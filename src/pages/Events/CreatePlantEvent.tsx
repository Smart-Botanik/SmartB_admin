import React, { useMemo, useState } from "react";
import {
  AutoComplete,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Select,
  Tag,
  Typography,
  message,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { copyToClipboard } from "@/utils/helpers";
import { plantEventsService } from "@/services/plantEvents";
import { actionPathRegistryService } from "@/services/actionPathRegistry";
import { plantsService, type PlantListItem } from "@/services/plants";

const { Title, Text } = Typography;

type FormValues = {
  plantId: string;
  actionPath: string;
  payloadJson: string;
};

function validatePayloadJson(payloadJson: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch {
    return "Invalid JSON";
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return "Payload must be a JSON object";
  }

  return null;
}

const CreatePlantEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<FormValues>();

  const [saving, setSaving] = useState(false);
  const payloadJsonValue = Form.useWatch("payloadJson", form);

  const [actionPathSearchValue, setActionPathSearchValue] = useState("");

  const [actionPathOptionsLoading, setActionPathOptionsLoading] =
    useState(false);
  const [actionPathOptions, setActionPathOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [actionPathRegistries, setActionPathRegistries] = useState<
    Array<{
      actionPath: string;
      mapping: Record<string, unknown>;
      tag?: {
        id: string;
        label: string;
        color?: string | null;
        icon?: string | null;
        category?: string | null;
      } | null;
    }>
  >([]);

  const [plantsLoading, setPlantsLoading] = useState(false);
  const [plants, setPlants] = useState<PlantListItem[]>([]);

  const [result, setResult] = useState<{
    id: string;
    name: string;
    current: unknown;
    createdAt: string;
    updatedAt: string;
  } | null>(null);

  const plantIdFromQuery = searchParams.get("plantId")?.trim() ?? "";

  React.useEffect(() => {
    if (plantIdFromQuery) {
      form.setFieldValue("plantId", plantIdFromQuery);
    }
  }, [plantIdFromQuery, form]);

  const actionPathValue = Form.useWatch("actionPath", form);

  const selectedActionPathRegistry = useMemo(() => {
    if (!actionPathValue) return null;
    return (
      actionPathRegistries.find((r) => r.actionPath === actionPathValue) ?? null
    );
  }, [actionPathRegistries, actionPathValue]);

  const suggestedPayloadKeys = useMemo(() => {
    const fallback = [
      "stage",
      "potSize",
      "potType",
      "substrate",
      "locationId",
      "lastWateredAt",
      "notes",
    ];

    if (!actionPathValue) return fallback;

    const mapping = selectedActionPathRegistry?.mapping;
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
      return fallback;
    }

    const keys = Object.keys(mapping).filter(Boolean);
    if (keys.length === 0) return fallback;

    keys.sort();
    return keys;
  }, [selectedActionPathRegistry, actionPathValue]);

  const parsedPayload = useMemo(() => {
    const raw = payloadJsonValue ?? "{}";
    try {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return {
          obj: null as Record<string, unknown> | null,
          error: "Payload must be a JSON object",
        };
      }
      return {
        obj: parsed as Record<string, unknown>,
        error: null as string | null,
      };
    } catch {
      return {
        obj: null as Record<string, unknown> | null,
        error: "Invalid JSON",
      };
    }
  }, [payloadJsonValue]);

  const checkedPayloadKeys = useMemo(() => {
    if (!parsedPayload.obj) return new Set<string>();
    return new Set(Object.keys(parsedPayload.obj));
  }, [parsedPayload.obj]);

  const unknownPayloadKeys = useMemo(() => {
    if (!parsedPayload.obj) return [] as string[];
    const suggested = new Set(suggestedPayloadKeys);
    return Object.keys(parsedPayload.obj).filter((k) => !suggested.has(k));
  }, [parsedPayload.obj, suggestedPayloadKeys]);

  const setPayloadKey = (key: string, enabled: boolean) => {
    if (!parsedPayload.obj) {
      message.error(parsedPayload.error ?? "Invalid payloadJson");
      return;
    }

    const next = { ...parsedPayload.obj };
    if (enabled) {
      if (next[key] === undefined) next[key] = "";
    } else {
      delete next[key];
    }

    form.setFieldValue("payloadJson", JSON.stringify(next, null, 2));
  };

  const copyKey = async (key: string) => {
    const ok = await copyToClipboard(key);
    if (ok) message.success(`Copied: ${key}`);
    else message.error("Failed to copy");
  };

  const loadActionPathOptions = async () => {
    setActionPathOptionsLoading(true);
    try {
      const resp = await actionPathRegistryService.list({
        limit: 200,
        offset: 0,
        targetType: "Plant",
      });

      setActionPathRegistries(
        resp.items.map((r) => ({
          actionPath: r.actionPath,
          mapping: r.mapping,
          tag: r.tag,
        })),
      );

      const options = resp.items
        .map((r) => r.actionPath)
        .filter((v): v is string => Boolean(v))
        .sort()
        .map((v) => ({ value: v, label: v }));
      setActionPathOptions(options);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load action paths");
    } finally {
      setActionPathOptionsLoading(false);
    }
  };

  const loadLatestPlants = async () => {
    setPlantsLoading(true);
    try {
      const items = await plantsService.list({ limit: 50, offset: 0 });
      setPlants(items);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load plants");
    } finally {
      setPlantsLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const payloadError = validatePayloadJson(values.payloadJson);
    if (payloadError) {
      message.error(payloadError);
      return;
    }

    setSaving(true);
    try {
      const updatedPlant = await plantEventsService.createPlantEvent(values);
      setResult(updatedPlant);
      message.success("Event created and Plant updated");
    } catch (e: any) {
      message.error(e?.message ?? "Failed to create Plant event");
    } finally {
      setSaving(false);
    }
  };

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
          Create Plant Event
        </Title>
        <Button onClick={() => navigate("/events")}>Back to events</Button>
      </Space>

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Form<FormValues>
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{
              plantId: "",
              actionPath: "plant.growth.transplant",
              payloadJson: JSON.stringify(
                { potSize: "10L", stage: "veg" },
                null,
                2,
              ),
            }}
          >
            <Form.Item label="Pick plant (latest)" style={{ marginBottom: 8 }}>
              <Space wrap>
                <Button onClick={loadLatestPlants} loading={plantsLoading}>
                  Load latest
                </Button>
                <AutoComplete
                  style={{ width: 420 }}
                  options={plants.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.id})`,
                  }))}
                  placeholder="Select plant..."
                  filterOption={(inputValue, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                  onSelect={(v) => form.setFieldValue("plantId", v)}
                />
              </Space>
            </Form.Item>

            <Form.Item
              name="plantId"
              label="Plant ID"
              rules={[{ required: true, message: "Plant ID is required" }]}
            >
              <Input placeholder="Plant id (uuid)" />
            </Form.Item>

            <Form.Item
              name="actionPath"
              label="Action path"
              rules={[{ required: true, message: "Action path is required" }]}
            >
              <Select
                showSearch
                placeholder="plant.growth.transplant"
                allowClear
                loading={actionPathOptionsLoading}
                options={actionPathOptions}
                searchValue={actionPathSearchValue}
                onDropdownVisibleChange={(open) => {
                  if (open) setActionPathSearchValue("");
                  if (
                    open &&
                    !actionPathOptions.length &&
                    !actionPathOptionsLoading
                  ) {
                    void loadActionPathOptions();
                  }
                }}
                onFocus={() => setActionPathSearchValue("")}
                onSearch={(v) => setActionPathSearchValue(v)}
                filterOption={(inputValue, option) =>
                  String(option?.value ?? "")
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>

            {selectedActionPathRegistry?.tag ? (
              <div style={{ marginTop: -8, marginBottom: 12 }}>
                <Space size={8} wrap>
                  <Text type="secondary">Tag:</Text>
                  <Tag
                    color={selectedActionPathRegistry.tag.color ?? undefined}
                  >
                    {selectedActionPathRegistry.tag.label}
                  </Tag>
                </Space>
              </div>
            ) : null}

            <Form.Item
              name="payloadJson"
              label="Payload JSON"
              rules={[{ required: true, message: "Payload JSON is required" }]}
            >
              <Input.TextArea rows={10} />
            </Form.Item>

            <Card size="small" style={{ marginBottom: 12 }}>
              <Text strong>Payload field suggestions (MVP)</Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {suggestedPayloadKeys.map((k) => (
                    <span key={k} onDoubleClick={() => copyKey(k)}>
                      <Tag.CheckableTag
                        style={{ cursor: "pointer" }}
                        checked={checkedPayloadKeys.has(k)}
                        onChange={(checked) => setPayloadKey(k, checked)}
                      >
                        {k}
                      </Tag.CheckableTag>
                    </span>
                  ))}
                </Space>
              </div>

              {parsedPayload.error ? (
                <div style={{ marginTop: 8 }}>
                  <Text type="danger">{parsedPayload.error}</Text>
                </div>
              ) : null}

              {unknownPayloadKeys.length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  <Text type="warning">
                    Keys in payload not in suggestions:
                  </Text>
                  <div style={{ marginTop: 6 }}>
                    <Space wrap>
                      {unknownPayloadKeys.map((k) => (
                        <Tag
                          key={k}
                          color="orange"
                          closable
                          onClose={() => setPayloadKey(k, false)}
                        >
                          {k}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              ) : null}

              <Text type="secondary">
                Toggle tag to add/remove key in payload. Double click to copy
                key.
              </Text>
            </Card>

            <Button type="primary" htmlType="submit" loading={saving}>
              Create event
            </Button>
          </Form>
        </Card>

        <Card title="Result (Plant)">
          {result ? (
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="id">{result.id}</Descriptions.Item>
              <Descriptions.Item label="name">{result.name}</Descriptions.Item>
              <Descriptions.Item label="current">
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(result.current, null, 2)}
                </pre>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Text type="secondary">No result yet</Text>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default CreatePlantEventPage;
