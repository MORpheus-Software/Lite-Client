import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface RegistryModelsProps {
  onModelPull?: (modelName: string) => void;
  isPulling?: string | null;
  onCancelPull?: () => void;
}

interface RegistryModel {
  name: string;
  description: string;
  modifiedAt: string;
  digest: string;
  tags: string[];
  url?: string;
  isInstalled: boolean;
  isDefault?: boolean;
}

const RegistryModels: React.FC<RegistryModelsProps> = ({
  onModelPull,
  isPulling,
  onCancelPull,
}) => {
  const [models, setModels] = useState<RegistryModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<RegistryModel | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  // Removed filtering and sorting state

  useEffect(() => {
    loadRegistryModels();
    loadCurrentModel();
  }, []);

  const loadRegistryModels = async () => {
    try {
      setLoading(true);

      const registryModels = await window.backendBridge.ollama.getAvailableModelsFromRegistry();
      console.log('Models received from backend:', registryModels);
      console.log('Models type:', typeof registryModels);
      console.log('Models length:', registryModels?.length);
      if (registryModels && registryModels.length > 0) {
        console.log('First model structure:', registryModels[0]);
        console.log(
          'First 3 model names:',
          registryModels.slice(0, 3).map((m) => m.name),
        );
      }
      setModels(registryModels);
      setError(null);
    } catch (err) {
      console.error('Failed to load registry models:', err);
      setError('Failed to load models from registry');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentModel = async () => {
    try {
      const current = await window.backendBridge.ollama.getCurrentModel();
      if (current?.name) {
        setCurrentModel(current);
      }
    } catch (err) {
      console.error('Failed to load current model:', err);
    }
  };

  const handleModelPull = (modelName: string) => {
    if (onModelPull) {
      onModelPull(modelName);
    }
  };

  const rawModels = models;

  const getAllTags = () => {
    return [];
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Model Registry</Title>
          <Subtitle>Loading models...</Subtitle>
        </Header>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Model Registry</Title>
          <Subtitle>Error: {error}</Subtitle>
        </Header>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <RetryButton onClick={loadRegistryModels}>Retry</RetryButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Model Registry</Title>
        <Subtitle>Discover and install AI models</Subtitle>
      </Header>

      <Controls>
        <DebugToggle>
          <ToggleButton onClick={() => setIsDebugMode(!isDebugMode)} $active={isDebugMode}>
            {isDebugMode ? 'Switch to Normal View' : 'Switch to Debug View'}
          </ToggleButton>
        </DebugToggle>
        {isDebugMode && (
          <>
            <div>No filtering - showing raw data</div>
            <div>Raw API Data</div>
          </>
        )}
      </Controls>

      {isDebugMode ? (
        <TableContainer>
          <Table>
            <TableHeader>
              <HeaderCell>Name</HeaderCell>
              <HeaderCell>Raw Tags</HeaderCell>
              <HeaderCell>Raw Data</HeaderCell>
              <HeaderCell>Action</HeaderCell>
            </TableHeader>

            <TableBody>
              {rawModels.map((model: any, index: number) => (
                <TableRow key={`${model.name}-${index}`}>
                  <TableCell>
                    <ModelName>{model.name}</ModelName>
                  </TableCell>
                  <TableCell>
                    <Tags>{JSON.stringify(model.tags)}</Tags>
                  </TableCell>
                  <TableCell>
                    <div>{JSON.stringify(model)}</div>
                  </TableCell>
                  <TableCell>
                    <ActionButton
                      onClick={() => handleModelPull(model.name)}
                      disabled={isPulling === model.name && isPulling !== null}
                      isCurrent={!!(currentModel && currentModel.name === model.name)}
                    >
                      {currentModel && currentModel.name === model.name
                        ? 'In Use'
                        : model.isInstalled
                          ? 'Load'
                          : isPulling === model.name
                            ? 'Pulling...'
                            : 'Pull'}
                    </ActionButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <NormalTableContainer>
          <NormalTable>
            <NormalTableHeader>
              <tr>
                <NormalHeaderCell>Model Name</NormalHeaderCell>
                <NormalHeaderCell>Action</NormalHeaderCell>
              </tr>
            </NormalTableHeader>
            <NormalTableBody>
              {models.map((model) => (
                <NormalTableRow key={model.name}>
                  <NormalTableCell>
                    <ModelName>{model.name}</ModelName>
                  </NormalTableCell>
                  <NormalTableCell>
                    <ActionButton
                      onClick={() => handleModelPull(model.name)}
                      disabled={isPulling === model.name}
                      isCurrent={!!(currentModel && currentModel.name === model.name)}
                    >
                      {currentModel && currentModel.name === model.name
                        ? 'In Use'
                        : model.isInstalled
                          ? 'Load'
                          : isPulling === model.name
                            ? 'Pulling...'
                            : 'Pull'}
                    </ActionButton>
                  </NormalTableCell>
                </NormalTableRow>
              ))}
            </NormalTableBody>
          </NormalTable>
        </NormalTableContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  background: white;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  margin-bottom: 20px;
  flex-shrink: 0;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1a1a1a;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  flex: 1;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
`;

const TagFilter = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
  flex: 1;
  overflow-y: auto;
`;

const TableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
`;

const TableHeader = styled.thead`
  background: #f8f9fa;
`;

const HeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #ddd;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #eee;

  &:hover {
    background: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  vertical-align: top;
`;

const ModelName = styled.div`
  font-weight: 500;
  color: #333;
`;

const Tags = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
`;

const TagMore = styled.span`
  color: #666;
  font-size: 11px;
  font-weight: 500;
`;

const Status = styled.div`
  white-space: nowrap;
  min-width: 100px;
`;

const CurrentStatus = styled.span`
  color: #28a745;
  font-weight: 500;
  font-size: 12px;
`;

const InstalledStatus = styled.span`
  color: #007bff;
  font-weight: 500;
  font-size: 12px;
`;

const NotInstalledStatus = styled.span`
  color: #666;
  font-size: 12px;
  white-space: nowrap;
`;

const ActionButton = styled.button<{ isCurrent?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${(props) => (props.isCurrent ? '#28a745' : '#ddd')};
  border-radius: 4px;
  background: ${(props) => (props.isCurrent ? '#28a745' : 'white')};
  color: ${(props) => (props.isCurrent ? 'white' : '#333')};
  font-size: 12px;
  font-weight: 500;
  cursor: ${(props) => (props.isCurrent ? 'default' : 'pointer')};

  &:hover:not(:disabled) {
    background: ${(props) => (props.isCurrent ? '#28a745' : '#f8f9fa')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 40px;
`;

const ErrorText = styled.div`
  color: #dc3545;
  margin-bottom: 16px;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }
`;

const DebugToggle = styled.div`
  margin-right: 16px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  background: ${(props) => (props.$active ? '#28a745' : '#f8f9fa')};
  color: ${(props) => (props.$active ? 'white' : '#333')};
  border: 1px solid ${(props) => (props.$active ? '#28a745' : '#ddd')};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$active ? '#218838' : '#e9ecef')};
    border-color: ${(props) => (props.$active ? '#1e7e34' : '#adb5bd')};
  }
`;

// Normal view table components
const NormalTableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
`;

const NormalTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const NormalTableHeader = styled.thead`
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
`;

const NormalHeaderCell = styled.th`
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
`;

const NormalTableBody = styled.tbody``;

const NormalTableRow = styled.tr`
  &:hover {
    background: #f8f9fa;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #e9ecef;
  }
`;

const NormalTableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  vertical-align: middle;
`;

const ModelDescription = styled.div`
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export default RegistryModels;
