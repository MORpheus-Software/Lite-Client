import React, { useState, useEffect, useCallback } from 'react';
import styled, { useTheme } from 'styled-components';

// Import types from the backend bridge
import { RegistryModel } from '../renderer.d';

// Types for our models - use the actual backend response types
interface LocalModel {
  name: string;
  size: number;
  modified_at: Date; // This comes from ollama as Date, not string
}

// Use RegistryModel directly for community models since that's what backend returns
type CommunityModel = RegistryModel;

interface RemoteModel {
  id: string;
  blockchainID: string;
  tags: string[];
  isFavorite?: boolean;
}

// Debounce utility function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Favorite storage functions
const getFavorites = (): string[] => {
  const stored = localStorage.getItem('morpheus-favorites');
  return stored ? JSON.parse(stored) : [];
};

const saveFavorites = (blockchainIDs: string[]): void => {
  localStorage.setItem('morpheus-favorites', JSON.stringify(blockchainIDs));
};

const toggleFavorite = (blockchainID: string): boolean => {
  const favorites = getFavorites();
  const index = favorites.indexOf(blockchainID);
  if (index === -1) {
    favorites.push(blockchainID);
  } else {
    favorites.splice(index, 1);
  }
  saveFavorites(favorites);
  return index === -1; // return new favorite status
};

