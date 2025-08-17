import React, { useEffect, useState } from 'react';
import Styled from 'styled-components';
import { TailSpin } from 'react-loader-spinner';
import { useNavigate } from 'react-router-dom';

const HomeView = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [ollamaStatus, setOllamaStatus] = useState<string>('Checking Ollama status...');
  const [isOllamaConnected, setIsOllamaConnected] = useState<boolean>(false);
  const [availableModels, setAvailableModels] = useState<{ name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentConversations] = useState<Array<{ question: string; timestamp: Date }>>([]);

  useEffect(() => {
    const checkOllamaStatus = async () => {
      try {
        // Check if Ollama is running
        const models = await window.backendBridge.ollama.getAllModels();
        setAvailableModels(models.models || []);
        setIsOllamaConnected(true);
        setOllamaStatus('Ollama is running and connected');
      } catch (error) {
        setIsOllamaConnected(false);
        setOllamaStatus('Ollama is not running');
      } finally {
        setIsLoading(false);
      }
    };

    checkOllamaStatus();
  }, []);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'chat':
        navigate('/chat');
        break;
      case 'models':
        navigate('/registry');
        break;
      case 'settings':
        navigate('/settings');
        break;
    }
  };

  const handleStartNewChat = () => {
    navigate('/chat');
  };

  const handleModelClick = () => {
    // Navigate to chat with specific model
    navigate('/chat');
  };

  return (
    <Home.Layout>
      <Home.Header>
        <Home.Title>Welcome to Morpheus</Home.Title>
        <Home.Subtitle>Private, Sovereign AI</Home.Subtitle>
      </Home.Header>

      <Home.StatusSection>
        <Home.StatusTitle>System Status</Home.StatusTitle>
        <Home.StatusCard>
          <Home.StatusIcon status={isOllamaConnected}>
            {isOllamaConnected ? '✓' : '✗'}
          </Home.StatusIcon>
          <Home.StatusText>
            <Home.StatusLabel>Ollama:</Home.StatusLabel>
            {isLoading ? (
              <Home.LoadingSpinner width="16" height="16" />
            ) : (
              <Home.StatusValue status={isOllamaConnected}>{ollamaStatus}</Home.StatusValue>
            )}
          </Home.StatusText>
        </Home.StatusCard>

        {isOllamaConnected && availableModels.length > 0 && (
          <Home.ModelsInfo>
            <Home.ModelsCount>{availableModels.length} models available</Home.ModelsCount>
            <Home.ModelsList>
              {availableModels.slice(0, 3).map((model, index) => (
                <Home.ModelTag key={index} onClick={() => handleModelClick()} clickable={true}>
                  {model.name}
                </Home.ModelTag>
              ))}
              {availableModels.length > 3 && (
                <Home.ModelTag clickable={false}>+{availableModels.length - 3} more</Home.ModelTag>
              )}
            </Home.ModelsList>
          </Home.ModelsInfo>
        )}
      </Home.StatusSection>

      <Home.ActionsSection>
        <Home.ActionsTitle>Quick Actions</Home.ActionsTitle>
        <Home.ActionsGrid>
          <Home.ActionCard onClick={() => handleQuickAction('chat')} primary={true}>
            <Home.ActionIcon>💬</Home.ActionIcon>
            <Home.ActionTitle>Start Chat</Home.ActionTitle>
            <Home.ActionDescription>Begin a conversation with AI</Home.ActionDescription>
            <Home.ActionButton onClick={handleStartNewChat}>Start New Chat</Home.ActionButton>
          </Home.ActionCard>

          <Home.ActionCard onClick={() => handleQuickAction('models')}>
            <Home.ActionTitle>Manage Models</Home.ActionTitle>
            <Home.ActionDescription>View and install AI models</Home.ActionDescription>
          </Home.ActionCard>

          <Home.ActionCard onClick={() => handleQuickAction('settings')}>
            <Home.ActionIcon>⚙️</Home.ActionIcon>
            <Home.ActionTitle>Settings</Home.ActionTitle>
            <Home.ActionDescription>Configure your preferences</Home.ActionDescription>
          </Home.ActionCard>
        </Home.ActionsGrid>
      </Home.ActionsSection>

      {recentConversations.length > 0 && (
        <Home.RecentSection>
          <Home.RecentTitle>Recent Conversations</Home.RecentTitle>
          <Home.RecentList>
            {recentConversations.slice(0, 3).map((conversation, index) => (
              <Home.RecentItem key={index} onClick={() => navigate('/chat')}>
                <Home.RecentQuestion>{conversation.question}</Home.RecentQuestion>
                <Home.RecentTime>{conversation.timestamp.toLocaleDateString()}</Home.RecentTime>
              </Home.RecentItem>
            ))}
          </Home.RecentList>
        </Home.RecentSection>
      )}

      <Home.Footer>
        <Home.FooterText>
          Morpheus is your private AI companion. All conversations stay on your device.
        </Home.FooterText>
        <Home.FooterStatus>
          ✅ Notarized & Code Signed • 🍎 Apple Silicon Optimized
        </Home.FooterStatus>
      </Home.Footer>
    </Home.Layout>
  );
};

