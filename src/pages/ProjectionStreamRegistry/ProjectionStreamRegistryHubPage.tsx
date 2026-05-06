import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Space, Table, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { registryFieldSpecsService, type RegistryFieldSpec } from "@/services/registryFieldSpecs";
import { registryProfilesService, type RegistryProfile } from "@/services/registryProfiles";

const { Title, Paragraph, Text } = Typography;

const ProjectionStreamRegistryHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [fieldSpecs, setFieldSpecs] = useState<RegistryFieldSpec[]>([]);
  const [profiles, setProfiles] = useState<RegistryProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [nextSpecs, nextProfiles] = await Promise.all([
          registryFieldSpecsService.list({ entity: "Plant" }),
          registryProfilesService.list({ entity: "Plant", isActive: true }),
        ]);
        setFieldSpecs(nextSpecs);
        setProfiles(nextProfiles);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const profileColumns: ColumnsType<RegistryProfile> = useMemo(
    () => [
      { title: "Key", dataIndex: "key", key: "key" },
      { title: "Kind", dataIndex: "kind", key: "kind", width: 160 },
      { title: "Fields", key: "fields", width: 90, render: (_, p) => p.fields.length },
      {
        title: "Status",
        key: "isActive",
        width: 100,
        render: (_, p) => (p.isActive ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>),
      },
    ],
    []
  );

  const wateringProfile = useMemo(
    () => profiles.find(profile => profile.key === "watering.event.v1") ?? null,
    [profiles]
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Projection/Stream Registry
      </Title>

      <Paragraph type="secondary" style={{ maxWidth: 920 }}>
        Research hub for admin-driven contracts between admin frontend, main frontend, and backend.
        The goal is to define what we treat as FieldSpec, which slices go to current snapshot, and
        which capabilities stay in event streams.
      </Paragraph>

      <Alert
        type="info"
        showIcon
        message="Research mode"
        description="This section is intentionally iterative: we can change direction while preserving a clear checklist of assumptions and contract decisions."
        style={{ marginBottom: 16 }}
      />

      <Card title="Readiness Gates" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Tag color="green">Backend: PR-1 schema + seed ready</Tag>
          <Tag color="gold">Backend: PR-2 API in progress</Tag>
          <Tag color={fieldSpecs.length > 0 ? "green" : "gold"}>
            Admin: FieldSpec catalog {fieldSpecs.length > 0 ? "connected" : "in progress"}
          </Tag>
          <Tag color="blue">FrontendApp start gate: C2 + A3</Tag>
        </Space>
      </Card>

      <Card title="Live Registry Snapshot" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Connected FieldSpecs: {fieldSpecs.length} | Active Profiles: {profiles.length}
          </Typography.Text>
          <Table<RegistryProfile>
            size="small"
            rowKey="id"
            loading={loading}
            dataSource={profiles}
            columns={profileColumns}
            pagination={false}
          />
        </Space>
      </Card>

      <Card
        title="Pilot Profile: watering.event.v1"
        style={{ marginBottom: 16 }}
        extra={wateringProfile ? <Tag color="green">ready</Tag> : <Tag color="gold">not found</Tag>}
        actions={[
          <Button type="link" onClick={() => navigate("/projection-stream-registry/profiles")}>
            Open Profile Builder
          </Button>,
        ]}
      >
        <Space direction="vertical" size={6}>
          <Text>
            First E2E contract for Plant watering payloads. It must be validated as a Profile before
            Event Definitions start referencing it.
          </Text>
          <Text>
            Fields: {wateringProfile?.fields.length ?? 0} selected | Kind:{" "}
            {wateringProfile?.kind ?? "event_write"}
          </Text>
          <Text type="secondary">
            Gate: FieldSpecs/Profile → Build Preview → Event Definition.
          </Text>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="Registry Profiles"
            extra={<Tag color="blue">core</Tag>}
            actions={[
              <Button type="link" onClick={() => navigate("/projection-stream-registry/profiles")}>
                Open Profile Builder
              </Button>,
            ]}
          >
            <Space direction="vertical" size={6}>
              <Text>- Define profile groups per capability (watering, feeding, climate).</Text>
              <Text>- Keep v1 canonical paths only; no custom path bindings yet.</Text>
              <Text>- Validate mapping JSON and cross-check required fields.</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="FieldSpec Catalog"
            extra={<Tag color="purple">contract</Tag>}
            actions={[
              <Button type="link" onClick={() => navigate("/field-specs")}>
                Open Field Specs
              </Button>,
            ]}
          >
            <Space direction="vertical" size={6}>
              <Text>- Replace "primitive thinking" with FieldSpec vocabulary.</Text>
              <Text>- Distinguish valueType vs semanticKind and validation format.</Text>
              <Text>- Keep decimal behavior (precision/step) explicit for pH/ppm.</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Current Snapshot Policy"
            extra={<Tag color="green">projection</Tag>}
            actions={[
              <Button type="link" onClick={() => navigate("/plants")}>
                Review Plant Admin Flow
              </Button>,
            ]}
          >
            <Space direction="vertical" size={6}>
              <Text>- Mark fields included in current snapshot.</Text>
              <Text>- Keep time-series metrics out of current by default.</Text>
              <Text>- Confirm which fields main frontend reads as current.</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Event & Chart Streams"
            extra={<Tag color="orange">timeseries</Tag>}
            actions={[
              <Button type="link" onClick={() => navigate("/events")}>
                Open Events
              </Button>,
            ]}
          >
            <Space direction="vertical" size={6}>
              <Text>- Record watering/metrics as events (not Plant flat fields).</Text>
              <Text>- Query by period for chart series in frontend.</Text>
              <Text>- Prepare profile pairs: write-event and read-chart.</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Frontend/Backend Coordination" style={{ marginTop: 16 }}>
        <Space direction="vertical" size={8}>
          <Text>- Admin frontend defines contracts and profile metadata.</Text>
          <Text>- Main frontend resolves selected fields into payload via canonical paths.</Text>
          <Text>- Backend validates contracts, stores events, and materializes current snapshot.</Text>
          <Space wrap>
            <Button onClick={() => navigate("/tags")}>Open Registry Tags</Button>
            <Button onClick={() => navigate("/events/definitions/new")}>
              Create Draft Profile
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="Glossary (v1)" style={{ marginTop: 16 }}>
        <Space direction="vertical" size={6}>
          <Text>
            - <strong>FieldSpec</strong>: field contract definition (replaces legacy "primitive" wording
            for new registry flow).
          </Text>
          <Text>- <strong>valueType</strong>: technical data type (number/string/boolean/date/enum/json).</Text>
          <Text>- <strong>semanticKind</strong>: domain meaning (ph/ppm/temperature/generic).</Text>
          <Text>- <strong>format</strong>: input behavior (decimal/integer, precision, step).</Text>
          <Text>- <strong>constraints</strong>: validation rules (required, min, max, enum values).</Text>
          <Text>- <strong>canonicalPath</strong>: path used for v1 payload assembly.</Text>
        </Space>
      </Card>
    </div>
  );
};

export default ProjectionStreamRegistryHubPage;
