export type TelegramChannel = {
  id: string;
  name: string;
  chatId: string;
  botId: string;
  isDefault: boolean;
  isActive: boolean;
  publicUrl?: string | null;
  bot?: {
    id: string;
    name: string;
    username?: string | null;
    isActive: boolean;
  } | null;
};
