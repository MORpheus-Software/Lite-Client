import React, { useState, useEffect } from 'react';
import Styled from 'styled-components';
import { X, CheckCircle } from 'lucide-react';

interface MigrationNotificationProps {
  show: boolean;
  onDismiss: () => void;
}

const MigrationNotification: React.FC<MigrationNotificationProps> = ({ show, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Wait for animation to complete
  };

  if (!show) return null;

  return (
    <Notification.Overlay $visible={isVisible}>
      <Notification.Container $visible={isVisible}>
        <Notification.Header>
          <Notification.Icon>
            <CheckCircle size={24} color="#10b981" />
          </Notification.Icon>
          <Notification.Title>Chat Migrated Successfully!</Notification.Title>
          <Notification.CloseButton onClick={handleDismiss}>
            <X size={20} />
          </Notification.CloseButton>
        </Notification.Header>

        <Notification.Content>
          <Notification.Text>
            Your previous conversation has been converted to the new multiple chat format.
          </Notification.Text>
          <Notification.Features>
            <Notification.Feature>
              ✨ Each chat now has its own local/remote mode
            </Notification.Feature>
            <Notification.Feature>
              🔒 No more context loss when switching modes
            </Notification.Feature>
            <Notification.Feature>
              💬 Create multiple chats with different models
            </Notification.Feature>
          </Notification.Features>
          <Notification.ActionText>
            Use the "New Chat" button in the sidebar to create additional conversations!
          </Notification.ActionText>
        </Notification.Content>
      </Notification.Container>
    </Notification.Overlay>
  );
};

const Notification = {
  Overlay: Styled.div<{ $visible: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: ${(props) => (props.$visible ? 1 : 0)};
    transition: opacity 0.3s ease;
  `,
  Container: Styled.div<{ $visible: boolean }>`
    background: ${(props) => props.theme.colors.core};
    border-radius: 12px;
    border: 1px solid ${(props) => props.theme.colors.emerald};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 500px;
    overflow: hidden;
    transform: ${(props) => (props.$visible ? 'scale(1)' : 'scale(0.9)')};
    transition: transform 0.3s ease;
  `,
  Header: Styled.div`
    padding: 20px 24px 16px 24px;
    border-bottom: 1px solid ${(props) => props.theme.colors.hunter};
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  Icon: Styled.div`
    display: flex;
    align-items: center;
  `,
  Title: Styled.h3`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.1rem;
    margin: 0;
    flex: 1;
  `,
  CloseButton: Styled.button`
    background: none;
    border: none;
    color: ${(props) => props.theme.colors.notice};
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    
    &:hover {
      background: ${(props) => props.theme.colors.hunter};
      opacity: 1;
    }
  `,
  Content: Styled.div`
    padding: 0 24px 24px 24px;
  `,
  Text: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.95rem;
    margin: 0 0 16px 0;
    line-height: 1.5;
  `,
  Features: Styled.div`
    margin: 16px 0;
  `,
  Feature: Styled.div`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.85rem;
    margin: 6px 0;
    opacity: 0.9;
    line-height: 1.4;
  `,
  ActionText: Styled.p`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
    margin: 16px 0 0 0;
    padding: 12px;
    background: ${(props) => props.theme.colors.emerald}15;
    border-radius: 6px;
    border-left: 3px solid ${(props) => props.theme.colors.emerald};
  `,
};

export default MigrationNotification;
