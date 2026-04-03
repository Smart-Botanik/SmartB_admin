import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Descriptions, Form, Input, message, Space, Typography } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import type { AppEvent, FieldEvent } from "@/types/event";
import { eventsService } from "@/services/events";

const { Title, Text } = Typography;

type FormValues = {
  title?: string;
  message?: string;
  fieldPath?: string;
  from?: string;
  to?: string;
};

const EventEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<AppEvent | null>(null);

  const [form] = Form.useForm<FormValues>();

  const load = async (eventId: string) => {
    setLoading(true);
    try {
      const item = await eventsService.getById(eventId);
      setEvent(item);

      form.setFieldsValue({
        title: item.title,
        message: item.message,
        fieldPath: item.scope === "field" ? item.fieldPath : undefined,
        from: item.scope === "field" ? String(item.from ?? "") : undefined,
        to: item.scope === "field" ? String(item.to ?? "") : undefined,
      });
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const meta = useMemo(() => {
    if (!event) return null;
    return (
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="ID">{event.id}</Descriptions.Item>
        <Descriptions.Item label="Scope">{event.scope}</Descriptions.Item>
        <Descriptions.Item label="Action">{event.action}</Descriptions.Item>
        <Descriptions.Item label="Target type">{event.targetType}</Descriptions.Item>
        <Descriptions.Item label="Target id">{event.targetId}</Descriptions.Item>
        <Descriptions.Item label="Created at">{new Date(event.createdAt).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Actor">
          {event.createdBy?.email ?? event.createdBy?.id ?? "-"}
        </Descriptions.Item>
      </Descriptions>
    );
  }, [event]);

  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    if (!event) return;

    setSaving(true);
    try {
      const patch: Partial<AppEvent> = {
        title: values.title,
        message: values.message,
      };

      if (event.scope === "field") {
        const fieldPatch: Partial<FieldEvent> = {
          fieldPath: values.fieldPath || (event as FieldEvent).fieldPath,
          from: values.from,
          to: values.to,
        };
        Object.assign(patch, fieldPatch);
      }

      const updated = await eventsService.update(id, patch);
      setEvent(updated);
      message.success("Event updated");
    } catch (e: any) {
      message.error(e?.message ?? "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          Edit Event
        </Title>
        <Button onClick={() => navigate("/events")}>Back to list</Button>
      </Space>

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card loading={loading} title="Metadata">
          {meta}
        </Card>

        <Card loading={loading} title="Editable fields">
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Form.Item name="title" label="Title">
              <Input placeholder="Optional title" />
            </Form.Item>

            <Form.Item name="message" label="Message">
              <Input.TextArea placeholder="Optional message" rows={3} />
            </Form.Item>

            {event?.scope === "field" ? (
              <>
                <Form.Item name="fieldPath" label="Field path">
                  <Input placeholder="e.g. potSize" />
                </Form.Item>

                <Space style={{ width: "100%" }} align="start" size={16}>
                  <Form.Item name="from" label="From" style={{ flex: 1 }}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="to" label="To" style={{ flex: 1 }}>
                    <Input />
                  </Form.Item>
                </Space>

                <Text type="secondary">
                  For field events, you can adjust `fieldPath`, `from` and `to`.
                </Text>
              </>
            ) : null}

            <Space style={{ marginTop: 16 }}>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save
              </Button>
              <Button
                onClick={() => {
                  if (id) load(id);
                }}
                disabled={saving}
              >
                Reset
              </Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </div>
  );
};

export default EventEditPage;