const ModelsView: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'local' | 'remote'>('local');
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [communityModels, setCommunityModels] = useState<CommunityModel[]>([]);
  const [remoteModels, setRemoteModels] = useState<RemoteModel[]>([]);
  const [loading, setLoading] = useState(false);

  // Model count state (for display only)
  const [totalModels, setTotalModels] = useState(0);

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'downloads' | 'name' | 'updated_at' | 'last_updated'>(
    'downloads',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSearching, setIsSearching] = useState(false);

  // Model info modal state
  const [showModelInfoModal, setShowModelInfoModal] = useState(false);
  const [selectedModelInfo, setSelectedModelInfo] = useState<{
    name: string;
    description: string;
    tags: string[];
    examples: string[];
    parameters: Record<string, string>;
    url: string;
  } | null>(null);
  const [loadingModelInfo, setLoadingModelInfo] = useState(false);

  // Load data when tab changes
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'local') {
        // Load downloaded models
        const localResponse = await window.backendBridge.ollama.getAllModels();
        setLocalModels(localResponse.models || []);

        // Load community models (always 500 limit, no pagination)
        const communityResponse = await window.backendBridge.ollama.getAvailableModelsFromRegistry(
          searchQuery || undefined,
          sortBy,
          sortOrder,
        );
        setCommunityModels(communityResponse || []);

        // Extract total count if available
        if (communityResponse && (communityResponse as any).total_count) {
          const total = (communityResponse as any).total_count;
          setTotalModels(total);
        }
      } else {
        // Load remote models
        const remoteResponse = await window.backendBridge.morpheus.getModels();
        const favorites = getFavorites();

        // Set favorite status based on stored favorites
        const modelsWithFavorites = (remoteResponse || []).map((model) => ({
          ...model,
          isFavorite: favorites.includes(model.blockchainID),
        }));

        setRemoteModels(modelsWithFavorites);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (modelName: string) => {
    try {
      await window.backendBridge.ollama.getModel(modelName);
      // Refresh local models
      if (activeTab === 'local') {
        loadTabData();
      }
    } catch (error) {
      console.error('Failed to download model:', error);
    }
  };

  const handleDelete = async (modelName: string) => {
    if (confirm(`Are you sure you want to delete ${modelName}?`)) {
      try {
        await window.backendBridge.ollama.deleteModel(modelName);
        // Refresh local models
        loadTabData();
      } catch (error) {
        console.error('Failed to delete model:', error);
      }
    }
  };

  const handleToggleFavorite = (modelId: string) => {
    const model = remoteModels.find((m) => m.id === modelId);
    if (!model) return;

    const newFavoriteStatus = toggleFavorite(model.blockchainID);

    // Update the model state
    setRemoteModels((prevModels) =>
      prevModels.map((m) => (m.id === modelId ? { ...m, isFavorite: newFavoriteStatus } : m)),
    );
  };

  const handleModelInfo = async (modelUrl: string, modelName: string) => {
    setLoadingModelInfo(true);
    try {
      const response = await window.backendBridge.ollama.getModelInfo(modelUrl, modelName);
      if (response.success && response.data) {
        setSelectedModelInfo(response.data);
        setShowModelInfoModal(true);
      } else {
        console.error('Failed to get model info:', response.error);
        alert('Failed to load model information. Please try again.');
      }
    } catch (error) {
      console.error('Failed to get model info:', error);
      alert('Failed to load model information. Please try again.');
    } finally {
      setLoadingModelInfo(false);
    }
  };

  const handleLocalModelInfo = async (modelName: string) => {
    setLoadingModelInfo(true);
    try {
      const response = await window.backendBridge.ollama.getLocalModelInfo(modelName);
      if (response.success && response.data) {
        setSelectedModelInfo(response.data);
        setShowModelInfoModal(true);
      } else {
        console.error('Failed to get local model info:', response.error);
        alert('Failed to load model information. Please try again.');
      }
    } catch (error) {
      console.error('Failed to get local model info:', error);
      alert('Failed to load model information. Please try again.');
    } finally {
      setLoadingModelInfo(false);
    }
  };

  const closeModelInfoModal = () => {
    setShowModelInfoModal(false);
    setSelectedModelInfo(null);
  };

  // Simplified search - no pagination, get all results
  const performSearch = async (query: string) => {
    setIsSearching(true);

    try {
      console.log(`🔍 DEBUG: Search query: '${query}'`);
      const response = await window.backendBridge.ollama.getAvailableModelsFromRegistry(
        query || undefined,
        sortBy,
        sortOrder,
      );

      setCommunityModels(response || []);

      // Extract total count if available
      if (response && (response as any).total_count) {
        const total = (response as any).total_count;
        setTotalModels(total);
      }

      console.log(`🔍 DEBUG: Search complete - got ${response?.length || 0} results`);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim()) {
        await performSearch(query);
      } else {
        // No search - reload with fixed parameters
        await loadTabData();
      }
    }, 300),
    [sortBy, sortOrder],
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Handle sort change
  const handleSortChange = async (newSortBy: string) => {
    setSortBy(newSortBy as 'downloads' | 'name' | 'updated_at' | 'last_updated');
    if (searchQuery.trim()) {
      // Re-search with new sort
      await performSearch(searchQuery);
    } else {
      // Reload data (no sort controls when not searching, so this won't be called)
      await loadTabData();
    }
  };

  // Handle sort order toggle
  const handleSortOrderToggle = async () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    if (searchQuery.trim()) {
      // Re-search with new sort order
      await performSearch(searchQuery);
    } else {
      // Reload data (no sort controls when not searching, so this won't be called)
      await loadTabData();
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    debouncedSearch('');
  };

  return (
    <Container>
      <Header>
        <Title>Models</Title>
        <TabContainer>
          <Tab active={activeTab === 'local'} onClick={() => setActiveTab('local')}>
            Local Mode
          </Tab>
          <Tab active={activeTab === 'remote'} onClick={() => setActiveTab('remote')}>
            Remote Mode
          </Tab>
        </TabContainer>
      </Header>

      <Content>
        {loading ? (
          <LoadingMessage>Loading models...</LoadingMessage>
        ) : (
          <>
            {activeTab === 'local' ? (
              <LocalTabContent
                localModels={localModels}
                communityModels={communityModels}
                onDownload={handleDownload}
                onDelete={handleDelete}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onClearSearch={handleClearSearch}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onSortOrderToggle={handleSortOrderToggle}
                isSearching={isSearching}
                totalModels={totalModels}
                onModelInfo={handleModelInfo}
                onLocalModelInfo={handleLocalModelInfo}
                loadingModelInfo={loadingModelInfo}
              />
            ) : (
              <RemoteTabContent
                remoteModels={remoteModels}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </>
        )}
      </Content>

      {/* Model Info Modal */}
      {showModelInfoModal && selectedModelInfo && (
        <ModelInfoModal>
          <ModalOverlay onClick={closeModelInfoModal} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{selectedModelInfo.name}</ModalTitle>
              <CloseButton onClick={closeModelInfoModal}>✕</CloseButton>
            </ModalHeader>

            <ModalBody>
              <InfoSection>
                <SectionLabel>Description</SectionLabel>
                <InfoText>{selectedModelInfo.description}</InfoText>
              </InfoSection>

              {selectedModelInfo.tags.length > 0 && (
                <InfoSection>
                  <SectionLabel>Tags</SectionLabel>
                  <TagsContainer>
                    {selectedModelInfo.tags.map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                  </TagsContainer>
                </InfoSection>
              )}

              {Object.keys(selectedModelInfo.parameters).length > 0 && (
                <InfoSection>
                  <SectionLabel>Parameters</SectionLabel>
                  <ParametersContainer>
                    {Object.entries(selectedModelInfo.parameters).map(([key, value]) => (
                      <Parameter key={key}>
                        <ParameterKey>{key}:</ParameterKey>
                        <ParameterValue>{value}</ParameterValue>
                      </Parameter>
                    ))}
                  </ParametersContainer>
                </InfoSection>
              )}

              {selectedModelInfo.examples.length > 0 && (
                <InfoSection>
                  <SectionLabel>Examples</SectionLabel>
                  {selectedModelInfo.examples.map((example, index) => (
                    <CodeExample key={index}>{example}</CodeExample>
                  ))}
                </InfoSection>
              )}
            </ModalBody>

            <ModalFooter>
              {selectedModelInfo.url && (
                <ActionButton
                  variant="info"
                  onClick={() => window.open(selectedModelInfo.url, '_blank')}
                >
                  View on Ollama
                </ActionButton>
              )}
              <ActionButton variant="download" onClick={closeModelInfoModal}>
                Close
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </ModelInfoModal>
      )}
    </Container>
  );
};

// Local Tab Component
const LocalTabContent: React.FC<{
  localModels: LocalModel[];
  communityModels: CommunityModel[];
  onDownload: (modelName: string) => void;
  onDelete: (modelName: string) => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string) => void;
  onSortOrderToggle: () => void;
  isSearching: boolean;
  totalModels: number;
  onModelInfo: (modelUrl: string, modelName: string) => void;
  onLocalModelInfo: (modelName: string) => void;
  loadingModelInfo: boolean;
}> = ({
  localModels,
  communityModels,
  onDownload,
  onDelete,
  searchQuery,
  onSearchChange,
  onClearSearch,
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderToggle,
  isSearching,
  totalModels,
  onModelInfo,
  onLocalModelInfo,
  loadingModelInfo,
}) => {
  return (
    <LocalContainer>
      <Section>
        <SectionTitle>Downloaded Models</SectionTitle>
        <ModelList>
          {localModels.map((model) => (
            <ModelItem key={model.name}>
              <ModelInfo>
                <ModelName>{model.name}</ModelName>
                <ModelMeta>Size: {(model.size / (1024 * 1024 * 1024)).toFixed(1)}GB</ModelMeta>
              </ModelInfo>
              <ModelActions>
                <ActionButton
                  variant="info"
                  onClick={() => onLocalModelInfo(model.name)}
                  disabled={loadingModelInfo}
                >
                  {loadingModelInfo ? 'Loading...' : 'Info'}
                </ActionButton>
                <ActionButton variant="delete" onClick={() => onDelete(model.name)}>
                  Delete
                </ActionButton>
              </ModelActions>
            </ModelItem>
          ))}
          {localModels.length === 0 && <EmptyMessage>No models downloaded</EmptyMessage>}
        </ModelList>
      </Section>

      <Section>
        <SectionTitle>Available Models{totalModels > 0 && ` (${totalModels} total)`}</SectionTitle>

        {/* Search Controls (Sort controls only shown when searching) */}
        <SearchContainer>
          <SearchAndSortRow>
            <SearchInput>
              <SearchField
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={onSearchChange}
              />
              {searchQuery && <ClearButton onClick={onClearSearch}>✕</ClearButton>}
            </SearchInput>

            {searchQuery.trim() && (
              <SortControls>
                <SortLabel>Sort by:</SortLabel>
                <SortSelect
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    onSortChange(e.target.value)
                  }
                >
                  <option value="downloads">Most Popular</option>
                  <option value="name">Name</option>
                  <option value="updated_at">Recently Updated</option>
                  <option value="last_updated">Last Updated</option>
                </SortSelect>
                <SortOrderButton onClick={onSortOrderToggle}>
                  {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
                </SortOrderButton>
              </SortControls>
            )}
          </SearchAndSortRow>

          {/* Search Results Info */}
          {searchQuery.trim() && (
            <SearchResultsInfo>
              {isSearching
                ? 'Searching...'
                : `Found ${communityModels.length} models for "${searchQuery}"`}
            </SearchResultsInfo>
          )}
        </SearchContainer>

        {communityModels.length === 0 ? (
          <>
            {isSearching && <LoadingMessage>Searching...</LoadingMessage>}
            {searchQuery && !isSearching && (
              <EmptyMessage>No models found for "{searchQuery}"</EmptyMessage>
            )}
            {!searchQuery && !isSearching && <EmptyMessage>No models available</EmptyMessage>}
          </>
        ) : (
          <ModelTable>
            <TableHeader>
              <TableHeaderRow>
                <TableHeaderCell>Model Name</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableHeaderRow>
            </TableHeader>
            <TableBody>
              {communityModels.map((model) => (
                <TableRow key={model.name}>
                  <ModelNameCell>{model.name}</ModelNameCell>
                  <ActionCell>
                    <ModelActions>
                      <ActionButton
                        variant="info"
                        onClick={() => onModelInfo(model.url || '', model.name)}
                        disabled={loadingModelInfo}
                      >
                        {loadingModelInfo ? 'Loading...' : 'Info'}
                      </ActionButton>
                      <ActionButton variant="download" onClick={() => onDownload(model.name)}>
                        {model.isInstalled ? 'Installed' : 'Download'}
                      </ActionButton>
                    </ModelActions>
                  </ActionCell>
                </TableRow>
              ))}
            </TableBody>
          </ModelTable>
        )}
      </Section>
    </LocalContainer>
  );
};

// Remote Tab Component
const RemoteTabContent: React.FC<{
  remoteModels: RemoteModel[];
  onToggleFavorite: (modelId: string) => void;
}> = ({ remoteModels, onToggleFavorite }) => (
  <Section>
    <SectionTitle>Morpheus API Models</SectionTitle>
    {remoteModels.length === 0 ? (
      <EmptyMessage>No remote models available</EmptyMessage>
    ) : (
      <ModelTable>
        <TableHeader>
          <TableHeaderRow>
            <TableHeaderCell>Model Name</TableHeaderCell>
            <TableHeaderCell>Tags</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
          {remoteModels.map((model) => (
            <TableRow key={model.id}>
              <ModelNameCell>{model.id}</ModelNameCell>
              <TagsCell>{model.tags.join(', ')}</TagsCell>
              <ActionCell>
                <ActionButton
                  variant={model.isFavorite ? 'favorited' : 'favorite'}
                  onClick={() => onToggleFavorite(model.id)}
                >
                  {model.isFavorite ? 'Unfavorite' : 'Favorite'}
                </ActionButton>
              </ActionCell>
            </TableRow>
          ))}
        </TableBody>
      </ModelTable>
    )}
  </Section>
);

// Styled Components
const Container = styled.div`
  padding: 30px;
  background: ${(props) => props.theme.colors.core};
  color: ${(props) => props.theme.colors.notice};
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  margin-bottom: 30px;
  flex-shrink: 0;
`;

const Title = styled.h1`
  color: ${(props) => props.theme.colors.emerald};
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const Tab = styled.button.withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop),
})<{ active: boolean }>`
  padding: 12px 24px;
  background: ${(props) => (props.active ? props.theme.colors.emerald : 'transparent')};
  color: ${(props) => (props.active ? props.theme.colors.background : props.theme.colors.emerald)};
  border: 2px solid ${(props) => props.theme.colors.emerald};
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.active ? props.theme.colors.emerald : props.theme.colors.emerald + '20'};
  }
