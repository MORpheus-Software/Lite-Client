# Release v0.6.0 - Enhanced Model Registry

## 🎉 Major Features

### Enhanced Model Registry
- **Improved UI/UX**: Complete redesign of the model registry with modern, clean interface
- **Current Model Indicator**: Shows the active model in the sidebar footer and registry header
- **Smart Default Selection**: Automatically selects `orca-mini:3b` as the default model
- **Visual Distinction**: Current model card is highlighted for easy identification

### Model Management
- **List View Default**: Registry now opens in list view by default for better organization
- **Uniform Action Buttons**: All action buttons (View, Pull, Replace) are now consistent in size and styling
- **Tag Filtering**: Filter models by tags using the dropdown selector
- **Model URL Display**: Shows "View on Ollama" link for each model with external link icon

### UI Improvements
- **Better Layout**: Improved spacing and alignment in list view
- **Centered Tags**: Model tags are now centered and properly styled
- **Grouped Information**: Model info is logically grouped for better readability
- **Scrollbar Styling**: Custom scrollbar styling for better visual consistency

### Technical Enhancements
- **Ollama Integration**: Enhanced backend integration with Ollama API
- **Error Handling**: Improved error handling and user feedback
- **Loading States**: Better loading indicators and progress feedback
- **TypeScript**: Full type safety throughout the application

## 🔧 Technical Details

- Updated to use community Ollama API for better model discovery
- Improved IPC communication between frontend and backend
- Enhanced error handling and logging
- Better state management for model operations

## 🐛 Bug Fixes

- Fixed list view alignment issues
- Resolved TypeScript compilation errors
- Fixed window border and content overflow issues
- Improved model pulling feedback and cancellation

## 📦 Installation

Download the latest release for your platform:
- macOS (ARM64): `morpheus-0.6.0-arm64.dmg`
- Windows: `morpheus-0.6.0-win32-x64.exe`
- Linux: `morpheus-0.6.0-linux-x64.deb`

## 🚀 Getting Started

1. Download and install the application
2. The app will automatically detect and connect to Ollama
3. Browse the enhanced model registry
4. Select and pull your preferred models
5. Start chatting with your local AI models!

---

**Note**: This release includes significant UI/UX improvements and enhanced model management capabilities. The registry now provides a much better experience for discovering and managing Ollama models. 