import { useEffect, useMemo, useState, type FC } from "react";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  buildNormalizedValuesJson,
  createDefaultFieldInput,
  type RegistryFieldInputValue,
} from "@growing/contracts";
import { UxRegistryProfileValuesForm, type UxRegistryProfileFieldRow } from "@growing/ui";
import { fieldPatternsService, type FieldPattern } from "@/services/fieldPatterns";
import { registryFieldSpecsService, type RegistryFieldSpec } from "@/services/registryFieldSpecs";
import {
  registryProfilesService,
  type RegistryBuildPreviewResult,
  type RegistryProfile,
  type RegistryProfileKind,
} from "@/services/registryProfiles";

type ProfileFormValues = {
  key: string;
  entity: string;
  kind: RegistryProfileKind;
  title: string;
  description?: string;
  isActive?: boolean;
};

const kindOptions: Array<{ value: RegistryProfileKind; label: string }> = [
  { value: "event_write", label: "event_write" },
  { value: "timeseries_read", label: "timeseries_read" },
  { value: "snapshot_build", label: "snapshot_build" },
];

const REGISTRY_BUILDER_ENTITIES = [
  { value: "Plant", label: "Plant" },
  { value: "Diary", label: "Diary" },
  { value: "Location", label: "Location" },
] as const;

type RegistryBuilderEntity = (typeof REGISTRY_BUILDER_ENTITIES)[number]["value"];

const fullWidthStyle: React.CSSProperties = { width: "100%" };

const wateringPreviewValues: Record<string, RegistryFieldInputValue> = {
  "plant.watering.solution.ph": { value: 6.2, unit: "pH" },
  "plant.watering.solution.ppm": { value: 820, unit: "ppm" },
  "plant.watering.drainage.ph": { value: 6.4, unit: "pH" },
  "plant.watering.drainage.ppm": { value: 900, unit: "ppm" },
  "plant.watering.nutrients": {
    value: JSON.stringify(
      [
        {
          productId: "product-1",
          product: "Base Nutrient",
          nutrient_amount: { value: 1.5, unit: "mll" },
        },
      ],
      null,
      2,
    ),
  },
};

const diarySetupPreviewValues: Record<string, RegistryFieldInputValue> = {
  "diary.setup.watering_type": { value: "hydroponics" },
  "diary.setup.room_type": { value: "indoor" },
};

const PROFILE_PREVIEW_DEFAULTS: Record<string, Record<string, RegistryFieldInputValue>> = {
  "watering.event.v1": wateringPreviewValues,
  "diary.setup.config.v1": diarySetupPreviewValues,
};

const resolvePreviewDefault = (
  profileKey: string,
  fieldId: string,
): RegistryFieldInputValue | undefined =>
  PROFILE_PREVIEW_DEFAULTS[profileKey]?.[fieldId] ?? wateringPreviewValues[fieldId];

const setValueAtPath = (
  target: Record<string, unknown>,
  path: string,
  value: unknown
) => {
  const segments = path.split(".");
  let cursor = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value;
      return;
    }
    const next = cursor[segment];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  });
};

