// libs
import React, { useEffect, useState } from 'react';
import Styled from 'styled-components';
import { OllamaChannel } from '../../../events';

const AppInit = () => {
  const [currentStatus, setCurrentStatus] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    window.backendBridge.ollama.onStatusUpdate((status: string) => {
      setCurrentStatus(status);

      // Update progress based on status messages
      if (status.includes('checking if ollama instance')) {
        setProgress(20);
      } else if (status.includes('trying to spawn')) {
        setProgress(40);
      } else if (status.includes('running and connected')) {
        setProgress(80);
      } else if (status.includes('Connected') || status.includes('ready')) {
        setProgress(100);
        setIsComplete(true);
      }
    });

    return () => {
      window.backendBridge.removeAllListeners(OllamaChannel.OllamaStatusUpdate);
    };
  }, []);

  return (
    <Main.Layout>
      <Main.Draggable />
      <Main.Content>
        <Main.Header>
          <Main.Title>Morpheus</Main.Title>
          <Main.Subtitle>Private AI Assistant</Main.Subtitle>
        </Main.Header>

        <Main.ProgressSection>
          <Main.ProgressBar>
            <Main.ProgressFill $progress={progress} />
          </Main.ProgressBar>
          <Main.ProgressText>{progress}%</Main.ProgressText>
        </Main.ProgressSection>

        <Main.StatusSection>
          {isComplete ? (
            <Main.SuccessMessage>
              <Main.SuccessIcon>✅</Main.SuccessIcon>
              <Main.SuccessText>Ready to chat!</Main.SuccessText>
            </Main.SuccessMessage>
          ) : (
            currentStatus && <Main.StatusText>{currentStatus}</Main.StatusText>
          )}
        </Main.StatusSection>
      </Main.Content>
    </Main.Layout>
  );
};

const Main = {
  Layout: Styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100vh;
    background: ${(props) => props.theme.colors.core};
    position: relative;
    min-height: 100vh;
  `,
  Draggable: Styled.div`
    display: flex;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 35px;
    z-index: 0;
    -webkit-app-region: drag;
  `,
  Content: Styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 20px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  `,
  Header: Styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
  `,
  Logo: Styled.span`
    font-size: 60px;
    margin-bottom: 10px;
  `,
  Title: Styled.h1`
    font-size: 48px;
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-weight: 700;
    color: ${(props) => props.theme.colors.emerald};
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `,
  Subtitle: Styled.p`
    font-size: 20px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.notice};
    margin-bottom: 30px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  `,
  ProgressSection: Styled.div`
    width: 100%;
    max-width: 600px;
    margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
  `,
  ProgressBar: Styled.div`
    width: 100%;
    height: 10px;
    background-color: ${(props) => props.theme.colors.hunter};
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 10px;
  `,
  ProgressFill: Styled.div<{ $progress: number }>`
    height: 100%;
    background-color: ${(props) => props.theme.colors.emerald};
    border-radius: 5px;
    width: ${(props) => props.$progress}%;
    transition: width 0.3s ease-in-out;
  `,
  ProgressText: Styled.span`
    font-size: 16px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  `,
  StatusSection: Styled.div`
    width: 100%;
    max-width: 600px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `,
  StatusText: Styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    margin-top: 20px;
    max-width: 400px;
    word-wrap: break-word;
    justify-content: center;
    align-items: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    width: 100%;
  `,
  SuccessMessage: Styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 24px;
    font-weight: 700;
    margin-top: 20px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  `,
  SuccessIcon: Styled.span`
    font-size: 30px;
    margin-right: 10px;
  `,
  SuccessText: Styled.span`
    font-size: 20px;
  `,
};

export default AppInit;
