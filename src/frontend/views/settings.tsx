import React, { useState, useEffect, ChangeEvent } from 'react';
import Styled from 'styled-components';

// Types
import { InferenceMode, MorpheusAPIConfig } from '../renderer';

const SettingsView = (): React.JSX.Element => {
  const [ollamaPath, setOllamaPath] = useState<string>('');
  const [modelsPath, setModelsPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Morpheus API settings
  const [morpheusConfig, setMorpheusConfig] = useState<MorpheusAPIConfig>({
    apiKey: '',
    baseUrl: 'https://api.mor.org/api/v1',
    defaultModel: 'llama-3.3-70b',
  });
  const [isConnectionTesting, setIsConnectionTesting] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'failed'>(
    'unknown',
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load current settings
        const currentModelsPath = await window.backendBridge.main.getFolderPath();

        // Load Morpheus API configuration
        const currentConfig = await window.backendBridge.inference.getMorpheusConfig();

        setOllamaPath('Default'); // Ollama path is not configurable in this version
        setModelsPath(currentModelsPath || 'Default');

        if (currentConfig) {
          setMorpheusConfig(currentConfig);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleResetSettings = async () => {
    try {
      // Reset settings by setting folder path to default
      await window.backendBridge.main.setFolderPath();
      // Reload settings
      const currentModelsPath = await window.backendBridge.main.getFolderPath();

      setOllamaPath('Default');
      setModelsPath(currentModelsPath || 'Default');
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  const handleClearCache = async () => {
    // Cache functionality has been removed - models are always fetched fresh
    alert(
      'Cache functionality has been removed. Models are now always fetched fresh from the registry.',
    );
  };

  // Morpheus API handlers

  const handleMorpheusConfigSave = async () => {
    try {
      // Basic validation
      if (!morpheusConfig.apiKey?.trim()) {
        alert('Please enter an API key before saving.');
        return;
      }

      if (!morpheusConfig.baseUrl?.trim()) {
        alert('Please enter a valid API endpoint.');
        return;
      }

      await window.backendBridge.inference.setMorpheusConfig(morpheusConfig);
      setConnectionStatus('unknown');
      alert(
        'Configuration saved successfully! You can now test the connection or switch to remote mode.',
      );
    } catch (error) {
      console.error('Failed to save Morpheus config:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  const handleTestConnection = async () => {
    if (!morpheusConfig.apiKey.trim()) {
      alert('Please enter an API key first.');
      return;
    }

    setIsConnectionTesting(true);
    setConnectionStatus('unknown');

    try {
      // Save config first, then test
      await window.backendBridge.inference.setMorpheusConfig(morpheusConfig);
      const isConnected = await window.backendBridge.inference.testMorpheusConnection();

      setConnectionStatus(isConnected ? 'success' : 'failed');

      if (isConnected) {
        alert('Connection successful! Remote inference is ready to use.');
      } else {
        alert('Connection failed. Please check your API key and try again.');
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      setConnectionStatus('failed');
      alert('Connection test failed. Please check your configuration.');
    } finally {
      setIsConnectionTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Settings.Layout>
        <Settings.LoadingSpinner />
        <Settings.LoadingText>Loading settings...</Settings.LoadingText>
      </Settings.Layout>
    );
  }

  return (
    <Settings.Layout>
      <Settings.Header>
        <Settings.Title>Settings</Settings.Title>
        <Settings.Subtitle>Configure your Morpheus experience</Settings.Subtitle>
      </Settings.Header>

      <Settings.Section>
        <Settings.SectionTitle>System Configuration</Settings.SectionTitle>

        <Settings.SettingRow>
          <Settings.SettingLabel>Ollama Path:</Settings.SettingLabel>
          <Settings.SettingValue>{ollamaPath}</Settings.SettingValue>
        </Settings.SettingRow>

        <Settings.SettingRow>
          <Settings.SettingLabel>Models Path:</Settings.SettingLabel>
          <Settings.SettingValue>{modelsPath}</Settings.SettingValue>
        </Settings.SettingRow>
      </Settings.Section>

      <Settings.Section>
        <Settings.SectionTitle>Remote Inference (Morpheus API)</Settings.SectionTitle>
        <Settings.SectionDescription>
          Configure your Morpheus API settings for remote chat sessions. Each chat can be set to
          local or remote mode when created.
        </Settings.SectionDescription>

        <Settings.SettingRow>
          <Settings.SettingLabel>API Endpoint:</Settings.SettingLabel>
          <Settings.InputField
            type="text"
            value={morpheusConfig.baseUrl || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setMorpheusConfig({ ...morpheusConfig, baseUrl: e.target.value })
            }
            placeholder="https://api.mor.org/api/v1"
          />
        </Settings.SettingRow>

        <Settings.SettingRow>
          <Settings.SettingLabel>API Key:</Settings.SettingLabel>
          <Settings.InputField
            type="password"
            value={morpheusConfig.apiKey}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setMorpheusConfig({ ...morpheusConfig, apiKey: e.target.value })
            }
            placeholder="Enter your Morpheus API key"
          />
        </Settings.SettingRow>

        <Settings.SettingRow>
          <Settings.SettingLabel>Default Model:</Settings.SettingLabel>
          <Settings.InputField
            type="text"
            value={morpheusConfig.defaultModel || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setMorpheusConfig({ ...morpheusConfig, defaultModel: e.target.value })
            }
            placeholder="llama-3.3-70b"
          />
        </Settings.SettingRow>

        <Settings.ApiActions>
          <Settings.ActionButton onClick={handleMorpheusConfigSave}>
            <Settings.ButtonIcon>💾</Settings.ButtonIcon>
            <Settings.ButtonText>Save Configuration</Settings.ButtonText>
          </Settings.ActionButton>

          <Settings.TestButton
            onClick={handleTestConnection}
            disabled={isConnectionTesting}
            $status={connectionStatus}
          >
            <Settings.ButtonIcon>
              {isConnectionTesting
                ? '⏳'
                : connectionStatus === 'success'
                  ? '✅'
                  : connectionStatus === 'failed'
                    ? '❌'
                    : '🔌'}
            </Settings.ButtonIcon>
            <Settings.ButtonText>
              {isConnectionTesting ? 'Testing...' : 'Test Connection'}
            </Settings.ButtonText>
          </Settings.TestButton>
        </Settings.ApiActions>

        <Settings.ApiInfo>
          <Settings.InfoText>
            💡 Get your API key at{' '}
            <a href="https://openbeta.mor.org/docs" target="_blank" rel="noopener noreferrer">
              openbeta.mor.org
            </a>
          </Settings.InfoText>
          {connectionStatus === 'success' && (
            <Settings.SuccessText>
              ✅ Connection verified - Remote inference ready!
            </Settings.SuccessText>
          )}
          {connectionStatus === 'failed' && (
            <Settings.ErrorText>
              ❌ Connection failed - Please check your API key
            </Settings.ErrorText>
          )}
        </Settings.ApiInfo>
      </Settings.Section>

      <Settings.Section>
        <Settings.SectionTitle>Maintenance</Settings.SectionTitle>

        <Settings.ActionButton onClick={handleClearCache}>
          <Settings.ButtonIcon>🗑️</Settings.ButtonIcon>
          <Settings.ButtonText>Clear Registry Cache</Settings.ButtonText>
        </Settings.ActionButton>

        <Settings.ActionButton onClick={handleResetSettings}>
          <Settings.ButtonIcon>🔄</Settings.ButtonIcon>
          <Settings.ButtonText>Reset to Defaults</Settings.ButtonText>
        </Settings.ActionButton>
      </Settings.Section>

      <Settings.Section>
        <Settings.SectionTitle>About</Settings.SectionTitle>

        <Settings.InfoRow>
          <Settings.InfoLabel>Version:</Settings.InfoLabel>
          <Settings.InfoValue>0.0.6</Settings.InfoValue>
        </Settings.InfoRow>

        <Settings.InfoRow>
          <Settings.InfoLabel>Build:</Settings.InfoLabel>
          <Settings.InfoValue>Apple Silicon (ARM64)</Settings.InfoValue>
        </Settings.InfoRow>

        <Settings.InfoRow>
          <Settings.InfoLabel>Status:</Settings.InfoLabel>
          <Settings.InfoValue>✅ Notarized & Code Signed</Settings.InfoValue>
        </Settings.InfoRow>
      </Settings.Section>
    </Settings.Layout>
  );
};

const Settings = {
  Layout: Styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 30px;
    background: ${(props) => props.theme.colors.core};
    overflow-y: auto;
  `,
  Header: Styled.div`
    margin-bottom: 40px;
  `,
  Title: Styled.h1`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 2rem;
    margin: 0 0 10px 0;
  `,
  Subtitle: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 1.1rem;
    margin: 0;
  `,
  Section: Styled.div`
    margin-bottom: 30px;
    padding: 20px;
    background: ${(props) => props.theme.colors.hunter};
    border-radius: 15px;
  `,
  SectionTitle: Styled.h2`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.3rem;
    margin: 0 0 8px 0;
  `,
  SectionDescription: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.9rem;
    margin: 0 0 16px 0;
    opacity: 0.7;
    line-height: 1.4;
  `,
  SettingRow: Styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  `,
  SettingLabel: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 1rem;
  `,
  SettingValue: Styled.span`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1rem;
  `,
  ActionButton: Styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    padding: 15px;
    margin-bottom: 10px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 10px;
    color: ${(props) => props.theme.colors.emerald};
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(16, 185, 129, 0.2);
      transform: translateY(-1px);
    }
  `,
  ButtonIcon: Styled.span`
    font-size: 1.2rem;
    margin-right: 10px;
  `,
  ButtonText: Styled.span`
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 1rem;
  `,
  InfoRow: Styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  `,
  InfoLabel: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
  `,
  InfoValue: Styled.span`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 0.9rem;
  `,
  LoadingSpinner: Styled.div`
    width: 40px;
    height: 40px;
    border: 3px solid rgba(148, 163, 184, 0.2);
    border-top: 3px solid ${(props) => props.theme.colors.emerald};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,
  LoadingText: Styled.div`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 1rem;
    text-align: center;
  `,

  // Remote Inference styles

  InputField: Styled.input`
    padding: 10px 12px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    color: ${(props) => props.theme.colors.notice};
    font-size: 0.9rem;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    width: 250px;
    outline: none;

    &:focus {
      border-color: ${(props) => props.theme.colors.emerald};
      box-shadow: 0 0 0 2px rgba(23, 156, 101, 0.2);
    }

    &::placeholder {
      color: rgba(148, 163, 184, 0.6);
    }
  `,

  ApiActions: Styled.div`
    display: flex;
    gap: 10px;
    margin-top: 20px;
  `,

  TestButton: Styled.button<{ $status: 'unknown' | 'success' | 'failed'; disabled: boolean }>`
    display: flex;
    align-items: center;
    padding: 15px;
    background: ${({ $status }) =>
      $status === 'success'
        ? 'rgba(34, 197, 94, 0.1)'
        : $status === 'failed'
          ? 'rgba(239, 68, 68, 0.1)'
          : 'rgba(59, 130, 246, 0.1)'};
    border: 1px solid ${({ $status }) =>
      $status === 'success'
        ? 'rgba(34, 197, 94, 0.3)'
        : $status === 'failed'
          ? 'rgba(239, 68, 68, 0.3)'
          : 'rgba(59, 130, 246, 0.3)'};
    border-radius: 10px;
    color: ${({ $status }) =>
      $status === 'success' ? '#22c55e' : $status === 'failed' ? '#ef4444' : '#3b82f6'};
    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
    transition: all 0.3s ease;
    opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

    &:hover:not(:disabled) {
      background: ${({ $status }) =>
        $status === 'success'
          ? 'rgba(34, 197, 94, 0.2)'
          : $status === 'failed'
            ? 'rgba(239, 68, 68, 0.2)'
            : 'rgba(59, 130, 246, 0.2)'};
      transform: translateY(-1px);
    }
  `,

  ApiInfo: Styled.div`
    margin-top: 15px;
    padding: 15px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    border-left: 4px solid ${(props) => props.theme.colors.emerald};
  `,

  InfoText: Styled.p`
    color: ${(props) => props.theme.colors.notice};
    font-size: 0.9rem;
    margin: 0 0 8px 0;
    
    a {
      color: ${(props) => props.theme.colors.emerald};
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  `,

  SuccessText: Styled.p`
    color: #22c55e;
    font-size: 0.9rem;
    margin: 0;
    font-weight: 500;
  `,

  ErrorText: Styled.p`
    color: #ef4444;
    font-size: 0.9rem;
    margin: 0;
    font-weight: 500;
  `,
};

export default SettingsView;
