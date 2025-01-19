// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/// @title Interface for Position Tokens
/// @notice Defines the interface for market position tokens
interface IPositionToken {
    /// @notice Mints new position tokens
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) external;

    /// @notice Burns position tokens
    /// @param from Address to burn tokens from
    /// @param amount Amount of tokens to burn
    function burn(address from, uint256 amount) external;
} 