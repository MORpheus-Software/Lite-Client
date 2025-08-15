import React from 'react';
import Styled from 'styled-components';
import { X } from 'lucide-react';
import BackDropComponent from './backdrop';

interface ModelDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  modelName: string;
  progress: number;
  status: string;
  isComplete: boolean;
  error?: string;
}

const ModelDownloadModal: React.FC<ModelDownloadModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  modelName,
  progress,
  status,
  isComplete,
  error,
}) => {
  if (!isOpen) return null;

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <BackDropComponent>
      <Modal.Container>
        <Modal.Header>
          <Modal.Title>Downloading Model</Modal.Title>
          <Modal.CloseButton onClick={onClose}>
            <X size={20} />
          </Modal.CloseButton>
        </Modal.Header>

        <Modal.Content>
          <Modal.ModelName>{modelName}</Modal.ModelName>

          <Modal.ProgressSection>
            <Modal.ProgressBar>
              <Modal.ProgressFill $progress={progress} />
            </Modal.ProgressBar>
            <Modal.ProgressText>{progress}%</Modal.ProgressText>
          </Modal.ProgressSection>

          <Modal.StatusSection>
            {isComplete ? (
              <Modal.SuccessMessage>
                <Modal.SuccessIcon>✅</Modal.SuccessIcon>
                <Modal.SuccessText>Download Complete!</Modal.SuccessText>
              </Modal.SuccessMessage>
            ) : error ? (
              <Modal.Error>{error}</Modal.Error>
            ) : (
              status && <Modal.StatusText>{status}</Modal.StatusText>
            )}
          </Modal.StatusSection>
        </Modal.Content>

        <Modal.Footer>
          {!isComplete && !error && (
            <Modal.Button $variant="secondary" onClick={handleCancel}>
              Cancel Download
            </Modal.Button>
          )}
          {(isComplete || error) && (
            <Modal.Button $variant="primary" onClick={onClose}>
              Close
            </Modal.Button>
          )}
        </Modal.Footer>
      </Modal.Container>
    </BackDropComponent>
  );
};

const Modal = {
  Container: Styled.div`
    background-color: ${(props) => props.theme.colors.core};
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow: hidden;
  `,

  Header: Styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px 24px;
    border-bottom: 1px solid ${(props) => props.theme.colors.hunter};
  `,

  Title: Styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
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
    transition: background-color 0.2s ease;

    &:hover {
      background-color: ${(props) => props.theme.colors.hunter};
    }
  `,

  Content: Styled.div`
    padding: 24px;
    flex: 1;
    overflow-y: auto;
  `,

  ModelName: Styled.h3`
    font-size: 18px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.balance};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    margin: 0 0 24px 0;
    text-align: center;
  `,

  ProgressSection: Styled.div`
    width: 100%;
    margin-bottom: 24px;
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
    color: ${(props) => props.theme.colors.balance};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
  `,

  StatusSection: Styled.div`
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40px;
  `,

  StatusText: Styled.div`
    color: ${(props) => props.theme.colors.notice};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    max-width: 400px;
    word-wrap: break-word;
  `,

  SuccessMessage: Styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.emerald};
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: 18px;
    font-weight: 700;
  `,

  SuccessIcon: Styled.span`
    font-size: 24px;
    margin-right: 8px;
  `,

  SuccessText: Styled.span`
    font-size: 16px;
  `,

  Error: Styled.div`
    color: #ff4444;
    background-color: rgba(255, 68, 68, 0.1);
    border: 1px solid rgba(255, 68, 68, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
  `,

  Footer: Styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px 20px 24px;
    border-top: 1px solid ${(props) => props.theme.colors.hunter};
  `,

  Button: Styled.button<{ $variant: 'primary' | 'secondary' }>`
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    min-width: 100px;

    ${(props) =>
      props.$variant === 'primary'
        ? `
          background-color: ${props.theme.colors.emerald};
          color: white;
          &:hover {
            background-color: ${props.theme.colors.hunter};
          }
        `
        : `
          background-color: transparent;
          color: ${props.theme.colors.notice};
          border: 1px solid ${props.theme.colors.hunter};
          &:hover {
            background-color: ${props.theme.colors.hunter};
          }
        `}

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `,
};

export default ModelDownloadModal;
