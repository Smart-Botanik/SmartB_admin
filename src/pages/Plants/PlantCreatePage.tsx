import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { plantEventsService } from "@/services/plantEvents";
import { plantsService } from "@/services/plants";

const { Title } = Typography;
const CREATED_ACTION_PATH = "common.plant.created";

interface FormValues {
  name: string;
  title?: string;
  potSize?: number;
  potType?: string;
  periodDays?: number;
  startedAt?: Dayjs;
  notes?: string;
}

function buildPlantCreatedPayload(values: FormValues) {
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
  };

  if (values.title?.trim()) payload.title = values.title.trim();
  if (typeof values.potSize === "number") payload.potSize = values.potSize;
  if (values.potType) payload.potType = values.potType;
  if (typeof values.periodDays === "number") payload.periodDays = values.periodDays;
  if (values.startedAt) payload.startedAt = values.startedAt.toISOString();
  if (values.notes?.trim()) payload.notes = values.notes.trim();

  return payload;
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
      const createdPlant = await plantsService.create({ name });

      try {
        const payload = buildPlantCreatedPayload(values);
        await plantEventsService.createPlantEvent({
          plantId: createdPlant.id,
          actionPath: CREATED_ACTION_PATH,
          payloadJson: JSON.stringify(payload),
        });
        message.success("Растение создано, стартовые характеристики добавлены в историю");
      } catch (eventError: unknown) {
        const eventErrorMessage =
          eventError instanceof Error
            ? eventError.message
            : "Не удалось записать стартовое событие";
        message.warning(`Растение создано, но событие не записано: ${eventErrorMessage}`);
      }

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
          <Form.Item name="title" label="Заголовок">
            <Input placeholder="Например, Gorilla Glue #4" maxLength={200} />
          </Form.Item>
          <Form.Item name="potSize" label="Размер горшка (л)">
            <InputNumber
              min={0}
              step={0.5}
              precision={1}
              placeholder="10"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item name="potType" label="Тип горшка">
            <Select
              allowClear
              options={[
                { value: "grow_bag", label: "Grow Bag" },
                { value: "air_pot", label: "Air Pot" },
                { value: "plastic", label: "Plastic" },
                { value: "standard", label: "Standard" },
              ]}
              placeholder="Выберите тип"
            />
          </Form.Item>
          <Form.Item name="periodDays" label="Паспортный цикл (дней)">
            <InputNumber
              min={0}
              step={1}
              precision={0}
              placeholder="90"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item name="startedAt" label="Дата старта">
            <DatePicker
              style={{ width: "100%" }}
              format="DD.MM.YYYY"
              placeholder="Выберите дату"
              disabledDate={(currentDate) =>
                !!currentDate && currentDate.endOf("day").isAfter(dayjs())
              }
            />
          </Form.Item>
          <Form.Item name="notes" label="Комментарий">
            <Input.TextArea
              rows={3}
              placeholder="Краткая заметка для стартовой истории"
              maxLength={500}
            />
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
