// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import {Test} from "forge-std/Test.sol";

contract UnitMarketFactoryTest is Test {
    function test_CreateMarketWhenQuestionIsEmpty() external {
        // it reverts
        vm.skip(true);
    }

    function test_CreateMarketWhenEndTimeIsLessThanMinMarketDuration() external {
        // it reverts
        vm.skip(true);
    }

    function test_CreateMarketWhenCollateralTokenIs0() external {
        // it reverts
        vm.skip(true);
    }

    function test_CreateMarketWhenProtocolFeeIsGreaterThanMax() external {
        // it reverts
        vm.skip(true);
    }

    function test_CreateMarketWhenOutcomeDescriptionsLengthIsLessThan2OrGreaterThan10() external {
        // it reverts
        vm.skip(true);
    }

    function test_CreateMarketWhenMarketAlreadyExists() external {
        // it reverts
        vm.skip(true);
    }

    function test_CreateMarketWhenMarketIsCreatedSuccessfully() external {
        // it registers the market
        // it returns the market address
        // it emits the correct event
        vm.skip(true);
    }

    function test_GetMarketWhenMarketDoesNotExist() external {
        // it returns 0x0
        vm.skip(true);
    }

    function test_GetMarketWhenMarketExists() external {
        // it returns the market address
        vm.skip(true);
    }

    function test_AddMarketCreatorWhenCallerIsNotOwner() external {
        // it reverts
        vm.skip(true);
    }

    function test_AddMarketCreatorWhenCallerIsOwner() external {
        // it adds the agent as a market creator
        // it emits the correct event
        vm.skip(true);
    }

    function test_RemoveMarketCreatorWhenCallerIsNotOwner() external {
        // it reverts
        vm.skip(true);
    }

    function test_RemoveMarketCreatorWhenCallerIsOwner() external {
        // it removes the agent as a market creator
        // it emits the correct event
        vm.skip(true);
    }

    function test_PauseWhenCallerIsNotOwner() external {
        // it reverts
        vm.skip(true);
    }

    function test_PauseWhenFactoryIsPaused() external {
        // it reverts
        vm.skip(true);
    }

    function test_PauseWhenCallerIsOwner() external {
        // it pauses the market creation
        // it emits the correct event
        vm.skip(true);
    }

    function test_UnpauseWhenCallerIsNotOwner() external {
        // it reverts
        vm.skip(true);
    }

    function test_UnpauseWhenFactoryIsNotPaused() external {
        // it reverts
        vm.skip(true);
    }

    function test_UnpauseWhenCallerIsOwner() external {
        // it unpauses the market creation
        // it emits the correct event
        vm.skip(true);
    }
}
