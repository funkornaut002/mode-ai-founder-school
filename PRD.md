# Project Name  
AI Prediction Market 
*needs a name*

---

## 1. Project Overview  
- **Objective:** Create an onchain prediction market for AI models.  
- **Summary:** This project aims to build a prediction market for AI models. The market will be on Mode Network and will function similarly to Polymarket. Ai Agents will be the only participants in the market. There will be one agent who will create the markets. Other agents will participate in the markets. Each participant will have a unique data sources and will act in line to what their data is telling them. 

Actors:
- Creator Agent: An agent that will create the markets.
- Participant Agent: An agent that will participate in the markets.

---

## 2. Key Features  
- Onchain Prediction Market: *Basically a fork of Polymarket.*  
- Creator Agent: *An agent that will create the markets. Will mirror active Polymarket markets. Will have the ability to create new markets. One fun would could be to create a market on if a token will go up or down after AIXBT mentions it in a tweet.*  
- Participant Agents: *An Eliza agent whose knowledge is based on the data it is given and can be tailored by a user*  

---

## 3. Technical Requirements  
### Functional Requirements:  

**Onchain Prediction Market:** 
- [x] Smart Contract Architecture
  - Market Factory: Creates and manages prediction markets
  - Market Implementation: Individual market logic and state
  - Simple Oracle System: Initially centralized with upgrade path
  
- [] Supported Tokens
  - [] Collateral: MODE, veMODE, ETH, USDC, some meme coin
  - [] Position Tokens: ERC1155 for outcome positions (extensible for multi-outcome)
  
- [] Core Features
  - [] Binary outcome markets (Yes/No)
  - [] Market creation with initial liquidity
  - [] Trading positions
  - [] Basic protocol fee
  - [] Market resolution

**Market Factory:** 
```solidity
interface IMarketFactory {
    /// @notice Creates a new prediction market
    /// @param question The market question/description
    /// @param endTime When trading period ends
    /// @param collateralToken Address of token used for trading (MODE, ETH, etc)
    /// @param initialLiquidity Amount of collateral to seed market
    function createMarket(
        string calldata question,
        uint256 endTime,
        address collateralToken,
        uint256 initialLiquidity
    ) external returns (address marketAddress);

    /// @notice Protocol fee getter/setter
    function getProtocolFee() external view returns (uint256);
    function setProtocolFee(uint256 newFee) external;

    /// @notice Market getters
    function getMarket(bytes32 marketId) external view returns (address);
    function isValidMarket(address market) external view returns (bool);
}
```
`createMarket`
Purpose: Launches a new prediction market.
Parameters:
question: The text or description of the prediction market question (e.g., "Will candidate X win the election?").
endTime: The timestamp when the market stops accepting trades.
collateralToken: The ERC20 token address used for trading (e.g., MODE, USDC, ETH).
initialLiquidity: The amount of collateral provided to seed the market and ensure trading can begin.
Return Value:
marketAddress: The address of the newly created market contract.
Notes:
This function should emit an event (e.g., MarketCreated) to log the creation of new markets for indexing and transparency.

`getProtocolFee`
Purpose: Returns the current protocol fee.
Notes:
The protocol fee might be expressed as a percentage or basis points (e.g., 0.1% = 10 basis points).
This fee is typically applied to trades or market settlements as the platform's revenue.

`setProtocolFee`
Purpose: Updates the protocol fee to a new value.
Parameters:
newFee: The new fee value to set (likely in basis points).
Access Control:
Restricted to only the contract owner or governance system to prevent unauthorized changes.

`getMarket`
Purpose: Retrieves the address of a specific market by its unique identifier.
Parameters:
marketId: A unique identifier for the market (e.g., a hash of its question or metadata).
Return Value:
The address of the corresponding market contract.

`isValidMarket`
Purpose: Checks whether a given address corresponds to a valid market created by this factory.
Parameters:
market: The market contract address to validate.
Return Value:
true if the market is valid, false otherwise.

**Market Implementation:** 
```solidity

2. **Market Interface**
```solidity
interface IMarket {
    enum MarketState { 
        Trading,    // Market is open for trading
        Closed,     // Trading period has ended
        Resolved    // Outcome has been determined
    }
    
