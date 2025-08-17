
# Morpheus Lite Client

> **Private, Sovereign AI** - Chat with AI models locally without compromising your privacy

![Morpheus](src/frontend/assets/images/logo.png)

## Overview

Morpheus is a cross-platform desktop application that provides private AI conversations using local models via Ollama, with optional cloud inference through the Morpheus API. Built with Electron, React, and TypeScript.

**Current Version:** `0.7.4-daily.6`

## What Makes Morpheus Different

- 🔐 **Privacy First** - Your conversations never leave your device (local mode)
- 🏠 **Self-Hosted AI** - Run models locally with Ollama integration
- 🌐 **Hybrid Inference** - Choose between local privacy or cloud performance
- 💳 **Web3 Ready** - MetaMask integration for blockchain interactions
- 🎯 **Zero Setup** - Automatic Ollama detection and model management

## Installation

### Download Pre-built Binaries

| Platform | Download |
|----------|----------|
| Windows | `morpheus-{version}-win32-x64.exe` |
| macOS (Apple Silicon) | `morpheus-{version}-arm64.dmg` |
| macOS (Intel) | `morpheus-{version}-x64.dmg` |
| Linux | `morpheus-{version}-linux-x64.deb` |

📥 **[Get Latest Release](https://github.com/MORpheus-Software/Lite-Client/releases)**

### Build from Source

```bash
# Clone repository
git clone https://github.com/MORpheus-Software/Lite-Client.git
cd Lite-Client

# Install dependencies (requires Node.js 16+ and Yarn)
yarn install

# Development
yarn start

# Build for production
yarn build
```

## Quick Start Guide

1. **Launch Morpheus** - The app auto-detects Ollama installation
2. **Browse Models** - Go to Models tab to download AI models
3. **Create Chat** - Start a new conversation in local or remote mode
4. **Connect Wallet** (Optional) - Link MetaMask for blockchain features

## Core Features

### AI Chat Interface
- Multiple conversation management
- Message history persistence
- Real-time streaming responses
- Model switching per conversation

### Model Management
- Browse and download models from Ollama registry
- Monitor disk space and model sizes
- Filter by tags and categories
- One-click model installation

### Inference Modes

| Mode | Description | Privacy | Performance |
|------|-------------|---------|-------------|
| **Local** | Ollama models on your machine | 🟢 Complete | Depends on hardware |
| **Remote** | Morpheus API cloud inference | 🟡 API calls logged | 🟢 High performance |

### Blockchain Integration
- MetaMask wallet connection
- ETH balance checking
- Transaction execution via chat
- Address validation and formatting

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│  Electron Main   │◄──►│   Ollama API    │
│   (Renderer)     │    │   (IPC Bridge)   │    │   (Local AI)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌──────────────────┐              
│  MetaMask SDK   │    │  Morpheus API    │              
│  (Web3)         │    │  (Remote AI)     │              
└─────────────────┘    └──────────────────┘              
```

**Tech Stack:**
- **Frontend:** React 19, TypeScript, Styled Components
- **Backend:** Electron, Node.js, IPC communication
- **AI:** Ollama (local), Morpheus API (remote)
- **Web3:** MetaMask SDK, Ethers.js
- **Build:** Electron Forge, Webpack

## Configuration

### Environment Setup
```bash
# Required for development
export NODE_ENV=development
export DEBUG=electron-packager

# Optional: Apple Developer credentials for macOS signing
export APPLE_DEVELOPER_ID="Developer ID Application: ..."
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

### Settings
- **Models Path:** Configure where Ollama models are stored
- **API Configuration:** Set Morpheus API endpoint and credentials
- **Performance:** Adjust memory and processing preferences

## Development

### Project Structure
```
src/
├── backend/           # Electron main process
│   ├── services/      # AI, wallet, and system services
│   └── handlers.ts    # IPC request handlers
├── frontend/          # React application
│   ├── components/    # UI components
│   ├── views/         # Main application views
│   └── utils/         # Utilities and helpers
└── events.ts          # IPC channel definitions
```

### Available Scripts
```bash
yarn start             # Development mode
yarn package           # Package for current platform
yarn make              # Build for all platforms
yarn lint              # Run ESLint
yarn pretty            # Format code with Prettier
```

### Release Process
```bash
# GitHub releases (uses existing signed artifacts)
./release-github.sh daily    # Pre-release build
./release-github.sh patch    # Patch version
./release-github.sh minor    # Minor version
./release-github.sh major    # Major version
```

> **Important:** This project publishes exclusively to GitHub releases, never npm

## Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Submit a pull request

### Developer Rewards
- 🏆 **Join [mor.software](https://mor.software/)** to earn rewards for merged contributions
- 📝 **Submit MRCs** (Morpheus Request for Comments) for feature proposals
- 🤖 **Build Smart Agents** on the Morpheus platform

### Code Guidelines
- TypeScript strict mode enabled
- Prettier formatting enforced
- ESLint rules configured
- Test changes on all supported platforms

## Support & Community

- 🐛 **Issues:** [GitHub Issues](https://github.com/MORpheus-Software/Lite-Client/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/MORpheus-Software/Lite-Client/discussions)
- 🌐 **Website:** [mor.software](https://mor.software/)
- 📚 **Documentation:** [GitHub Wiki](https://github.com/MORpheus-Software/Lite-Client/wiki)

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Morpheus** - Bringing private, sovereign AI to everyone.

*Built with ❤️ by the Morpheus community*
