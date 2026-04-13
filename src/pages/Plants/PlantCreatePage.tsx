import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Space, Typography, message } from "antd";

import { plantsService } from "@/services/plants";

const { Title } = Typography;

interface FormValues {
  name: string;
}

const PlantCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: FormValues) => {
    const name = values.name.trim();
    if (!name) {
      message.error("Введите название");
      return;
    }
    setSubmitting(true);
    try {
      await plantsService.create({ name });
      message.success("Растение создано");
      navigate("/plants");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось создать растение";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Новое растение
      </Title>
      <Card>
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ name: "" }}
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input placeholder="Например, Томат черри" maxLength={200} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Сохранить
            </Button>
            <Button onClick={() => navigate("/plants")}>Отмена</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};

export default PlantCreatePage;
