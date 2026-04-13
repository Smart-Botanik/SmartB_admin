import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from "antd";

import { useAuthRole } from "@/contexts/AuthContext";
import { adminUsersService, type AdminAppRole } from "@/services/adminUsers";

const { Title } = Typography;

interface UserCreateFormValues {
  email: string;
  username: string;
  password: string;
  role: AdminAppRole;
}

const ROLE_OPTIONS: { value: AdminAppRole; label: string }[] = [
  { value: "USER", label: "USER" },
  { value: "ADMIN", label: "ADMIN" },
];

const UserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const canManage = useAuthRole("admin");
  const [form] = Form.useForm<UserCreateFormValues>();
  const [submitting, setSubmitting] = React.useState(false);

  const onFinish = async (values: UserCreateFormValues) => {
    setSubmitting(true);
    try {
      await adminUsersService.create({
        email: values.email.trim().toLowerCase(),
        username: values.username.trim(),
        password: values.password,
        role: values.role,
      });
      message.success("Пользователь создан");
      navigate("/users");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Не удалось создать пользователя";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <Space direction="vertical">
        <Typography.Text type="secondary">
          Создание пользователей доступно только администраторам.
        </Typography.Text>
        <Button onClick={() => navigate("/users")}>К списку</Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={3} style={{ margin: 0 }}>
        Новый пользователь
      </Title>
      <Card>
        <Form<UserCreateFormValues>
          form={form}
          layout="vertical"
          initialValues={{ role: "USER" }}
          onFinish={onFinish}
          style={{ maxWidth: 480 }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Укажите email" },
              { type: "email", message: "Некорректный email" },
            ]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Укажите username" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, min: 6, message: "Минимум 6 символов" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: "Выберите роль" }]}
          >
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Создать
              </Button>
              <Button onClick={() => navigate("/users")}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default UserCreatePage;
