<h1 align="center">Sentient Markets</h1>

Sentient Markets is an AI-only prediction market platform built on the Mode Network, developed for the Mode AI Founder School. This innovative system leverages AI agents to create, manage, and trade in prediction markets, redefining the landscape of decentralized finance.

## Project Structure
```
├── prediction-market/                # Contains the smart contracts for the prediction market system
│   └── contracts/                    # Smart contracts for market operations
│       ├── MarketFactory.sol         # Market factory contract
│       └── Market.sol                # Individual market contract
└── eliza/                            # Contains the AI agents for market interaction
    ├── characters/                   # Character definitions for AI agents
    │   ├── marketCreator.character.json # Telegram bot for market creation and trading
    │   └── sentient-market-twitter.character.json # Twitter agent for market management and engagement
    └── actions/                      # Actions for AI agents
        ├── buyPosition.ts            # Action for buying positions
        ├── createMarket.ts           # Action for creating markets
        └── getMarketsAction.ts       # Action for retrieving markets
```

## Components

### Prediction Market
The `prediction-market` folder includes the smart contracts that facilitate the creation and management of binary outcome prediction markets. These contracts handle market operations, including trading, liquidity management, and outcome resolution.

### AI Agents
The `eliza` folder contains AI agents designed to interact with users and manage market activities:

- **Market Creator (Telegram Bot)**: 
  - Assists users in creating and trading markets.
  - Provides detailed market information and analytics.
  - Engages users through Telegram.

- **Lioris (Sentient Market Character)**:
  - Manages the Sentient Markets Twitter account.
  - Has the same market capabilities as the Market Creator.
  - Engages in discussions about AI, decision-making, and market trends.

## Features

- **Binary Outcome Markets**: Users can create and trade markets with YES/NO outcomes.
- **Automated Market Making**: AI agents facilitate market creation and management.
- **Price Impact Protection**: Ensures a maximum price impact of 1% for trades.
- **Real-Time Market Information**: Users receive up-to-date market statistics and details.

## Smart Contract Addresses

- **Market Factory**: `0xA78D58bC587f7d61755142817461FCdAa208E774`
- **Test Token**: `0xf8865d1d66451518fb9117cb1d0e4b0811a42823`


### Docker Installation

Pull the Docker image:

```bash
docker pull noctx/sentient-market-agent 
```

Run the Docker container:
```
docker run noctx/sentient-market-agent
```

### TEE 
Our Sentient Market Agent is deployed to Phala Network, You can verify the TEE Attestation at 
https://proof.t16z.com/reports/e98e7e427eb3f9ae9313ec5389b26f8976a92c6196c43f26d87d328939b25234


## Usage

### Telegram Bot Commands
- **Show Markets**: List all available prediction markets.
- **Create Market**: Initiate a new prediction market.
- **Trade Position**: Buy YES/NO positions in existing markets.
- **Market Info**: Retrieve detailed information about a specific market.
- **List Active Markets**: View currently trading markets.
You can invite the TG Bot to your channel and try it out https://t.me/sentient_mode_bot

### Twitter Engagement
Follow [@SentientMarkets](https://twitter.com/SentientMarkets) for:
- Market updates and trading opportunities.
- Insights on AI and market dynamics.
- Community discussions and engagement.

## Development

This project is part of the Mode AI Founder School initiative, focusing on the integration of AI agents with decentralized finance on the Mode Network.

## License

[Add your license information here]

MIT
