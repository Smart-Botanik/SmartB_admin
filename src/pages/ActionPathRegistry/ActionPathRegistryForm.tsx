import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { actionPathRegistryService } from "@/services/actionPathRegistry";
import { tagsService, type TagListItem } from "@/services/tags";
import { copyToClipboard } from "@/utils/helpers";

const { Text, Title } = Typography;

type FormValues = {
  actionPath: string;
  targetType: string;
  mappingJson: string;
  conditionsJson?: string;
  tagId?: string | null;
};

type ConditionRuleFormValue = {
  field?: string;
  operator?: "lt" | "gt" | "eq" | "lte" | "gte";
  value?: string;
  tagId?: string;
};

function validateMappingJson(mappingJson: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(mappingJson);
  } catch {
    return "Invalid JSON";
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return "Mapping must be a JSON object";
  }

  for (const [, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string") {
      return "Mapping values must be strings (payloadKey -> currentKey)";
    }
  }

  return null;
}

export const ActionPathRegistryForm: React.FC<{
  title?: string;
  initialValues?: Partial<FormValues>;
  onSaved?: () => void;
}> = ({ title = "Create / Update Registry", initialValues, onSaved }) => {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  const [tagsLoading, setTagsLoading] = useState(false);
  const [entityTags, setEntityTags] = useState<TagListItem[]>([]);
  const [commonTags, setCommonTags] = useState<TagListItem[]>([]);
  const [tagsLoadedOnce, setTagsLoadedOnce] = useState(false);

  const targetTypeValue = Form.useWatch("targetType", form);

  const mappingJsonValue = Form.useWatch("mappingJson", form);

  const conditionsJsonValue = Form.useWatch("conditionsJson", form);

  const defaultMapping = useMemo(
    () =>
      JSON.stringify(
        { potSize: "potSize", potType: "potType", stage: "stage" },
        null,
        2,
      ),
    [],
  );

  const plantSuggestedKeys = useMemo(
    () => [
      "stage",
      "potSize",
      "potType",
      "substrate",
      "locationId",
      "lastWateredAt",
      "notes",
    ],
    [],
  );

  const insertTemplate = () => {
    form.setFieldValue("mappingJson", defaultMapping);
    message.success("Template inserted");
  };

  const parsedMapping = useMemo(() => {
    const raw = mappingJsonValue ?? "{}";
    try {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return {
          obj: null as Record<string, unknown> | null,
          error: "Mapping must be a JSON object",
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
  }, [mappingJsonValue]);

  const mappingKeyOptions = useMemo(() => {
    if (!parsedMapping.obj)
      return [] as Array<{ value: string; label: string }>;
    return Object.keys(parsedMapping.obj)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => ({ value: k, label: k }));
  }, [parsedMapping.obj]);

  const parsedConditions = useMemo(() => {
    const raw = conditionsJsonValue ?? "[]";
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return {
          arr: null as ConditionRuleFormValue[] | null,
          error: "Conditions must be a JSON array",
        };
      }
      return {
        arr: parsed as ConditionRuleFormValue[],
        error: null as string | null,
      };
    } catch {
      return {
        arr: null as ConditionRuleFormValue[] | null,
        error: "Invalid JSON",
      };
    }
  }, [conditionsJsonValue]);

  const checkedKeys = useMemo(() => {
    if (!parsedMapping.obj) return new Set<string>();
    return new Set(Object.keys(parsedMapping.obj));
  }, [parsedMapping.obj]);

  const unknownKeys = useMemo(() => {
    if (!parsedMapping.obj) return [] as string[];
    const suggested = new Set(plantSuggestedKeys);
    return Object.keys(parsedMapping.obj).filter((k) => !suggested.has(k));
  }, [parsedMapping.obj, plantSuggestedKeys]);

  const setMappingKey = (key: string, enabled: boolean) => {
    if (!parsedMapping.obj) {
      message.error(parsedMapping.error ?? "Invalid mappingJson");
      return;
    }

    const next = { ...parsedMapping.obj };
    if (enabled) {
      if (next[key] === undefined) next[key] = key;
    } else {
      delete next[key];
    }
    form.setFieldValue("mappingJson", JSON.stringify(next, null, 2));
  };

  const removeUnknownKey = (key: string) => {
    setMappingKey(key, false);
  };

  const copyKey = async (key: string) => {
    const ok = await copyToClipboard(key);
    if (ok) message.success(`Copied: ${key}`);
    else message.error("Failed to copy");
  };

  const onSubmit = async (values: FormValues) => {
    const mappingError = validateMappingJson(values.mappingJson);
    if (mappingError) {
      message.error(mappingError);
      return;
    }

    if (values.conditionsJson) {
      try {
        const parsed = JSON.parse(values.conditionsJson);
        if (!Array.isArray(parsed)) {
          message.error("Conditions JSON must be an array");
          return;
        }

        for (const [idx, rule] of parsed.entries()) {
          const r = rule as ConditionRuleFormValue;

          if (!r.field || String(r.field).trim() === "") {
            message.error(`Rule #${idx + 1}: field is required`);
            return;
          }
          if (!mappingKeyOptions.some((opt) => opt.value === r.field)) {
            message.error(
              `Rule #${idx + 1}: field must be one of mapping keys (${r.field})`,
            );
            return;
          }
          if (!r.operator) {
            message.error(`Rule #${idx + 1}: operator is required`);
            return;
          }
          if (!r.value || String(r.value).trim() === "") {
            message.error(`Rule #${idx + 1}: value is required`);
            return;
          }
          if (!r.tagId || String(r.tagId).trim() === "") {
            message.error(`Rule #${idx + 1}: tag is required`);
            return;
          }
        }
      } catch {
        message.error("Invalid conditions JSON");
        return;
      }
    }

    const actionPathOk = /^[a-z]+\.[a-z]+\.[a-z0-9_]+$/i.test(
      values.actionPath,
    );
    if (!actionPathOk) {
      message.error(
        "Invalid actionPath format. Expected scope.category.action (e.g. plant.growth.transplant)",
      );
      return;
    }

    setSaving(true);
    try {
      const ok = await actionPathRegistryService.upsert(values);
      if (ok) {
        message.success("Registry saved");
        onSaved?.();
      } else {
        message.warning("Registry not saved");
      }
    } catch (e: any) {
      message.error(e?.message ?? "Failed to save registry");
    } finally {
      setSaving(false);
    }
  };

  const loadTags = async () => {
    setTagsLoading(true);
    try {
      const [entityResp, allResp] = await Promise.all([
        tagsService.list({
          limit: 200,
          offset: 0,
          targetType: targetTypeValue || undefined,
        }),
        tagsService.list({
          limit: 200,
          offset: 0,
        }),
      ]);

      setEntityTags(entityResp.items);
      setCommonTags(allResp.items.filter((t) => !t.targetType));
      setTagsLoadedOnce(true);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load tags");
    } finally {
      setTagsLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldValue("tagId", null);
    setEntityTags([]);
    setCommonTags([]);

    if (tagsLoadedOnce) {
      void loadTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTypeValue]);

  const tagSelectOptions = useMemo(() => {
    const entityLabel = targetTypeValue
      ? `${targetTypeValue} Tags (${entityTags.length})`
      : `Entity Tags (${entityTags.length})`;

    return [
      {
        label: entityLabel,
        options: entityTags.map((t) => ({
          value: t.id,
          label: (
            <Space size={8}>
              <Tag color={t.color ?? "default"}>{t.label}</Tag>
              {t.icon ? <Text type="secondary">{t.icon}</Text> : null}
            </Space>
          ),
          searchLabel: t.label,
        })),
      },
      {
        label: `Common Tags (${commonTags.length})`,
        options: commonTags.map((t) => ({
          value: t.id,
          label: (
            <Space size={8}>
              <Tag color={t.color ?? "default"}>{t.label}</Tag>
              {t.icon ? <Text type="secondary">{t.icon}</Text> : null}
            </Space>
          ),
          searchLabel: t.label,
        })),
      },
    ];
  }, [commonTags, entityTags, targetTypeValue]);

  const allTagItems = useMemo(() => {
    const map = new Map<string, TagListItem>();
    for (const t of [...entityTags, ...commonTags]) map.set(t.id, t);
    return map;
  }, [commonTags, entityTags]);

  return (
    <Card>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
      </Space>

      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          actionPath: "plant.growth.transplant",
          targetType: "Plant",
          mappingJson: defaultMapping,
          conditionsJson: "[]",
          ...initialValues,
        }}
      >
        <Form.Item
          name="actionPath"
          label="Action path"
          extra={
            <Text type="secondary">
              Example: <Text code>plant.growth.transplant</Text> (format:{" "}
              <Text code>scope.category.action</Text>)
            </Text>
          }
          rules={[{ required: true, message: "Action path is required" }]}
        >
          <Input placeholder="scope.category.action (e.g. plant.growth.transplant)" />
        </Form.Item>

        <Form.Item
          name="targetType"
          label="Target type"
          rules={[{ required: true, message: "Target type is required" }]}
        >
          <Select
            options={[
              { value: "Plant", label: "Plant" },
              { value: "Diary", label: "Diary" },
              { value: "Brand", label: "Brand" },
              { value: "Product", label: "Product" },
            ]}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item
          name="mappingJson"
          label="Mapping JSON (payloadKey -> plant.currentKey)"
          rules={[{ required: true, message: "Mapping JSON is required" }]}
        >
          <Input.TextArea rows={10} />
        </Form.Item>

        <Form.Item name="tagId" label="Tag (optional)">
          <Select
            allowClear
            showSearch
            placeholder="Select a tag..."
            loading={tagsLoading}
            options={tagSelectOptions}
            onDropdownVisibleChange={(open) => {
              if (
                open &&
                !tagsLoading &&
                entityTags.length === 0 &&
                commonTags.length === 0
              ) {
                void loadTags();
              }
            }}
            filterOption={(inputValue, option) =>
              String((option as any)?.searchLabel ?? "")
                .toLowerCase()
                .includes(inputValue.toLowerCase())
            }
            style={{ width: 320 }}
          />
        </Form.Item>

        <Card size="small" style={{ marginBottom: 12 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Text strong>Condition Builder</Text>
            <Button
              size="small"
              onClick={() => form.setFieldValue("conditionsJson", "[]")}
            >
              Clear rules
            </Button>
          </Space>

          <div style={{ marginTop: 8 }}>
            <Form.Item
              name="conditionsJson"
              label="Conditions JSON (advanced)"
              style={{ marginBottom: 8 }}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            {parsedConditions.error ? (
              <div style={{ marginTop: 8 }}>
                <Text type="danger">{parsedConditions.error}</Text>
              </div>
            ) : null}

            <Form.Item shouldUpdate noStyle>
              {() => {
                const rules: ConditionRuleFormValue[] = (() => {
                  if (!parsedConditions.arr) return [];
                  return parsedConditions.arr;
                })();

                const setRules = (nextRules: ConditionRuleFormValue[]) => {
                  form.setFieldValue(
                    "conditionsJson",
                    JSON.stringify(nextRules, null, 2),
                  );
                };

                const updateRule = (
                  idx: number,
                  patch: Partial<ConditionRuleFormValue>,
                ) => {
                  const next = rules.map((r, i) =>
                    i === idx ? { ...r, ...patch } : r,
                  );
                  setRules(next);
                };

                const removeRule = (idx: number) => {
                  const next = rules.filter((_r, i) => i !== idx);
                  setRules(next);
                };

                const addRule = () => {
                  setRules([
                    ...rules,
                    {
                      field: undefined,
                      operator: undefined,
                      value: undefined,
                      tagId: undefined,
                    },
                  ]);
                };

                return (
                  <div>
                    {rules.length === 0 ? (
                      <Text type="secondary">No rules yet</Text>
                    ) : null}

                    <div style={{ marginTop: 8 }}>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {rules.map((rule, idx) => {
                          const selectedTag = rule.tagId
                            ? allTagItems.get(rule.tagId)
                            : undefined;

                          return (
                            <Card
                              key={idx}
                              size="small"
                              style={{ background: "#fafafa" }}
                              bodyStyle={{ padding: 12 }}
                            >
                              <Space
                                align="start"
                                style={{
                                  width: "100%",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Space wrap>
                                  <Select
                                    placeholder="Field"
                                    style={{ width: 180 }}
                                    value={rule.field}
                                    options={mappingKeyOptions}
                                    onChange={(v) =>
                                      updateRule(idx, { field: v })
                                    }
                                  />

                                  <Select
                                    placeholder="Operator"
                                    style={{ width: 120 }}
                                    value={rule.operator}
                                    options={[
                                      { value: "lt", label: "lt (<)" },
                                      { value: "gt", label: "gt (>)" },
                                      { value: "eq", label: "eq (=)" },
                                      { value: "lte", label: "lte (<=)" },
                                      { value: "gte", label: "gte (>=)" },
                                    ]}
                                    onChange={(v) =>
                                      updateRule(idx, { operator: v })
                                    }
                                  />

                                  <Input
                                    placeholder="Value"
                                    style={{ width: 180 }}
                                    value={rule.value}
                                    onChange={(e) =>
                                      updateRule(idx, { value: e.target.value })
                                    }
                                  />

                                  <Select
                                    showSearch
                                    placeholder="Tag"
                                    style={{ width: 260 }}
                                    value={rule.tagId}
                                    loading={tagsLoading}
                                    options={tagSelectOptions}
                                    onDropdownVisibleChange={(open) => {
                                      if (
                                        open &&
                                        !tagsLoading &&
                                        entityTags.length === 0 &&
                                        commonTags.length === 0
                                      ) {
                                        void loadTags();
                                      }
                                    }}
                                    onChange={(v) =>
                                      updateRule(idx, { tagId: v })
                                    }
                                    filterOption={(inputValue, option) =>
                                      String((option as any)?.searchLabel ?? "")
                                        .toLowerCase()
                                        .includes(inputValue.toLowerCase())
                                    }
                                  />
                                </Space>

                                <Space direction="vertical" align="end">
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => removeRule(idx)}
                                  />
                                  {selectedTag ? (
                                    <Tag color={selectedTag.color ?? "default"}>
                                      {selectedTag.icon
                                        ? `${selectedTag.icon} `
                                        : ""}
                                      {selectedTag.label}
                                    </Tag>
                                  ) : null}
                                </Space>
                              </Space>
                            </Card>
                          );
                        })}
                      </Space>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <Button onClick={addRule}>Add rule</Button>
                    </div>
                  </div>
                );
              }}
            </Form.Item>
          </div>
        </Card>

        <Card size="small" style={{ marginBottom: 12 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Text strong>Plant field suggestions (MVP)</Text>
            <Button size="small" onClick={insertTemplate}>
              Insert template
            </Button>
          </Space>
          <div style={{ marginTop: 8 }}>
            <Space wrap>
              {plantSuggestedKeys.map((k) => (
                <span key={k} onDoubleClick={() => copyKey(k)}>
                  <Tag.CheckableTag
                    style={{ cursor: "pointer" }}
                    checked={checkedKeys.has(k)}
                    onChange={(checked) => setMappingKey(k, checked)}
                  >
                    {k}
                  </Tag.CheckableTag>
                </span>
              ))}
            </Space>
          </div>

          {parsedMapping.error ? (
            <div style={{ marginTop: 8 }}>
              <Text type="danger">{parsedMapping.error}</Text>
            </div>
          ) : null}

          {unknownKeys.length > 0 ? (
            <div style={{ marginTop: 8 }}>
              <Text type="warning">Keys in mapping not in suggestions:</Text>
              <div style={{ marginTop: 6 }}>
                <Space wrap>
                  {unknownKeys.map((k) => (
                    <Tag
                      key={k}
                      color="orange"
                      closable
                      onClose={() => removeUnknownKey(k)}
                    >
                      {k}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              Toggle tag to add/remove <Text code>{'"key": "key"'}</Text>{" "}
              mapping. Double click to copy key.
            </Text>
          </div>
        </Card>

        <Text type="secondary">
          MVP limitation: mapping keys are flat. Dates should be stored as ISO
          strings.
        </Text>

        <div style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save
          </Button>
        </div>
      </Form>
    </Card>
  );
};
