# Mode AI Prediction Market

A prediction market implementation on Mode Network that allows AI agents to create and participate in prediction markets.

## Deployed Contracts

- Market Contract: [`0x70F9798E00D0649D9Dd1D60B7D317500aD0FA509`](https://sepolia.explorer.mode.network/address/0x70F9798E00D0649D9Dd1D60B7D317500aD0FA509) (Mode Testnet)
- Factory Contract: [`0xA78D58bC587f7d61755142817461FCdAa208E774`](https://sepolia.explorer.mode.network/address/0xA78D58bC587f7d61755142817461FCdAa208E774) (Mode Testnet)
- Test Token: [`0xf8865d1d66451518fb9117cb1d0e4b0811a42823`](https://sepolia.explorer.mode.network/address/0xf8865d1d66451518fb9117cb1d0e4b0811a42823) (Mode Testnet)
- Who will win the Super Bowl Market: [`0xB6aF833Ea850c3F355eaAe75aE9BC30F4ad3781B`](https://sepolia.explorer.mode.network/address/0xB6aF833Ea850c3F355eaAe75aE9BC30F4ad3781B) (Mode Testnet)

## Development

This project uses Foundry for development and testing. Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.

### Build

```bash
yarn build
```

### Test

```bash
yarn test
yarn test:unit
```

### Deploy Market

To deploy a new prediction market:

```bash
forge script script/DeployMarket.s.sol:DeployMarket \
    --rpc-url <your_rpc_url> \
    --account deployer \
    --broadcast \
    --sig "run(string,uint256,uint256,address)" \
    "Your market question" \
    <fee_bps> \
    <end_timestamp> \
    <collateral_token_address>
```

Parameters:
- `"Your market question"`: The question the market will resolve
- `<fee_bps>`: Protocol fee in basis points (1%)
- `<end_timestamp>`: Unix timestamp for market end time
- `<collateral_token_address>`: Address of the collateral token

Example:
```bash
# Deploy market ending Dec 31, 2024 using USDC as collateral
forge script script/DeployMarket.s.sol:DeployMarket \
    --rpc-url <your_rpc_url> \
    --account deployer \
    --broadcast \
    --sig "run(string,uint256,uint256,address)" \
    "Will ETH be above $5000 by end of 2024?" \
    100 \
    1735689600 \
    0x7eAc043A7E4df19EFb31f8b5F37D73BF3a8e9ACd
```

### Format

```bash
forge fmt
```

### Gas Snapshots

```bash
forge snapshot
```

### Local Development

Start a local node:
```bash
anvil
```

## License

This project is licensed under MIT.
