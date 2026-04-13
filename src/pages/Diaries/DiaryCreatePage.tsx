import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
  message,
} from "antd";

import { diariesService } from "@/services/diaries";

const { Title } = Typography;

interface FormValues {
  title?: string;
  body: string;
}

const DiaryCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: FormValues) => {
    const body = values.body?.trim() ?? "";
    if (!body) {
      message.error("Введите текст записи");
      return;
    }
    setSubmitting(true);
    try {
      await diariesService.create({
        body,
        title: values.title?.trim() || null,
      });
      message.success("Дневник создан");
      navigate("/diaries");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось создать дневник";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Новый дневник
      </Title>
      <Card>
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ title: "", body: "" }}
        >
          <Form.Item name="title" label="Заголовок (необязательно)">
            <Input placeholder="Краткий заголовок" maxLength={300} />
          </Form.Item>
          <Form.Item
            name="body"
            label="Текст"
            rules={[{ required: true, message: "Введите текст" }]}
          >
            <Input.TextArea
              placeholder="Содержание записи"
              rows={8}
              maxLength={20000}
              showCount
            />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Сохранить
            </Button>
            <Button onClick={() => navigate("/diaries")}>Отмена</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};

export default DiaryCreatePage;
