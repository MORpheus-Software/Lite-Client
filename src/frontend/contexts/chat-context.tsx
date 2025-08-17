import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from 'react';
import { Chat, ChatMessage } from '../renderer';
import { AIMessage } from '../types';

interface ChatContextType {
  // Current chat state
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;

  // Migration state
  migrationCompleted: boolean;
  dismissMigrationNotification: () => void;

  // Chat management functions
  createChat: (mode: 'local' | 'remote', model: string, title?: string) => Promise<Chat>;
  switchToChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;

  // List management
  refreshChats: () => Promise<void>;

  // Migration function
  migrateExistingChat: (messages: any[], mode: 'local' | 'remote', model: string) => Promise<Chat>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  // Load initial chat on mount and handle migration
  useEffect(() => {
    loadInitialChatOrMigrate();
  }, []);

  const loadInitialChatOrMigrate = async () => {
    try {
      setIsLoading(true);

      // First, check if we have any chats in the new format
      const existingChats = await window.backendBridge.chat.getAll();

      if (existingChats.length > 0) {
        // We have new format chats, load the current one
        const currentChat = await window.backendBridge.chat.getCurrent();
        if (currentChat) {
          setCurrentChat(currentChat);
        }
      } else {
        // No new format chats, check for old format data to migrate
        await attemptMigration();
      }
    } catch (err) {
      console.error('Failed to load initial chat:', err);
      setError('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  const attemptMigration = async () => {
    try {
      // Check if there's old chat data in localStorage (from AIMessagesContext)
      const oldChatData = localStorage.getItem('aiMessages');
      if (oldChatData) {
        console.log('Found old chat data, attempting migration...');

        const oldMessages: AIMessage[] = JSON.parse(oldChatData);
        if (oldMessages.length > 0) {
          // Get current inference mode and model for migration
          let migrationMode: 'local' | 'remote' = 'local';
          let migrationModel = 'orca-mini:latest';

          try {
            migrationMode = await window.backendBridge.inference.getMode();
            if (migrationMode === 'local') {
              const lastUsedModel = await window.backendBridge.ollama.getLastUsedLocalModel();
              if (lastUsedModel) {
                migrationModel = lastUsedModel;
              }
            } else {
              // For remote mode, use default remote model
              migrationModel = 'llama-3.3-70b';
            }
          } catch (error) {
            console.warn(
              'Could not determine current settings for migration, using defaults:',
              error,
            );
          }

          // Migrate the chat
          const migratedChat = await migrateExistingChat(
            oldMessages,
            migrationMode,
            migrationModel,
          );
          setCurrentChat(migratedChat);

          // Clean up old data
          localStorage.removeItem('aiMessages');

          // Show migration notification
          setMigrationCompleted(true);

          console.log(`Successfully migrated ${oldMessages.length} messages to new chat format`);
        }
      }
    } catch (error) {
      console.warn('Migration failed, continuing without migration:', error);
    }
  };

  const createChat = useCallback(
    async (mode: 'local' | 'remote', model: string, title?: string): Promise<Chat> => {
      try {
        setIsLoading(true);
        setError(null);

        const newChat = await window.backendBridge.chat.create(mode, model, title);
        setCurrentChat(newChat);

        return newChat;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create chat';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const switchToChat = useCallback(async (chatId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await window.backendBridge.chat.switchTo(chatId);
      if (success) {
        const chat = await window.backendBridge.chat.get(chatId);
        setCurrentChat(chat);
      } else {
        throw new Error('Failed to switch to chat');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch chat';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteChat = useCallback(
    async (chatId: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await window.backendBridge.chat.delete(chatId);
        if (success) {
          // If we deleted the current chat, clear it
          if (currentChat?.id === chatId) {
            setCurrentChat(null);
          }
        } else {
          throw new Error('Failed to delete chat');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete chat';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentChat?.id],
  );

  const sendMessage = useCallback(
    async (message: string): Promise<void> => {
      if (!currentChat) {
        throw new Error('No active chat');
      }

      try {
        setError(null);

        // Immediately add user message to chat for instant feedback
        const userMessage: ChatMessage = {
          id: `temp-${Date.now()}`, // Temporary ID until backend assigns real one
          role: 'user',
          content: message,
          timestamp: new Date(),
        };

        setCurrentChat((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, userMessage],
              }
            : null,
        );

        setIsLoading(true);

        // Send message and get response
        await window.backendBridge.chat.sendMessage(currentChat.id, message);

        // Refresh current chat to get updated messages with proper IDs and AI response
        const updatedChat = await window.backendBridge.chat.get(currentChat.id);
        if (updatedChat) {
          setCurrentChat(updatedChat);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        // On error, refresh to get the actual current state
        try {
          const currentState = await window.backendBridge.chat.get(currentChat.id);
          if (currentState) {
            setCurrentChat(currentState);
          }
        } catch (refreshError) {
          console.error('Failed to refresh chat state after error:', refreshError);
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentChat?.id],
  );

  const updateChatTitle = useCallback(
    async (chatId: string, title: string): Promise<void> => {
      try {
        setError(null);

        const success = await window.backendBridge.chat.updateTitle(chatId, title);
        if (success) {
          // If this is the current chat, update it
          if (currentChat?.id === chatId) {
            setCurrentChat((prev) => (prev ? { ...prev, title } : null));
          }
        } else {
          throw new Error('Failed to update chat title');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update chat title';
        setError(errorMessage);
        throw err;
      }
    },
    [currentChat?.id],
  );

  const refreshChats = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // If there's a current chat, refresh its data
      if (currentChat) {
        const updatedChat = await window.backendBridge.chat.get(currentChat.id);
        setCurrentChat(updatedChat);
      }
    } catch (err) {
      console.error('Failed to refresh chats:', err);
      setError('Failed to refresh chats');
    }
  }, [currentChat?.id]);

  const migrateExistingChat = useCallback(
    async (messages: any[], mode: 'local' | 'remote', model: string): Promise<Chat> => {
      try {
        setIsLoading(true);
        setError(null);

        const migratedChat = await window.backendBridge.chat.migrate(messages, mode, model);
        setCurrentChat(migratedChat);

        return migratedChat;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to migrate chat';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const dismissMigrationNotification = useCallback(() => {
    setMigrationCompleted(false);
  }, []);

  const contextValue: ChatContextType = {
    currentChat,
    isLoading,
    error,
    migrationCompleted,
    dismissMigrationNotification,
    createChat,
    switchToChat,
    deleteChat,
    sendMessage,
    updateChatTitle,
    refreshChats,
    migrateExistingChat,
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
