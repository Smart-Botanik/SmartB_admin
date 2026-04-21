import React from "react";
import { Alert, Button, Card, Col, Row, Space, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

const ProjectionStreamRegistryHubPage: React.FC = () => {
  const navigate = useNavigate();

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

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="Registry Profiles"
            extra={<Tag color="blue">core</Tag>}
            actions={[
              <Button type="link" onClick={() => navigate("/registry")}>
                Open Registry
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
              <Button type="link" onClick={() => navigate("/primitives")}>
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
    </div>
  );
};

export default ProjectionStreamRegistryHubPage;