    enum Outcome { 
        Unresolved,
        Yes,
        No,
        Invalid
    }

    /// @notice Core trading functions
    function buy(bool isYes, uint256 investmentAmount) external returns (uint256);
    function sell(bool isYes, uint256 positionAmount) external returns (uint256);
    
    /// @notice Liquidity functions
    function addLiquidity(uint256 amount) external returns (uint256 lpTokens);
    function removeLiquidity(uint256 lpTokens) external returns (uint256 amount);
    
    /// @notice Market resolution
    function resolveMarket(Outcome outcome) external;
    function claimWinnings() external returns (uint256);

    /// @notice View functions
    function getPrice(bool isYes) external view returns (uint256);
    function getMarketInfo() external view returns (
        string memory question,
        uint256 endTime,
        address collateralToken,
        MarketState state,
        Outcome outcome
    );
}
```

**Fixed Product Market Maker:** 
```solidity
interface IFPMM {
    /// @notice Calculate amounts for trades
    function calcBuyAmount(
        bool isYes,
        uint256 investmentAmount
    ) external view returns (uint256 buyAmount);
    
    function calcSellAmount(
        bool isYes,
        uint256 positionAmount
    ) external view returns (uint256 returnAmount);

    /// @notice Liquidity calculations
    function calcLPTokensForLiquidity(
        uint256 collateralAmount
    ) external view returns (uint256 lpTokens);
    
    function calcCollateralForLPTokens(
        uint256 lpTokens
    ) external view returns (uint256 collateralAmount);
}
```
Explanation of Existing Functions
1. Core Trading Functions
`buy(bool isYes, uint256 investmentAmount)`

Allows a user to buy either "Yes" or "No" tokens by investing collateral.
Parameters:
`isYes`: A boolean indicating whether to buy "Yes" (true) or "No" (false) tokens.
`investmentAmount`: The amount of collateral being invested.
Returns:
The number of outcome tokens received.
`sell(bool isYes, uint256 positionAmount)`

Allows a user to sell their position in "Yes" or "No" tokens for collateral.
Parameters:
`isYes`: Indicates whether the user is selling "Yes" (true) or "No" (false) tokens.
`positionAmount`: The amount of outcome tokens to sell.
Returns:
The amount of collateral received.
2. Liquidity Functions
`addLiquidity(uint256 amount)`

Allows a user to add collateral to the market and receive LP tokens representing their share of the liquidity pool.
Parameters:
`amount`: The amount of collateral to add.
Returns:
The number of LP tokens minted.
`removeLiquidity(uint256 lpTokens)`

Allows a user to remove their liquidity and redeem LP tokens for collateral.
Parameters:
`lpTokens`: The number of LP tokens to redeem.
Returns:
The amount of collateral withdrawn.
3. Market Resolution
`resolveMarket(Outcome outcome)`

Finalizes the market by setting the outcome.
Parameters:
`outcome`: The resolved market outcome (Yes, No, or Invalid).
Access Control:
Typically restricted to an oracle or an authorized account.
`claimWinnings()`

Allows users to claim their winnings after the market has been resolved.
Returns:
The amount of collateral received as winnings.
4. View Functions
`getPrice(bool isYes)`

Retrieves the current price of either "Yes" or "No" tokens.
Parameters:
`isYes`: Specifies whether to get the price of "Yes" (true) or "No" (false) tokens.
Returns:
The price in terms of collateral.
`getMarketInfo()`

Retrieves metadata about the market.
Returns:
question: The market question or description.
endTime: The trading deadline.
collateralToken: The address of the collateral token.
state: The current market state (Trading, Closed, or Resolved).
outcome: The resolved market outcome (Yes, No, Invalid, or Unresolved).


**Oracle**
```solidity
interface IOracle {
    /// @notice Resolution functions
    function resolveMarket(
        address market,
        Outcome outcome
    ) external;
    
    function challengeResolution(address market) external;
    
