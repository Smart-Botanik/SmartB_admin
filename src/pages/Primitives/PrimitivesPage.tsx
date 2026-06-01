import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  FieldSpecControllerPreview,
  FieldSpecNumericSection,
  buildConstraintsJson,
  buildFormatJson,
  formatJsonToString,
  parseConstraintsJson,
  parseFormatJson,
} from "@/components/FieldSpecs";
import {
  RegistryFieldSpec,
  RegistryFieldSpecStatus,
  RegistrySemanticKind,
  RegistryValueType,
  registryFieldSpecsService,
} from "@/services/registryFieldSpecs";
import { fieldPatternsService, type FieldPattern } from "@/services/fieldPatterns";

const { Title, Text, Link } = Typography;

const ENTITY_OPTIONS = [
  { value: "Plant", label: "Plant" },
  { value: "Diary", label: "Diary" },
  { value: "Location", label: "Location" },
] as const;

type FieldSpecFormValues = {
  fieldId: string;
  entity: string;
  fieldPatternKey?: string;
  label: string;
  valueType: RegistryValueType;
  semanticKind: RegistrySemanticKind;
  canonicalPath: string;
  unit?: string;
  includeInCurrent?: boolean;
  required?: boolean;
  formatMode?: "integer" | "decimal";
  formatPrecision?: number;
  formatStep?: number;
  constraintMin?: number;
  constraintMax?: number;
  formatJson?: string;
  constraintsJson?: string;
};

const parseJsonPayload = (raw?: string | Record<string, unknown> | null) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const serializeFormatAndConstraints = (values: FieldSpecFormValues) => {
  if (values.valueType === "number") {
    return {
      formatJson:
        formatJsonToString(
          buildFormatJson({
            formatMode: values.formatMode,
            formatPrecision: values.formatPrecision,
            formatStep: values.formatStep,
          }),
        ) || undefined,
      constraintsJson:
        formatJsonToString(
          buildConstraintsJson({
            constraintMin: values.constraintMin,
            constraintMax: values.constraintMax,
          }),
        ) || undefined,
    };
  }

  return {
    formatJson: values.formatJson?.trim() || undefined,
    constraintsJson: values.constraintsJson?.trim() || undefined,
  };
};

type StatusFilter = RegistryFieldSpecStatus | "all";

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Активные" },
  { value: "deprecated", label: "Deprecated" },
  { value: "all", label: "Все" },
];

const FieldSpecStatusTag: React.FC<{ status: RegistryFieldSpecStatus }> = ({ status }) => {
  if (status === "deprecated") {
    return <Tag color="orange">DEPRECATED</Tag>;
  }
  return <Tag color="green">active</Tag>;
};

