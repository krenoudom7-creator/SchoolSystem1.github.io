import { storage } from './storage.ts';

export interface TelegramSendResult {
  ok: boolean;
  description?: string;
  messageId?: number;
}

/**
 * Sends a real-time message via the school's configured Telegram Bot
 * (@machin_caffee_bot) and logs it to internal notification records.
 */
export async function sendTelegramAlert(
  message: string,
  targetChatId?: string
): Promise<TelegramSendResult> {
  try {
    const settings = storage.getTelegramSettings();
    const token = (settings.botToken || '8854828129:AAHp_oHUOkQ1u9vJiT8tFU8HtSygyaZHWyU').trim();
    const destChatId = (targetChatId || settings.chatId || '').trim();

    // Log internally regardless of remote network status
    storage.addNotification({
      type: 'telegram',
      recipientName: 'អាណាព្យាបាល / Telegram Channel',
      recipientPhone: destChatId || '012 000 000',
      studentName: 'សិស្សទួលសំបួរ',
      title: 'ដំណឹង Telegram ស្វ័យប្រវត្តិ',
      message: message,
      status: 'sent',
    });

    if (!token || !destChatId) {
      return {
        ok: true,
        description: 'បានរក្សាទុកក្នុងប្រព័ន្ធ (កំណត់ Telegram Chat ID ក្នុងម៉ឺនុយ Telegram ដើម្បីផ្ញើផ្ទាល់)',
      };
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: destChatId,
        text: message,
      }),
    });

    const data = await response.json();
    return {
      ok: Boolean(data.ok),
      description: data.description,
      messageId: data.result?.message_id,
    };
  } catch (error: any) {
    console.warn('Telegram send failed:', error);
    return {
      ok: false,
      description: error.message || 'កំហុសបណ្តាញតភ្ជាប់ Telegram API',
    };
  }
}
