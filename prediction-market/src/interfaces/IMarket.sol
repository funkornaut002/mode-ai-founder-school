// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/// @title Interface for Prediction Market
/// @notice Defines the interface for individual prediction markets
interface IMarket {
    /////////////
    /// ENUMS ///
    /////////////

    
    /** 
     * @notice Represents possible outcomes for the market
     */
    enum Outcome { 
        Unresolved,
        Resolved,
        Invalid
    }

    //////////////
    /// EVENTS ///
    //////////////
    
    /** 
     * @notice Emitted when outcome tokens are bought
     * @param buyer Address of the token buyer
     * @param outcomeTokenId The outcome token ID bought
     * @param collateralAmount Amount of collateral invested
     * @param tokenAmount Amount of outcome tokens received
     */
    event TokensBought(address indexed buyer, uint256 outcomeTokenId, uint256 collateralAmount, uint256 tokenAmount);

    /** 
     * @notice Emitted when outcome tokens are sold
     * @param seller Address of the token seller
     * @param outcomeTokenId The outcome token ID sold
     * @param tokenAmount Amount of outcome tokens sold
     * @param returnAmount Amount of collateral returned
     */
    event TokensSold(address indexed seller, uint256 outcomeTokenId, uint256 tokenAmount, uint256 returnAmount);

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

    /** 
     * @notice Emitted when market is invalidated
     */
    event MarketInvalidated();

    /** 
     * @notice Emitted when invalid market tokens are claimed
     * @param user Address of the user claiming refund
     * @param amount Amount of collateral refunded
     */
    event InvalidMarketClaimed(address indexed user, uint256 amount);

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

    /** @notice Thrown when attempting to sell more tokens than held */
    error Market_InvalidPositionAmount();

    /** @notice Thrown when user has insufficient balance */
    error Market_InsufficientBalance();

    /** @notice Thrown when price impact exceeds maximum allowed */
    error Market_PriceImpactTooHigh();

    /** @notice Thrown when market is not in invalid state */
    error Market_NotInvalid();

    /** @notice Thrown when market end time is invalid */
    error Market_InvalidEndTime();

    /** @notice Thrown when outcome count is invalid */
    error Market_InvalidOutcomeCount();

    /** @notice Thrown when insufficient output is received */
    error Market_InsufficientOutput();

    /////////////////
    /// VARIABLES ///
    ///////////////// 

    /** 
     * @notice The market question
     * @return _question The market question
     */
    function question() external view returns (string memory _question);

    /** 
     * @notice The market end time
     * @return _endTime The market end time
     */
    function endTime() external view returns (uint256 _endTime);

    /** 
     * @notice The collateral token used for trading
     * @return _collateralToken The collateral token
     */
    function collateralToken() external view returns (IERC20 _collateralToken);

    /** 
     * @notice The protocol fee in basis points
     * @return _protocolFee The protocol fee
     */
    function protocolFee() external view returns (uint256 _protocolFee);

    /** 
     * @notice The market creator address
     * @return _creator The market creator address
     */
    function creator() external view returns (address _creator);

    /** 
     * @notice The market outcome
     * @return _outcome The market outcome
     */
    function outcome() external view returns (Outcome _outcome);

    /** 
     * @notice The winning outcome token ID
     * @return _winningOutcomeTokenId The winning outcome token ID
     */
    function winningOutcomeTokenId() external view returns (uint256 _winningOutcomeTokenId);

    /// @notice Get outcome description at index
    /// @param index The index to query
    /// @return _description The description at the given index
    function outcomeDescriptions(uint256 index) external view returns (string memory _description);



    /////////////
    /// LOGIC ///
    /////////////

    /** 
     * @notice Buy outcome tokens
     * @param _outcomeTokenId The outcome token ID to buy
     * @param _collateralAmount Amount of collateral to invest
     * @param _maxPriceImpactBps Maximum allowed price impact in basis points
     * @param _minTokensOut Minimum amount of outcome tokens to receive
     * @return Amount of outcome tokens received
     */
    function buy(uint256 _outcomeTokenId, uint256 _collateralAmount, uint256 _maxPriceImpactBps, uint256 _minTokensOut) external returns (uint256);

    /** 
     * @notice Sell outcome tokens
     * @param _outcomeTokenId The outcome token ID to sell
     * @param _positionAmount Amount of outcome tokens to sell
     * @param _maxPriceImpactBps Maximum allowed price impact in basis points
     * @param _minCollateralOut Minimum amount of collateral to receive
     * @return Amount of collateral returned
     */
    function sell(uint256 _outcomeTokenId, uint256 _positionAmount, uint256 _maxPriceImpactBps, uint256 _minCollateralOut) external returns (uint256);
    
    
    /** 
     * @notice Resolve the market with winning outcome token ID
     * @param _winningOutcomeTokenId The ID of the winning outcome token
     */
    function resolveMarket(uint256 _winningOutcomeTokenId) external;

    /** 
     * @notice Claim winnings after market resolution
     * @return Amount of collateral claimed
     */
    function claimWinnings() external returns (uint256);

    /** 
     * @notice Claim refund for invalid market
     * @return Amount of collateral refunded
     */
    function claimInvalidMarket() external returns (uint256);

    /** 
     * @notice Invalidate the market
     */
    function invalidateMarket() external;

    /** 
     * @notice Get current price of outcome token
     * @param _outcomeId The outcome token ID
     * @return Current price in terms of collateral
     */
    function getPrice(uint256 _outcomeId) external view returns (uint256);

    /** 
     * @notice Get market information
     * @return _question The market question
     * @return _endTime The market end time
     * @return _collateralToken The collateral token address
     * @return _outcome The market outcome
     */
    function getMarketInfo() external view returns (
        string memory _question,
        uint256 _endTime,
        address _collateralToken,
        Outcome _outcome
    );

    /** 
     * @notice Calculate the amount of outcome tokens to receive for a given investment
     * @param _outcomeId The outcome token ID to buy
     * @param _investmentAmount Amount of collateral to invest
     * @return Amount of outcome tokens to receive
     */
    function calcBuyAmount(uint256 _outcomeId, uint256 _investmentAmount) external view returns (uint256);

    /** 
     * @notice Calculate the amount of collateral to receive for selling outcome tokens
     * @param _outcomeTokenId The outcome token ID to sell
     * @param _positionAmount Amount of outcome tokens to sell
     * @return Amount of collateral to receive
     */
    function calcSellAmount(uint256 _outcomeTokenId, uint256 _positionAmount) external view returns (uint256);

    /** 
     * @notice Get total number of outcomes
     * @return _outcomeCount Number of outcomes
     */
    function getOutcomeCount() external view returns (uint256 _outcomeCount);

    /** 
     * @notice Get description for a specific outcome
     * @param outcomeIndex Index of the outcome
     * @return _description Description of the outcome
     */
    function getOutcomeDescription(uint256 outcomeIndex) external view returns (string memory _description);
} 