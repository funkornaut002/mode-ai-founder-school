// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {IMarketFactory} from 'interfaces/IMarketFactory.sol';
import {Market} from './Market.sol';

/** 
 * @title Market Factory for Prediction Markets
 * @author Funkornaut
 * @notice Factory contract for creating and managing prediction markets
 */
contract MarketFactory is IMarketFactory, Ownable, Pausable {
    // State variables
    uint256 public protocolFee;
    mapping(bytes32 => address) public markets;
    mapping(address => bool) public validMarkets;

    constructor(uint256 _protocolFee) Ownable(msg.sender) {
        protocolFee = _protocolFee;
    }

    /** 
     * @notice Ensures only authorized market creators can create markets
     * @dev To be replaced with a proper roles authority system
     * @param market The market address to check authorization for
     */
    modifier onlyMarketCreator(address market) {
        // @todo add in a roles authority 
        _;
    }

    /// @inheritdoc IMarketFactory
    function createMarket(
        string calldata question,
        uint256 endTime,
        address collateralToken,
        uint256 initialLiquidity
    ) external whenNotPaused onlyMarketCreator(msg.sender) returns (address marketAddress) {
        if (endTime <= block.timestamp) revert MarketFactory_InvalidEndTime();
        if (collateralToken == address(0)) revert MarketFactory_InvalidToken();
        if (initialLiquidity == 0) revert MarketFactory_InvalidLiquidity(); //@note probaly need a minimum liquidity amount

        bytes32 marketId = keccak256(
            abi.encodePacked(question, endTime, collateralToken)
        );

        if (markets[marketId] != address(0)) revert MarketFactory_MarketExists();

        // Deploy new market contract
        Market market = new Market(
            question,
            endTime,
            collateralToken,
            initialLiquidity,
            protocolFee,
            msg.sender
        );
        marketAddress = address(market);

        // Register market
        markets[marketId] = marketAddress;
        validMarkets[marketAddress] = true;

        emit MarketCreated(
            marketAddress,
            question,
            endTime,
            collateralToken,
            initialLiquidity
        );
    }

    /// @inheritdoc IMarketFactory
    function setProtocolFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, 'MarketFactory_FeeTooHigh'); // Max 10%
        uint256 oldFee = protocolFee;
        protocolFee = newFee;
        emit ProtocolFeeUpdated(oldFee, newFee);
    }

    /// @inheritdoc IMarketFactory
    function getMarket(bytes32 marketId) external view returns (address) {
        return markets[marketId];
    }

    /// @inheritdoc IMarketFactory
    function isValidMarket(address market) external view returns (bool) {
        return validMarkets[market];
    }

    /** 
     * @notice Pauses market creation
     * @dev Only callable by contract owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /** 
     * @notice Unpauses market creation
     * @dev Only callable by contract owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }
} 