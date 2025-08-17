import { logger } from './logger';
import {
  Chat,
  ChatMessage,
  saveChat,
  getChatById,
  getAllChats,
  deleteChat,
  setCurrentChatId,
  getCurrentChatId,
  generateChatId,
  generateMessageId,
} from '../storage';
import { getInferenceManager } from './inference-manager';
import { warmUpModel } from './ollama';

class ChatManager {
  private warmModels: Set<string> = new Set(); // Track which models are already warm

  constructor() {
    // InferenceManager is handled as a singleton
  }

  /**
   * Warm up a model only if it hasn't been warmed recently
   */
  private async warmUpModelIfNeeded(model: string): Promise<void> {
    if (this.warmModels.has(model)) {
      logger.debug(`Model ${model} already warm, skipping warmup`);
      return;
    }

    try {
      this.warmModels.add(model);
      await warmUpModel(model);

      // Remove from warm set after 5 minutes to allow re-warming if needed
      setTimeout(
        () => {
          this.warmModels.delete(model);
          logger.debug(`Model ${model} removed from warm cache`);
        },
        5 * 60 * 1000,
      );
    } catch (error) {
      // Remove from set if warmup failed
      this.warmModels.delete(model);
      throw error;
    }
  }

  /**
   * Create a new chat with the specified mode and model
   */
  createChat(mode: 'local' | 'remote', model: string, title?: string): Chat {
    const chatId = generateChatId();
    const now = new Date();

    const chat: Chat = {
      id: chatId,
      title: title || this.generateChatTitle(mode, model),
      mode,
      model,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    saveChat(chat);
    setCurrentChatId(chatId);

    // Pre-warm the model for faster first response (local chats only)
    if (mode === 'local') {
      // Don't await this - let it run in the background
      this.warmUpModelIfNeeded(model).catch((error) => {
        logger.warn(`Failed to warm up model ${model}:`, error);
      });
    }

    logger.info(`Created new ${mode} chat with model ${model}: ${chatId}`);
    return chat;
  }

  /**
   * Get all chats sorted by last updated
   */
  getChats(): Chat[] {
    return getAllChats();
  }

  /**
   * Get a specific chat by ID
   */
  getChat(chatId: string): Chat | null {
    return getChatById(chatId);
  }

  /**
   * Get the currently active chat
   */
  getCurrentChat(): Chat | null {
    const currentChatId = getCurrentChatId();
    return currentChatId ? getChatById(currentChatId) : null;
  }

  /**
   * Switch to a specific chat
   */
  switchToChat(chatId: string): boolean {
    const chat = getChatById(chatId);
    if (chat) {
      setCurrentChatId(chatId);
      logger.info(`Switched to chat: ${chatId} (${chat.mode} - ${chat.model})`);

      // Pre-warm the model for faster first response (local chats only)
      if (chat.mode === 'local') {
        // Don't await this - let it run in the background
        this.warmUpModelIfNeeded(chat.model).catch((error) => {
          logger.warn(`Failed to warm up model ${chat.model}:`, error);
        });
      }

      return true;
    }
    return false;
  }

  /**
   * Delete a chat
   */
  deleteChat(chatId: string): boolean {
    const chat = getChatById(chatId);
    if (chat) {
      deleteChat(chatId);
      logger.info(`Deleted chat: ${chatId}`);
      return true;
    }
    return false;
  }

  /**
   * Add a message to a chat
   */
  addMessageToChat(
    chatId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ): ChatMessage | null {
    const chat = getChatById(chatId);
    if (!chat) {
      logger.error(`Chat not found: ${chatId}`);
      return null;
    }

    const message: ChatMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: new Date(),
    };

    chat.messages.push(message);
    chat.updatedAt = new Date();
    saveChat(chat);

    logger.info(`Added ${role} message to chat ${chatId}`);
    return message;
  }

  /**
   * Send a message in a specific chat and get AI response
   */
  async sendMessage(chatId: string, userMessage: string): Promise<string> {
    const chat = getChatById(chatId);
    if (!chat) {
      throw new Error(`Chat not found: ${chatId}`);
    }

    // Get conversation history before adding the new user message
    const conversationHistory = chat.messages.filter((msg) => msg.role !== 'system');

    // Add user message
    this.addMessageToChat(chatId, 'user', userMessage);

    try {
      // Use the inference manager to get response based on chat's mode and model
      const inferenceManager = getInferenceManager();
      const response = await inferenceManager.askWithSource(
        userMessage,
        chat.mode,
        chat.model,
        conversationHistory,
      );

      // Add assistant response
      this.addMessageToChat(chatId, 'assistant', response.response);

      return response.response;
    } catch (error) {
      logger.error(`Failed to get response for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Update chat title
   */
  updateChatTitle(chatId: string, title: string): boolean {
    const chat = getChatById(chatId);
    if (chat) {
      chat.title = title;
      chat.updatedAt = new Date();
      saveChat(chat);
      return true;
    }
    return false;
  }

  /**
   * Generate a default chat title based on mode and model
   */
  private generateChatTitle(mode: 'local' | 'remote', model: string): string {
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return `${mode === 'local' ? '🏠' : '🌐'} ${model} - ${timestamp}`;
  }

  /**
   * Get chat statistics
   */
  getChatStats(chatId: string): { messageCount: number; lastActivity: Date } | null {
    const chat = getChatById(chatId);
    if (!chat) {
      return null;
    }

    return {
      messageCount: chat.messages.length,
      lastActivity: chat.updatedAt,
    };
  }

  /**
   * Migrate existing single chat to new format (for backwards compatibility)
   */
  migrateExistingChat(messages: any[], mode: 'local' | 'remote', model: string): Chat {
    logger.info('Migrating existing chat to new format');

    const chatId = generateChatId();
    const now = new Date();

    const migratedMessages: ChatMessage[] = messages
      .map((msg, index) => {
        const baseTimestamp = new Date(now.getTime() - (messages.length - index) * 60000); // 1 minute intervals

        const chatMessages: ChatMessage[] = [];

        if (msg.question) {
          chatMessages.push({
            id: generateMessageId(),
            role: 'user',
            content: msg.question,
            timestamp: new Date(baseTimestamp.getTime()),
          });
        }

        if (msg.answer) {
          chatMessages.push({
            id: generateMessageId(),
            role: 'assistant',
            content: msg.answer,
            timestamp: new Date(baseTimestamp.getTime() + 30000), // 30 seconds later
          });
        }

        return chatMessages;
      })
      .flat();

    const chat: Chat = {
      id: chatId,
      title: '📝 Migrated Chat',
      mode,
      model,
      messages: migratedMessages,
      createdAt: new Date(now.getTime() - messages.length * 60000),
      updatedAt: now,
    };

    saveChat(chat);
    setCurrentChatId(chatId);

    logger.info(`Migrated chat with ${migratedMessages.length} messages`);
    return chat;
  }
}

export default ChatManager;
