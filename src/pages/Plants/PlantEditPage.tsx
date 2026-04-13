import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Space,
  Spin,
  Typography,
  message,
} from "antd";

import { plantsService } from "@/services/plants";

const { Title, Text } = Typography;

interface FormValues {
  name: string;
}

const PlantEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentJson, setCurrentJson] = useState<string>("");

  useEffect(() => {
    if (!id) {
      message.error("Не указан id растения");
      navigate("/plants");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const plant = await plantsService.getById(id);
        if (cancelled) return;
        if (!plant) {
          message.error("Растение не найдено");
          navigate("/plants");
          return;
        }
        form.setFieldsValue({ name: plant.name });
        setCurrentJson(
          plant.current === null || plant.current === undefined
            ? ""
            : JSON.stringify(plant.current, null, 2),
        );
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Не удалось загрузить растение";
        message.error(msg);
        navigate("/plants");
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
    const name = values.name.trim();
    if (!name) {
      message.error("Введите название");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await plantsService.update(id, { name });
      message.success("Сохранено");
      setCurrentJson(
        updated.current === null || updated.current === undefined
          ? ""
          : JSON.stringify(updated.current, null, 2),
      );
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось сохранить растение";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await plantsService.delete(id);
      message.success("Растение удалено");
      navigate("/plants");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось удалить растение";
      message.error(msg);
    } finally {
      setDeleting(false);
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
          Редактирование растения
        </Title>
        <Space wrap>
          <Link to={`/events/create-plant?plantId=${encodeURIComponent(id)}`}>
            Записать событие растения
          </Link>
          <Button onClick={() => navigate("/plants")}>К списку</Button>
        </Space>
      </Space>

      <Card title="Профиль">
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input placeholder="Название" maxLength={200} />
          </Form.Item>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Сохранить
            </Button>
            <Popconfirm
              title="Удалить растение?"
              description="Действие необратимо."
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{ danger: true, loading: deleting }}
              onConfirm={onDelete}
            >
              <Button danger loading={deleting}>
                Удалить
              </Button>
            </Popconfirm>
          </Space>
        </Form>
      </Card>

      <Card title="Текущее состояние (только чтение)">
        <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Обновляется через события растения и правила реестра, не
          редактируется здесь.
        </Text>
        {currentJson ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 360,
              overflow: "auto",
              fontSize: 12,
            }}
          >
            {currentJson}
          </pre>
        ) : (
          <Text type="secondary">Пока пусто</Text>
        )}
      </Card>
    </Space>
  );
};

export default PlantEditPage;
