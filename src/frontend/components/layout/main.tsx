// libs
import React, { useEffect, useState } from 'react';
import Styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';

// layout components
import TopBar from './top-bar';
// import BottomBar from './bottom-bar';

// components
import ChatList from '../chat-list';
import MigrationNotification from '../migration-notification';
import { useChatContext } from '../../contexts/chat-context';

// types
import { InferenceMode } from '../../renderer.d';

// router
import { MainRouter } from '../../router';

export default () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const {
    currentChat,
    createChat,
    switchToChat,
    deleteChat,
    migrationCompleted,
    dismissMigrationNotification,
  } = useChatContext();

  useEffect(() => {
    loadCurrentModel();
  }, []); // Initial load

  // Update model when current chat changes (including when it becomes null)
  useEffect(() => {
    loadCurrentModel();
  }, [currentChat]);

  const loadCurrentModel = async () => {
    try {
      // Show the current chat's model if a chat is active
      if (currentChat) {
        const chatModel = currentChat.model;
        const chatMode = currentChat.mode;
        setCurrentModel(`${chatModel} (${chatMode})`);
        console.log('Displaying chat model:', chatModel, 'mode:', chatMode);
        return;
      }

      // No active chat - show fallback information
      try {
        const lastUsedModel = await window.backendBridge.ollama.getLastUsedLocalModel();
        if (lastUsedModel) {
          setCurrentModel(`${lastUsedModel} (ready)`);
        } else {
          setCurrentModel('No active chat');
        }
      } catch (error) {
        console.warn('Could not get last used model:', error);
        setCurrentModel('No active chat');
      }
    } catch (error) {
      console.error('Failed to load current model:', error);
      setCurrentModel('Model unavailable');
    }
  };

  const handleNewChat = () => {
    // The new chat creation will be handled by the ChatList component
    // Just navigate to chat route
    navigate('/chat');
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleChatCreate = async (mode: 'local' | 'remote', model: string, title?: string) => {
    const newChat = await createChat(mode, model, title);
    navigate(`/chat/${newChat.id}`);
  };

  const handleChatDelete = async (chatId: string) => {
    await deleteChat(chatId);
    // If we deleted the current chat, navigate to home
    if (currentChat?.id === chatId) {
      navigate('/');
    }
  };

  const handleModels = () => {
    navigate('/registry');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Remove inference mode toggle since it's now per-chat

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Main.Layout>
      <Main.Sidebar>
        <Main.SidebarContent>
          <Main.SidebarHeader>
            <Main.AppTitle>Morpheus</Main.AppTitle>
            <Main.AppSubtitle>Private AI</Main.AppSubtitle>
          </Main.SidebarHeader>

          <Main.SidebarActions>
            <Main.ActionButton onClick={handleModels} $active={isActive('/registry')}>
              <Main.ActionIcon>📦</Main.ActionIcon>
              <Main.ActionText>Models</Main.ActionText>
            </Main.ActionButton>

            <Main.ActionButton onClick={handleSettings} $active={isActive('/settings')}>
              <Main.ActionIcon>⚙️</Main.ActionIcon>
              <Main.ActionText>Settings</Main.ActionText>
            </Main.ActionButton>
          </Main.SidebarActions>

          {/* Chat List */}
          <Main.ChatListSection>
            <ChatList
              currentChatId={currentChat?.id}
              onChatSelect={handleChatSelect}
              onChatCreate={handleChatCreate}
              onChatDelete={handleChatDelete}
            />
          </Main.ChatListSection>

          <Main.SidebarFooter>
            <Main.StatusIndicator>
              <Main.StatusDot />
              <Main.StatusText>Ollama Connected</Main.StatusText>
            </Main.StatusIndicator>
            {currentModel && (
              <Main.ModelIndicator>
                <Main.ModelIcon>🎯</Main.ModelIcon>
                <Main.ModelText>{currentModel}</Main.ModelText>
              </Main.ModelIndicator>
            )}
          </Main.SidebarFooter>
        </Main.SidebarContent>
      </Main.Sidebar>

      <Main.ContentArea>
        <Main.TopWrapper>
          <TopBar />
        </Main.TopWrapper>
        <Main.MainWrapper>
          <MainRouter />
        </Main.MainWrapper>
      </Main.ContentArea>

      {/* Migration Notification */}
      <MigrationNotification show={migrationCompleted} onDismiss={dismissMigrationNotification} />
    </Main.Layout>
  );
};

const Main = {
  Layout: Styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    background: ${(props) => props.theme.colors.core};
  `,
  Sidebar: Styled.div`
    display: flex;
    width: 280px;
    background: ${(props) => props.theme.colors.hunter};
    border-right: 1px solid ${(props) => props.theme.colors.hunter};
    flex-shrink: 0;
    height: 100vh;
  `,
  SidebarContent: Styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 20px;
  `,
  SidebarHeader: Styled.div`
    margin-bottom: 30px;
    text-align: center;
  `,
  AppTitle: Styled.h1`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.8rem;
    margin: 0 0 5px 0;
  `,
  AppSubtitle: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.9rem;
    margin: 0;
    opacity: 0.8;
  `,
  SidebarActions: Styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
  `,
  ChatListSection: Styled.div`
    flex: 1;
    min-height: 0;
    margin-bottom: 20px;
  `,
  ActionButton: Styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: ${(props) => (props.$active ? props.theme.colors.emerald : 'transparent')};
    border: none;
    border-radius: 8px;
    color: ${(props) => (props.$active ? props.theme.colors.core : props.theme.colors.notice)};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;

    &:hover {
      background: ${(props) => props.theme.colors.emerald};
      color: ${(props) => props.theme.colors.core};
    }
  `,
  ActionIcon: Styled.span`
    font-size: 1.1rem;
  `,
  ActionText: Styled.span`
    font-weight: 500;
  `,
  SidebarFooter: Styled.div`
    padding-top: 20px;
    border-top: 1px solid ${(props) => props.theme.colors.hunter}40;
  `,

  StatusIndicator: Styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: ${(props) => props.theme.colors.emerald};
    border-radius: 6px;
  `,
  StatusDot: Styled.div`
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
  `,
  StatusText: Styled.span`
    color: white;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.8rem;
    font-weight: 500;
  `,
  ModelIndicator: Styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin-top: 8px;
    background: ${(props) => props.theme.colors.hunter};
    border: 1px solid ${(props) => props.theme.colors.emerald};
    border-radius: 6px;
  `,
  ModelIcon: Styled.span`
    font-size: 0.9rem;
  `,
  ModelText: Styled.span`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.8rem;
    font-weight: 500;
  `,
  ContentArea: Styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    background: ${(props) => props.theme.colors.core};
    height: 100vh;
  `,
  TopWrapper: Styled.div`
    display: flex;
    width: 100%;
    height: ${(props) => props.theme.layout.topBarHeight}px;
    flex-shrink: 0;
  `,
  MainWrapper: Styled.div`
    display: flex;
    flex: 1;
    background: ${(props) => props.theme.colors.core};
    overflow: hidden;
    height: calc(100vh - ${(props) => props.theme.layout.topBarHeight}px);
  `,
};
