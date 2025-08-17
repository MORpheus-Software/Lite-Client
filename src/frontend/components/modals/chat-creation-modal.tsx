import React, { useState, useEffect } from 'react';
import Styled from 'styled-components';
import { Globe, MonitorSpeaker, X } from 'lucide-react';
import { InferenceMode } from '../../renderer';

interface ChatCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (mode: 'local' | 'remote', model: string, title?: string) => void;
}

interface ModelOption {
  id: string;
  name: string;
  description?: string;
  size?: string;
}

const ChatCreationModal: React.FC<ChatCreationModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [selectedMode, setSelectedMode] = useState<'local' | 'remote'>('local');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [localModels, setLocalModels] = useState<ModelOption[]>([]);
  const [remoteModels, setRemoteModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRemoteConfigured, setIsRemoteConfigured] = useState(false);

  // Load models when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      loadModels();
      checkRemoteConfig();
      // Reset form when modal opens
      setSelectedModel('');
      setCustomTitle('');
      setError(null);
    }
  }, [isOpen, selectedMode]);

  const loadModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedMode === 'local') {
        // Load Ollama models
        const ollamaModels = await window.backendBridge.ollama.getAllModels();
        const formattedModels: ModelOption[] =
          ollamaModels.models?.map((model: any) => ({
            id: model.name,
            name: model.name,
            description: `Size: ${(model.size / (1024 * 1024 * 1024)).toFixed(1)}GB`,
            size: `${(model.size / (1024 * 1024 * 1024)).toFixed(1)}GB`,
          })) || [];
        setLocalModels(formattedModels);

        // Set default to last used or orca-mini
        if (formattedModels.length > 0) {
          try {
            const lastUsed = await window.backendBridge.ollama.getLastUsedLocalModel();
            const defaultModel =
              formattedModels.find((m) => m.name === lastUsed) || formattedModels[0];
            setSelectedModel(defaultModel.name);
          } catch {
            setSelectedModel(formattedModels[0].name);
          }
        }
      } else {
        // Load Morpheus API models
        const morpheusModels = await window.backendBridge.morpheus.getModels();
        const formattedModels: ModelOption[] = morpheusModels.map((model: any) => ({
          id: model.id || model.name,
          name: model.id || model.name,
          description: model.description || 'Remote AI model',
        }));
        setRemoteModels(formattedModels);

        // Set default model
        if (formattedModels.length > 0) {
          setSelectedModel(formattedModels[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load models:', err);
      setError(`Failed to load ${selectedMode} models. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRemoteConfig = async () => {
    try {
      const config = await window.backendBridge.inference.getMorpheusConfig();
      setIsRemoteConfigured(config !== null && config.apiKey !== '');
    } catch (error) {
      console.error('Failed to check remote config:', error);
      setIsRemoteConfigured(false);
    }
  };

  const handleCreate = () => {
    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    if (selectedMode === 'remote' && !isRemoteConfigured) {
      setError('Remote inference is not configured. Please set up your API key in settings.');
      return;
    }

    onCreate(selectedMode, selectedModel, customTitle || undefined);
    onClose();
  };

  const getCurrentModels = () => {
    return selectedMode === 'local' ? localModels : remoteModels;
  };

  if (!isOpen) return null;

  return (
    <Modal.Backdrop onClick={onClose}>
      <Modal.Container onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Modal.Header>
          <Modal.Title>Create New Chat</Modal.Title>
          <Modal.CloseButton onClick={onClose}>
            <X size={20} />
          </Modal.CloseButton>
        </Modal.Header>

        <Modal.Content>
          {/* Mode Selection */}
          <Modal.Section>
            <Modal.SectionTitle>Choose Mode</Modal.SectionTitle>
            <Modal.ModeOptions>
              <Modal.ModeOption
                $active={selectedMode === 'local'}
                onClick={() => setSelectedMode('local')}
              >
                <Modal.ModeIcon>
                  <MonitorSpeaker size={20} />
                </Modal.ModeIcon>
                <Modal.ModeInfo>
                  <Modal.ModeTitle>Local Chat</Modal.ModeTitle>
                  <Modal.ModeDescription>
                    Private & secure, runs on your device
                  </Modal.ModeDescription>
                </Modal.ModeInfo>
              </Modal.ModeOption>

              <Modal.ModeOption
                $active={selectedMode === 'remote'}
                onClick={() => setSelectedMode('remote')}
                $disabled={!isRemoteConfigured}
              >
                <Modal.ModeIcon>
                  <Globe size={20} />
                </Modal.ModeIcon>
                <Modal.ModeInfo>
                  <Modal.ModeTitle>
                    Remote Chat
                    {!isRemoteConfigured && (
                      <Modal.ConfigWarning>(Not configured)</Modal.ConfigWarning>
                    )}
                  </Modal.ModeTitle>
                  <Modal.ModeDescription>
                    {isRemoteConfigured
                      ? 'Cloud-powered AI models'
                      : 'Configure API key in settings'}
                  </Modal.ModeDescription>
                </Modal.ModeInfo>
              </Modal.ModeOption>
            </Modal.ModeOptions>
          </Modal.Section>

          {/* Model Selection */}
          <Modal.Section>
            <Modal.SectionTitle>
              Select Model ({selectedMode === 'local' ? 'Local' : 'Remote'})
            </Modal.SectionTitle>

            {isLoading && <Modal.LoadingState>Loading available models...</Modal.LoadingState>}

            {!isLoading && getCurrentModels().length > 0 && (
              <Modal.ModelList>
                {getCurrentModels().map((model) => (
                  <Modal.ModelOption
                    key={model.id}
                    $active={selectedModel === model.name}
                    onClick={() => setSelectedModel(model.name)}
                  >
                    <Modal.ModelName>{model.name}</Modal.ModelName>
                    {model.description && (
                      <Modal.ModelDescription>{model.description}</Modal.ModelDescription>
                    )}
                  </Modal.ModelOption>
                ))}
              </Modal.ModelList>
            )}

            {!isLoading && getCurrentModels().length === 0 && (
              <Modal.EmptyState>
                No {selectedMode} models available.
                {selectedMode === 'local'
                  ? ' Please install Ollama models first.'
                  : ' Please check your remote configuration.'}
              </Modal.EmptyState>
            )}
          </Modal.Section>

          {/* Optional Title */}
          <Modal.Section>
            <Modal.SectionTitle>Chat Title (Optional)</Modal.SectionTitle>
            <Modal.Input
              type="text"
              placeholder="Enter a custom title for your chat..."
              value={customTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTitle(e.target.value)}
            />
          </Modal.Section>

          {error && <Modal.Error>{error}</Modal.Error>}
        </Modal.Content>

        <Modal.Footer>
          <Modal.Button $variant="secondary" onClick={onClose}>
            Cancel
          </Modal.Button>
          <Modal.Button
            $variant="primary"
            onClick={handleCreate}
            disabled={!selectedModel || isLoading}
          >
            Create Chat
          </Modal.Button>
        </Modal.Footer>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

const Modal = {
  Backdrop: Styled.div`
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
  `,
  Container: Styled.div`
    background: ${(props) => props.theme.colors.core};
    border-radius: 12px;
    border: 1px solid ${(props) => props.theme.colors.hunter};
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `,
  Header: Styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid ${(props) => props.theme.colors.hunter};
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  Title: Styled.h2`
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 1.25rem;
    margin: 0;
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
    
    &:hover {
      background: ${(props) => props.theme.colors.hunter};
    }
  `,
  Content: Styled.div`
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  `,
  Section: Styled.div`
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
  `,
  SectionTitle: Styled.h3`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.95rem;
    margin: 0 0 12px 0;
    font-weight: 600;
  `,
  ModeOptions: Styled.div`
    display: flex;
    gap: 12px;
  `,
  ModeOption: Styled.div<{ $active: boolean; $disabled?: boolean }>`
    flex: 1;
    padding: 16px;
    border: 2px solid ${(props) => (props.$active ? props.theme.colors.emerald : props.theme.colors.hunter)};
    background: ${(props) => (props.$active ? `${props.theme.colors.emerald}20` : 'transparent')};
    border-radius: 8px;
    cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
    opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
    
    &:hover {
      ${(props) =>
        !props.$disabled &&
        `
        border-color: ${props.theme.colors.emerald};
        background: ${props.theme.colors.emerald}10;
      `}
    }
  `,
  ModeIcon: Styled.div`
    color: ${(props) => props.theme.colors.emerald};
  `,
  ModeInfo: Styled.div`
    flex: 1;
  `,
  ModeTitle: Styled.div`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 4px;
  `,
  ModeDescription: Styled.div`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.8rem;
    opacity: 0.7;
  `,
  ConfigWarning: Styled.span`
    color: #f59e0b;
    font-size: 0.75rem;
    margin-left: 4px;
  `,
  ModelList: Styled.div`
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid ${(props) => props.theme.colors.hunter};
    border-radius: 6px;
  `,
  ModelOption: Styled.div<{ $active: boolean }>`
    padding: 12px 16px;
    border-bottom: 1px solid ${(props) => props.theme.colors.hunter};
    cursor: pointer;
    background: ${(props) => (props.$active ? `${props.theme.colors.emerald}20` : 'transparent')};
    transition: all 0.2s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: ${(props) => (props.$active ? `${props.theme.colors.emerald}20` : `${props.theme.colors.hunter}40`)};
    }
  `,
  ModelName: Styled.div`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 2px;
  `,
  ModelDescription: Styled.div`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.secondary.regular};
    font-size: 0.8rem;
    opacity: 0.6;
  `,
  Input: Styled.input`
    width: 100%;
    padding: 12px;
    border: 1px solid ${(props) => props.theme.colors.hunter};
    border-radius: 6px;
    background: transparent;
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.colors.emerald};
    }
    
    &::placeholder {
      color: ${(props) => props.theme.colors.notice};
      opacity: 0.5;
    }
  `,
  LoadingState: Styled.div`
    padding: 20px;
    text-align: center;
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    opacity: 0.7;
  `,
  EmptyState: Styled.div`
    padding: 20px;
    text-align: center;
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    opacity: 0.7;
    border: 1px solid ${(props) => props.theme.colors.hunter};
    border-radius: 6px;
  `,
  Error: Styled.div`
    background: #f59e0b20;
    border: 1px solid #f59e0b;
    color: #f59e0b;
    padding: 12px;
    border-radius: 6px;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.85rem;
    margin-top: 16px;
  `,
  Footer: Styled.div`
    padding: 20px 24px;
    border-top: 1px solid ${(props) => props.theme.colors.hunter};
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `,
  Button: Styled.button<{ $variant: 'primary' | 'secondary' }>`
    padding: 10px 20px;
    border-radius: 6px;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
    
    ${(props) =>
      props.$variant === 'primary'
        ? `
      background: ${props.theme.colors.emerald};
      color: ${props.theme.colors.core};
      border-color: ${props.theme.colors.emerald};
      
      &:hover:not(:disabled) {
        background: ${props.theme.colors.emerald}dd;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `
        : `
      background: transparent;
      color: ${props.theme.colors.notice};
      border-color: ${props.theme.colors.hunter};
      
      &:hover {
        background: ${props.theme.colors.hunter};
      }
    `}
  `,
};

export default ChatCreationModal;
