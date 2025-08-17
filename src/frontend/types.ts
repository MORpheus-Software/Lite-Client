export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
};

export type Chat = {
  id: string;
  title: string;
  mode: 'local' | 'remote';
  model: string; // Specific model name for this chat
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
};

// Legacy type for backwards compatibility during migration
export type AIMessage = {
  question: string;
  answer?: string;
  answered: boolean;
};
