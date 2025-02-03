# Sentient Markets Eliza 🤖

<div align="center">

📖 [Documentation](https://elizaos.github.io/eliza/)

</div>

## ✨ Features

- 🛠️ Full-featured Discord, Twitter, and Telegram connectors
- 🔗 Support for every model (Llama, Grok, OpenAI, Anthropic, etc.)
- 👥 Multi-agent and room support
- 📚 Easily ingest and interact with your documents
- 💾 Retrievable memory and document store
- 🚀 Highly extensible - create your own actions and clients
- ☁️ Supports many models (local Llama, OpenAI, Anthropic, Grok, etc.)
- 📦 Just works!
- 📈 **Sentient Markets Integration**: Includes the `@elizaos/plugin-sentient` package that holds all actions needed to interact with Sentient Markets.

## 🚀 Quick Start

### Prerequisites

- [Python 2.7+](https://www.python.org/downloads/)
- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)

### Edit the .env file

Copy `.env.example` to `.env` and fill in the appropriate values.

```bash
cp .env.example .env
```

### Manually Start Eliza

```bash
pnpm i
pnpm build
pnpm start

# The project iterates fast, sometimes you need to clean the project if you are coming back to the project
pnpm clean
```

## 📦 Sentient Markets Actions

The `@elizaos/plugin-sentient` package contains all the necessary actions for interacting with the Sentient Markets prediction market system. This includes functionalities for creating markets, trading positions, and retrieving market information.

### Example Actions

- **Create Market**: Action for creating new prediction markets.
- **Buy Position**: Action for purchasing positions in existing markets.
- **Get Markets**: Action for retrieving available markets and their details.

For more detailed usage and examples, refer to the documentation linked above.
