import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { registryFieldSpecsService, type RegistryFieldSpec } from "@/services/registryFieldSpecs";
import { registryProfilesService, type RegistryProfile } from "@/services/registryProfiles";
import { RegistryPilotProfileCard } from "./RegistryPilotProfileCard";
import {
  REGISTRY_PILOT_PROFILES,
  readinessLabel,
  readinessTagColor,
  resolveRegistryReadinessGates,
} from "./registryHubConfig";
import type { RegistryPilotProfileCardConfig } from "./registryHubConfig";

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
          registryFieldSpecsService.list({ status: "active" }),
          registryProfilesService.list({ isActive: true }),
        ]);
        setFieldSpecs(nextSpecs);
        setProfiles(nextProfiles);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const profileByKey = useMemo(
    () => new Map(profiles.map(profile => [profile.key, profile])),
    [profiles],
  );

  const readiness = useMemo(
    () => resolveRegistryReadinessGates(fieldSpecs.length, profiles),
    [fieldSpecs.length, profiles],
  );

  const corePilotProfiles = useMemo(
    () => REGISTRY_PILOT_PROFILES.filter(item => item.tier === "core"),
    [],
  );

  const additionalPilotProfiles = useMemo(
    () => REGISTRY_PILOT_PROFILES.filter(item => item.tier === "pilot"),
    [],
  );

  const profileColumns: ColumnsType<RegistryProfile> = useMemo(
    () => [
      { title: "Key", dataIndex: "key", key: "key" },
      { title: "Entity", dataIndex: "entity", key: "entity", width: 100 },
      { title: "Kind", dataIndex: "kind", key: "kind", width: 160 },
      { title: "Fields", key: "fields", width: 90, render: (_, p) => p.fields.length },
      {
        title: "Status",
        key: "isActive",
        width: 100,
        render: (_, p) => (p.isActive ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>),
      },
    ],
    [],
  );

  const openProfileBuilder = (entity?: RegistryPilotProfileCardConfig["builderEntity"]) => {
    navigate("/projection-stream-registry/profiles", {
      state: entity ? { builderEntity: entity } : undefined,
    });
  };

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
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={4}>
              <Space wrap>
                <Text strong>Backend</Text>
                <Tag color={readinessTagColor(readiness.backend)}>
                  {readinessLabel(readiness.backend)}
                </Tag>
              </Space>
              <Text type="secondary">{readiness.backendHint}</Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={4}>
              <Space wrap>
                <Text strong>Admin</Text>
                <Tag color={readinessTagColor(readiness.admin)}>
                  {readinessLabel(readiness.admin)}
                </Tag>
              </Space>
              <Text type="secondary">{readiness.adminHint}</Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={4}>
              <Space wrap>
                <Text strong>Main frontend</Text>
                <Tag color={readinessTagColor(readiness.frontend)}>
                  {readinessLabel(readiness.frontend)}
                </Tag>
              </Space>
              <Text type="secondary">{readiness.frontendHint}</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Current vs Streams" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={6}>
              <Text strong>Current (snapshot_build)</Text>
              <Text>- `current.snapshot.v1` — поля с `includeInCurrent=true`.</Text>
              <Text>- Materialized `Plant.current` / `Diary.current`, не история.</Text>
              <Text>- Nutrients JSON может участвовать в current, но не в chart read profile.</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={6}>
              <Text strong>Streams (event_write + timeseries_read)</Text>
              <Text>- `watering.event.v1` — запись события полива (full payload).</Text>
              <Text>- `watering.chart.v1` — read slice pH/PPM для графиков по периоду.</Text>
              <Text>- Main frontend: FE-REG-R4 chart data flow.</Text>
            </Space>
          </Col>
        </Row>
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

      <Title level={4} style={{ marginTop: 0 }}>
        Core Plant Profiles
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Три профиля v1 для write / read-chart / snapshot-build. Должны быть в seed после{" "}
        <Text code>db:seed:registry:fieldspec</Text>.
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {corePilotProfiles.map(config => (
          <Col xs={24} lg={8} key={config.key}>
            <RegistryPilotProfileCard
              config={config}
              profile={profileByKey.get(config.key) ?? null}
              onOpenBuilder={openProfileBuilder}
            />
          </Col>
        ))}
      </Row>

      <Title level={4}>Additional Pilots</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {additionalPilotProfiles.map(config => (
          <Col xs={24} lg={12} key={config.key}>
            <RegistryPilotProfileCard
              config={config}
              profile={profileByKey.get(config.key) ?? null}
              onOpenBuilder={openProfileBuilder}
            />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="Registry Profiles"
            extra={<Tag color="blue">core</Tag>}
            actions={[
              <Button type="link" onClick={() => openProfileBuilder()}>
                Open Profile Builder
              </Button>,
            ]}
          >
            <Space direction="vertical" size={6}>
              <Text>- Define profile groups per capability (watering, feeding, climate).</Text>
              <Text>- Keep v1 canonical paths only; no custom path bindings yet.</Text>
              <Text>- Validate via runtime form + buildPreview.</Text>
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
              <Text>- Mark `includeInCurrent` for snapshot policy.</Text>
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
            <Button onClick={() => navigate("/field-patterns")}>Field Patterns</Button>
          </Space>
        </Space>
      </Card>

      <Card title="Glossary (v1)" style={{ marginTop: 16 }}>
        <Space direction="vertical" size={6}>
          <Text>
            - <strong>FieldSpec</strong>: field contract definition (replaces legacy "primitive"
            wording for new registry flow).
          </Text>
          <Text>
            - <strong>valueType</strong>: technical data type (number/string/boolean/date/enum/json).
          </Text>
          <Text>- <strong>semanticKind</strong>: domain meaning (ph/ppm/temperature/generic).</Text>
          <Text>- <strong>format</strong>: input behavior (decimal/integer, precision, step).</Text>
          <Text>- <strong>constraints</strong>: validation rules (required, min, max, enum values).</Text>
          <Text>- <strong>canonicalPath</strong>: path used for v1 payload assembly.</Text>
          <Text>
            - <strong>Profile kind</strong>: `event_write` | `timeseries_read` | `snapshot_build`.
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default ProjectionStreamRegistryHubPage;