`;

const Content = styled.div`
  background: transparent;
  border-radius: 12px;
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const LocalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  flex: 1;
  overflow-y: auto;
`;

const Section = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  background: ${(props) => props.theme.colors.hunter};
  border-radius: 15px;
  flex-shrink: 0;
`;

const SectionTitle = styled.h2`
  color: ${(props) => props.theme.colors.emerald};
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
`;

const ModelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
`;

const ModelItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(2, 44, 51, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(253, 179, 102, 0.2);
`;

const ModelInfo = styled.div`
  flex: 1;
`;

const ModelName = styled.div`
  color: ${(props) => props.theme.colors.notice};
  font-weight: 500;
  margin-bottom: 4px;
`;

const ModelMeta = styled.div`
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 12px;
`;

const ModelActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

// Table-style components for Remote Models
const ModelTable = styled.div`
  display: table;
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.div`
  display: table-header-group;
`;

const TableHeaderRow = styled.div`
  display: table-row;
`;

const TableHeaderCell = styled.div`
  display: table-cell;
  padding: 10px 15px;
  color: ${(props) => props.theme.colors.emerald};
  font-weight: 600;
  border-bottom: 2px solid rgba(23, 156, 101, 0.3);
`;

const TableBody = styled.div`
  display: table-row-group;
