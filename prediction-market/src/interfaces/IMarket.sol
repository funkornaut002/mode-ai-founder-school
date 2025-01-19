// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/// @title Interface for Prediction Market
/// @notice Defines the interface for individual prediction markets
interface IMarket {
    /////////////
    /// ENUMS ///
    /////////////

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

    //////////////
    /// EVENTS ///
    //////////////
    
    /** 
     * @notice Emitted when outcome tokens are bought
     * @param buyer Address of the token buyer
     * @param isYes Whether YES tokens were bought
     * @param investmentAmount Amount of collateral invested
     * @param tokenAmount Amount of outcome tokens received
     */
    event TokensBought(address indexed buyer, bool isYes, uint256 investmentAmount, uint256 tokenAmount);

    /** 
     * @notice Emitted when outcome tokens are sold
     * @param seller Address of the token seller
     * @param isYes Whether YES tokens were sold
     * @param tokenAmount Amount of outcome tokens sold
     * @param returnAmount Amount of collateral returned
     */
    event TokensSold(address indexed seller, bool isYes, uint256 tokenAmount, uint256 returnAmount);

    /** 
     * @notice Emitted when liquidity is added to the market
     * @param provider Address of the liquidity provider
     * @param amount Amount of collateral added
     * @param lpTokens Amount of LP tokens minted
     */
    event LiquidityAdded(address indexed provider, uint256 amount, uint256 lpTokens);

    /** 
     * @notice Emitted when liquidity is removed from the market
     * @param provider Address of the liquidity provider
     * @param lpTokens Amount of LP tokens burned
     * @param amount Amount of collateral returned
     */
    event LiquidityRemoved(address indexed provider, uint256 lpTokens, uint256 amount);

    /** 
     * @notice Emitted when the market outcome is resolved
     * @param outcome The final outcome of the market
     */
    event MarketResolved(Outcome outcome);

    /** 
     * @notice Emitted when winnings are claimed
     * @param user Address of the user claiming winnings
     * @param amount Amount of collateral claimed
     */
    event WinningsClaimed(address indexed user, uint256 amount);

    //////////////
    /// ERRORS ///
    //////////////

    /** @notice Thrown when attempting to trade while market is not in trading state */
    error Market_NotTrading();

    /** @notice Thrown when attempting to trade after market end time */
    error Market_TradingEnded();

    /** @notice Thrown when buy amount calculation results in zero tokens */
    error Market_InvalidBuyAmount();

    /** @notice Thrown when sell amount calculation results in zero collateral */
    error Market_InvalidSellAmount();

    /** @notice Thrown when attempting to add invalid liquidity amount */
    error Market_InvalidAmount();

    /** @notice Thrown when LP token calculation results in zero tokens */
    error Market_InvalidLPTokens();

    /** @notice Thrown when collateral calculation results in zero amount */
    error Market_InvalidCollateralAmount();

    /** @notice Thrown when caller lacks required role */
    error Market_Unauthorized();

    /** @notice Thrown when attempting to resolve an already resolved market */
    error Market_AlreadyResolved();

    /** @notice Thrown when attempting to resolve before trading period ends */
    error Market_TradingNotEnded();

    /** @notice Thrown when attempting to resolve with invalid outcome */
    error Market_InvalidOutcome();

    /** @notice Thrown when attempting to claim from unresolved market */
    error Market_NotResolved();

    /** @notice Thrown when attempting to claim with no outcome set */
    error Market_NoOutcome();

    /** @notice Thrown when attempting to claim with no tokens */
    error Market_NoTokens();

    /** @notice Thrown when attempting to remove liquidity with no liquidity */
    error Market_NoLiquidity();

    /////////////////
    /// VARIABLES ///
    ///////////////// 

    /** @notice The market question */
    function question() external view returns (string memory);

    /** @notice The market end time */
    function endTime() external view returns (uint256);

    /** @notice The collateral token used for trading */
    function collateralToken() external view returns (IERC20);

    /** @notice The protocol fee in basis points */
    function protocolFee() external view returns (uint256);

    /** @notice The market creator address */
    function creator() external view returns (address);

    /** @notice The current market state */
    function state() external view returns (MarketState);

    /** @notice The market outcome */
    function outcome() external view returns (Outcome);

    /** @notice The current YES token liquidity */
    function yesLiquidity() external view returns (uint256);

    /** @notice The current NO token liquidity */
    function noLiquidity() external view returns (uint256);

    /** @notice Get whitelist address at index */
    function whitelist(uint256 index) external view returns (address);

    /////////////
    /// LOGIC ///
    /////////////

    /** 
     * @notice Buy outcome tokens
     * @param isYes Whether to buy YES tokens
     * @param investmentAmount Amount of collateral to invest
     * @return Amount of outcome tokens received
     */
    function buy(bool isYes, uint256 investmentAmount) external returns (uint256);

    /** 
     * @notice Sell outcome tokens
     * @param isYes Whether to sell YES tokens
     * @param positionAmount Amount of outcome tokens to sell
     * @return Amount of collateral returned
     */
    function sell(bool isYes, uint256 positionAmount) external returns (uint256);
    
    /** 
     * @notice Add liquidity to the market
     * @param amount Amount of collateral to add
     * @return lpTokens Amount of LP tokens received
     */
    function addLiquidity(uint256 amount) external returns (uint256 lpTokens);

    /** 
     * @notice Remove liquidity from the market
     * @param lpTokens Amount of LP tokens to burn
     * @return amount Amount of collateral returned
     */
    function removeLiquidity(uint256 lpTokens) external returns (uint256 amount);
    
    /** 
     * @notice Resolve the market with final outcome
     * @param outcome The final outcome of the market
     */
    function resolveMarket(Outcome outcome) external;

    /** 
     * @notice Claim winnings after market resolution
     * @return Amount of collateral claimed
     */
    function claimWinnings() external returns (uint256);

    /** 
     * @notice Get current price of outcome tokens
     * @param isYes Whether to get YES token price
     * @return Current price in terms of collateral
     */
    function getPrice(bool isYes) external view returns (uint256);

    /** 
     * @notice Get market information
     * @return question The market question
     * @return endTime The market end time
     * @return collateralToken The collateral token address
     * @return state The current market state
     * @return outcome The market outcome
     */
    function getMarketInfo() external view returns (
        string memory question,
        uint256 endTime,
        address collateralToken,
        MarketState state,
        Outcome outcome
    );

    /** 
     * @notice Calculate the amount of outcome tokens to receive for a given investment
     * @param isYes Whether calculating for YES tokens
     * @param investmentAmount Amount of collateral to invest
     * @return Amount of outcome tokens to receive
     */
    function calcBuyAmount(bool isYes, uint256 investmentAmount) external view returns (uint256);

    /** 
     * @notice Calculate the amount of collateral to receive for selling outcome tokens
     * @param isYes Whether calculating for YES tokens
     * @param positionAmount Amount of outcome tokens to sell
     * @return Amount of collateral to receive
     */
    function calcSellAmount(bool isYes, uint256 positionAmount) external view returns (uint256);

    /** 
     * @notice Calculate the amount of LP tokens to receive for adding liquidity
     * @param collateralAmount Amount of collateral to add
     * @return Amount of LP tokens to receive
     */
    function calcLPTokensForLiquidity(uint256 collateralAmount) external view returns (uint256);

    /** 
     * @notice Calculate the amount of collateral to receive for burning LP tokens
     * @param lpTokens Amount of LP tokens to burn
     * @return Amount of collateral to receive
     */
    function calcCollateralForLPTokens(uint256 lpTokens) external view returns (uint256);
} 