const Home = {
  Layout: Styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: ${(props) => props.theme.colors.core};
    padding: 30px;
    overflow-y: auto;
  `,
  Header: Styled.div`
    text-align: center;
    margin-bottom: 40px;
  `,
  Title: Styled.h1`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 2.5rem;
    margin: 0 0 10px 0;
  `,
  Subtitle: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 1.2rem;
    margin: 0;
  `,
  StatusSection: Styled.div`
    margin-bottom: 40px;
  `,
  StatusTitle: Styled.h2`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.3rem;
    margin: 0 0 20px 0;
  `,
  StatusCard: Styled.div`
    display: flex;
    align-items: center;
    background: ${(props) => props.theme.colors.hunter};
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 15px;
  `,
  StatusIcon: Styled.div<{ status: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${(props) => (props.status ? props.theme.colors.emerald : '#ff6b6b')};
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    margin-right: 15px;
  `,
  StatusText: Styled.div`
    display: flex;
    flex-direction: column;
  `,
  StatusLabel: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
    margin-bottom: 5px;
  `,
  StatusValue: Styled.span<{ status: boolean }>`
    color: ${(props) => (props.status ? props.theme.colors.emerald : '#ff6b6b')};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1rem;
  `,
  LoadingSpinner: Styled(TailSpin)`
    margin-left: 10px;
  `,
  ModelsInfo: Styled.div`
    background: ${(props) => props.theme.colors.hunter};
    border-radius: 15px;
    padding: 20px;
  `,
  ModelsCount: Styled.div`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1rem;
    margin-bottom: 10px;
  `,
  ModelsList: Styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  ModelTag: Styled.span<{ clickable: boolean }>`
    background: ${(props) => props.theme.colors.emerald};
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.8rem;
    cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
    transition: background-color 0.3s ease;

    &:hover {
      background: ${(props) => props.theme.colors.emerald};
    }
  `,
  ActionsSection: Styled.div`
    margin-bottom: 40px;
  `,
  ActionsTitle: Styled.h2`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.3rem;
    margin: 0 0 20px 0;
  `,
  ActionsGrid: Styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  `,
  ActionCard: Styled.div<{ primary?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    background: ${(props) => props.theme.colors.hunter};
    border-radius: 15px;
    padding: 30px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;

    &:hover {
      background: ${(props) => props.theme.colors.emerald};
      transform: translateY(-2px);
    }

    ${(props) =>
      props.primary &&
      `
      background: ${props.theme.colors.emerald};
      color: white;
      &:hover {
        background: ${props.theme.colors.emerald};
        transform: translateY(-2px);
      }
    `}
  `,
  ActionIcon: Styled.div`
    font-size: 2.5rem;
    margin-bottom: 15px;
  `,
  ActionTitle: Styled.h3`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.2rem;
    margin: 0 0 10px 0;
  `,
  ActionDescription: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.9rem;
    margin: 0;
    opacity: 0.8;
  `,
  ActionButton: Styled.button`
    background: ${(props) => props.theme.colors.notice};
    color: white;
    padding: 8px 15px;
    border-radius: 10px;
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 0.9rem;
    cursor: pointer;
    border: none;
    margin-top: 15px;
    transition: background-color 0.3s ease;

    &:hover {
      background: ${(props) => props.theme.colors.emerald};
    }
  `,
  RecentSection: Styled.div`
    margin-bottom: 40px;
  `,
  RecentTitle: Styled.h2`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.3rem;
    margin: 0 0 20px 0;
  `,
  RecentList: Styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `,
  RecentItem: Styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${(props) => props.theme.colors.hunter};
    border-radius: 10px;
    padding: 10px 15px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background: ${(props) => props.theme.colors.emerald};
    }
  `,
  RecentQuestion: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
    flex-grow: 1;
  `,
  RecentTime: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.7rem;
    opacity: 0.7;
  `,
  Footer: Styled.div`
    text-align: center;
    margin-top: auto;
    padding-top: 30px;
  `,
  FooterText: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.9rem;
    opacity: 0.7;
    margin: 0;
  `,
  FooterStatus: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: 10px;
  `,
};

export default HomeView;
