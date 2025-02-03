// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script} from "forge-std/Script.sol";
import {TestToken} from "../src/contracts/tokens/TestToken.sol";
import {console} from "forge-std/console.sol";

/**
 * @notice Deploy using forge script with the following command:
 * @dev forge script scripts/DeployTestToken.s.sol:DeployTestToken \
 *      --rpc-url <your_rpc_url> \
 *      --account deployer \
 *      --broadcast
 */
contract DeployTestToken is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy TestToken
        TestToken token = new TestToken("Test USD", "tUSD");

        // Mint some initial tokens to deployer
        token.mint(msg.sender, 1000000 * 10**18); // 1M tokens

        vm.stopBroadcast();

        // Log deployment info
        console.log("TestToken deployed to:", address(token));
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Decimals:", token.decimals());
        console.log("Initial supply:", token.balanceOf(msg.sender));
    }
} 