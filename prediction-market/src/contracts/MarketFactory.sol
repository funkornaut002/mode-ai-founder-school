// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { Pausable } from '@openzeppelin/contracts/utils/Pausable.sol';
import { IMarketFactory } from 'interfaces/IMarketFactory.sol';
import { Market } from './Market.sol';

/** 
 * @title Market Factory for Prediction Markets
 * @author Funkornaut
 * @notice Factory contract for creating and managing prediction markets
 */
contract MarketFactory is IMarketFactory, Pausable, Ownable {
    // State variables
    mapping(bytes32 _marketId => address _marketAddress) public markets;

    mapping(address _agent => bool _isMarketCreator) public isMarketCreator;

    constructor() Ownable(msg.sender) {}

    modifier onlyMarketCreator() {
        if (!isMarketCreator[msg.sender]) revert MarketFactory_Unauthorized();
        _;
    }

    /// @inheritdoc IMarketFactory
    //@note No maximum limit on _virtualLiquidity, No validation on _question length, No validation on _outcomeDescriptions individual lengths
    function createMarket(
        string calldata _question,
        uint256 _endTime,
        address _collateralToken,
        uint256 _virtualLiquidity,
        uint256 _protocolFee,
        string[] calldata _outcomeDescriptions
    ) external whenNotPaused onlyMarketCreator returns (address marketAddress) {
        if (_endTime <= block.timestamp) revert MarketFactory_InvalidEndTime(); //@note should probaly have a min buffer time
        if (_collateralToken == address(0)) revert MarketFactory_InvalidToken(); //@note should probaly have a whitelist of valid collateral tokens
        if (_outcomeDescriptions.length < 2) revert MarketFactory_InvalidOutcomeCount();
        if (_protocolFee > 1000) revert MarketFactory_FeeTooHigh(); // Max 10%


        bytes32 marketId = keccak256(
            abi.encodePacked(_question, _endTime, _collateralToken) //
        );

        if (markets[marketId] != address(0)) revert MarketFactory_MarketExists();

        // Deploy new market contract
        Market market = new Market(
            _question,
            _endTime,
            _collateralToken,
            _virtualLiquidity,
            _protocolFee,
            _outcomeDescriptions
        );
        marketAddress = address(market);

        // Register market
        markets[marketId] = marketAddress;

        emit MarketCreated(
            marketId,
            marketAddress,
            _question,
            _endTime,
            _collateralToken,
            _virtualLiquidity
        );
    }

    /// @inheritdoc IMarketFactory
    function getMarket(bytes32 _marketId) external view returns (address) {
        return markets[_marketId];
    }

    function addMarketCreator(address _agent) external onlyOwner {
        isMarketCreator[_agent] = true;
        emit MarketCreatorAdded(_agent);
    }

    function removeMarketCreator(address _agent) external onlyOwner {
        isMarketCreator[_agent] = false;
        emit MarketCreatorRemoved(_agent);
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