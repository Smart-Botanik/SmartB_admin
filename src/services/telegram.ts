import { graphqlClient } from "@/services/graphql";
import type { TelegramChannel } from "@/types/telegram";

const TELEGRAM_CHANNEL_FIELDS = `
  id
  name
  chatId
  botId
  isDefault
  isActive
  publicUrl
  bot {
    id
    name
    username
    isActive
  }
`;

class TelegramService {
  async listActiveChannels(): Promise<TelegramChannel[]> {
    const data = await graphqlClient.request<
      { telegramChannels: TelegramChannel[] },
      { isActive: boolean }
    >({
      query: `
        query TelegramChannels($isActive: Boolean) {
          telegramChannels(isActive: $isActive) {
            ${TELEGRAM_CHANNEL_FIELDS}
          }
        }
      `,
      variables: { isActive: true },
      operationName: "TelegramChannels",
    });
    return data.telegramChannels;
  }

  async getDefaultChannel(): Promise<TelegramChannel | null> {
    const data = await graphqlClient.request<{
      telegramDefaultChannel: TelegramChannel | null;
    }>({
      query: `
        query TelegramDefaultChannel {
          telegramDefaultChannel {
            ${TELEGRAM_CHANNEL_FIELDS}
          }
        }
      `,
      operationName: "TelegramDefaultChannel",
    });
    return data.telegramDefaultChannel;
  }
}

export const telegramService = new TelegramService();
