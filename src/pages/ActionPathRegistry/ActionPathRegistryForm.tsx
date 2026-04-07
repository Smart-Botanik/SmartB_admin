import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
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
  groupPath: string;
  filter: string;
  description?: string;
  targetType: string;
  mappingJson: string;
  conditionsJson?: string;
  autoTagRulesJson?: string;
  tagId?: string | null;
};

type ConditionRuleFormValue = {
  field?: string;
  operator?: "lt" | "gt" | "eq" | "lte" | "gte";
  value?: string;
  tagId?: string;
};

type AutoTagConditionFormValue = {
  field?: string;
  operator?: "lt" | "gt" | "eq" | "lte" | "gte";
  value?: string | number;
};

type AutoTagRuleFormValue = {
  name?: string;
  tag_id?: string;
  logic?: "AND" | "OR" | null;
  conditions?: AutoTagConditionFormValue[];
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

  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groups, setGroups] = useState<
    Array<{ id: string; path: string; description?: string | null }>
  >([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupPath, setNewGroupPath] = useState<string>("");
  const [newGroupDescription, setNewGroupDescription] = useState<string>("");

  const [tagsLoading, setTagsLoading] = useState(false);
  const [entityTags, setEntityTags] = useState<TagListItem[]>([]);
  const [commonTags, setCommonTags] = useState<TagListItem[]>([]);
  const [tagsLoadedOnce, setTagsLoadedOnce] = useState(false);

  const targetTypeValue = Form.useWatch("targetType", form);

  const groupPathValue = Form.useWatch("groupPath", form);

  const filterValue = Form.useWatch("filter", form);

  const mappingJsonValue = Form.useWatch("mappingJson", form);

  const autoTagRulesJsonValue = Form.useWatch("autoTagRulesJson", form);

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

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const resp = await actionPathRegistryService.listGroups();
      setGroups(resp);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load groups");
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const actionPath = String(initialValues?.actionPath ?? "").trim();
    if (!actionPath) return;

    const parts = actionPath.split(".").filter(Boolean);
    if (parts.length < 2) {
      form.setFieldValue("groupPath", "common");
      form.setFieldValue("filter", parts[0] ?? "");
      return;
    }

    const groupPath = parts.slice(0, -1).join(".") || "common";
    const filter = parts[parts.length - 1] ?? "";
    form.setFieldValue("groupPath", groupPath);
    form.setFieldValue("filter", filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.actionPath]);

  useEffect(() => {
    const groupPath = String(groupPathValue ?? "").trim();
    const filter = String(filterValue ?? "").trim();
    if (!groupPath || !filter) return;
    form.setFieldValue("actionPath", `${groupPath}.${filter}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupPathValue, filterValue]);

  const updateAutoTagRule = (idx: number, next: AutoTagRuleFormValue) => {
    if (!parsedAutoTagRules.arr) {
      message.error(parsedAutoTagRules.error ?? "Invalid autoTagRulesJson");
      return;
    }
    const arr = [...parsedAutoTagRules.arr];
    arr[idx] = next;
    form.setFieldValue("autoTagRulesJson", JSON.stringify(arr, null, 2));
  };

  const addAutoTagRule = () => {
    const arr = parsedAutoTagRules.arr ?? [];
    const next: AutoTagRuleFormValue = {
      name: "",
      tag_id: undefined,
      logic: "AND",
      conditions: [
        { field: "", operator: "lt", value: "" },
        { field: "", operator: "gt", value: "" },
      ],
    };
    form.setFieldValue(
      "autoTagRulesJson",
      JSON.stringify([...arr, next], null, 2),
    );
  };

  const removeAutoTagRule = (idx: number) => {
    if (!parsedAutoTagRules.arr) return;
    const arr = parsedAutoTagRules.arr.filter((_, i) => i !== idx);
    form.setFieldValue("autoTagRulesJson", JSON.stringify(arr, null, 2));
  };

  const addCondition = (ruleIdx: number) => {
    if (!parsedAutoTagRules.arr) return;
    const rule = parsedAutoTagRules.arr[ruleIdx] ?? {};
    const conditions = [...(rule.conditions ?? [])];
    conditions.push({ field: "", operator: "eq", value: "" });
    updateAutoTagRule(ruleIdx, { ...rule, conditions });
  };

  const removeCondition = (ruleIdx: number, condIdx: number) => {
    if (!parsedAutoTagRules.arr) return;
    const rule = parsedAutoTagRules.arr[ruleIdx] ?? {};
    const conditions = [...(rule.conditions ?? [])].filter(
      (_, i) => i !== condIdx,
    );
    updateAutoTagRule(ruleIdx, { ...rule, conditions });
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

  const parsedAutoTagRules = useMemo(() => {
    const raw = autoTagRulesJsonValue ?? "[]";
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return {
          arr: null as AutoTagRuleFormValue[] | null,
          error: "AutoTagRules must be a JSON array",
        };
      }
      return {
        arr: parsed as AutoTagRuleFormValue[],
        error: null as string | null,
      };
    } catch {
      return {
        arr: null as AutoTagRuleFormValue[] | null,
        error: "Invalid JSON",
      };
    }
  }, [autoTagRulesJsonValue]);

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

    const groupPath = String(values.groupPath ?? "").trim() || "common";
    const filter = String(values.filter ?? "").trim();

    const groupPathOk = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/i.test(groupPath);
    if (!groupPathOk) {
      message.error(
        "Invalid group path format. Expected dot-separated keys (e.g. plant.growth)",
      );
      return;
    }

    const filterOk = /^[a-z0-9_]+$/i.test(filter);
    if (!filterOk) {
      message.error(
        "Invalid filter format. Expected a single key (e.g. transplant)",
      );
      return;
    }

    const actionPath = `${groupPath}.${filter}`;

    if (values.autoTagRulesJson) {
      try {
        const parsed = JSON.parse(values.autoTagRulesJson);
        if (!Array.isArray(parsed)) {
          message.error("AutoTagRules JSON must be an array");
          return;
        }

        for (const [idx, rule] of parsed.entries()) {
          const r = rule as AutoTagRuleFormValue;
          if (!r.name || String(r.name).trim() === "") {
            message.error(`Rule #${idx + 1}: name is required`);
            return;
          }
          if (!r.tag_id || String(r.tag_id).trim() === "") {
            message.error(`Rule #${idx + 1}: tag is required`);
            return;
          }
          const hasLogic = r.logic === "AND" || r.logic === "OR";
          const minConditions = hasLogic ? 2 : 1;
          if (
            r.logic !== undefined &&
            r.logic !== null &&
            r.logic !== "AND" &&
            r.logic !== "OR"
          ) {
            message.error(`Rule #${idx + 1}: logic must be AND/OR or empty`);
            return;
          }
          if (
            !Array.isArray(r.conditions) ||
            r.conditions.length < minConditions
          ) {
            message.error(
              `Rule #${idx + 1}: conditions must have at least ${minConditions} items`,
            );
            return;
          }
          for (const [cIdx, c] of r.conditions.entries()) {
            if (!c.field || String(c.field).trim() === "") {
              message.error(
                `Rule #${idx + 1} / Condition #${cIdx + 1}: field is required`,
              );
              return;
            }
            if (!c.operator) {
              message.error(
                `Rule #${idx + 1} / Condition #${cIdx + 1}: operator is required`,
              );
              return;
            }
            if (c.value === undefined || String(c.value).trim() === "") {
              message.error(
                `Rule #${idx + 1} / Condition #${cIdx + 1}: value is required`,
              );
              return;
            }
          }
        }
      } catch {
        message.error("Invalid autoTagRules JSON");
        return;
      }
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

    setSaving(true);
    try {
      const ok = await actionPathRegistryService.upsert({
        actionPath,
        description: values.description,
        targetType: values.targetType,
        mappingJson: values.mappingJson,
        conditionsJson: values.conditionsJson,
        autoTagRulesJson: values.autoTagRulesJson,
        tagId: values.tagId,
      });
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
          groupPath: "plant.growth",
          filter: "transplant",
          description: "",
          targetType: "Plant",
          mappingJson: defaultMapping,
          conditionsJson: "[]",
          autoTagRulesJson: "[]",
          ...initialValues,
        }}
      >
        <Form.Item name="actionPath" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="groupPath"
          label="Group"
          extra={
            <Text type="secondary">
              Example: <Text code>plant.growth</Text> (this will prefix your
              action path)
            </Text>
          }
          rules={[{ required: true, message: "Group is required" }]}
        >
          <Select
            showSearch
            loading={groupsLoading}
            placeholder="Select a group..."
            options={groups.map((g) => ({
              value: g.path,
              label: (
                <Space size={8}>
                  <Text code>{g.path}</Text>
                  {g.description ? (
                    <Text type="secondary">{g.description}</Text>
                  ) : null}
                </Space>
              ),
            }))}
            filterOption={(inputValue, option) =>
              String((option as any)?.value ?? "")
                .toLowerCase()
                .includes(inputValue.toLowerCase())
            }
            style={{ width: 420 }}
          />
        </Form.Item>

        <Space style={{ marginBottom: 16 }}>
          <Button
            onClick={() => {
              setCreatingGroup((v) => !v);
              if (!creatingGroup) {
                setNewGroupPath("");
                setNewGroupDescription("");
              }
            }}
          >
            {creatingGroup ? "Cancel new group" : "Create new group"}
          </Button>
        </Space>

        {creatingGroup ? (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Input
                value={newGroupPath}
                onChange={(e) => setNewGroupPath(e.target.value)}
                placeholder="Group path (e.g. plant.growth)"
              />
              <Input
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Group description (optional)"
              />
              <Space>
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      const created =
                        await actionPathRegistryService.createGroup({
                          path: newGroupPath,
                          description: newGroupDescription,
                        });
                      message.success("Group created");
                      setGroups((prev) => {
                        const next = [...prev, created];
                        next.sort((a, b) => a.path.localeCompare(b.path));
                        return next;
                      });
                      form.setFieldValue("groupPath", created.path);
                      setCreatingGroup(false);
                    } catch (e: any) {
                      message.error(e?.message ?? "Failed to create group");
                    }
                  }}
                  disabled={!String(newGroupPath).trim()}
                >
                  Save group
                </Button>
              </Space>
            </Space>
          </Card>
        ) : null}

        <Form.Item
          name="filter"
          label="Filter"
          extra={
            <Text type="secondary">
              Example: <Text code>transplant</Text>
            </Text>
          }
          rules={[{ required: true, message: "Filter is required" }]}
        >
          <Input
            placeholder="Event name (last segment)"
            style={{ width: 420 }}
          />
        </Form.Item>

        <Form.Item name="description" label="Description (optional)">
          <Input.TextArea rows={2} />
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
            <Text strong>Auto Tag Rules</Text>
            <Button size="small" onClick={addAutoTagRule}>
              Add rule
            </Button>
          </Space>

          <div style={{ marginTop: 8 }}>
            <Form.Item
              name="autoTagRulesJson"
              label="AutoTagRules JSON (advanced)"
              style={{ marginBottom: 8 }}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            {parsedAutoTagRules.error ? (
              <div style={{ marginTop: 8 }}>
                <Text type="danger">{parsedAutoTagRules.error}</Text>
              </div>
            ) : null}

            {parsedAutoTagRules.arr?.length ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                {parsedAutoTagRules.arr.map((rule, ruleIdx) => (
                  <Card
                    key={ruleIdx}
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
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Space wrap>
                          <Input
                            placeholder="Rule name"
                            style={{ width: 220 }}
                            value={rule.name}
                            onChange={(e) =>
                              updateAutoTagRule(ruleIdx, {
                                ...rule,
                                name: e.target.value,
                              })
                            }
                          />

                          <Select
                            showSearch
                            placeholder="Tag"
                            style={{ width: 260 }}
                            value={rule.tag_id}
                            loading={tagsLoading}
                            options={tagSelectOptions as any}
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
                              updateAutoTagRule(ruleIdx, { ...rule, tag_id: v })
                            }
                            filterOption={(inputValue, option) =>
                              String((option as any)?.searchLabel ?? "")
                                .toLowerCase()
                                .includes(inputValue.toLowerCase())
                            }
                          />

                          <Select
                            allowClear
                            placeholder="Logic"
                            style={{ width: 120 }}
                            value={rule.logic ?? null}
                            options={[
                              { value: "AND", label: "AND" },
                              { value: "OR", label: "OR" },
                            ]}
                            onChange={(v) =>
                              updateAutoTagRule(ruleIdx, {
                                ...rule,
                                logic: v ?? null,
                              })
                            }
                          />
                        </Space>

                        <Space
                          style={{
                            width: "100%",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">
                            Conditions (min{" "}
                            {rule.logic === "AND" || rule.logic === "OR"
                              ? 2
                              : 1}
                            )
                          </Text>
                          <Button
                            size="small"
                            onClick={() => addCondition(ruleIdx)}
                          >
                            Add condition
                          </Button>
                        </Space>

                        <Space direction="vertical" style={{ width: "100%" }}>
                          {(rule.conditions ?? []).map((c, condIdx) => (
                            <Space key={condIdx} wrap>
                              <Select
                                showSearch
                                allowClear
                                placeholder="field"
                                style={{ width: 180 }}
                                className="condition-field-input"
                                value={c.field}
                                options={mappingKeyOptions}
                                filterOption={(inputValue, option) =>
                                  String((option as any)?.value ?? "")
                                    .toLowerCase()
                                    .includes(inputValue.toLowerCase())
                                }
                                onSearch={(search) => {
                                  const conditions = [
                                    ...(rule.conditions ?? []),
                                  ];
                                  conditions[condIdx] = {
                                    ...conditions[condIdx],
                                    field: search,
                                  };
                                  updateAutoTagRule(ruleIdx, {
                                    ...rule,
                                    conditions,
                                  });
                                }}
                                onChange={(v) => {
                                  const conditions = [
                                    ...(rule.conditions ?? []),
                                  ];
                                  conditions[condIdx] = {
                                    ...conditions[condIdx],
                                    field: v ?? "",
                                  };
                                  updateAutoTagRule(ruleIdx, {
                                    ...rule,
                                    conditions,
                                  });
                                }}
                              />

                              <Select
                                placeholder="op"
                                style={{ width: 110 }}
                                value={c.operator}
                                options={[
                                  { value: "lt", label: "lt" },
                                  { value: "gt", label: "gt" },
                                  { value: "eq", label: "eq" },
                                  { value: "lte", label: "lte" },
                                  { value: "gte", label: "gte" },
                                ]}
                                onChange={(v) => {
                                  const conditions = [
                                    ...(rule.conditions ?? []),
                                  ];
                                  conditions[condIdx] = {
                                    ...conditions[condIdx],
                                    operator: v,
                                  };
                                  updateAutoTagRule(ruleIdx, {
                                    ...rule,
                                    conditions,
                                  });
                                }}
                              />

                              <InputNumber
                                placeholder="number"
                                style={{ width: 140 }}
                                value={
                                  typeof c.value === "number"
                                    ? c.value
                                    : undefined
                                }
                                onChange={(v) => {
                                  const conditions = [
                                    ...(rule.conditions ?? []),
                                  ];
                                  conditions[condIdx] = {
                                    ...conditions[condIdx],
                                    value: v === null ? "" : v,
                                  };
                                  updateAutoTagRule(ruleIdx, {
                                    ...rule,
                                    conditions,
                                  });
                                }}
                              />

                              <Input
                                placeholder="string"
                                style={{ width: 180 }}
                                value={
                                  typeof c.value === "string" ? c.value : ""
                                }
                                onChange={(e) => {
                                  const conditions = [
                                    ...(rule.conditions ?? []),
                                  ];
                                  conditions[condIdx] = {
                                    ...conditions[condIdx],
                                    value: e.target.value,
                                  };
                                  updateAutoTagRule(ruleIdx, {
                                    ...rule,
                                    conditions,
                                  });
                                }}
                              />

                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<CloseOutlined />}
                                onClick={() =>
                                  removeCondition(ruleIdx, condIdx)
                                }
                                disabled={
                                  (rule.conditions ?? []).length <=
                                  (rule.logic === "AND" || rule.logic === "OR"
                                    ? 2
                                    : 1)
                                }
                              />
                            </Space>
                          ))}
                        </Space>
                      </Space>

                      <Button
                        danger
                        size="small"
                        onClick={() => removeAutoTagRule(ruleIdx)}
                      >
                        Remove rule
                      </Button>
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No auto tag rules yet</Text>
            )}
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
