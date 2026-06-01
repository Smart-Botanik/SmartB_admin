import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from "antd";

import { diariesService, type DiaryPlantSummary } from "@/services/diaries";
import { plantsService, type PlantListItem } from "@/services/plants";

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
  const [plantsCatalog, setPlantsCatalog] = useState<PlantListItem[]>([]);
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [linkSaving, setLinkSaving] = useState(false);
  const [current, setCurrent] = useState<unknown>(null);

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
        const [diary, plants] = await Promise.all([
          diariesService.getById(id),
          plantsService.list({ limit: 500, offset: 0 }),
        ]);
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
        const linked = diary.plants ?? [];
        setLinkedPlants(linked);
        setSelectedPlantIds(linked.map((p) => p.id));
        setPlantsCatalog(plants);
        setCurrent(diary.current ?? null);
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

  const savePlantLinks = useCallback(async () => {
    if (!id) return;
    const prev = new Set(linkedPlants.map((p) => p.id));
    const next = new Set(selectedPlantIds);
    setLinkSaving(true);
    try {
      for (const pid of prev) {
        if (!next.has(pid)) {
          await plantsService.update(pid, { diaryId: null });
        }
      }
      for (const pid of next) {
        if (!prev.has(pid)) {
          await plantsService.update(pid, { diaryId: id });
        }
      }
      const diary = await diariesService.getById(id);
      const linked = diary?.plants ?? [];
      setLinkedPlants(linked);
      setSelectedPlantIds(linked.map((p) => p.id));
      setPlantsCatalog(await plantsService.list({ limit: 500, offset: 0 }));
      message.success("Связи растений обновлены");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось сохранить связи растений";
      message.error(msg);
    } finally {
      setLinkSaving(false);
    }
  }, [id, linkedPlants, selectedPlantIds]);

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
      const linked = updated.plants ?? [];
      setLinkedPlants(linked);
      setSelectedPlantIds(linked.map((p) => p.id));
      setCurrent(updated.current ?? null);
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
        <Space>
          <Button onClick={() => navigate(`/events/create-diary?diaryId=${id}`)}>
            Записать событие
          </Button>
          <Button onClick={() => navigate("/diaries")}>К списку</Button>
        </Space>
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

      <Card title="Current (read-only)">
        {current ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="snapshot">
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(current, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Text type="secondary">
            Current появится после первого события дневника.
          </Text>
        )}
      </Card>

      <Card title="Связанные растения">
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text type="secondary">
            Выберите растения текущего пользователя. Уже привязанные к другому
            дневнику можно перенести сюда — при сохранении они отвяжутся от
            прошлого дневника.
          </Text>
          <Select
            mode="multiple"
            allowClear
            placeholder="Растения дневника"
            style={{ width: "100%" }}
            value={selectedPlantIds}
            onChange={(vals) => setSelectedPlantIds(vals)}
            options={plantsCatalog.map((p) => ({
              value: p.id,
              label:
                p.diaryId && p.diaryId !== id
                  ? `${p.name} (сейчас в другом дневнике)`
                  : p.name,
            }))}
            optionFilterProp="label"
          />
          <Button
            type="primary"
            loading={linkSaving}
            onClick={() => void savePlantLinks()}
          >
            Сохранить связи растений
          </Button>
        </Space>
      </Card>
    </Space>
  );
};

export default DiaryEditPage;