`;

const TableRow = styled.div`
  display: table-row;
  &:hover {
    background: rgba(23, 156, 101, 0.1);
  }
`;

const TableCell = styled.div`
  display: table-cell;
  padding: 15px;
  border-bottom: 1px solid rgba(253, 179, 102, 0.2);
  vertical-align: middle;
`;

const ModelNameCell = styled(TableCell)`
  font-weight: 700;
  color: ${(props) => props.theme.colors.notice};
`;

const TagsCell = styled(TableCell)`
  color: ${(props) => props.theme.colors.textSecondary};
`;

const ActionCell = styled(TableCell)`
  text-align: right;
  width: 120px;
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop),
})<{ variant: string }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;

  ${(props) => {
    switch (props.variant) {
      case 'info':
        return `
          background: ${props.theme.colors.hunter};
          color: ${props.theme.colors.notice};
          border: 1px solid ${props.theme.colors.emerald};
          &:hover { background: rgba(23, 156, 101, 0.8); }
        `;
      case 'download':
        return `
          background: ${props.theme.colors.emerald};
          color: ${props.theme.colors.background};
          &:hover { background: ${props.theme.colors.emerald}dd; }
        `;
      case 'delete':
        return `
          background: #ff4444;
          color: white;
          &:hover { background: #ff4444dd; }
        `;
      case 'favorite':
        return `
          background: transparent;
          color: ${props.theme.colors.emerald};
          border: 1px solid ${props.theme.colors.emerald};
          &:hover { background: ${props.theme.colors.emerald}20; }
        `;
      case 'favorited':
        return `
          background: ${props.theme.colors.emerald};
          color: ${props.theme.colors.background};
          &:hover { background: ${props.theme.colors.emerald}dd; }
        `;
      default:
        return '';
    }
  }}
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: ${(props) => props.theme.colors.textSecondary};
  padding: 40px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: ${(props) => props.theme.colors.textSecondary};
  padding: 20px;
  font-style: italic;
