import React from "react";
import { Result, Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Paragraph, Text } = Typography;

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={
        <div>
          <Paragraph>
            <Text type="secondary">
              You don't have the required permissions to view this content.
              Please contact your administrator if you believe this is an error.
            </Text>
          </Paragraph>
          <Button type="primary" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>
      }
    />
  );
};

export default UnauthorizedPage;
