import React, { useState, useEffect } from 'react';
import Styled from 'styled-components';
import { Plus, Globe, MonitorSpeaker, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { Chat } from '../renderer';
import ChatCreationModal from './modals/chat-creation-modal';

interface ChatListProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onChatCreate: (mode: 'local' | 'remote', model: string, title?: string) => void;
  onChatDelete?: (chatId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  currentChatId,
  onChatSelect,
  onChatCreate,
  onChatDelete,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const chatList = await window.backendBridge.chat.getAll();
      setChats(chatList);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatCreate = async (mode: 'local' | 'remote', model: string, title?: string) => {
    try {
      await onChatCreate(mode, model, title);
      await loadChats(); // Refresh the list
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleChatDelete = async (chatId: string) => {
    try {
      if (onChatDelete) {
        await onChatDelete(chatId);
        await loadChats(); // Refresh the list
        setExpandedMenuId(null);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  const truncateTitle = (title: string, maxLength: number = 40) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <>
      <ChatListContainer>
        <ChatListHeader>
          <HeaderTitle>Chats</HeaderTitle>
          <NewChatButton onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            New Chat
          </NewChatButton>
        </ChatListHeader>

        <ChatListContent>
          {isLoading && <LoadingState>Loading chats...</LoadingState>}

          {!isLoading && chats.length === 0 && (
            <EmptyState>
              <EmptyStateText>No chats yet</EmptyStateText>
              <EmptyStateSubtext>Create your first chat to get started</EmptyStateSubtext>
            </EmptyState>
          )}

          {!isLoading && chats.length > 0 && (
            <ChatItems>
              {chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  $active={currentChatId === chat.id}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <ChatItemHeader>
                    <ChatItemMode $mode={chat.mode}>
                      {chat.mode === 'local' ? <MonitorSpeaker size={14} /> : <Globe size={14} />}
                    </ChatItemMode>
                    <ChatItemTitle>{truncateTitle(chat.title)}</ChatItemTitle>
                    <ChatItemMenu>
                      <MenuButton
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setExpandedMenuId(expandedMenuId === chat.id ? null : chat.id);
                        }}
                      >
                        <MoreHorizontal size={14} />
                      </MenuButton>
                      {expandedMenuId === chat.id && (
                        <MenuDropdown>
                          <MenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleChatDelete(chat.id);
                            }}
                          >
                            <Trash2 size={12} />
                            Delete
                          </MenuItem>
                        </MenuDropdown>
                      )}
                    </ChatItemMenu>
                  </ChatItemHeader>

                  <ChatItemDetails>
                    <ChatItemModel>{chat.model}</ChatItemModel>
                    <ChatItemTime>{formatTimeAgo(chat.updatedAt)}</ChatItemTime>
                  </ChatItemDetails>

                  <ChatItemStats>
                    <MessageCount>{chat.messages.length} messages</MessageCount>
                  </ChatItemStats>
                </ChatItem>
              ))}
            </ChatItems>
          )}
        </ChatListContent>
      </ChatListContainer>

      <ChatCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleChatCreate}
      />
    </>
  );
};

const ChatListContainer = Styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 400px; // Limit height so it doesn't dominate sidebar
`;

const ChatListHeader = Styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const HeaderTitle = Styled.h3`
  color: ${(props) => props.theme.colors.emerald};
  font-family: ${(props) => props.theme.fonts.family.primary.bold};
  font-size: 1rem;
  margin: 0;
`;

const NewChatButton = Styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${(props) => props.theme.colors.emerald};
  color: ${(props) => props.theme.colors.core};
  border: none;
  border-radius: 6px;
  font-family: ${(props) => props.theme.fonts.family.primary.regular};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => props.theme.colors.emerald}dd;
  }
`;

const ChatListContent = Styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const ChatItems = Styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ChatItem = Styled.div<{ $active: boolean }>`
  padding: 12px;
  border-radius: 8px;
  background: ${(props) => (props.$active ? `${props.theme.colors.emerald}20` : 'transparent')};
  border: 1px solid ${(props) => (props.$active ? props.theme.colors.emerald : 'transparent')};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${(props) => (props.$active ? `${props.theme.colors.emerald}20` : `${props.theme.colors.hunter}40`)};
  }
`;

const ChatItemHeader = Styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const ChatItemMode = Styled.div<{ $mode: 'local' | 'remote' }>`
  color: ${(props) => (props.$mode === 'local' ? '#10b981' : '#3b82f6')};
  display: flex;
  align-items: center;
`;

const ChatItemTitle = Styled.div`
  flex: 1;
  color: ${(props) => props.theme.colors.notice};
  font-family: ${(props) => props.theme.fonts.family.primary.regular};
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.2;
`;

const ChatItemMenu = Styled.div`
  position: relative;
`;

const MenuButton = Styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.notice};
  opacity: 0.6;
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
    background: ${(props) => props.theme.colors.hunter};
  }
`;

const MenuDropdown = Styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${(props) => props.theme.colors.core};
  border: 1px solid ${(props) => props.theme.colors.hunter};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 120px;
`;

const MenuItem = Styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: ${(props) => props.theme.colors.notice};
  font-family: ${(props) => props.theme.fonts.family.primary.regular};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => props.theme.colors.hunter};
  }

  &:first-child {
    border-radius: 6px 6px 0 0;
  }

  &:last-child {
    border-radius: 0 0 6px 6px;
  }
`;

const ChatItemDetails = Styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const ChatItemModel = Styled.div`
  color: ${(props) => props.theme.colors.notice};
  font-family: ${(props) => props.theme.fonts.family.secondary.regular};
  font-size: 0.75rem;
  opacity: 0.7;
`;

const ChatItemTime = Styled.div`
  color: ${(props) => props.theme.colors.notice};
  font-family: ${(props) => props.theme.fonts.family.secondary.regular};
  font-size: 0.75rem;
  opacity: 0.6;
`;

const ChatItemStats = Styled.div`
  display: flex;
  align-items: center;
`;

const MessageCount = Styled.div`
  color: ${(props) => props.theme.colors.notice};
  font-family: ${(props) => props.theme.fonts.family.secondary.regular};
  font-size: 0.7rem;
  opacity: 0.5;
`;

const LoadingState = Styled.div`
  padding: 20px;
  text-align: center;
  color: ${(props) => props.theme.colors.notice};
  font-family: ${(props) => props.theme.fonts.family.primary.regular};
  opacity: 0.7;
  font-size: 0.85rem;
`;

const EmptyState = Styled.div`
  padding: 20px;
  text-align: center;
`;

const EmptyStateText = Styled.div`
  color: ${(props) => props.theme.colors.notice};
  font-family: ${(props) => props.theme.fonts.family.primary.regular};
  font-size: 0.9rem;
  margin-bottom: 4px;
`;

const EmptyStateSubtext = Styled.div`
  color: ${(props) => props.theme.colors.notice};
  font-family: ${(props) => props.theme.fonts.family.secondary.regular};
  font-size: 0.8rem;
  opacity: 0.6;
`;

export default ChatList;