`;

// Search and Sort Components
const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const SearchAndSortRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchResultsInfo = styled.div`
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 14px;
  font-style: italic;
  padding: 8px 0;
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const SearchField = styled.input`
  flex: 1;
  padding: 12px 40px 12px 15px;
  border: 1px solid rgba(253, 179, 102, 0.3);
  border-radius: 8px;
  background: rgba(2, 44, 51, 0.5);
  color: ${(props) => props.theme.colors.notice};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.emerald};
  }

  &::placeholder {
    color: rgba(253, 179, 102, 0.6);
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  font-size: 14px;

  &:hover {
    color: ${(props) => props.theme.colors.core};
  }
`;

const SortControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const SortLabel = styled.span`
  color: ${(props) => props.theme.colors.core};
  font-size: 14px;
  font-weight: 500;
`;

const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 6px;
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.core};
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.emerald};
  }
`;

const SortOrderButton = styled.button`
  padding: 8px 16px;
  border: 1px solid ${(props) => props.theme.colors.emerald};
  border-radius: 6px;
  background: transparent;
  color: ${(props) => props.theme.colors.emerald};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => props.theme.colors.emerald}20;
  }
`;

// Pagination Components for Search Results
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 20px;
  margin-top: 10px;
`;

const PaginationButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${(props) => props.theme.colors.emerald};
  border-radius: 6px;
  background: ${(props) => (props.disabled ? 'transparent' : 'transparent')};
  color: ${(props) =>
    props.disabled ? props.theme.colors.textSecondary : props.theme.colors.emerald};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover {
    background: ${(props) => (!props.disabled ? props.theme.colors.emerald + '20' : 'transparent')};
  }