    /// @notice View functions
    function canResolve(address resolver) external view returns (bool);
    function getResolution(
        address market
    ) external view returns (Outcome outcome, uint256 timestamp, bool challenged);
}
```
1. Resolution Functions
`resolveMarket(address market, Outcome outcome)`

Allows the oracle to finalize the outcome of a prediction market.
Parameters:
`market`: The address of the market being resolved.
`outcome`: The result of the market (e.g., Yes, No, Invalid).
Notes:
Typically restricted to authorized oracle accounts.
Should emit an event (e.g., MarketResolved) for transparency.
`challengeResolution(address market)`

Allows a user or entity to challenge a resolved outcome if they believe it to be incorrect or invalid.
Parameters:
`market`: The address of the market being challenged.
Notes:
Mechanism to prevent incorrect or malicious resolutions.
Should emit an event (e.g., ResolutionChallenged).
2. View Functions
`canResolve(address resolver)`

Checks whether a given account is authorized to resolve markets.
Parameters:
`resolver`: The address being checked.
Returns:
`true` if the account can resolve markets, `false` otherwise.
`getResolution(address market)`

Retrieves the resolution details for a specific market.
Parameters:
`market`: The address of the market.
Returns:
`outcome`: The resolved outcome.
`timestamp`: When the resolution occurred.
`challenged`: Whether the resolution is currently under dispute.

**Position Token:** 
```solidity
interface IPositionToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}
```



  
**Creator Agent:** 
- [ ] Ability to search for data to create markets on
- [ ] Ability to create markets with correctly formatted parameters
- [ ] Provides initial liquidity to markets
- [ ] Collects fees from markets
- [ ] Market monitoring capabilities
- [ ] Closes markets when they are resolved

**Participant Agent:** 
- [ ] Has a unique personality that influences their trading behavior
- [ ] Uses unique data sources to make trading decisions
- [ ] Ability to interact with markets
- [ ] Position trading capabilities
- [ ] Portfolio management
- [ ] Risk assessment logic
- [ ] Integration with data sources

### Non-Functional Requirements:  

**Onchain Prediction Market:** 

**Creator Agent:** 

**Participant Agent:** 

---

## 4. User Stories  
- **User Type 1:** *What does this user want to achieve?*  
- **User Type 2:** *What does this user want to achieve?*  

---

## 5. Tools / Research 
Need more research on this.

https://github.com/agentcoinorg/predictionprophet - warpcast prediction bot
https://github.com/gnosis/prediction-market-agent-tooling - gnosis prediction market agent tooling
https://github.com/gnosis/prediction-market-agent?tab=readme-ov-file - gnosis prediction market agent

---

## 6. Constraints  
- Time.

---

## 7. Deliverables  
- Deliverable 1: *Smart Contracts*
- Deliverable 1a: *Smart Contracts tested*
- Deliverable 1b: *Smart Contracts deployed to Mode TestNetwork*

- Deliverable 2: *Creator Agent*
- Deliverable 2a: *Creator Agent interacting with Market Factory*
- Deliverable 2b: *Creator Agent creating markets with correct parameters*
- Deliverable 2c: *Creator Agent is able to receieve search information*
- Deliverable 2d: *Creator Agent is able to create markets based on search information with A/B outcomes*
- Deliverable 2e: *Creator Agent is able to create markets based on search information with many different outcomes*
- Deliverable 2f: *Creator Agent deployed and running automatically*

- Deliverable 3: *Participant Agent*
- Deliverable 3a: *Participant Agent interacting with Market*
- Deliverable 3b: *Participant Agent is able to receieve search information*
- Deliverable 3c: *Participant Agent is able to trade positions based on search information*
- Deliverable 3d: *Participant Agent deployed and running automatically*

---

## 8. Timeline  
- **Phase 1: Market Development** *Smart contract development and testing ~ 5 days*  
- **Phase 2: Agent Development** *Agent development and testing. Must get agents transacting on chain. Will need at least 1 creator agent and 1 participant agent.*  
- **Phase 3: UI Development** *UI development and testing. Should allow users to easily create agents, give them data sources, and fund their agents.*  

---

## 9. Success Criteria  
### Must Haves
- [] Market is live on Mode TestNetwork.
- [] Creator Agent is able to create markets.
- [] Participant Agent is able to participate in markets.

### Stretch Goals For Mode Swarn
- [] UI is able to create agents, give them data sources, and fund their agents.

