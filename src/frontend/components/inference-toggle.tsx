// libs
import React, { useState, useEffect } from 'react';
import Styled from 'styled-components';
import { MonitorSpeaker, Globe, AlertTriangle } from 'lucide-react';

// types
import { InferenceMode } from '../renderer';

interface InferenceToggleProps {
  currentMode: InferenceMode;
  onModeChange: (mode: InferenceMode) => void;
  disabled?: boolean;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const InferenceToggle: React.FC<InferenceToggleProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
  showLabels = true,
  size = 'medium',
}) => {
  const [isRemoteConfigured, setIsRemoteConfigured] = useState(false);

  useEffect(() => {
    // Check if remote API is configured
    const checkRemoteConfig = async () => {
      try {
        const config = await window.backendBridge.inference.getMorpheusConfig();
        setIsRemoteConfigured(config !== null && config.apiKey !== '');
      } catch (error) {
        console.error('Failed to check remote config:', error);
        setIsRemoteConfigured(false);
      }
    };

    checkRemoteConfig();
  }, []);

  const handleToggle = () => {
    if (disabled) return;

    if (currentMode === 'local' && !isRemoteConfigured) {
      // Show warning that remote is not configured
      alert('Remote inference is not configured. Please set up your API key in settings.');
      return;
    }

    const newMode: InferenceMode = currentMode === 'local' ? 'remote' : 'local';
    onModeChange(newMode);
  };

  return (
    <Toggle.Container $size={size}>
      {showLabels && (
        <Toggle.Label $active={currentMode === 'local'} $size={size}>
          <MonitorSpeaker size={12} /> Local
        </Toggle.Label>
      )}

      <Toggle.Switch
        onClick={handleToggle}
        $active={currentMode === 'remote'}
        $disabled={disabled}
        $size={size}
        title={`Switch to ${currentMode === 'local' ? 'remote' : 'local'} inference`}
      >
        <Toggle.Slider $active={currentMode === 'remote'} $size={size}>
          <Toggle.Icon>
            {currentMode === 'local' ? <MonitorSpeaker size={10} /> : <Globe size={10} />}
          </Toggle.Icon>
        </Toggle.Slider>
      </Toggle.Switch>

      {showLabels && (
        <Toggle.Label $active={currentMode === 'remote'} $size={size}>
          <Globe size={12} /> Remote
          {!isRemoteConfigured && (
            <Toggle.Warning title="Remote inference not configured">
              <AlertTriangle size={10} />
            </Toggle.Warning>
          )}
        </Toggle.Label>
      )}

      {/* Status indicator */}
      <Toggle.Status $mode={currentMode} $size={size}>
        <Toggle.StatusDot $mode={currentMode} />
        <Toggle.StatusText $size={size}>
          {currentMode === 'local' ? 'Private & Local' : 'Cloud Processing'}
        </Toggle.StatusText>
      </Toggle.Status>
    </Toggle.Container>
  );
};

const sizeConfig = {
  small: {
    switchWidth: '36px',
    switchHeight: '20px',
    sliderSize: '16px',
    fontSize: '12px',
    iconSize: '10px',
    spacing: '8px',
  },
  medium: {
    switchWidth: '48px',
    switchHeight: '26px',
    sliderSize: '22px',
    fontSize: '14px',
    iconSize: '12px',
    spacing: '12px',
  },
  large: {
    switchWidth: '60px',
    switchHeight: '32px',
    sliderSize: '28px',
    fontSize: '16px',
    iconSize: '14px',
    spacing: '16px',
  },
};

const Toggle = {
  Container: Styled.div<{ $size: 'small' | 'medium' | 'large' }>`
    display: flex;
    align-items: center;
    gap: ${({ $size }) => sizeConfig[$size].spacing};
    flex-direction: column;
  `,

  Label: Styled.span<{ $active: boolean; $size: 'small' | 'medium' | 'large' }>`
    font-size: ${({ $size }) => sizeConfig[$size].fontSize};
    font-weight: 500;
    color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textSecondary)};
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
    user-select: none;
  `,

  Switch: Styled.button<{
    $active: boolean;
    $disabled: boolean;
    $size: 'small' | 'medium' | 'large';
  }>`
    width: ${({ $size }) => sizeConfig[$size].switchWidth};
    height: ${({ $size }) => sizeConfig[$size].switchHeight};
    border-radius: ${({ $size }) => sizeConfig[$size].switchHeight};
    border: 2px solid ${({ $active, theme }) => ($active ? theme.colors.remote : theme.colors.local)};
    background: ${({ $active, theme }) =>
      $active
        ? `linear-gradient(135deg, ${theme.colors.remote}, ${theme.colors.remoteLight})`
        : `linear-gradient(135deg, ${theme.colors.local}, ${theme.colors.localLight})`};
    position: relative;
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
    transition: all 0.3s ease;
    opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
    outline: none;

    &:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }
  `,

  Slider: Styled.div<{ $active: boolean; $size: 'small' | 'medium' | 'large' }>`
    width: ${({ $size }) => sizeConfig[$size].sliderSize};
    height: ${({ $size }) => sizeConfig[$size].sliderSize};
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 50%;
    left: ${({ $active, $size }) =>
      $active ? `calc(100% - ${sizeConfig[$size].sliderSize} - 2px)` : '2px'};
    transform: translateY(-50%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  `,

  Icon: Styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    
    svg {
      color: #666;
    }
  `,

  Warning: Styled.span`
    display: flex;
    align-items: center;
    margin-left: 4px;
    
    svg {
      color: #ffa500;
    }
  `,

  Status: Styled.div<{ $mode: InferenceMode; $size: 'small' | 'medium' | 'large' }>`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  `,

  StatusDot: Styled.div<{ $mode: InferenceMode }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $mode, theme }) => ($mode === 'local' ? theme.colors.local : theme.colors.remote)};
    animation: pulse 2s infinite;

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,

  StatusText: Styled.span<{ $size: 'small' | 'medium' | 'large' }>`
    font-size: ${({ $size }) => ($size === 'small' ? '10px' : '11px')};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 400;
  `,
};

export default InferenceToggle;
