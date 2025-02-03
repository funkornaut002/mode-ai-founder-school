// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { ReentrancyGuard } from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import { OutcomeToken } from 'tokens/OutcomeToken.sol';
import { IMarket } from 'interfaces/IMarket.sol';

/** 
 * @title Prediction Market Implementation
 * @author Funkornaut
 * @notice Implements a binary outcome prediction market with FPMM
 */
contract Market is IMarket, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Scaling factor for price calculations
    uint256 private constant _SCALE = 1e18;


    struct Pool {
        uint256 virtualLiquidity;
        uint256 realTokens;
        uint256 realCollateral;
    }

    /// @notice Stores pool data for each outcome
    mapping(uint256 _tokenId => Pool) public outcomePools;
    
    /// @notice Outcome token contract
    OutcomeToken public outcomeToken;

    /// @inheritdoc IMarket
    string public question;
    /// @inheritdoc IMarket
    uint256 public endTime;
    /// @inheritdoc IMarket
    IERC20 public collateralToken;
    /// @inheritdoc IMarket
    uint256 public protocolFee;
    /// @inheritdoc IMarket
    address public creator;
    /// @inheritdoc IMarket
    Outcome public outcome;
    /// @inheritdoc IMarket
    uint256 public winningOutcomeTokenId;
    /// @inheritdoc IMarket
    string[] public outcomeDescriptions;
    /// @notice Accumulated protocol fees
    uint256 public accumulatedFees;

    constructor(
        string memory _question,
        uint256 _endTime,
        address _collateralToken,
        uint256 _virtualLiquidity,
        uint256 _protocolFee,
        string[] memory _outcomeDescriptions
    ) {        
        question = _question;
        endTime = _endTime;
        collateralToken = IERC20(_collateralToken);
        protocolFee = _protocolFee;
        creator = msg.sender;
        outcome = Outcome.Unresolved;
        outcomeDescriptions = _outcomeDescriptions;

        // Deploy outcome tokens contract
        outcomeToken = new OutcomeToken(
            _question, // URI for token metadata
            _outcomeDescriptions
        );

        // Initialize virtual outcomePools with equal liquidity
        //@note eventually should allow Creator AI to set these so they can set the bet ratios -> maybe another agent could do this.
        for(uint256 i = 0; i < _outcomeDescriptions.length; i++) {
            outcomePools[i] = Pool({
                virtualLiquidity: _virtualLiquidity,
                realTokens: 0,
                realCollateral: 0
            });
        }
    }

    /// @inheritdoc IMarket
    function getOutcomeCount() external view returns (uint256 _outcomeCount) {
        return outcomeDescriptions.length;
    }

    /// @inheritdoc IMarket
    function getOutcomeDescription(uint256 outcomeIndex) external view returns (string memory _description) {
        if (outcomeIndex >= outcomeDescriptions.length) revert Market_InvalidOutcome();
        return outcomeDescriptions[outcomeIndex];
    }

    /// @inheritdoc IMarket
    function extendMarket(uint256 _endTime) external {
        if (msg.sender != creator) revert Market_Unauthorized();
        if (_endTime <= block.timestamp) revert Market_InvalidEndTime();

        uint256 _oldEndTime = endTime;
        endTime = _endTime;
        emit MarketExtended(_oldEndTime, _endTime);
    }

    /// @inheritdoc IMarket
    function buy(
        uint256 _outcomeId, 
        uint256 _collateralAmount,
        uint256 _maxPriceImpactBps,
        uint256 _minTokensOut
    ) external nonReentrant returns (uint256) {
        if (block.timestamp > endTime) revert Market_TradingEnded();
        if (_outcomeId >= outcomeDescriptions.length) revert Market_InvalidOutcome();

        uint256 priceImpact = calculatePriceImpact(_outcomeId, _collateralAmount);
        if (priceImpact > _maxPriceImpactBps) revert Market_PriceImpactTooHigh();

        // Calculate fee
        uint256 fee = (_collateralAmount * protocolFee) / 10000;
        uint256 netCollateral = _collateralAmount - fee;
        accumulatedFees += fee;

        Pool storage pool = outcomePools[_outcomeId];
        
        // Calculate tokens following x * y = k formula
        uint256 totalTokens = pool.virtualLiquidity + pool.realTokens;
        uint256 buyAmount = totalTokens * netCollateral / (totalTokens + netCollateral);

        if (buyAmount < _minTokensOut) revert Market_InsufficientOutput();

        // Update pool state
        pool.realTokens += buyAmount;
        pool.realCollateral += netCollateral;

        // Mint tokens and transfer collateral
        outcomeToken.mint(msg.sender, _outcomeId, buyAmount);
        collateralToken.safeTransferFrom(msg.sender, address(this), netCollateral);

        emit TokensBought(msg.sender, _outcomeId, netCollateral, buyAmount);
        return buyAmount;
    }

    /// @notice Sell outcome tokens back to the market
    function sell(
        uint256 _outcomeId,
        uint256 _tokenAmount,
        uint256 _maxPriceImpactBps,
        uint256 _minCollateralOut
    ) external nonReentrant returns (uint256 collateralReturned) {
        if (block.timestamp >= endTime) revert Market_TradingEnded();
        if (_outcomeId >= outcomeDescriptions.length) revert Market_InvalidOutcome();
        
        if (outcomeToken.balanceOf(msg.sender, _outcomeId) < _tokenAmount) revert Market_InsufficientBalance();

        Pool storage pool = outcomePools[_outcomeId];
        
        uint256 priceImpact = calculateSellPriceImpact(_outcomeId, _tokenAmount);
        if (priceImpact > _maxPriceImpactBps) revert Market_PriceImpactTooHigh();

        // Calculate gross collateral
        uint256 totalTokens = pool.virtualLiquidity + pool.realTokens;
        uint256 grossCollateral = _tokenAmount * totalTokens / (totalTokens - _tokenAmount);
        
        // Calculate fee and net collateral
        uint256 fee = (grossCollateral * protocolFee) / 10000;
        accumulatedFees += fee;
        collateralReturned = grossCollateral - fee;
        
        if (collateralReturned < _minCollateralOut) revert Market_InsufficientOutput();

        // Update pool state
        pool.realTokens -= _tokenAmount;
        pool.realCollateral -= collateralReturned;

        // Burn tokens and return collateral
        outcomeToken.burn(msg.sender, _outcomeId, _tokenAmount);
        collateralToken.safeTransfer(msg.sender, collateralReturned);

        emit TokensSold(msg.sender, _outcomeId, _tokenAmount, collateralReturned);
        return collateralReturned;
    }

    /// @inheritdoc IMarket
    function resolveMarket(uint256 _winningOutcomeTokenId) external {
        if (msg.sender != creator) revert Market_Unauthorized();
        if (block.timestamp < endTime) revert Market_TradingNotEnded();
        if (_winningOutcomeTokenId >= outcomeDescriptions.length) 
            revert Market_InvalidOutcome();

        outcome = Outcome.Resolved;
        winningOutcomeTokenId = _winningOutcomeTokenId;

        emit MarketResolved(outcome);
    }

    /// @inheritdoc IMarket
    //@note probaly need to decrement collateral when it is taken out
    function claimWinnings() external nonReentrant returns (uint256) {
        if (block.timestamp < endTime) revert Market_TradingNotEnded();
        if (outcome != Outcome.Resolved) revert Market_NoOutcome();

        Pool storage winningPool = outcomePools[winningOutcomeTokenId];
        uint256 userTokens = outcomeToken.balanceOf(msg.sender, winningOutcomeTokenId);
        if (userTokens == 0) revert Market_NoTokens();
        
        // Calculate share of total real collateral based on winning tokens
        uint256 totalRealCollateral = getTotalRealCollateral();
        uint256 share = (userTokens * totalRealCollateral) / winningPool.realTokens;
            
        outcomeToken.burn(msg.sender, winningOutcomeTokenId, userTokens);
        collateralToken.transfer(msg.sender, share);
        
        emit WinningsClaimed(msg.sender, share);
        return share;
    }

    /// @inheritdoc IMarket
    function calcBuyAmount(uint256 _outcomeId, uint256 _investmentAmount) public view returns (uint256) {
        uint256 poolBalance = outcomePools[_outcomeId].realTokens;
        return (_investmentAmount * _SCALE) / (poolBalance + _investmentAmount);
    }

    /// @inheritdoc IMarket
    function calcSellAmount(uint256 _outcomeTokenId, uint256 _positionAmount) public view returns (uint256) {
        uint256 poolBalance = outcomePools[_outcomeTokenId].realTokens;
        return (_positionAmount * poolBalance) / _SCALE;
    }

    /// @inheritdoc IMarket
    //@note might want to double check this
    function getPrice(uint256 _outcomeId) public view returns (uint256) {
        if (_outcomeId > outcomeDescriptions.length) revert Market_InvalidOutcome();
        
        Pool storage pool = outcomePools[_outcomeId];
        uint256 totalTokens = pool.virtualLiquidity + pool.realTokens;
        
        return (totalTokens * _SCALE) / getTotalLiquidity();
    }


    /// @inheritdoc IMarket
    function getMarketInfo() external view returns (
        string memory _question,
        uint256 _endTime,
        address _collateralToken,
        Outcome _outcome
    ) {
        return (question, endTime, address(collateralToken), outcome);
    }

    /** 
     * @notice Handle claims for invalid markets where no outcome was correct
     * @return Amount of collateral refunded
     */
    function claimInvalidMarket() external nonReentrant returns (uint256) {
        if (block.timestamp < endTime) revert Market_TradingNotEnded();
        if (outcome != Outcome.Invalid) revert Market_NotInvalid();

        uint256 totalRefund = 0;
        
        // Check all outcome tokens the user holds
        for(uint256 i = 0; i < outcomeDescriptions.length; i++) {
            Pool storage pool = outcomePools[i];
            uint256 tokenBalance = outcomeToken.balanceOf(msg.sender, i);
            
            if (tokenBalance > 0) {
                // Calculate refund based on proportion of real collateral
                uint256 refund = (tokenBalance * pool.realCollateral) / pool.realTokens;
                totalRefund += refund;
                
                // Burn the tokens
                outcomeToken.burn(msg.sender, i, tokenBalance);
                
                // Update pool state
                pool.realTokens -= tokenBalance;
                pool.realCollateral -= refund;
            }
        }

        if (totalRefund == 0) revert Market_NoTokens();

        // Transfer refund
        collateralToken.safeTransfer(msg.sender, totalRefund);

        emit InvalidMarketClaimed(msg.sender, totalRefund);
        return totalRefund;
    }

    /// @notice Calculate price impact in basis points for a given trade
    function calculatePriceImpact(
        uint256 _outcomeId,
        uint256 _tradeAmount
    ) public view returns (uint256 priceImpactBps) {
        if (_outcomeId >= outcomeDescriptions.length) revert Market_InvalidOutcome();
        
        Pool storage pool = outcomePools[_outcomeId];
        uint256 totalTokens = pool.virtualLiquidity + pool.realTokens;
        
        uint256 oldPrice = totalTokens * _SCALE / getTotalLiquidity();
        uint256 newPrice = (totalTokens + _tradeAmount) * _SCALE / (getTotalLiquidity() + _tradeAmount);
            
        return ((newPrice - oldPrice) * 10000) / oldPrice;
    }

    /// @notice Calculate price impact for selling tokens
    function calculateSellPriceImpact(
        uint256 _outcomeId,
        uint256 _tokenAmount
    ) public view returns (uint256 priceImpactBps) {
        if (_outcomeId >= outcomeDescriptions.length) revert Market_InvalidOutcome();
        
        Pool storage pool = outcomePools[_outcomeId];
        uint256 totalTokens = pool.virtualLiquidity + pool.realTokens;
        
        uint256 oldPrice = totalTokens * _SCALE / getTotalLiquidity();
        uint256 newPrice = (totalTokens - _tokenAmount) * _SCALE / (getTotalLiquidity() - _tokenAmount);
            
        return ((oldPrice - newPrice) * 10000) / oldPrice;
    }

    /// @notice Get total real collateral in market
    function getTotalRealCollateral() public view returns (uint256) {
        uint256 total = 0;
        for(uint256 i = 0; i < outcomeDescriptions.length; i++) {
            total += outcomePools[i].realCollateral;
        }
        return total;
    }

    /// @notice Get total liquidity (virtual + real)
    function getTotalLiquidity() public view returns (uint256) {
        uint256 total = 0;
        for(uint256 i = 0; i < outcomeDescriptions.length; i++) {
            Pool storage pool = outcomePools[i];
            total += pool.virtualLiquidity + pool.realTokens;
        }
        return total;
    }

    function invalidateMarket() external {
        if (msg.sender != creator) revert Market_Unauthorized();
        if (block.timestamp < endTime) revert Market_TradingNotEnded();
        if (outcome != Outcome.Unresolved) revert Market_AlreadyResolved();

        outcome = Outcome.Invalid;
        emit MarketInvalidated();
    }

    /// @notice Allows creator to collect accumulated protocol fees
    function collectFees() external returns (uint256) {
        if (msg.sender != creator) revert Market_Unauthorized();
        if (accumulatedFees == 0) revert Market_NoFeesToCollect();

        uint256 feesToCollect = accumulatedFees;
        accumulatedFees = 0;
        
        collateralToken.safeTransfer(creator, feesToCollect);
        
        emit FeesCollected(creator, feesToCollect);
        return feesToCollect;
    }

    
} 