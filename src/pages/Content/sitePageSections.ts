export type TelegramBlockSection = {
  type: "telegramBlock";
  title?: string;
  text?: string;
  channelUrl?: string;
  buttonLabel?: string;
};

export type TelegramBlockFormValues = {
  title: string;
  text: string;
  channelUrl: string;
  buttonLabel: string;
};

export const DEFAULT_TELEGRAM_BLOCK: TelegramBlockFormValues = {
  title: "Telegram-канал SmartБотanik",
  text: "Короткие советы, анонсы новых статей и ссылки на полные руководства на сайте.",
  channelUrl: "https://t.me/smart_botanik",
  buttonLabel: "Подписаться на канал",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseSectionsJson(json: string): unknown[] {
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("sectionsJson должен быть JSON-массивом");
  }
  return parsed;
}

export function extractTelegramBlock(sections: unknown[]): TelegramBlockFormValues {
  const block = sections.find(
    section => isRecord(section) && section.type === "telegramBlock",
  );

  if (!isRecord(block)) {
    return { ...DEFAULT_TELEGRAM_BLOCK };
  }

  return {
    title:
      typeof block.title === "string" ? block.title : DEFAULT_TELEGRAM_BLOCK.title,
    text: typeof block.text === "string" ? block.text : DEFAULT_TELEGRAM_BLOCK.text,
    channelUrl:
      typeof block.channelUrl === "string"
        ? block.channelUrl
        : DEFAULT_TELEGRAM_BLOCK.channelUrl,
    buttonLabel:
      typeof block.buttonLabel === "string"
        ? block.buttonLabel
        : DEFAULT_TELEGRAM_BLOCK.buttonLabel,
  };
}

export function upsertTelegramBlock(
  sections: unknown[],
  values: TelegramBlockFormValues,
): unknown[] {
  const nextBlock: TelegramBlockSection = {
    type: "telegramBlock",
    title: values.title.trim(),
    text: values.text.trim(),
    channelUrl: values.channelUrl.trim(),
    buttonLabel: values.buttonLabel.trim(),
  };

  const withoutTelegram = sections.filter(
    section => !(isRecord(section) && section.type === "telegramBlock"),
  );

  const heroIndex = withoutTelegram.findIndex(
    section => isRecord(section) && section.type === "hero",
  );
  const insertAt = heroIndex >= 0 ? heroIndex + 1 : 0;

  return [
    ...withoutTelegram.slice(0, insertAt),
    nextBlock,
    ...withoutTelegram.slice(insertAt),
  ];
}

export function mergeTelegramIntoSectionsJson(
  sectionsJson: string,
  telegram: TelegramBlockFormValues,
): string {
  const sections = parseSectionsJson(sectionsJson);
  const merged = upsertTelegramBlock(sections, telegram);
  return JSON.stringify(merged, null, 2);
}
