// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script} from "forge-std/Script.sol";
import {Market} from "../src/contracts/Market.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {console} from "forge-std/console.sol";

/**
 * @notice Deploy using forge script with the following command:
 * @dev forge script script/DeployMarket.s.sol:DeployMarket \
 *      --rpc-url <your_rpc_url> \
 *      --account deployer (new coinbase walelt) \
 *      --broadcast \
 *      --sig "run(string,uint256,uint256,address)" \
 *      "Will ETH be above $5000 by end of 2024?" \
 *      100 \
 *      1735689600 \
 *      0x7eAc043A7E4df19EFb31f8b5F37D73BF3a8e9ACd -- USDa Layer0 token on sepolia idk if this is correct aUSD
 * 
 * @dev Parameters explained:
 * - "Will ETH be above $5000 by end of 2024?" : The market question
 * - 100 : Protocol fee in basis points (1%)
 * - 1735689600 : Unix timestamp for end time (use `date -d "2024-12-31" +%s` to generate)
 * - 0xd988097fb8612cc24eeC14542bC03424c656005f : Mode testnet USDC address
 */
contract DeployMarket is Script {
    /// @notice Deploy a new market
    /// @param _question The question to be answered by the market
    /// @param _protocolFee The protocol fee of the market
    /// @param _endTime The end time of the market
    /// @param _collateralToken The collateral token of the market
    //@note for now we just start with 2 outcomes
    function run(string calldata _question, uint256 _protocolFee, uint256 _endTime, address _collateralToken) external {
        // Get deployment private key from environment
        //uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        uint256 _virtualLiquidity = 100000000;

        // Define outcome descriptions
        string[] memory outcomeDescriptions = new string[](2);
        outcomeDescriptions[0] = "Yes";
        outcomeDescriptions[1] = "No";

        vm.startBroadcast();

        // Deploy Market contract
        Market market = new Market(
            _question,
            _endTime,
            _collateralToken,
            _virtualLiquidity,
            _protocolFee,
            outcomeDescriptions
        );

        vm.stopBroadcast();

        // Log deployment info
        console.log("Market deployed to:", address(market));
        console.log("Question:", _question);
        console.log("End time:", _endTime);
        console.log("Collateral token:", _collateralToken);
        console.log("Virtual liquidity:", _virtualLiquidity);
        console.log("Protocol fee (bps):", _protocolFee);
    }
}
