// // SPDX-License-Identifier: MIT
// pragma solidity 0.8.25;

// /** 
//  * @title Interface for Fixed Product Market Maker
//  * @notice Defines the interface for market making calculations
//  */
// interface IFPMM {
//     /** 
//      * @notice Calculate the amount of outcome tokens to receive for a given investment
//      * @param isYes Whether calculating for YES tokens
//      * @param investmentAmount Amount of collateral to invest
//      * @return buyAmount Amount of outcome tokens to receive
//      */
//     function calcBuyAmount(
//         bool isYes,
//         uint256 investmentAmount
//     ) external view returns (uint256 buyAmount);
    
//     /** 
//      * @notice Calculate the amount of collateral to receive for selling outcome tokens
//      * @param isYes Whether calculating for YES tokens
//      * @param positionAmount Amount of outcome tokens to sell
//      * @return returnAmount Amount of collateral to receive
//      */
//     function calcSellAmount(
//         bool isYes,
//         uint256 positionAmount
//     ) external view returns (uint256 returnAmount);

//     /** 
//      * @notice Calculate the amount of LP tokens to receive for adding liquidity
//      * @param collateralAmount Amount of collateral to add
//      * @return lpTokens Amount of LP tokens to receive
//      */
//     function calcLPTokensForLiquidity(
//         uint256 collateralAmount
//     ) external view returns (uint256 lpTokens);
    
//     /** 
//      * @notice Calculate the amount of collateral to receive for burning LP tokens
//      * @param lpTokens Amount of LP tokens to burn
//      * @return collateralAmount Amount of collateral to receive
//      */
//     function calcCollateralForLPTokens(
//         uint256 lpTokens
//     ) external view returns (uint256 collateralAmount);
// } 