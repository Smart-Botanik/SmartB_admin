import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
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
import { registryFieldSpecsService, type RegistryFieldSpec } from "@/services/registryFieldSpecs";
import {
  registryProfilesService,
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

const RegistryProfileBuilderPage: React.FC = () => {
  const [form] = Form.useForm<ProfileFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profiles, setProfiles] = useState<RegistryProfile[]>([]);
  const [fieldSpecs, setFieldSpecs] = useState<RegistryFieldSpec[]>([]);
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>("");
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [requiredFieldIds, setRequiredFieldIds] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [nextProfiles, nextFieldSpecs] = await Promise.all([
        registryProfilesService.list({ entity: "Plant" }),
        registryFieldSpecsService.list({ entity: "Plant", status: "active" }),
      ]);
      setProfiles(nextProfiles);
      setFieldSpecs(nextFieldSpecs);
    } catch (error: any) {
      message.error(error?.message ?? "Failed to load profile builder data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      await load();
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
      await load();
    } catch (error: any) {
      message.error(error?.message ?? "Failed to save profile field set");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Profile Builder (v1)
      </Typography.Title>

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
                      entity: "Plant",
                      kind: "event_write",
                      isActive: true,
                    });
                    return;
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
                  entity: "Plant",
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
                  <Select options={[{ value: "Plant", label: "Plant" }]} />
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

              <Select
                mode="multiple"
                placeholder="Select required field IDs"
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
    </div>
  );
};

export default RegistryProfileBuilderPage;

