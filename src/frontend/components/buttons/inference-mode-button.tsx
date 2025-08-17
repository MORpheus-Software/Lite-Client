// libs
import React from 'react';
import Styled from 'styled-components';
import { MonitorSpeaker, Globe } from 'lucide-react';

// types
import { InferenceMode } from '../../renderer';

interface InferenceModeButtonProps {
  currentMode: InferenceMode;
  onToggle: () => void;
  disabled?: boolean;
  compact?: boolean;
}

const InferenceModeButton: React.FC<InferenceModeButtonProps> = ({
  currentMode,
  onToggle,
  disabled = false,
  compact = false,
}) => {
  const isRemote = currentMode === 'remote';

  return (
    <Button.Container
      onClick={onToggle}
      $isRemote={isRemote}
      $disabled={disabled}
      $compact={compact}
      disabled={disabled}
      title={`Switch to ${isRemote ? 'local' : 'remote'} inference`}
    >
      <Button.Icon $isRemote={isRemote}>
        {isRemote ? <Globe size={14} /> : <MonitorSpeaker size={14} />}
      </Button.Icon>
      {!compact && (
        <Button.Label $isRemote={isRemote}>{isRemote ? 'Remote' : 'Local'}</Button.Label>
      )}
      <Button.Indicator $isRemote={isRemote} />
    </Button.Container>
  );
};

const ButtonContainer = Styled.button<{
  $isRemote: boolean;
  $disabled: boolean;
  $compact: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ $compact }) => ($compact ? '4px' : '8px')};
  padding: ${({ $compact }) => ($compact ? '6px 10px' : '8px 12px')};
  border: 2px solid ${({ $isRemote }) => ($isRemote ? '#4A90E2' : '#179C65')};
  border-radius: 20px;
  background: ${({ $isRemote }) =>
    $isRemote
      ? 'linear-gradient(135deg, #4A90E2, #5BA2F0)'
      : 'linear-gradient(135deg, #179C65, #20B574)'};
  color: white;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  font-size: ${({ $compact }) => ($compact ? '12px' : '14px')};
  font-weight: 500;
  outline: none;
  position: relative;
  min-width: ${({ $compact }) => ($compact ? '40px' : '80px')};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const ButtonIcon = Styled.span<{ $isRemote: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  
  svg {
    color: white;
  }
  
  ${ButtonContainer}:hover & {
    transform: scale(1.1);
  }
`;

const ButtonLabel = Styled.span<{ $isRemote: boolean }>`
  font-weight: 600;
  white-space: nowrap;
`;

const ButtonIndicator = Styled.div<{ $isRemote: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.4; }
  }
`;

const Button = {
  Container: ButtonContainer,
  Icon: ButtonIcon,
  Label: ButtonLabel,
  Indicator: ButtonIndicator,
};

export default InferenceModeButton;