const RegistryProfileBuilderPage: FC = () => {
  const location = useLocation();
  const [form] = Form.useForm<ProfileFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewSubmitting, setPreviewSubmitting] = useState(false);
  const [profiles, setProfiles] = useState<RegistryProfile[]>([]);
  const [fieldSpecs, setFieldSpecs] = useState<RegistryFieldSpec[]>([]);
  const [fieldPatterns, setFieldPatterns] = useState<FieldPattern[]>([]);
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>("");
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [requiredFieldIds, setRequiredFieldIds] = useState<string[]>([]);
  const [fieldInputs, setFieldInputs] = useState<Record<string, RegistryFieldInputValue>>({});
  const [useAdvancedJson, setUseAdvancedJson] = useState(false);
  const [previewValuesJson, setPreviewValuesJson] = useState("{}");
  const [normalizeErrors, setNormalizeErrors] = useState<
    Array<{ fieldId: string; code: string; message: string }>
  >([]);
  const [buildPreviewResult, setBuildPreviewResult] =
    useState<RegistryBuildPreviewResult | null>(null);
  const [builderEntity, setBuilderEntity] = useState<RegistryBuilderEntity>("Plant");

  const load = async (entity: RegistryBuilderEntity = builderEntity) => {
    setLoading(true);
    try {
      const [nextProfiles, nextFieldSpecs, nextPatterns] = await Promise.all([
        registryProfilesService.list({ entity }),
        registryFieldSpecsService.list({ entity, status: "active" }),
        fieldPatternsService.list(),
      ]);
      setProfiles(nextProfiles);
      setFieldSpecs(nextFieldSpecs);
      setFieldPatterns(nextPatterns);
    } catch (error: any) {
      message.error(error?.message ?? "Failed to load profile builder data");
    } finally {
      setLoading(false);
    }
  };

  const switchBuilderEntity = (entity: RegistryBuilderEntity) => {
    setBuilderEntity(entity);
    setSelectedProfileKey("");
    setSelectedFieldIds([]);
    setRequiredFieldIds([]);
    setFieldInputs({});
    setBuildPreviewResult(null);
    setNormalizeErrors([]);
    setPreviewValuesJson("{}");
    form.setFieldsValue({
      entity,
      key: undefined,
      title: undefined,
      description: "",
    });
  };

  useEffect(() => {
    load(builderEntity);
  }, [builderEntity]);

  useEffect(() => {
    const fromHub = (location.state as { builderEntity?: RegistryBuilderEntity } | null)
      ?.builderEntity;
    if (fromHub && fromHub !== builderEntity) {
      switchBuilderEntity(fromHub);
    }
  }, [location.state, builderEntity]);

  const selectedProfile = useMemo(
    () => profiles.find(profile => profile.key === selectedProfileKey) ?? null,
    [profiles, selectedProfileKey]
  );

  useEffect(() => {
    if (!selectedProfile) {
      setSelectedFieldIds([]);
      setRequiredFieldIds([]);
      return;
    }
    const ordered = [...selectedProfile.fields].sort((a, b) => a.position - b.position);
    setSelectedFieldIds(ordered.map(f => f.fieldId));
    setRequiredFieldIds(ordered.filter(f => f.required).map(f => f.fieldId));
  }, [selectedProfile]);

  const fieldMap = useMemo(() => {
    const map = new Map<string, RegistryFieldSpec>();
    for (const field of fieldSpecs) {
      map.set(field.fieldId, field);
    }
    return map;
  }, [fieldSpecs]);

  const patternMap = useMemo(() => {
    const map = new Map<string, FieldPattern>();
    for (const pattern of fieldPatterns) {
      map.set(pattern.key, pattern);
    }
    return map;
  }, [fieldPatterns]);

  const runtimeFormFields = useMemo((): UxRegistryProfileFieldRow[] => {
    return selectedFieldIds.flatMap(fieldId => {
      const field = fieldMap.get(fieldId);
      if (!field) return [];
      const pattern = field.fieldPatternKey
        ? patternMap.get(field.fieldPatternKey) ?? null
        : null;

      return [
        {
          fieldId: field.fieldId,
          label: field.label,
          valueType: field.valueType,
          semanticKind: field.semanticKind,
          unit: field.unit,
          fieldPatternKey: field.fieldPatternKey,
          formatJson: field.formatJson,
          constraintsJson: field.constraintsJson,
          required: requiredFieldIds.includes(fieldId),
          pattern,
        },
      ];
    });
  }, [fieldMap, patternMap, requiredFieldIds, selectedFieldIds]);

  useEffect(() => {
    setFieldInputs(prev => {
      const next: Record<string, RegistryFieldInputValue> = {};
      selectedFieldIds.forEach(fieldId => {
        if (prev[fieldId]) {
          next[fieldId] = prev[fieldId];
          return;
        }

        const field = fieldMap.get(fieldId);
        const pattern = field?.fieldPatternKey
          ? patternMap.get(field.fieldPatternKey) ?? null
          : null;
        next[fieldId] =
          resolvePreviewDefault(selectedProfileKey, fieldId) ??
          createDefaultFieldInput(
            {
              fieldId,
              valueType: field?.valueType ?? "string",
              unit: field?.unit,
              fieldPatternKey: field?.fieldPatternKey,
            },
            pattern,
          );
      });
      return next;
    });
  }, [fieldMap, patternMap, selectedFieldIds, selectedProfileKey]);

  const previewRows = useMemo(
    () =>
      selectedFieldIds.map((fieldId, index) => {
        const field = fieldMap.get(fieldId);
        return {
          key: `${fieldId}-${index}`,
          position: index,
          fieldId,
          canonicalPath: field?.canonicalPath ?? "unknown",
          semanticKind: field?.semanticKind ?? "unknown",
          required: requiredFieldIds.includes(fieldId),
        };
      }),
    [fieldMap, requiredFieldIds, selectedFieldIds]
  );

  const previewColumns: ColumnsType<(typeof previewRows)[number]> = [
    { title: "Pos", dataIndex: "position", key: "position", width: 64 },
    { title: "Field ID", dataIndex: "fieldId", key: "fieldId" },
    { title: "Canonical Path", dataIndex: "canonicalPath", key: "canonicalPath" },
    {
      title: "Semantic",
      dataIndex: "semanticKind",
      key: "semanticKind",
      width: 120,
      render: value => <Tag>{value}</Tag>,
    },
    {
      title: "Required",
      dataIndex: "required",
      key: "required",
      width: 100,
      render: value => (value ? <Tag color="blue">yes</Tag> : <Tag>no</Tag>),
    },
  ];

  const fieldColumns: ColumnsType<RegistryFieldSpec> = [
    { title: "Field ID", dataIndex: "fieldId", key: "fieldId" },
    { title: "Label", dataIndex: "label", key: "label", width: 180 },
    {
      title: "Type",
      key: "valueType",
      width: 120,
      render: (_, field) => (
        <Space size={4} wrap>
          <Tag>{field.valueType}</Tag>
          <Tag>{field.semanticKind}</Tag>
        </Space>
      ),
    },
    { title: "Unit", dataIndex: "unit", key: "unit", width: 80 },
    { title: "Canonical Path", dataIndex: "canonicalPath", key: "canonicalPath" },
    {
      title: "Policy",
      key: "policy",
      width: 180,
      render: (_, field) => (
        <Space size={4} wrap>
          {field.required ? <Tag color="blue">field required</Tag> : <Tag>optional</Tag>}
          {field.includeInCurrent ? <Tag color="green">current</Tag> : null}
          {field.fieldPatternKey ? <Tag color="purple">{field.fieldPatternKey}</Tag> : null}
        </Space>
      ),
    },
  ];

  const payloadShape = useMemo(() => {
    const shape: Record<string, unknown> = {};
    selectedFieldIds.forEach(fieldId => {
      const field = fieldMap.get(fieldId);
      if (!field) return;
      setValueAtPath(shape, field.canonicalPath, `<${field.fieldId}>`);
    });
    return shape;
  }, [fieldMap, selectedFieldIds]);

  const saveProfileMeta = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const profile = await registryProfilesService.upsert({
        key: values.key.trim(),
        entity: values.entity,
        kind: values.kind,
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        isActive: values.isActive ?? true,
      });
      message.success("Profile saved");
      setSelectedProfileKey(profile.key);
      await load(builderEntity);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.message ?? "Failed to save profile metadata");
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfileFields = async () => {
    if (!selectedProfileKey.trim()) {
      message.warning("Select or create profile first");
      return;
    }
    if (!selectedFieldIds.length) {
      message.warning("Select at least one field");
      return;
    }
    const required = requiredFieldIds.filter(fieldId => selectedFieldIds.includes(fieldId));
    setSubmitting(true);
    try {
      await registryProfilesService.setFields({
        profileKey: selectedProfileKey,
        fieldIds: selectedFieldIds,
        requiredFieldIds: required,
      });
      message.success("Profile field selection saved");
      await load(builderEntity);
    } catch (error: any) {
      message.error(error?.message ?? "Failed to save profile field set");
    } finally {
      setSubmitting(false);
    }
  };

  const runBuildPreview = async () => {
    if (!selectedProfileKey.trim()) {
      message.warning("Select or create profile first");
      return;
    }

    let valuesJson: Record<string, unknown>;
    let nextNormalizeErrors: Array<{ fieldId: string; code: string; message: string }> = [];

    if (useAdvancedJson) {
      try {
        const parsed = JSON.parse(previewValuesJson);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Preview values must be a JSON object keyed by fieldId");
        }
        valuesJson = parsed;
      } catch (error: any) {
        message.error(error?.message ?? "Preview values must be valid JSON");
        return;
      }
    } else {
      const buildResult = buildNormalizedValuesJson(
        runtimeFormFields.map(field => ({
          field,
          pattern: field.pattern,
          input: fieldInputs[field.fieldId] ?? {},
          required: field.required,
        })),
      );
      valuesJson = buildResult.valuesJson;
      nextNormalizeErrors = buildResult.errors;
      setNormalizeErrors(nextNormalizeErrors);
      setPreviewValuesJson(JSON.stringify(valuesJson, null, 2));

      if (nextNormalizeErrors.length) {
        message.warning("Fix unit/value errors before preview");
        return;
      }
    }

    setPreviewSubmitting(true);
    try {
      const result = await registryProfilesService.buildPreview({
        profileKey: selectedProfileKey,
        valuesJson,
      });
      setBuildPreviewResult(result);
      if (result.errors.length) {
        message.warning("Preview returned validation errors");
      } else {
        message.success("Preview payload built");
      }
    } catch (error: any) {
      message.error(error?.message ?? "Failed to build profile preview");
    } finally {
      setPreviewSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Profile Builder (v1)
      </Typography.Title>

      <Space style={{ marginBottom: 16 }} wrap>
        <Typography.Text strong>Entity scope:</Typography.Text>
        <Select<RegistryBuilderEntity>
          style={{ minWidth: 160 }}
          value={builderEntity}
          options={[...REGISTRY_BUILDER_ENTITIES]}
          onChange={switchBuilderEntity}
        />
        <Tag color="blue">{fieldSpecs.length} active Field Specs</Tag>
        <Tag>{profiles.length} profiles</Tag>
      </Space>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Canonical paths only"
        description="Builder uses FieldSpec catalog and stores field selection in profile order. Custom mapping is intentionally out of scope in v1."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Profile Metadata" loading={loading}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Select
                allowClear
                showSearch
                placeholder="Load existing profile"
                style={fullWidthStyle}
                value={selectedProfileKey || undefined}
                options={profiles.map(p => ({
                  value: p.key,
                  label: `${p.key} (${p.kind})`,
                }))}
                onChange={value => {
                  const nextKey = value ?? "";
                  setSelectedProfileKey(nextKey);
                  const profile = profiles.find(p => p.key === nextKey);
                  if (!profile) {
                    form.resetFields();
                    form.setFieldsValue({
                      entity: builderEntity,
                      kind: "event_write",
                      isActive: true,
                    });
                    return;
                  }
                  if (profile.entity !== builderEntity) {
                    setBuilderEntity(profile.entity as RegistryBuilderEntity);
                  }
                  form.setFieldsValue({
                    key: profile.key,
                    entity: profile.entity,
                    kind: profile.kind,
                    title: profile.title,
                    description: profile.description ?? "",
                    isActive: profile.isActive,
                  });
                }}
              />

              <Form<ProfileFormValues>
                form={form}
                layout="vertical"
                initialValues={{
                  entity: builderEntity,
                  kind: "event_write",
                  isActive: true,
                }}
              >
                <Form.Item
                  name="key"
                  label="Profile Key"
                  rules={[
                    { required: true, message: "Profile key is required" },
                    {
                      pattern: /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
                      message: "Use dotted format: watering.event.v1",
                    },
                  ]}
                >
                  <Input placeholder="e.g. watering.event.v1" />
                </Form.Item>

                <Form.Item
                  name="entity"
                  label="Entity"
                  rules={[{ required: true, message: "Entity is required" }]}
                >
                  <Select options={[...REGISTRY_BUILDER_ENTITIES]} />
                </Form.Item>

                <Form.Item
                  name="kind"
                  label="Kind"
                  rules={[{ required: true, message: "Kind is required" }]}
                >
                  <Select options={kindOptions} />
                </Form.Item>

                <Form.Item
                  name="title"
                  label="Title"
                  rules={[{ required: true, message: "Title is required" }]}
                >
                  <Input placeholder="e.g. Watering event v1" />
                </Form.Item>

                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="isActive" valuePropName="checked">
                  <Checkbox>Active profile</Checkbox>
                </Form.Item>
              </Form>

              <Button type="primary" onClick={saveProfileMeta} loading={submitting}>
                Save Profile Metadata
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Field Picker + Canonical Preview" loading={loading}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Select
                mode="multiple"
                placeholder="Select field IDs for this profile"
                style={fullWidthStyle}
                maxTagCount="responsive"
                value={selectedFieldIds}
                onChange={(value: string[]) => {
                  setSelectedFieldIds(value);
                  setRequiredFieldIds(prev => prev.filter(id => value.includes(id)));
                }}
                options={fieldSpecs.map(field => ({
                  value: field.fieldId,
                  label: `${field.fieldId} -> ${field.canonicalPath}`,
                }))}
              />

              <Table<RegistryFieldSpec>
                size="small"
                rowKey="fieldId"
                pagination={{ pageSize: 5 }}
                dataSource={fieldSpecs}
                columns={fieldColumns}
                rowSelection={{
                  selectedRowKeys: selectedFieldIds,
                  onChange: keys => {
                    const next = keys.map(String);
                    setSelectedFieldIds(next);
                    setRequiredFieldIds(prev => prev.filter(id => next.includes(id)));
                  },
                }}
              />

              <Select
                mode="multiple"
                placeholder="Select required field IDs"
                style={fullWidthStyle}
                maxTagCount="responsive"
                value={requiredFieldIds}
                onChange={(value: string[]) => setRequiredFieldIds(value)}
                options={selectedFieldIds.map(fieldId => ({
                  value: fieldId,
                  label: fieldId,
                }))}
              />

              <Table
                size="small"
                rowKey="key"
                pagination={false}
                dataSource={previewRows}
                columns={previewColumns}
                locale={{ emptyText: "Select fields to preview canonical paths" }}
              />

              <Divider style={{ margin: "8px 0" }} />

              <Typography.Text strong>Payload Shape</Typography.Text>
              <Input.TextArea
                readOnly
                rows={8}
                value={JSON.stringify(payloadShape, null, 2)}
              />

              <Button
                type="primary"
                onClick={saveProfileFields}
                loading={submitting}
                disabled={!selectedProfileKey || !selectedFieldIds.length}
              >
                Save Profile Field Set
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Build Preview" style={{ marginTop: 16 }}>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="Runtime values form with unit normalization"
            description="User input unit → canonical unit через @growing/contracts перед buildPreview. Advanced JSON — escape hatch для отладки."
          />

          <Checkbox
            checked={useAdvancedJson}
            onChange={event => setUseAdvancedJson(event.target.checked)}
          >
            Advanced JSON (canonical valuesJson, skip normalizer)
          </Checkbox>

          {useAdvancedJson ? (
            <Input.TextArea
              rows={10}
              value={previewValuesJson}
              onChange={event => setPreviewValuesJson(event.target.value)}
            />
          ) : (
            <UxRegistryProfileValuesForm
              fields={runtimeFormFields}
              values={fieldInputs}
              onChange={(fieldId, next) =>
                setFieldInputs(prev => ({
                  ...prev,
                  [fieldId]: next,
                }))
              }
            />
          )}

          {normalizeErrors.length && !useAdvancedJson ? (
            <Table
              size="small"
              rowKey={(_, index) => String(index)}
              pagination={false}
              dataSource={normalizeErrors}
              columns={[
                { title: "Field ID", dataIndex: "fieldId", key: "fieldId" },
                { title: "Code", dataIndex: "code", key: "code", width: 180 },
                { title: "Message", dataIndex: "message", key: "message" },
              ]}
            />
          ) : null}

          <Button
            type="primary"
            onClick={runBuildPreview}
            loading={previewSubmitting}
            disabled={!selectedProfileKey || (!useAdvancedJson && !selectedFieldIds.length)}
          >
            Build Preview
          </Button>
          {buildPreviewResult ? (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Typography.Text strong>Payload</Typography.Text>
                <Input.TextArea
                  readOnly
                  rows={12}
                  value={JSON.stringify(buildPreviewResult.payload, null, 2)}
                />
              </Col>
              <Col xs={24} lg={12}>
                <Typography.Text strong>Errors</Typography.Text>
                <Table
                  size="small"
                  rowKey={(_, index) => String(index)}
                  pagination={false}
                  dataSource={buildPreviewResult.errors}
                  columns={[
                    { title: "Field ID", dataIndex: "fieldId", key: "fieldId" },
                    { title: "Code", dataIndex: "code", key: "code", width: 140 },
                    { title: "Message", dataIndex: "message", key: "message" },
                  ]}
                  locale={{ emptyText: "No validation errors" }}
                />
              </Col>
            </Row>
          ) : null}
        </Space>
      </Card>
    </div>
  );
};

export default RegistryProfileBuilderPage;

