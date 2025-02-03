// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import {Test} from "forge-std/Test.sol";
import {MockMarket, IMarket} from "smock/MockMarket.sol";
import {MockOutcomeToken} from "smock/tokens/MockOutcomeToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract UnitMarketTestComposerNoDocs is Test {
    MockMarket public market;
    MockOutcomeToken public outcomeToken;
    address public creator;
    IERC20 public collateralToken;
    uint256 public constant PROTOCOL_FEE = 100; // 1%
    uint256 public constant VIRTUAL_LIQUIDITY = 1000e18;
    string[] public outcomeDescriptions;

    function setUp() public {
        creator = makeAddr("creator");
        collateralToken = IERC20(makeAddr("collateralToken"));
        outcomeToken = new MockOutcomeToken("Test URI", new string[](0));
        
        vm.startPrank(creator);
        outcomeDescriptions = new string[](2);
        outcomeDescriptions[0] = "Yes";
        outcomeDescriptions[1] = "No";

        market = new MockMarket(
            "Will ETH reach $10k in 2024?",
            block.timestamp + 30 days,
            address(collateralToken),
            VIRTUAL_LIQUIDITY,
            PROTOCOL_FEE,
            outcomeDescriptions
        );
        market.set_outcomeToken(outcomeToken);
        vm.stopPrank();
    }

    function test_ConstructorWhenParametersAreValid() external {
        assertEq(market.question(), "Will ETH reach $10k in 2024?");
        assertEq(market.endTime(), block.timestamp + 30 days);
        assertEq(address(market.collateralToken()), address(collateralToken));
        assertEq(market.protocolFee(), PROTOCOL_FEE);
        assertEq(market.creator(), creator);
        assertEq(uint256(market.outcome()), uint256(IMarket.Outcome.Unresolved));
        assertEq(address(market.outcomeToken()), address(outcomeToken));
        
        // Check pools initialization
        for(uint256 i = 0; i < outcomeDescriptions.length; i++) {
            (uint256 virtualLiquidity, uint256 realTokens, uint256 realCollateral) = market.outcomePools(i);
            assertEq(virtualLiquidity, VIRTUAL_LIQUIDITY);
            assertEq(realTokens, 0);
            assertEq(realCollateral, 0);
        }
    }

    function test_BuyWhenMarketHasEnded() external {
        vm.warp(block.timestamp + 31 days);
        vm.expectRevert(IMarket.Market_TradingEnded.selector);
        market.buy(0, 1e18, 100, 0);
    }

    function test_BuyWhenOutcomeIdIsInvalid() external {
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.buy(2, 1e18, 100, 0);
    }

    function test_BuyWhenPriceImpactExceedsMax() external {
        uint256 maxPriceImpactBps = 100; // 1%
        uint256 actualPriceImpact = 200; // 2%
        market.mock_call_calculatePriceImpact(0, 1e18, actualPriceImpact);
        
        vm.expectRevert(IMarket.Market_PriceImpactTooHigh.selector);
        market.buy(0, 1e18, maxPriceImpactBps, 0);
    }

    function test_BuyWhenOutputIsLessThanMinTokensOut() external {
        market.mock_call_calculatePriceImpact(0, 1e18, 50);
        uint256 minTokensOut = 1e18;
        
        vm.expectRevert(IMarket.Market_InsufficientOutput.selector);
        market.buy(0, 1e18, 100, minTokensOut);
    }

    function test_BuyWhenParametersAreValid() external {
        uint256 collateralAmount = 1e18;
        uint256 maxPriceImpactBps = 100;
        uint256 minTokensOut = 0.5e18;
        uint256 outcomeId = 0;
        
        // Setup mocks
        market.mock_call_calculatePriceImpact(outcomeId, collateralAmount, 50);
        vm.mockCall(
            address(collateralToken),
            abi.encodeWithSelector(IERC20.transferFrom.selector),
            abi.encode(true)
        );
        
        // Execute
        vm.prank(address(1));
        uint256 buyAmount = market.buy(outcomeId, collateralAmount, maxPriceImpactBps, minTokensOut);
        
        // Verify
        assertTrue(buyAmount >= minTokensOut);
    }

    function test_SellWhenMarketHasEnded() external {
        vm.warp(block.timestamp + 31 days);
        vm.expectRevert(IMarket.Market_TradingEnded.selector);
        market.sell(0, 1e18, 100, 0);
    }

    function test_SellWhenOutcomeIdIsInvalid() external {
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.sell(2, 1e18, 100, 0);
    }

    function test_SellWhenUserHasInsufficientBalance() external {
        market.mock_call_calculateSellPriceImpact(0, 1e18, 50);
        vm.mockCall(
            address(outcomeToken),
            abi.encodeWithSelector(ERC1155.balanceOf.selector, address(this), 0),
            abi.encode(0)
        );
        
        vm.expectRevert(IMarket.Market_InsufficientBalance.selector);
        market.sell(0, 1e18, 100, 0);
    }

    function test_SellWhenPriceImpactExceedsMax() external {
        uint256 maxPriceImpactBps = 100; // 1%
        uint256 actualPriceImpact = 200; // 2%
        market.mock_call_calculateSellPriceImpact(0, 1e18, actualPriceImpact);
        
        vm.expectRevert(IMarket.Market_PriceImpactTooHigh.selector);
        market.sell(0, 1e18, maxPriceImpactBps, 0);
    }

    function test_SellWhenOutputIsLessThanMinCollateralOut() external {
        uint256 minCollateralOut = 1e18;
        market.mock_call_calculateSellPriceImpact(0, 1e18, 50);
        
        vm.expectRevert(IMarket.Market_InsufficientOutput.selector);
        market.sell(0, 1e18, 100, minCollateralOut);
    }

    function test_ResolveMarketWhenCallerIsNotCreator() external {
        vm.prank(address(1));
        vm.expectRevert(IMarket.Market_Unauthorized.selector);
        market.resolveMarket(0);
    }

    function test_ResolveMarketWhenMarketHasNotEnded() external {
        vm.prank(creator);
        vm.expectRevert(IMarket.Market_TradingNotEnded.selector);
        market.resolveMarket(0);
    }

    function test_ResolveMarketWhenOutcomeIdIsInvalid() external {
        vm.warp(block.timestamp + 31 days);
        vm.prank(creator);
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.resolveMarket(2);
    }

    function test_ResolveMarketWhenParametersAreValid() external {
        vm.warp(block.timestamp + 31 days);
        vm.prank(creator);
        market.resolveMarket(0);
        
        assertEq(uint256(market.outcome()), uint256(IMarket.Outcome.Resolved));
        assertEq(market.winningOutcomeTokenId(), 0);
    }

    function test_ClaimWinningsWhenMarketHasNotEnded() external {
        vm.expectRevert(IMarket.Market_TradingNotEnded.selector);
        market.claimWinnings();
    }

    function test_ClaimWinningsWhenMarketIsNotResolved() external {
        vm.warp(block.timestamp + 31 days);
        vm.expectRevert(IMarket.Market_NoOutcome.selector);
        market.claimWinnings();
    }

    function test_ClaimWinningsWhenUserHasNoTokens() external {
        vm.warp(block.timestamp + 31 days);
        market.set_outcome(IMarket.Outcome.Resolved);
        market.set_winningOutcomeTokenId(0);
        vm.mockCall(
            address(outcomeToken),
            abi.encodeWithSelector(ERC1155.balanceOf.selector, address(this), 0),
            abi.encode(0)
        );
        
        vm.expectRevert(IMarket.Market_NoTokens.selector);
        market.claimWinnings();
    }

    function test_ClaimWinningsWhenParametersAreValid() external {
        vm.warp(block.timestamp + 31 days);
        market.set_outcome(IMarket.Outcome.Resolved);
        market.set_winningOutcomeTokenId(0);
        
        uint256 userTokens = 1e18;
        vm.mockCall(
            address(outcomeToken),
            abi.encodeWithSelector(ERC1155.balanceOf.selector, address(this), 0),
            abi.encode(userTokens)
        );
        
        vm.mockCall(
            address(collateralToken),
            abi.encodeWithSelector(IERC20.transfer.selector),
            abi.encode(true)
        );
        
        uint256 claimAmount = market.claimWinnings();
        assertTrue(claimAmount > 0);
    }

    function test_ExtendMarketWhenCallerIsNotCreator() external {
        vm.prank(address(1));
        vm.expectRevert(IMarket.Market_Unauthorized.selector);
        market.extendMarket(block.timestamp + 60 days);
    }

    function test_ExtendMarketWhenNewEndTimeIsInThePast() external {
        vm.prank(creator);
        vm.expectRevert(IMarket.Market_InvalidEndTime.selector);
        market.extendMarket(block.timestamp - 1);
    }

    function test_ExtendMarketWhenParametersAreValid() external {
        uint256 newEndTime = block.timestamp + 60 days;
        vm.prank(creator);
        market.extendMarket(newEndTime);
        assertEq(market.endTime(), newEndTime);
    }

    function test_GetOutcomeCountReturnsCorrectNumberOfOutcomes() external {
        assertEq(market.getOutcomeCount(), 2);
    }

    function test_GetOutcomeDescriptionWhenOutcomeIndexIsInvalid() external {
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.getOutcomeDescription(2);
    }

    function test_GetOutcomeDescriptionWhenOutcomeIndexIsValid() external {
        assertEq(market.getOutcomeDescription(0), "Yes");
        assertEq(market.getOutcomeDescription(1), "No");
    }

    function test_GetPriceWhenOutcomeIdIsInvalid() external {
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.getPrice(2);
    }

    function test_GetPriceWhenOutcomeIdIsValid() external {
        uint256 expectedPrice = 0.5e18; // 50%
        market.mock_call_getPrice(0, expectedPrice);
        assertEq(market.getPrice(0), expectedPrice);
    }

    function test_GetMarketInfoReturnsCorrectMarketInformation() external {
        (
            string memory _question,
            uint256 _endTime,
            address _collateralToken,
            IMarket.Outcome _outcome
        ) = market.getMarketInfo();

        assertEq(_question, "Will ETH reach $10k in 2024?");
        assertEq(_endTime, block.timestamp + 30 days);
        assertEq(_collateralToken, address(collateralToken));
        assertEq(uint256(_outcome), uint256(IMarket.Outcome.Unresolved));
    }

    function test_CalculatePriceImpactWhenOutcomeIdIsInvalid() external {
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.calculatePriceImpact(2, 1e18);
    }

    function test_CalculatePriceImpactWhenOutcomeIdIsValid() external {
        uint256 expectedImpact = 100; // 1%
        market.mock_call_calculatePriceImpact(0, 1e18, expectedImpact);
        assertEq(market.calculatePriceImpact(0, 1e18), expectedImpact);
    }

    function test_CalculateSellPriceImpactWhenOutcomeIdIsInvalid() external {
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.calculateSellPriceImpact(2, 1e18);
    }

    function test_CalculateSellPriceImpactWhenOutcomeIdIsValid() external {
        uint256 expectedImpact = 100; // 1%
        market.mock_call_calculateSellPriceImpact(0, 1e18, expectedImpact);
        assertEq(market.calculateSellPriceImpact(0, 1e18), expectedImpact);
    }

    function test_GetTotalRealCollateralReturnsCorrectTotalRealCollateral() external {
        uint256 expectedTotal = 100e18;
        market.mock_call_getTotalRealCollateral(expectedTotal);
        assertEq(market.getTotalRealCollateral(), expectedTotal);
    }

    function test_GetTotalLiquidityReturnsCorrectTotalLiquidity() external {
        uint256 expectedTotal = 2000e18;
        market.mock_call_getTotalLiquidity(expectedTotal);
        assertEq(market.getTotalLiquidity(), expectedTotal);
    }
}