const FieldSpecsPage: React.FC = () => {
  const [items, setItems] = useState<RegistryFieldSpec[]>([]);
  const [patterns, setPatterns] = useState<FieldPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string>("Plant");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [deprecatingFieldId, setDeprecatingFieldId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [form] = Form.useForm<FieldSpecFormValues>();

  const isEditing = Boolean(editingFieldId);
  const editingRecord = useMemo(
    () => items.find(item => item.fieldId === editingFieldId) ?? null,
    [items, editingFieldId],
  );
  const selectedPatternKey = Form.useWatch("fieldPatternKey", form);
  const watchedValueType = Form.useWatch("valueType", form);
  const watchedLabel = Form.useWatch("label", form);
  const watchedSemanticKind = Form.useWatch("semanticKind", form);
  const watchedUnit = Form.useWatch("unit", form);
  const watchedFormatMode = Form.useWatch("formatMode", form);
  const watchedFormatPrecision = Form.useWatch("formatPrecision", form);
  const watchedFormatStep = Form.useWatch("formatStep", form);
  const watchedConstraintMin = Form.useWatch("constraintMin", form);
  const watchedConstraintMax = Form.useWatch("constraintMax", form);
  const isNumberField = watchedValueType === "number";
  const selectedPattern = useMemo(
    () => patterns.find(pattern => pattern.key === selectedPatternKey) ?? null,
    [patterns, selectedPatternKey],
  );

  const load = async (entity: string, status: StatusFilter) => {
    setLoading(true);
    try {
      const next = await registryFieldSpecsService.list({
        entity,
        status: status === "all" ? undefined : status,
      });
      setItems(next);
    } catch (error: any) {
      message.error(error?.message ?? "Failed to load field specs");
    } finally {
      setLoading(false);
    }
  };

  const handleDeprecate = useCallback(
    async (record: RegistryFieldSpec) => {
      setDeprecatingFieldId(record.fieldId);
      try {
        const usage = await registryFieldSpecsService.getUsage(record.fieldId);

        Modal.confirm({
          title: "Вывести Field Spec из оборота?",
          content: (
            <div>
              <Text>
                Поле <Text code>{record.fieldId}</Text> получит статус{" "}
                <Text strong>DEPRECATED</Text> и будет скрыто из picker новых профилей.
              </Text>
              {usage.profileCount > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 12 }}
                  message={`Используется в ${usage.profileCount} профиле(ах)`}
                  description={usage.profileKeys.join(", ")}
                />
              ) : null}
            </div>
          ),
          okText: "Вывести из оборота",
          okButtonProps: { danger: true },
          cancelText: "Отмена",
          onOk: async () => {
            await registryFieldSpecsService.deprecate(record.fieldId);
            message.success(`Field spec ${record.fieldId} выведен из оборота`);
            await load(selectedEntity, statusFilter);
          },
        });
      } catch (error: any) {
        message.error(error?.message ?? "Не удалось загрузить usage для field spec");
      } finally {
        setDeprecatingFieldId(null);
      }
    },
    [selectedEntity, statusFilter],
  );

  useEffect(() => {
    load(selectedEntity, statusFilter);
  }, [selectedEntity, statusFilter]);

  useEffect(() => {
    fieldPatternsService.list().then(setPatterns).catch(() => {
      message.error("Failed to load field patterns");
    });
  }, []);

  const columns: ColumnsType<RegistryFieldSpec> = useMemo(
    () => [
      { title: "Field ID", dataIndex: "fieldId", key: "fieldId", width: 220 },
      { title: "Entity", dataIndex: "entity", key: "entity", width: 100 },
      { title: "Label", dataIndex: "label", key: "label", width: 180 },
      { title: "Value Type", dataIndex: "valueType", key: "valueType", width: 120 },
      { title: "Semantic", dataIndex: "semanticKind", key: "semanticKind", width: 120 },
      { title: "Pattern", dataIndex: "fieldPatternKey", key: "fieldPatternKey", width: 190 },
      { title: "Canonical Path", dataIndex: "canonicalPath", key: "canonicalPath", width: 160 },
      { title: "Unit", dataIndex: "unit", key: "unit", width: 120 },
      {
        title: "Current",
        key: "includeInCurrent",
        width: 90,
        render: (_, record) =>
          record.includeInCurrent ? <Tag color="blue">yes</Tag> : <Tag>no</Tag>,
      },
      {
        title: "Status",
        key: "status",
        width: 140,
        render: (_, record) => <FieldSpecStatusTag status={record.status} />,
      },
      { title: "Version", dataIndex: "version", key: "version", width: 100 },
      {
        title: "",
        key: "actions",
        width: 120,
        render: (_, record) => (
          <Space size="small">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingFieldId(record.fieldId);
                form.setFieldsValue({
                  fieldId: record.fieldId,
                  entity: record.entity,
                  fieldPatternKey: record.fieldPatternKey ?? undefined,
                  label: record.label,
                  valueType: record.valueType,
                  semanticKind: record.semanticKind,
                  canonicalPath: record.canonicalPath,
                  unit: record.unit ?? "",
                  includeInCurrent: record.includeInCurrent,
                  required: record.required,
                  ...parseFormatJson(record.formatJson),
                  ...parseConstraintsJson(record.constraintsJson),
                  formatJson:
                    record.valueType === "number"
                      ? ""
                      : formatJsonToString(record.formatJson ?? undefined),
                  constraintsJson:
                    record.valueType === "number"
                      ? ""
                      : formatJsonToString(record.constraintsJson ?? undefined),
                });
                setModalOpen(true);
              }}
            />
            {record.status === "active" ? (
              <Button
                size="small"
                danger
                icon={<MinusCircleOutlined />}
                loading={deprecatingFieldId === record.fieldId}
                onClick={() => handleDeprecate(record)}
                title="Вывести из оборота"
              />
            ) : null}
          </Space>
        ),
      },
    ],
    [deprecatingFieldId, form, handleDeprecate],
  );

  const openCreateModal = () => {
    setEditingFieldId(null);
    form.resetFields();
    form.setFieldsValue({
      entity: selectedEntity,
      fieldPatternKey: undefined,
      semanticKind: "generic",
      valueType: "number",
      includeInCurrent: false,
      required: false,
      formatMode: undefined,
      formatPrecision: undefined,
      formatStep: undefined,
      constraintMin: undefined,
      constraintMax: undefined,
      formatJson: "",
      constraintsJson: "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFieldId(null);
    form.resetFields();
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const { formatJson, constraintsJson } = serializeFormatAndConstraints(values);

      if (isEditing && editingFieldId) {
        await registryFieldSpecsService.upsert({
          fieldId: editingFieldId,
          entity: values.entity,
          label: values.label,
          valueType: values.valueType,
          semanticKind: values.semanticKind,
          canonicalPath: values.canonicalPath,
          unit: values.unit?.trim() || undefined,
          fieldPatternKey: values.fieldPatternKey,
          status: editingRecord?.status ?? "active",
          includeInCurrent: values.includeInCurrent,
          required: values.required,
          formatJson,
          constraintsJson,
        });
        message.success("Field spec updated");
      } else {
        await registryFieldSpecsService.upsert({
          fieldId: values.fieldId,
          entity: values.entity,
          label: values.label,
          valueType: values.valueType,
          semanticKind: values.semanticKind,
          canonicalPath: values.canonicalPath,
          unit: values.unit?.trim() || undefined,
          fieldPatternKey: values.fieldPatternKey,
          status: "active",
          includeInCurrent: values.includeInCurrent,
          required: values.required,
          formatJson,
          constraintsJson,
        });
        message.success("Field spec created");
      }
      closeModal();
      await load(selectedEntity, statusFilter);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message ?? "Failed to save field spec");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Field Specs (Projection/Stream v1) - {selectedEntity}
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ minWidth: 180 }}
          value={selectedEntity}
          options={[...ENTITY_OPTIONS]}
          onChange={value => setSelectedEntity(value)}
        />
        <Select
          style={{ minWidth: 160 }}
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={value => setStatusFilter(value)}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => load(selectedEntity, statusFilter)}
          loading={loading}
        >
          Refresh
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Field Spec
        </Button>
      </Space>
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        Configure reusable rules in <Link href="/field-patterns">Field Patterns</Link> before creating Field Specs.
      </Text>

      <Table rowKey="id" loading={loading} dataSource={items} columns={columns} />

      <Modal
        title={isEditing ? "Edit Field Spec" : "Create Field Spec"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={submit}
        okText={isEditing ? "Save" : "Create"}
        confirmLoading={submitting}
        width={820}
        style={{ top: 24 }}
      >
        <Form form={form} layout="vertical" onFinish={submit} initialValues={{ entity: "Plant" }}>
          {editingRecord?.status === "deprecated" ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Field Spec выведен из оборота"
              description="Метаданные можно править; возврат в активный каталог — через seed или backend upsert со status active."
            />
          ) : null}
          <Form.Item
            name="fieldId"
            label="Field ID"
            rules={[
              { required: true, message: "Field ID is required" },
              {
                pattern: /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
                message: "Use dotted format: plant.solution.ph",
              },
            ]}
          >
            <Input placeholder="e.g. plant.solution.ph" disabled={isEditing} />
          </Form.Item>

          <Form.Item
            name="entity"
            label="Entity"
            rules={[{ required: true, message: "Entity is required" }]}
          >
            <Select options={[...ENTITY_OPTIONS]} />
          </Form.Item>

          <Form.Item name="fieldPatternKey" label="Field Pattern">
            <Select
              allowClear
              placeholder="Optional reusable pattern"
              options={patterns.map(pattern => ({
                value: pattern.key,
                label: `${pattern.title} (${pattern.key})`,
              }))}
              onChange={value => {
                const pattern = patterns.find(item => item.key === value);
                if (!pattern) {
                  return;
                }
                const formatPayload = parseJsonPayload(pattern.formatJson);
                const constraintsPayload = parseJsonPayload(pattern.constraintsJson);
                form.setFieldsValue({
                  valueType: pattern.valueType,
                  semanticKind: pattern.semanticKind,
                  unit: pattern.canonicalUnit ?? "",
                  ...parseFormatJson(formatPayload),
                  ...parseConstraintsJson(constraintsPayload),
                  formatJson:
                    pattern.valueType === "number"
                      ? ""
                      : (pattern.formatJson ?? ""),
                  constraintsJson:
                    pattern.valueType === "number"
                      ? ""
                      : (pattern.constraintsJson ?? ""),
                });
              }}
            />
          </Form.Item>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            Field Pattern переиспользует доменные правила (pH/ppm/temperature) без дублирования JSON.
          </Text>
          {selectedPattern?.allowedUnits?.length ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={`Unit options: ${selectedPattern.allowedUnits.join(", ")}`}
              description={`Storage/canonical unit: ${selectedPattern.canonicalUnit ?? "not set"}. Default input unit: ${selectedPattern.defaultInputUnit ?? "not set"}.`}
            />
          ) : null}

          <Form.Item
            name="label"
            label="Label"
            rules={[{ required: true, message: "Label is required" }]}
          >
            <Input placeholder="e.g. Solution pH" />
          </Form.Item>

          <Form.Item
            name="valueType"
            label="Value Type"
            rules={[{ required: true, message: "Value type is required" }]}
          >
            <Select
              options={[
                { value: "number", label: "number" },
                { value: "string", label: "string" },
                { value: "boolean", label: "boolean" },
                { value: "date", label: "date" },
                { value: "enum", label: "enum" },
                { value: "json", label: "json" },
              ]}
            />
          </Form.Item>

          <Form.Item name="semanticKind" label="Semantic Kind">
            <Select
              options={[
                { value: "generic", label: "generic" },
                { value: "ph", label: "ph" },
                { value: "ppm", label: "ppm" },
                { value: "temperature", label: "temperature" },
                { value: "length", label: "length" },
                { value: "concentration", label: "concentration" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="canonicalPath"
            label="Canonical Path"
            rules={[
              { required: true, message: "Canonical path is required" },
              {
                pattern: /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
                message: "Use dotted format: solution.ph",
              },
            ]}
          >
            <Input placeholder="e.g. solution.ph" />
          </Form.Item>

          <Form.Item
            name="unit"
            label={selectedPattern?.allowedUnits?.length ? "Canonical Unit" : "Unit"}
          >
            {selectedPattern?.allowedUnits?.length ? (
              <Select
                disabled
                options={selectedPattern.allowedUnits.map(unit => ({
                  value: unit,
                  label: unit,
                }))}
              />
            ) : (
              <Input placeholder="e.g. ppm" />
            )}
          </Form.Item>

          <Form.Item name="required" valuePropName="checked">
            <Checkbox>Required in profile by default</Checkbox>
          </Form.Item>

          <Form.Item name="includeInCurrent" valuePropName="checked">
            <Checkbox>
              Include in current snapshot{" "}
              <Tooltip title="При includeInCurrent=true поле может попасть в materialized current через profile mapping и snapshot policy.">
                <QuestionCircleOutlined />
              </Tooltip>
            </Checkbox>
          </Form.Item>

          {isNumberField ? (
            <>
              <Divider style={{ margin: "12px 0" }} />
              <FieldSpecNumericSection />
              <FieldSpecControllerPreview
                label={watchedLabel ?? ""}
                semanticKind={watchedSemanticKind}
                unit={watchedUnit}
                pattern={selectedPattern}
                format={{
                  formatMode: watchedFormatMode,
                  formatPrecision: watchedFormatPrecision,
                  formatStep: watchedFormatStep,
                }}
                constraints={{
                  constraintMin: watchedConstraintMin,
                  constraintMax: watchedConstraintMax,
                }}
              />
            </>
          ) : (
            <Collapse
              ghost
              style={{ marginBottom: 8 }}
              items={[
                {
                  key: "advanced-json",
                  label: "Advanced JSON (non-number types)",
                  children: (
                    <>
                      <Form.Item
                        name="formatJson"
                        label="Format JSON"
                        rules={[
                          {
                            validator: async (_, value: string | undefined) => {
                              const payload = value?.trim();
                              if (!payload) return;
                              JSON.parse(payload);
                            },
                            message: "Format JSON must be valid JSON",
                          },
                        ]}
                      >
                        <Input.TextArea rows={3} placeholder='e.g. {"mode":"decimal"}' />
                      </Form.Item>
                      <Form.Item
                        name="constraintsJson"
                        label="Constraints JSON"
                        rules={[
                          {
                            validator: async (_, value: string | undefined) => {
                              const payload = value?.trim();
                              if (!payload) return;
                              JSON.parse(payload);
                            },
                            message: "Constraints JSON must be valid JSON",
                          },
                        ]}
                      >
                        <Input.TextArea rows={3} placeholder='e.g. {"min":0,"max":14}' />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default FieldSpecsPage;
