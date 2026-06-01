import React, { useMemo, useState } from "react";
import { Col, Input, Row, Space, Tabs, Typography } from "antd";

import { MarkdownPreview } from "@/components/Content/MarkdownPreview";
import { GuideMediaPanel } from "@/components/Content/GuideMediaPanel";
import type { MediaUploadResponse } from "@/services/media";

const { Text } = Typography;
const TELEGRAM_LIMIT = 4096;

type GuideContentEditorProps = {
  guideId?: string;
  bodySiteMd: string;
  bodyTelegramMd: string;
  onBodySiteMdChange: (value: string) => void;
  onBodyTelegramMdChange: (value: string) => void;
  mediaFiles?: MediaUploadResponse[];
  onMediaUploaded?: (file: MediaUploadResponse) => void;
};

export const GuideContentEditor: React.FC<GuideContentEditorProps> = ({
  guideId,
  bodySiteMd,
  bodyTelegramMd,
  onBodySiteMdChange,
  onBodyTelegramMdChange,
  mediaFiles = [],
  onMediaUploaded,
}) => {
  const [activeTab, setActiveTab] = useState<"site" | "telegram">("site");

  const mediaUrlById = useMemo(
    () =>
      Object.fromEntries(
        mediaFiles.filter(f => f.url).map(f => [f.id, f.url as string]),
      ),
    [mediaFiles],
  );

  const insertSnippet = (snippet: string, field: "site" | "telegram") => {
    if (field === "site") {
      onBodySiteMdChange(`${bodySiteMd.trim()}\n\n${snippet}\n`.trimStart());
    } else {
      onBodyTelegramMdChange(`${bodyTelegramMd.trim()}\n\n${snippet}\n`.trimStart());
    }
  };

  const siteTab = (
    <Row gutter={16}>
      <Col xs={24} lg={12}>
        <Input.TextArea
          rows={18}
          value={bodySiteMd}
          onChange={e => onBodySiteMdChange(e.target.value)}
          placeholder={"# Заголовок\n\nТекст статьи.\n\n![alt](media://mediaId)"}
        />
      </Col>
      <Col xs={24} lg={12}>
        <MarkdownPreview markdown={bodySiteMd} mediaUrlById={mediaUrlById} />
      </Col>
    </Row>
  );

  const telegramTab = (
    <Row gutter={16}>
      <Col xs={24} lg={12}>
        <Input.TextArea
          rows={14}
          value={bodyTelegramMd}
          onChange={e => onBodyTelegramMdChange(e.target.value)}
          placeholder="Короткий анонс для Telegram-канала..."
        />
        <Text
          type={bodyTelegramMd.length > TELEGRAM_LIMIT ? "danger" : "secondary"}
          style={{ display: "block", marginTop: 8 }}
        >
          {bodyTelegramMd.length} / {TELEGRAM_LIMIT} символов
        </Text>
      </Col>
      <Col xs={24} lg={12}>
        <div className="guide-tg-preview">
          <MarkdownPreview markdown={bodyTelegramMd} mediaUrlById={mediaUrlById} />
        </div>
      </Col>
    </Row>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <GuideMediaPanel
        guideId={guideId}
        activeField={activeTab}
        uploadedFiles={mediaFiles}
        onMediaUploaded={onMediaUploaded}
        onInsert={insertSnippet}
      />
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as "site" | "telegram")}
        items={[
          { key: "site", label: "Сайт (Markdown)", children: siteTab },
          { key: "telegram", label: "Telegram (Markdown)", children: telegramTab },
        ]}
      />
    </Space>
  );
};
