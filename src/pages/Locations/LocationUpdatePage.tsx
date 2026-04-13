import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from "antd";

import { locationsService } from "@/services/locations";
import type {
  LocationStatus,
  LocationSubType,
  LocationType,
  LocationWateringType,
} from "@/types/location";
import {
  LOCATION_STATUS_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  LOCATION_WATERING_OPTIONS,
  subTypeOptionsForType,
} from "@/types/location";
import { useAuthRole } from "@/contexts/AuthContext";

const { Title, Text } = Typography;

interface LocationUpdateFormValues {
  name: string;
  status: LocationStatus;
  type?: LocationType | null;
  subType?: LocationSubType | null;
  wateringType?: LocationWateringType | null;
  description?: string | null;
  capacity?: number | null;
  occupiedSlots?: number | null;
}

export const LocationUpdatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canManage = useAuthRole("admin");
  const [form] = Form.useForm<LocationUpdateFormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const watchedType = Form.useWatch("type", form);
  const subTypeOptions = useMemo(
    () => subTypeOptionsForType(watchedType ?? undefined),
    [watchedType],
  );

  useEffect(() => {
    if (!id || !canManage) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const loc = await locationsService.getById(id);
        if (cancelled) return;
        if (!loc) {
          message.error("Локация не найдена");
          navigate("/locations");
          return;
        }
        form.setFieldsValue({
          name: loc.name,
          status: loc.status,
          type: loc.type ?? undefined,
          subType: loc.subType ?? undefined,
          wateringType: loc.wateringType ?? undefined,
          description: loc.description ?? undefined,
          capacity: loc.capacity ?? undefined,
          occupiedSlots: loc.occupiedSlots ?? undefined,
        });
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e instanceof Error ? e.message : "Не удалось загрузить локацию";
          message.error(msg);
          navigate("/locations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, canManage, form, navigate]);

  const onFinish = async (values: LocationUpdateFormValues) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await locationsService.update(id, {
        name: values.name.trim(),
        status: values.status,
        type: values.type ?? null,
        subType: values.subType ?? null,
        wateringType: values.wateringType ?? null,
        description: values.description?.trim() || null,
        capacity: values.capacity ?? null,
        occupiedSlots: values.occupiedSlots ?? null,
      });
      message.success("Локация обновлена");
      navigate("/locations");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось обновить локацию";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <Space direction="vertical">
        <Text type="secondary">
          Обновление локаций доступно только администраторам.
        </Text>
        <Button onClick={() => navigate("/locations")}>К списку локаций</Button>
      </Space>
    );
  }

  if (!id) {
    return <Text type="danger">Не указан идентификатор локации.</Text>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Обновить локацию
      </Title>
      <Alert
        type="info"
        showIcon
        message="Слой администратора"
        description="Сохраняются только поля формы. Блоки specs и связи дневников из этой страницы не меняются. Полная семантика «обновления поверх» с provenance — после BK-LOC-2 / BK-LOC-3."
      />
      {loading ? (
        <Spin />
      ) : (
        <Card>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="name"
              label="Название"
              rules={[{ required: true, message: "Укажите название" }]}
            >
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item
              name="status"
              label="Статус"
              rules={[{ required: true, message: "Выберите статус" }]}
            >
              <Select options={LOCATION_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="type" label="Тип">
              <Select
                allowClear
                placeholder="Не задан"
                options={LOCATION_TYPE_OPTIONS}
                onChange={() => form.setFieldValue("subType", undefined)}
              />
            </Form.Item>
            <Form.Item name="subType" label="Подтип">
              <Select
                allowClear
                placeholder={
                  watchedType ? "Выберите подтип" : "Сначала выберите тип"
                }
                disabled={!watchedType}
                options={subTypeOptions}
              />
            </Form.Item>
            <Form.Item name="wateringType" label="Полив">
              <Select
                allowClear
                placeholder="Не задан"
                options={LOCATION_WATERING_OPTIONS}
              />
            </Form.Item>
            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={4} maxLength={4000} showCount />
            </Form.Item>
            <Form.Item name="capacity" label="Вместимость (слотов)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="occupiedSlots" label="Занято слотов">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Сохранить изменения
                </Button>
                <Button onClick={() => navigate("/locations")}>Отмена</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Space>
  );
};
