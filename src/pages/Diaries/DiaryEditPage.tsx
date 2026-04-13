import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  Space,
  Spin,
  Typography,
  message,
} from "antd";

import { diariesService, type DiaryPlantSummary } from "@/services/diaries";

const { Title, Text } = Typography;

interface FormValues {
  title?: string;
  body: string;
}

const DiaryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linkedPlants, setLinkedPlants] = useState<DiaryPlantSummary[]>([]);

  useEffect(() => {
    if (!id) {
      message.error("Не указан id дневника");
      navigate("/diaries");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const diary = await diariesService.getById(id);
        if (cancelled) return;
        if (!diary) {
          message.error("Дневник не найден");
          navigate("/diaries");
          return;
        }
        form.setFieldsValue({
          title: diary.title ?? "",
          body: diary.body ?? "",
        });
        setLinkedPlants(diary.plants ?? []);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Не удалось загрузить дневник";
        message.error(msg);
        navigate("/diaries");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, form, navigate]);

  const onFinish = async (values: FormValues) => {
    if (!id) return;
    const body = values.body?.trim() ?? "";
    if (!body) {
      message.error("Введите текст записи");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await diariesService.update(id, {
        body,
        title: values.title?.trim() || null,
      });
      setLinkedPlants(updated.plants ?? []);
      message.success("Сохранено");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось сохранить дневник";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Spin />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
        wrap
      >
        <Title level={3} style={{ margin: 0 }}>
          Редактирование дневника
        </Title>
        <Button onClick={() => navigate("/diaries")}>К списку</Button>
      </Space>

      <Card title="Запись">
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
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
              rows={10}
              maxLength={20000}
              showCount
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Сохранить
          </Button>
        </Form>
      </Card>

      <Card title="Связанные растения">
        {linkedPlants.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {linkedPlants.map((p) => (
              <li key={p.id}>
                <Text>{p.name}</Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text type="secondary">
            Пока нет привязанных растений. Редактирование связи — в задаче
            FR-7.5.DIARIES-4 (основное приложение / бэкенд).
          </Text>
        )}
      </Card>
    </Space>
  );
};

export default DiaryEditPage;
