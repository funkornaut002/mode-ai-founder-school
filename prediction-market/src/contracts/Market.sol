// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { ReentrancyGuard } from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { IMarket } from 'interfaces/IMarket.sol';
import { IFPMM } from 'interfaces/IFPMM.sol';

/** 
 * @title Prediction Market Implementation
 * @author Funkornaut
 * @notice Implements a binary outcome prediction market with FPMM
 */
contract Market is IMarket, IFPMM, ERC1155, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Scaling factor for liquidity calculations.
    uint256 private constant _SCALE = 1e18;

    /// @notice Token ID for the 'Yes' outcome.
    uint256 private constant _YES_TOKEN_ID = 1;

    /// @notice Token ID for the 'No' outcome.
    uint256 private constant _NO_TOKEN_ID = 2;

    /// @notice Token ID for Liquidity Provider (LP) tokens.
    uint256 private constant _LP_TOKEN_ID = 3;


    // Events


    // State variables
    string public question;
    uint256 public endTime;
    IERC20 public collateralToken;
    uint256 public protocolFee;
    address public creator;
    MarketState public state;
    Outcome public outcome;
    
    uint256 private _yesLiquidity;
    uint256 private _noLiquidity;

    constructor(
        string memory _question,
        uint256 _endTime,
        address _collateralToken,
        uint256 _initialLiquidity,
        uint256 _protocolFee,
        address _creator
    ) ERC1155('') {
        question = _question;
        endTime = _endTime;
        collateralToken = IERC20(_collateralToken);
        protocolFee = _protocolFee;
        creator = _creator;
        state = MarketState.Trading;
        outcome = Outcome.Unresolved;

        // Initialize liquidity pools
        _yesLiquidity = _initialLiquidity / 2;
        _noLiquidity = _initialLiquidity / 2;

        // Transfer initial liquidity from creator
        collateralToken.safeTransferFrom(_creator, address(this), _initialLiquidity);
        
        // Mint initial LP tokens to creator
        _mint(_creator, _LP_TOKEN_ID, _initialLiquidity, '');
    }

    /// @inheritdoc IMarket
    function buy(bool isYes, uint256 investmentAmount) external nonReentrant returns (uint256) {
        if (state != MarketState.Trading) revert Market_NotTrading();
        if (block.timestamp >= endTime) revert Market_TradingEnded();

        uint256 buyAmount = calcBuyAmount(isYes, investmentAmount);
        if (buyAmount == 0) revert Market_InvalidBuyAmount();

        // Transfer collateral from buyer
        collateralToken.safeTransferFrom(msg.sender, address(this), investmentAmount);

        // Update liquidity
        if (isYes) {
            _yesLiquidity += investmentAmount;
            _mint(msg.sender, _YES_TOKEN_ID, buyAmount, '');
        } else {
            _noLiquidity += investmentAmount;
            _mint(msg.sender, _NO_TOKEN_ID, buyAmount, '');
        }

        emit TokensBought(msg.sender, isYes, investmentAmount, buyAmount);
        return buyAmount;
    }

    /// @inheritdoc IMarket
    function sell(bool isYes, uint256 positionAmount) external nonReentrant returns (uint256) {
        if (state != MarketState.Trading) revert Market_NotTrading();
        if (block.timestamp >= endTime) revert Market_TradingEnded();

        uint256 returnAmount = calcSellAmount(isYes, positionAmount);
        if (returnAmount == 0) revert Market_InvalidSellAmount();

        // Burn position tokens
        uint256 tokenId = isYes ? _YES_TOKEN_ID : _NO_TOKEN_ID;
        _burn(msg.sender, tokenId, positionAmount);

        // Update liquidity
        if (isYes) {
            _yesLiquidity -= returnAmount;
        } else {
            _noLiquidity -= returnAmount;
        }

        // Transfer collateral to seller
        collateralToken.safeTransfer(msg.sender, returnAmount);

        emit TokensSold(msg.sender, isYes, positionAmount, returnAmount);
        return returnAmount;
    }

    /// @inheritdoc IMarket
    function addLiquidity(uint256 amount) external nonReentrant returns (uint256) {
        if (state != MarketState.Trading) revert Market_NotTrading();
        if (amount == 0) revert Market_InvalidAmount();

        uint256 lpTokens = calcLPTokensForLiquidity(amount);
        if (lpTokens == 0) revert Market_InvalidLPTokens();

        // Transfer collateral from provider
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        // Mint LP tokens
        _mint(msg.sender, _LP_TOKEN_ID, lpTokens, '');

        emit LiquidityAdded(msg.sender, amount, lpTokens);
        return lpTokens;
    }

    /// @inheritdoc IMarket
    function removeLiquidity(uint256 lpTokens) external nonReentrant returns (uint256) {
        if (state != MarketState.Trading) revert Market_NotTrading();
        if (lpTokens == 0) revert Market_InvalidAmount();

        uint256 collateralAmount = calcCollateralForLPTokens(lpTokens);
        if (collateralAmount == 0) revert Market_InvalidCollateralAmount();

        // Burn LP tokens
        _burn(msg.sender, _LP_TOKEN_ID, lpTokens);

        // Transfer collateral to provider
        collateralToken.safeTransfer(msg.sender, collateralAmount);

        emit LiquidityRemoved(msg.sender, lpTokens, collateralAmount);
        return collateralAmount;
    }

    /// @inheritdoc IMarket
    function resolveMarket(Outcome _outcome) external {
        if (msg.sender != creator) revert Market_NotCreator();
        if (state != MarketState.Trading) revert Market_AlreadyResolved();
        if (block.timestamp < endTime) revert Market_TradingNotEnded();
        if (_outcome == Outcome.Unresolved) revert Market_InvalidOutcome();

        state = MarketState.Resolved;
        outcome = _outcome;

        emit MarketResolved(_outcome);
    }

    /// @inheritdoc IMarket
    function claimWinnings() external nonReentrant returns (uint256) {
        if (state != MarketState.Resolved) revert Market_NotResolved();
        if (outcome == Outcome.Unresolved) revert Market_NoOutcome();

        uint256 winningTokenId;
        if (outcome == Outcome.Yes) {
            winningTokenId = _YES_TOKEN_ID;
        } else if (outcome == Outcome.No) {
            winningTokenId = _NO_TOKEN_ID;
        } else {
            // Invalid outcome - return proportional amount
            return _claimInvalidMarket();
        }

        uint256 tokenBalance = balanceOf(msg.sender, winningTokenId);
        if (tokenBalance == 0) revert Market_NoTokens();

        // Burn winning tokens
        _burn(msg.sender, winningTokenId, tokenBalance);

        // Calculate winnings (1:1 for winning tokens)
        uint256 winnings = tokenBalance;

        // Transfer winnings
        collateralToken.safeTransfer(msg.sender, winnings);

        emit WinningsClaimed(msg.sender, winnings);
        return winnings;
    }

    /// @inheritdoc IFPMM
    function calcBuyAmount(bool isYes, uint256 investmentAmount) public view returns (uint256) {
        uint256 poolBalance = isYes ? _yesLiquidity : _noLiquidity;
        return (investmentAmount * _SCALE) / (poolBalance + investmentAmount);
    }

    /// @inheritdoc IFPMM
    function calcSellAmount(bool isYes, uint256 positionAmount) public view returns (uint256) {
        uint256 poolBalance = isYes ? _yesLiquidity : _noLiquidity;
        return (positionAmount * poolBalance) / _SCALE;
    }

    /// @inheritdoc IFPMM
    function calcLPTokensForLiquidity(uint256 collateralAmount) public view returns (uint256) {
        uint256 totalSupply = collateralToken.totalSupply();
        if (totalSupply == 0) {
            return collateralAmount;
        }
        return (collateralAmount * totalSupply) / (_yesLiquidity + _noLiquidity);
    }

    /// @inheritdoc IFPMM
    function calcCollateralForLPTokens(uint256 lpTokens) public view returns (uint256) {
        uint256 totalSupply = collateralToken.totalSupply();
        if (totalSupply == 0) revert Market_NoLiquidity();
        return (lpTokens * (_yesLiquidity + _noLiquidity)) / totalSupply;
    }

    /// @inheritdoc IMarket
    function getPrice(bool isYes) external view returns (uint256) {
        uint256 poolBalance = isYes ? _yesLiquidity : _noLiquidity;
        return (poolBalance * _SCALE) / (_yesLiquidity + _noLiquidity);
    }

    /// @inheritdoc IMarket
    function getMarketInfo() external view returns (
        string memory _question,
        uint256 _endTime,
        address _collateralToken,
        MarketState _state,
        Outcome _outcome
    ) {
        return (question, endTime, address(collateralToken), state, outcome);
    }

    /** 
     * @notice Internal function to handle claims for invalid markets
     * @return Amount of collateral refunded
     */
    function _claimInvalidMarket() private returns (uint256) {
        uint256 yesBalance = balanceOf(msg.sender, _YES_TOKEN_ID);
        uint256 noBalance = balanceOf(msg.sender, _NO_TOKEN_ID);
        
        if (yesBalance == 0 && noBalance == 0) {
            return 0;
        }

        // Burn all tokens
        if (yesBalance > 0) {
            _burn(msg.sender, _YES_TOKEN_ID, yesBalance);
        }
        if (noBalance > 0) {
            _burn(msg.sender, _NO_TOKEN_ID, noBalance);
        }

        // Calculate proportional refund
        uint256 totalTokens = yesBalance + noBalance;
        uint256 totalPool = _yesLiquidity + _noLiquidity;
        uint256 refund = (totalTokens * totalPool) / (_SCALE * 2);

        // Transfer refund
        collateralToken.safeTransfer(msg.sender, refund);

        emit WinningsClaimed(msg.sender, refund);
        return refund;
    }
} 