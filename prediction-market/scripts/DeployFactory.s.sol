// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script} from "forge-std/Script.sol";
import {MarketFactory} from "../src/contracts/MarketFactory.sol";
import {console} from "forge-std/console.sol";

/**
 * @notice Deploy using forge script with the following command:
 * @dev forge script scripts/DeployFactory.s.sol:DeployFactory \
 *      --rpc-url <your_rpc_url> \
 *      --account deployer \
 *      --broadcast
 */
contract DeployFactory is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy MarketFactory contract
        MarketFactory factory = new MarketFactory();

        // Add deployer as market creator
        factory.addMarketCreator(msg.sender);

        vm.stopBroadcast();

        // Log deployment info
        console.log("MarketFactory deployed to:", address(factory));
        console.log("Owner:", factory.owner());
        console.log("Market creator added:", msg.sender);
    }
}
