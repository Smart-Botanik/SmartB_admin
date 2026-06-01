import React from "react";
import { Col, Form, InputNumber, Row, Select, Typography } from "antd";
import type { NumericFormatMode } from "../fieldSpecFormUtils";

const { Text } = Typography;

const MODE_OPTIONS: { value: NumericFormatMode; label: string }[] = [
  { value: "decimal", label: "decimal" },
  { value: "integer", label: "integer" },
];

export const FieldSpecNumericSection: React.FC = () => (
  <div style={{ marginBottom: 16 }}>
    <Text strong>Numeric behavior</Text>
    <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
      Structured format/constraints вместо ручного JSON для number-полей.
    </Text>
    <Row gutter={12}>
      <Col span={8}>
        <Form.Item name="formatMode" label="Mode">
          <Select allowClear placeholder="auto" options={MODE_OPTIONS} />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item name="formatPrecision" label="Precision">
          <InputNumber min={0} max={6} style={{ width: "100%" }} placeholder="e.g. 1" />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item name="formatStep" label="Step">
          <InputNumber min={0} style={{ width: "100%" }} placeholder="e.g. 0.1" />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={12}>
      <Col span={12}>
        <Form.Item name="constraintMin" label="Min">
          <InputNumber style={{ width: "100%" }} placeholder="optional" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="constraintMax" label="Max">
          <InputNumber style={{ width: "100%" }} placeholder="optional" />
        </Form.Item>
      </Col>
    </Row>
  </div>
);