`;

const PaginationInfo = styled.span`
  color: ${(props) => props.theme.colors.core};
  font-size: 14px;
  font-weight: 500;
  margin: 0 8px;
`;

const PaginationNumbers = styled.div`
  display: flex;
  gap: 4px;
`;

const PaginationNumber = styled.button<{ active: boolean }>`
  width: 36px;
  height: 36px;
  border: 1px solid
    ${(props) => (props.active ? props.theme.colors.emerald : props.theme.colors.border)};
  border-radius: 6px;
  background: ${(props) => (props.active ? props.theme.colors.emerald : 'transparent')};
  color: ${(props) => (props.active ? props.theme.colors.background : props.theme.colors.core)};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.active ? props.theme.colors.emerald : props.theme.colors.emerald + '20'};
    border-color: ${(props) => props.theme.colors.emerald};
  }
`;

// Model Info Modal Components
const ModelInfoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
`;

const ModalContent = styled.div`
  position: relative;
  background: ${(props) => props.theme.colors.background};
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const ModalTitle = styled.h2`
  color: ${(props) => props.theme.colors.emerald};
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 18px;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: ${(props) => props.theme.colors.core};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const InfoSection = styled.div`
  margin-bottom: 20px;
`;

const SectionLabel = styled.h3`
  color: ${(props) => props.theme.colors.core};
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const InfoText = styled.p`
  color: ${(props) => props.theme.colors.core};
  margin: 0;
  line-height: 1.5;
`;

const TagsContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background: ${(props) => props.theme.colors.emerald}20;
  color: ${(props) => props.theme.colors.emerald};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const ParametersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Parameter = styled.div`
  display: flex;
  gap: 8px;
`;

const ParameterKey = styled.span`
  color: ${(props) => props.theme.colors.emerald};
  font-weight: 500;
  min-width: 80px;
`;

const ParameterValue = styled.span`
  color: ${(props) => props.theme.colors.core};
`;

const CodeExample = styled.pre`
  background: rgba(2, 44, 51, 0.3);
  border: 1px solid rgba(253, 179, 102, 0.2);
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  color: ${(props) => props.theme.colors.core};
  font-size: 14px;
  overflow-x: auto;
  white-space: pre-wrap;
`;

export default ModelsView;
