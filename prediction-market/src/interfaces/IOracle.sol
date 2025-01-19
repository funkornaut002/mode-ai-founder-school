// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import './IMarket.sol';

/// @title Interface for Market Oracle
/// @notice Defines the interface for market resolution
interface IOracle {
    /// @notice Resolution functions
    function resolveMarket(
        address market,
        IMarket.Outcome outcome
    ) external;
    
    function challengeResolution(address market) external;
    
    /// @notice View functions
    function canResolve(address resolver) external view returns (bool);
    function getResolution(
        address market
    ) external view returns (
        IMarket.Outcome outcome,
        uint256 timestamp,
        bool challenged
    );
} 