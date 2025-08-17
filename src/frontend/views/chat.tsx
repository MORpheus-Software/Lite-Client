// libs
import React, { FormEvent, useEffect, useState, useRef } from 'react';
import Styled from 'styled-components';
import { useSDK } from '@metamask/sdk-react';
import { ThreeDots } from 'react-loader-spinner';
import { useParams, useNavigate } from 'react-router-dom';

// types and helpers
import { Chat, ChatMessage } from '../renderer';
import { useChatContext } from '../contexts/chat-context';

import {
  isActionInitiated,
  handleBalanceRequest,
  handleTransactionRequest,
} from '../utils/transaction';
import { parseResponse } from '../utils/utils';
import { ActionParams } from '../utils/types';

const ChatView = (): React.JSX.Element => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const {
    currentChat,
    switchToChat,
    sendMessage,
    isLoading: chatLoading,
    error: chatError,
  } = useChatContext();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const { provider, account, connected } = useSDK();

  const chatMainRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Handle chat loading based on route parameter
  useEffect(() => {
    const handleChatRoute = async () => {
      if (chatId) {
        // Load specific chat
        try {
          await switchToChat(chatId);
        } catch (error) {
          console.error('Failed to load chat:', error);
          setError('Failed to load chat');
          navigate('/chat');
        }
      }
    };

    handleChatRoute();
  }, [chatId, switchToChat, navigate]);

  // Auto-focus input when chat changes
  useEffect(() => {
    if (chatInputRef.current && currentChat) {
      chatInputRef.current.focus();
    }
  }, [currentChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatMainRef.current && currentChat?.messages) {
      // Use setTimeout to ensure DOM is fully updated before scrolling
      setTimeout(() => {
        if (chatMainRef.current) {
          chatMainRef.current.scrollTop = chatMainRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [currentChat?.messages]);

  // Also scroll when loading state changes (when response arrives)
  useEffect(() => {
    if (!isLoading && chatMainRef.current) {
      setTimeout(() => {
        if (chatMainRef.current) {
          chatMainRef.current.scrollTop = chatMainRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [isLoading]);

  // Clear local error when chat error changes
  useEffect(() => {
    if (chatError) {
      setError(chatError);
    }
  }, [chatError]);

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!currentChat) {
      setError('No active chat. Please create a new chat.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await sendMessage(message);
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleQuestionAsked = async (question: string) => {
    if (!question.trim()) return;
    await handleSendMessage(question.trim());
  };

  const handleQuestionChange = (e: FormEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuestionAsked(inputValue);
    }
  };

  const handleNetworkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedChain = e.target.value;

    const selectedValue = e.target.value;
    setSelectedNetwork(selectedValue);

    // Check if the default option is selected
    if (!selectedChain) {
      console.log('No network selected.');
      return; // Early return to avoid further execution
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Chat.Layout>
      {connected && (
        <Chat.Dropdown onChange={handleNetworkChange} value={selectedNetwork}>
          <option value="">Select a network</option>
          <option value="0x1">Ethereum</option>
          <option value="0xaa36a7">Sepolia</option>
          <option value="0xa4b1">Arbitrum</option>
          <option value="0x64">Gnosis</option>
        </Chat.Dropdown>
      )}
      <Chat.Main ref={chatMainRef}>
        {!currentChat && (
          <Chat.WelcomeMessage>
            <Chat.WelcomeTitle>Welcome to Morpheus</Chat.WelcomeTitle>
            <Chat.WelcomeText>Create a new chat to get started</Chat.WelcomeText>
            <Chat.WelcomeHint>
              Use the "New Chat" button in the sidebar to create your first conversation
            </Chat.WelcomeHint>
          </Chat.WelcomeMessage>
        )}

        {currentChat && currentChat.messages.length === 0 && (
          <Chat.WelcomeMessage>
            <Chat.WelcomeTitle>
              {currentChat.mode === 'local' ? '🏠' : '🌐'} {currentChat.title}
            </Chat.WelcomeTitle>
            <Chat.WelcomeText>
              {currentChat.mode === 'local' ? 'Private & Local' : 'Cloud Processing'} •{' '}
              {currentChat.model}
            </Chat.WelcomeText>
            <Chat.WelcomeHint>How can I help you today?</Chat.WelcomeHint>
          </Chat.WelcomeMessage>
        )}

        {currentChat &&
          currentChat.messages.map((message, index) => (
            <Chat.MessageWrapper key={message.id}>
              {message.role === 'user' && (
                <Chat.UserMessage>
                  <Chat.MessageContent $isUser={true}>{message.content}</Chat.MessageContent>
                  <Chat.MessageTimestamp>
                    {formatTimestamp(message.timestamp)}
                  </Chat.MessageTimestamp>
                </Chat.UserMessage>
              )}
              {message.role === 'assistant' && (
                <Chat.AIMessage>
                  <Chat.AIHeader>
                    <Chat.SourceIndicator $source={currentChat.mode}>
                      <Chat.SourceIcon>
                        {currentChat.mode === 'remote' ? '☁️' : '🏠'}
                      </Chat.SourceIcon>
                      <Chat.SourceText>
                        {currentChat.mode === 'remote' ? 'Remote' : 'Local'} • {currentChat.model}
                      </Chat.SourceText>
                    </Chat.SourceIndicator>
                    <Chat.MessageTimestamp>
                      {formatTimestamp(message.timestamp)}
                    </Chat.MessageTimestamp>
                  </Chat.AIHeader>
                  <Chat.MessageContent $isUser={false}>{message.content}</Chat.MessageContent>
                </Chat.AIMessage>
              )}
            </Chat.MessageWrapper>
          ))}

        {isLoading && (
          <Chat.MessageWrapper>
            <Chat.AIMessage>
              <Chat.LoadingIndicator>
                <ThreeDots
                  height="20"
                  width="40"
                  radius="9"
                  color="#59a973"
                  ariaLabel="three-dots-loading"
                  wrapperStyle={{}}
                  visible={true}
                />
              </Chat.LoadingIndicator>
            </Chat.AIMessage>
          </Chat.MessageWrapper>
        )}

        {error && (
          <Chat.ErrorMessage>
            <Chat.ErrorText>{error}</Chat.ErrorText>
          </Chat.ErrorMessage>
        )}
      </Chat.Main>

      <Chat.InputWrapper>
        <Chat.InputContainer>
          <Chat.Input
            ref={chatInputRef}
            value={inputValue}
            onChange={handleQuestionChange}
            onKeyPress={handleKeyPress}
            placeholder={
              currentChat
                ? `Message Morpheus (${currentChat.mode} - ${currentChat.model})...`
                : 'Create a new chat to start messaging...'
            }
            disabled={!currentChat || isLoading}
          />
          <Chat.SendButton
            onClick={() => handleQuestionAsked(inputValue)}
            disabled={!currentChat || !inputValue.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Chat.SendButton>
        </Chat.InputContainer>
      </Chat.InputWrapper>
    </Chat.Layout>
  );
};

const Chat = {
  Layout: Styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${(props) => props.theme.colors.core};
  `,
  Dropdown: Styled.select`
    margin: 10px 20px;
    padding: 8px 12px;
    border: 1px solid ${(props) => props.theme.colors.hunter};
    border-radius: 5px;
    background: transparent;
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: ${(props) => props.theme.fonts.size.small};
    word-wrap: break-word;
    margin-bottom: 5px;
  `,
  Answer: Styled.span`
    display: flex;
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: ${(props) => props.theme.fonts.size.small};
    margin-left: 20px;
  `,
  PollingIndicator: Styled(ThreeDots)`
    display: flex;
  `,
  Bottom: Styled.div`
    display: flex;
    width: 100%;
    height: 20%;
    background: ${(props) => props.theme.colors.core};
    justify-content: center;
  `,
  InputWrapper: Styled.div`
    display: flex;
    width: 90%;
    height: 40px;
    position: relative;
    align-items: center;
  `,
  Input: Styled.input`
    display: flex;
    width: 100%;
    height: 40px;
    border-radius: 30px;
    padding: 0 40px 0 25px;
    background: ${(props) => props.theme.colors.core};
    border: 2px solid ${(props) => props.theme.colors.hunter};
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: ${(props) => props.theme.fonts.size.small};
    &:focus {
      border: 2px solid ${(props) => props.theme.colors.emerald};
    }
  `,
  Arrow: Styled.span`
    display: flex;
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: ${(props) => props.theme.fonts.size.small};
    position: absolute;
    left: 10px;
  `,
  SubmitButton: Styled.button`
    display: flex;
    width: 30px;
    height: 30px;
    border-radius: 25px;
    background: ${(props) => props.theme.colors.hunter};
    position: absolute;
    right: 5px;
    cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
    border: none;

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.colors.emerald};
    }
  `,
  Main: Styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
  MessageWrapper: Styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  UserMessage: Styled.div`
    align-self: flex-end;
    max-width: 80%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  `,
  AIMessage: Styled.div`
    align-self: flex-start;
    max-width: 80%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  AIHeader: Styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  `,
  SourceIndicator: Styled.div<{ $source: 'local' | 'remote' }>`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 12px;
    background: ${({ $source }) =>
      $source === 'remote' ? 'rgba(74, 144, 226, 0.15)' : 'rgba(23, 156, 101, 0.15)'};
    border: 1px solid ${({ $source }) =>
      $source === 'remote' ? 'rgba(74, 144, 226, 0.3)' : 'rgba(23, 156, 101, 0.3)'};
  `,
  SourceIcon: Styled.span`
    font-size: 0.8rem;
  `,
  SourceText: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.8rem;
    font-weight: 500;
  `,
  MessageTimestamp: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.7rem;
    opacity: 0.5;
  `,
  MessageContent: Styled.div<{ $isUser: boolean }>`
    padding: 12px 16px;
    border-radius: 18px;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    
    ${({ $isUser, theme }) =>
      $isUser
        ? `
          background: ${theme.colors.emerald};
          color: white;
        `
        : `
          background: ${theme.colors.hunter};
          color: ${theme.colors.notice};
          border: 1px solid ${theme.colors.hunter};
        `}
  `,
  WelcomeMessage: Styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 8px;
    margin: auto;
    padding: 40px;
  `,
  WelcomeTitle: Styled.h2`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.5rem;
    margin: 0;
  `,
  WelcomeText: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 1rem;
    margin: 0;
    opacity: 0.8;
  `,
  WelcomeHint: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.9rem;
    margin: 0;
    opacity: 0.6;
  `,
  LoadingIndicator: Styled.div`
    padding: 12px 16px;
    background: ${(props) => props.theme.colors.hunter};
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  ErrorMessage: Styled.div`
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  ErrorText: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
  `,
  InputWrapper: Styled.div`
    padding: 20px;
    border-top: 1px solid ${(props) => props.theme.colors.hunter};
    background: ${(props) => props.theme.colors.core};
  `,
  InputContainer: Styled.div`
    display: flex;
    gap: 12px;
    align-items: flex-end;
  `,
  Input: Styled.input`
    flex: 1;
    padding: 12px;
    border: 1px solid ${(props) => props.theme.colors.hunter};
    border-radius: 5px;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: ${(props) => props.theme.fonts.size.small};
    background: transparent;
    color: ${(props) => props.theme.colors.notice};

    &:focus {
      outline: none;
      border: 2px solid ${(props) => props.theme.colors.emerald};
    }

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.colors.emerald};
    }

    &::placeholder {
      color: ${(props) => props.theme.colors.notice};
      opacity: 0.6;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  SendButton: Styled.button`
    padding: 10px 15px;
    background: ${(props) => props.theme.colors.emerald};
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 14px;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: ${(props) => props.theme.colors.emerald}DD;
    }

    &:disabled {
      background: ${(props) => props.theme.colors.hunter};
      color: ${(props) => props.theme.colors.notice};
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
};

export default ChatView;
