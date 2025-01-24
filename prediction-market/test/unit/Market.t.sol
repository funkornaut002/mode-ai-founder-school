// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

import {Test} from "forge-std/Test.sol";
import {MockMarket, IMarket} from "smock/MockMarket.sol";
import {MockOutcomeToken} from "smock/tokens/MockOutcomeToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Market} from "contracts/Market.sol";

contract UnitMarketTestWithDocs is Test {
    MockMarket public market;
    MockOutcomeToken public outcomeToken;
    IERC20 public collateralToken;
    
    string public constant QUESTION = "Will ETH reach $10k in 2024?";
    uint256 public constant END_TIME = 1735689600; // Dec 31, 2024
    uint256 public constant VIRTUAL_LIQUIDITY = 1000e18;
    uint256 public constant PROTOCOL_FEE = 30; // 0.3%
    string[] public outcomeDescriptions = ["Yes", "No"];

    function setUp() public {
        collateralToken = IERC20(makeAddr("collateralToken"));
        market = new MockMarket(
            QUESTION,
            END_TIME,
            address(collateralToken),
            VIRTUAL_LIQUIDITY,
            PROTOCOL_FEE,
            outcomeDescriptions
        );
    }

    function test_ConstructorWhenParametersAreValid() external {
        // it sets the correct question
        assertEq(market.question(), QUESTION);
        
        // it sets the correct end time
        assertEq(market.endTime(), END_TIME);
        
        // it sets the correct collateral token
        assertEq(address(market.collateralToken()), address(collateralToken));
        
        // it sets the correct protocol fee
        assertEq(market.protocolFee(), PROTOCOL_FEE);
        
        // it sets the creator
        assertEq(market.creator(), address(this));
        
        // it sets the outcome to unresolved
        assertEq(uint256(market.outcome()), uint256(IMarket.Outcome.Unresolved));
        
        // it deploys outcome token contract
        address outcomeTokenAddr = address(market.outcomeToken());
        assertTrue(outcomeTokenAddr != address(0));
        
        // it initializes pools with virtual liquidity
        for (uint256 i = 0; i < outcomeDescriptions.length; i++) {
            (uint256 virtualLiquidity,,) = market.outcomePools(i);
            assertEq(virtualLiquidity, VIRTUAL_LIQUIDITY);
        }
    }

    function test_BuyWhenMarketHasEnded() external {
        // Set up market end time in the past
        uint256 pastEndTime = block.timestamp - 1;
        market = new MockMarket(
            QUESTION,
            pastEndTime,
            address(collateralToken),
            VIRTUAL_LIQUIDITY,
            PROTOCOL_FEE,
            outcomeDescriptions
        );

        // Expect revert when trying to buy
        vm.expectRevert(IMarket.Market_TradingEnded.selector);
        market.buy(0, 100e18, 1000, 1e18);
    }

    function test_BuyWhenOutcomeIdIsInvalid() external {
        uint256 invalidOutcomeId = outcomeDescriptions.length;
        
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.buy(invalidOutcomeId, 100e18, 1000, 1e18);
    }

    function test_BuyWhenPriceImpactExceedsMax(uint256 collateralAmount) external {
        collateralAmount = bound(collateralAmount, 1e18, 1000000e18);
        uint256 maxPriceImpactBps = 100; // 1%
        
        // Mock a high price impact calculation
        uint256 highPriceImpact = maxPriceImpactBps + 1;
        market.mock_call_calculatePriceImpact(0, collateralAmount, highPriceImpact);
        
        vm.expectRevert(IMarket.Market_PriceImpactTooHigh.selector);
        market.buy(0, collateralAmount, maxPriceImpactBps, 1e18);
    }

    function test_BuyWhenOutputIsLessThanMinTokensOut(uint256 collateralAmount, uint256 minTokensOut) external {
        collateralAmount = bound(collateralAmount, 1e18, 1000000e18);
        minTokensOut = bound(minTokensOut, 2e18, 1000000e18);
        
        // Mock a low output calculation
        uint256 lowOutput = minTokensOut - 1;
        market.mock_call_buy(0, collateralAmount, 1000, minTokensOut, lowOutput);
        
        vm.expectRevert(IMarket.Market_InsufficientOutput.selector);
        market.buy(0, collateralAmount, 1000, minTokensOut);
    }

    function test_BuyWhenParametersAreValid(uint256 collateralAmount) external {
        collateralAmount = bound(collateralAmount, 1e18, 1000000e18);
        uint256 maxPriceImpactBps = 1000; // 10%
        uint256 minTokensOut = 1e18;
        uint256 outcomeId = 0;
        uint256 expectedTokens = 90e18;
        uint256 fee = (collateralAmount * PROTOCOL_FEE) / 10000;
        uint256 netCollateral = collateralAmount - fee;

        // Mock price impact calculation
        market.mock_call_calculatePriceImpact(outcomeId, collateralAmount, maxPriceImpactBps - 1);

        // Mock token minting
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        outcomeToken.mock_call_mint(address(this), outcomeId, expectedTokens);

        // Mock collateral transfer
        vm.mockCall(
            address(collateralToken),
            abi.encodeCall(IERC20.transferFrom, (address(this), address(market), collateralAmount)),
            abi.encode(true)
        );

        // Expect events
        vm.expectEmit(address(market));
        emit IMarket.TokensBought(address(this), outcomeId, netCollateral, expectedTokens);

        // Execute buy
        uint256 tokensReceived = market.buy(outcomeId, collateralAmount, maxPriceImpactBps, minTokensOut);
        assertEq(tokensReceived, expectedTokens);

        // Verify pool state updates
        (,uint256 realTokens, uint256 realCollateral) = market.outcomePools(outcomeId);
        assertEq(realTokens, expectedTokens);
        assertEq(realCollateral, netCollateral);
    }

    function test_SellWhenMarketHasEnded() external {
        // Set up market end time in the past
        uint256 pastEndTime = block.timestamp - 1;
        market = new MockMarket(
            QUESTION,
            pastEndTime,
            address(collateralToken),
            VIRTUAL_LIQUIDITY,
            PROTOCOL_FEE,
            outcomeDescriptions
        );

        vm.expectRevert(IMarket.Market_TradingEnded.selector);
        market.sell(0, 100e18, 1000, 1e18);
    }

    function test_SellWhenOutcomeIdIsInvalid() external {
        uint256 invalidOutcomeId = outcomeDescriptions.length;
        
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.sell(invalidOutcomeId, 100e18, 1000, 1e18);
    }

    function test_SellWhenUserHasInsufficientBalance(uint256 tokenAmount) external {
        tokenAmount = bound(tokenAmount, 1e18, 1000000e18);
        uint256 outcomeId = 0;

        // Mock zero balance
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        vm.mockCall(
            address(outcomeToken),
            abi.encodeCall(IERC1155.balanceOf, (address(this), outcomeId)),
            abi.encode(0)
        );

        vm.expectRevert(IMarket.Market_InsufficientBalance.selector);
        market.sell(outcomeId, tokenAmount, 1000, 1e18);
    }

    function test_SellWhenPriceImpactExceedsMax(uint256 tokenAmount) external {
        tokenAmount = bound(tokenAmount, 1e18, 1000000e18);
        uint256 maxPriceImpactBps = 100; // 1%
        uint256 outcomeId = 0;

        // Mock sufficient balance
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        vm.mockCall(
            address(outcomeToken),
            abi.encodeCall(IERC1155.balanceOf, (address(this), outcomeId)),
            abi.encode(tokenAmount)
        );

        // Mock high price impact
        market.mock_call_calculateSellPriceImpact(outcomeId, tokenAmount, maxPriceImpactBps + 1);

        vm.expectRevert(IMarket.Market_PriceImpactTooHigh.selector);
        market.sell(outcomeId, tokenAmount, maxPriceImpactBps, 1e18);
    }

    function test_SellWhenOutputIsLessThanMinCollateralOut(uint256 tokenAmount, uint256 minCollateralOut) external {
        tokenAmount = bound(tokenAmount, 1e18, 1000000e18);
        minCollateralOut = bound(minCollateralOut, 2e18, 1000000e18);
        uint256 outcomeId = 0;

        // Mock sufficient balance
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        vm.mockCall(
            address(outcomeToken),
            abi.encodeCall(IERC1155.balanceOf, (address(this), outcomeId)),
            abi.encode(tokenAmount)
        );

        // Mock low output
        uint256 lowOutput = minCollateralOut - 1;
        market.mock_call_sell(outcomeId, tokenAmount, 1000, minCollateralOut, lowOutput);

        vm.expectRevert(IMarket.Market_InsufficientOutput.selector);
        market.sell(outcomeId, tokenAmount, 1000, minCollateralOut);
    }

    function test_SellWhenParametersAreValid(uint256 tokenAmount) external {
        tokenAmount = bound(tokenAmount, 1e18, 1000000e18);
        uint256 maxPriceImpactBps = 1000; // 10%
        uint256 minCollateralOut = 1e18;
        uint256 outcomeId = 0;
        uint256 expectedCollateral = 90e18;
        uint256 fee = (expectedCollateral * PROTOCOL_FEE) / 10000;
        uint256 netCollateral = expectedCollateral - fee;

        // Mock sufficient balance
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        vm.mockCall(
            address(outcomeToken),
            abi.encodeCall(IERC1155.balanceOf, (address(this), outcomeId)),
            abi.encode(tokenAmount)
        );

        // Mock price impact calculation
        market.mock_call_calculateSellPriceImpact(outcomeId, tokenAmount, maxPriceImpactBps - 1);

        // Mock token burning
        outcomeToken.mock_call_burn(address(this), outcomeId, tokenAmount);

        // Mock collateral transfer
        vm.mockCall(
            address(collateralToken),
            abi.encodeCall(IERC20.transfer, (address(this), netCollateral)),
            abi.encode(true)
        );

        // Expect events
        vm.expectEmit(address(market));
        emit IMarket.TokensSold(address(this), outcomeId, tokenAmount, netCollateral);

        // Execute sell
        uint256 collateralReceived = market.sell(outcomeId, tokenAmount, maxPriceImpactBps, minCollateralOut);
        assertEq(collateralReceived, netCollateral);

        // Verify pool state updates
        (,uint256 realTokens, uint256 realCollateral) = market.outcomePools(outcomeId);
        assertEq(realTokens, 0);
        assertEq(realCollateral, 0);
    }

    function test_ResolveMarketWhenCallerIsNotCreator() external {
        address nonCreator = makeAddr("nonCreator");
        vm.prank(nonCreator);
        vm.expectRevert(IMarket.Market_Unauthorized.selector);
        market.resolveMarket(0);
    }

    function test_ResolveMarketWhenMarketHasNotEnded() external {
        vm.warp(END_TIME - 1);
        vm.expectRevert(IMarket.Market_TradingNotEnded.selector);
        market.resolveMarket(0);
    }

    function test_ResolveMarketWhenOutcomeIdIsInvalid() external {
        vm.warp(END_TIME + 1);
        uint256 invalidOutcomeId = outcomeDescriptions.length;
        
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.resolveMarket(invalidOutcomeId);
    }

    function test_ResolveMarketWhenParametersAreValid() external {
        vm.warp(END_TIME + 1);
        uint256 winningOutcomeId = 0;

        // Expect events
        vm.expectEmit(address(market));
        emit IMarket.MarketResolved(IMarket.Outcome.Resolved);

        market.resolveMarket(winningOutcomeId);

        assertEq(uint256(market.outcome()), uint256(IMarket.Outcome.Resolved));
        assertEq(market.winningOutcomeTokenId(), winningOutcomeId);
    }

    function test_ClaimWinningsWhenMarketHasNotEnded() external {
        vm.warp(END_TIME - 1);
        vm.expectRevert(IMarket.Market_TradingNotEnded.selector);
        market.claimWinnings();
    }

    function test_ClaimWinningsWhenMarketIsNotResolved() external {
        vm.warp(END_TIME + 1);
        vm.expectRevert(IMarket.Market_NoOutcome.selector);
        market.claimWinnings();
    }

    function test_ClaimWinningsWhenUserHasNoTokens() external {
        // Setup resolved market
        vm.warp(END_TIME + 1);
        uint256 winningOutcomeId = 0;
        market.resolveMarket(winningOutcomeId);

        // Mock zero balance
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        vm.mockCall(
            address(outcomeToken),
            abi.encodeCall(IERC1155.balanceOf, (address(this), winningOutcomeId)),
            abi.encode(0)
        );

        vm.expectRevert(IMarket.Market_NoTokens.selector);
        market.claimWinnings();
    }

    function test_ClaimWinningsWhenParametersAreValid(uint256 userTokens) external {
        userTokens = bound(userTokens, 1e18, 1000000e18);
        uint256 winningOutcomeId = 0;
        uint256 totalRealCollateral = 1000e18;
        uint256 totalWinningTokens = 100e18;
        uint256 expectedShare = (userTokens * totalRealCollateral) / totalWinningTokens;

        // Setup resolved market
        vm.warp(END_TIME + 1);
        market.resolveMarket(winningOutcomeId);

        // Mock winning pool state
        market.mock_call_outcomePools(winningOutcomeId, Market.Pool({
            virtualLiquidity: VIRTUAL_LIQUIDITY,
            realTokens: totalWinningTokens,
            realCollateral: totalRealCollateral
        }));

        // Mock user balance
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        vm.mockCall(
            address(outcomeToken),
            abi.encodeCall(IERC1155.balanceOf, (address(this), winningOutcomeId)),
            abi.encode(userTokens)
        );

        // Mock token burning
        outcomeToken.mock_call_burn(address(this), winningOutcomeId, userTokens);

        // Mock collateral transfer
        vm.mockCall(
            address(collateralToken),
            abi.encodeCall(IERC20.transfer, (address(this), expectedShare)),
            abi.encode(true)
        );

        // Expect events
        vm.expectEmit(address(market));
        emit IMarket.WinningsClaimed(address(this), expectedShare);

        uint256 claimedAmount = market.claimWinnings();
        assertEq(claimedAmount, expectedShare);
    }

    function test_ExtendMarketWhenCallerIsNotCreator() external {
        address nonCreator = makeAddr("nonCreator");
        vm.prank(nonCreator);
        vm.expectRevert(IMarket.Market_Unauthorized.selector);
        market.extendMarket(END_TIME + 1 days);
    }

    function test_ExtendMarketWhenNewEndTimeIsInThePast() external {
        vm.warp(END_TIME + 1);
        vm.expectRevert(IMarket.Market_InvalidEndTime.selector);
        market.extendMarket(END_TIME);
    }

    function test_ExtendMarketWhenParametersAreValid() external {
        uint256 newEndTime = END_TIME + 1 days;

        // Expect events
        vm.expectEmit(address(market));
        emit IMarket.MarketExtended(END_TIME, newEndTime);

        market.extendMarket(newEndTime);
        assertEq(market.endTime(), newEndTime);
    }

    function test_InvalidateMarketWhenCallerIsNotCreator() external {
        address nonCreator = makeAddr("nonCreator");
        vm.prank(nonCreator);
        vm.expectRevert(IMarket.Market_Unauthorized.selector);
        market.invalidateMarket();
    }

    function test_InvalidateMarketWhenMarketHasNotEnded() external {
        vm.warp(END_TIME - 1);
        vm.expectRevert(IMarket.Market_TradingNotEnded.selector);
        market.invalidateMarket();
    }

    function test_InvalidateMarketWhenMarketIsAlreadyResolved() external {
        vm.warp(END_TIME + 1);
        market.resolveMarket(0);
        vm.expectRevert(IMarket.Market_AlreadyResolved.selector);
        market.invalidateMarket();
    }

    function test_InvalidateMarketWhenParametersAreValid() external {
        vm.warp(END_TIME + 1);

        // Expect events
        vm.expectEmit(address(market));
        emit IMarket.MarketInvalidated();

        market.invalidateMarket();
        assertEq(uint256(market.outcome()), uint256(IMarket.Outcome.Invalid));
    }

    function test_ClaimInvalidMarketWhenMarketHasNotEnded() external {
        vm.warp(END_TIME - 1);
        vm.expectRevert(IMarket.Market_TradingNotEnded.selector);
        market.claimInvalidMarket();
    }

    function test_ClaimInvalidMarketWhenMarketIsNotInvalid() external {
        vm.warp(END_TIME + 1);
        vm.expectRevert(IMarket.Market_NotInvalid.selector);
        market.claimInvalidMarket();
    }

    function test_ClaimInvalidMarketWhenUserHasNoTokens() external {
        // Setup invalid market
        vm.warp(END_TIME + 1);
        market.invalidateMarket();

        // Mock zero balances for all outcomes
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        for (uint256 i = 0; i < outcomeDescriptions.length; i++) {
            vm.mockCall(
                address(outcomeToken),
                abi.encodeCall(IERC1155.balanceOf, (address(this), i)),
                abi.encode(0)
            );
        }

        vm.expectRevert(IMarket.Market_NoTokens.selector);
        market.claimInvalidMarket();
    }

    function test_ClaimInvalidMarketWhenParametersAreValid(uint256 tokenAmount) external {
        tokenAmount = bound(tokenAmount, 1e18, 1000000e18);
        uint256 outcomeId = 0;
        uint256 poolCollateral = 1000e18;
        uint256 poolTokens = 100e18;
        uint256 expectedRefund = (tokenAmount * poolCollateral) / poolTokens;

        // Setup invalid market
        vm.warp(END_TIME + 1);
        market.invalidateMarket();

        // Mock pool state
        market.mock_call_outcomePools(outcomeId, Market.Pool({
            virtualLiquidity: VIRTUAL_LIQUIDITY,
            realTokens: poolTokens,
            realCollateral: poolCollateral
        }));

        // Mock token balance
        outcomeToken = MockOutcomeToken(address(market.outcomeToken()));
        vm.mockCall(
            address(outcomeToken),
            abi.encodeCall(IERC1155.balanceOf, (address(this), outcomeId)),
            abi.encode(tokenAmount)
        );

        // Mock token burning
        outcomeToken.mock_call_burn(address(this), outcomeId, tokenAmount);

        // Mock collateral transfer
        vm.mockCall(
            address(collateralToken),
            abi.encodeCall(IERC20.transfer, (address(this), expectedRefund)),
            abi.encode(true)
        );

        // Expect events
        vm.expectEmit(address(market));
        emit IMarket.InvalidMarketClaimed(address(this), expectedRefund);

        uint256 refundAmount = market.claimInvalidMarket();
        assertEq(refundAmount, expectedRefund);

        // Verify pool state updates
        (,uint256 realTokens, uint256 realCollateral) = market.outcomePools(outcomeId);
        assertEq(realTokens, poolTokens - tokenAmount);
        assertEq(realCollateral, poolCollateral - expectedRefund);
    }

    function test_CollectFeesWhenCallerIsNotCreator() external {
        address nonCreator = makeAddr("nonCreator");
        vm.prank(nonCreator);
        vm.expectRevert(IMarket.Market_Unauthorized.selector);
        market.collectFees();
    }

    function test_CollectFeesWhenNoFeesToCollect() external {
        vm.expectRevert(IMarket.Market_NoFeesToCollect.selector);
        market.collectFees();
    }

    function test_CollectFeesWhenParametersAreValid(uint256 accumulatedFees) external {
        accumulatedFees = bound(accumulatedFees, 1e18, 1000000e18);

        // Mock accumulated fees
        market.set_accumulatedFees(accumulatedFees);

        // Mock collateral transfer
        vm.mockCall(
            address(collateralToken),
            abi.encodeCall(IERC20.transfer, (address(this), accumulatedFees)),
            abi.encode(true)
        );

        // Expect events
        vm.expectEmit(address(market));
        emit IMarket.FeesCollected(address(this), accumulatedFees);

        uint256 collectedFees = market.collectFees();
        assertEq(collectedFees, accumulatedFees);
        assertEq(market.accumulatedFees(), 0);
    }

    function test_GetOutcomeCountReturnsCorrectNumberOfOutcomes() external {
        uint256 outcomeCount = market.getOutcomeCount();
        assertEq(outcomeCount, outcomeDescriptions.length);
    }

    function test_GetOutcomeDescriptionWhenOutcomeIndexIsInvalid() external {
        uint256 invalidIndex = outcomeDescriptions.length;
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.getOutcomeDescription(invalidIndex);
    }

    function test_GetOutcomeDescriptionWhenOutcomeIndexIsValid() external {
        for (uint256 i = 0; i < outcomeDescriptions.length; i++) {
            string memory description = market.getOutcomeDescription(i);
            assertEq(description, outcomeDescriptions[i]);
        }
    }

    function test_CalcBuyAmountReturnsCorrectBuyAmountBasedOnInvestment(uint256 investmentAmount) external {
        investmentAmount = bound(investmentAmount, 1e18, 1000000e18);
        uint256 outcomeId = 0;
        uint256 expectedTokens = 90e18;

        market.mock_call_calcBuyAmount(outcomeId, investmentAmount, expectedTokens);

        uint256 buyAmount = market.calcBuyAmount(outcomeId, investmentAmount);
        assertEq(buyAmount, expectedTokens);
    }

    function test_CalcSellAmountReturnsCorrectSellAmountBasedOnPosition(uint256 positionAmount) external {
        positionAmount = bound(positionAmount, 1e18, 1000000e18);
        uint256 outcomeId = 0;
        uint256 expectedCollateral = 90e18;

        market.mock_call_calcSellAmount(outcomeId, positionAmount, expectedCollateral);

        uint256 sellAmount = market.calcSellAmount(outcomeId, positionAmount);
        assertEq(sellAmount, expectedCollateral);
    }

    function test_GetPriceWhenOutcomeIdIsInvalid() external {
        uint256 invalidOutcomeId = outcomeDescriptions.length;
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.getPrice(invalidOutcomeId);
    }

    function test_GetPriceWhenOutcomeIdIsValid(uint256 price) external {
        price = bound(price, 0, 1e18);
        uint256 outcomeId = 0;

        market.mock_call_getPrice(outcomeId, price);

        uint256 currentPrice = market.getPrice(outcomeId);
        assertEq(currentPrice, price);
    }

    function test_GetMarketInfoReturnsCorrectMarketInformation() external {
        (
            string memory questionResult,
            uint256 endTimeResult,
            address collateralTokenResult,
            IMarket.Outcome outcomeResult
        ) = market.getMarketInfo();

        assertEq(questionResult, QUESTION);
        assertEq(endTimeResult, END_TIME);
        assertEq(collateralTokenResult, address(collateralToken));
        assertEq(uint256(outcomeResult), uint256(IMarket.Outcome.Unresolved));
    }

    function test_CalculatePriceImpactWhenOutcomeIdIsInvalid() external {
        uint256 invalidOutcomeId = outcomeDescriptions.length;
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.calculatePriceImpact(invalidOutcomeId, 100e18);
    }

    function test_CalculatePriceImpactWhenOutcomeIdIsValid(uint256 tradeAmount) external {
        tradeAmount = bound(tradeAmount, 1e18, 1000000e18);
        uint256 outcomeId = 0;
        uint256 expectedPriceImpact = 100; // 1%

        market.mock_call_calculatePriceImpact(outcomeId, tradeAmount, expectedPriceImpact);

        uint256 priceImpact = market.calculatePriceImpact(outcomeId, tradeAmount);
        assertEq(priceImpact, expectedPriceImpact);
    }

    function test_CalculateSellPriceImpactWhenOutcomeIdIsInvalid() external {
        uint256 invalidOutcomeId = outcomeDescriptions.length;
        vm.expectRevert(IMarket.Market_InvalidOutcome.selector);
        market.calculateSellPriceImpact(invalidOutcomeId, 100e18);
    }

    function test_CalculateSellPriceImpactWhenOutcomeIdIsValid(uint256 tokenAmount) external {
        tokenAmount = bound(tokenAmount, 1e18, 1000000e18);
        uint256 outcomeId = 0;
        uint256 expectedPriceImpact = 100; // 1%

        market.mock_call_calculateSellPriceImpact(outcomeId, tokenAmount, expectedPriceImpact);

        uint256 priceImpact = market.calculateSellPriceImpact(outcomeId, tokenAmount);
        assertEq(priceImpact, expectedPriceImpact);
    }

    function test_GetTotalRealCollateralReturnsCorrectTotalRealCollateral(uint256 totalCollateral) external {
        totalCollateral = bound(totalCollateral, 0, 1000000e18);

        market.mock_call_getTotalRealCollateral(totalCollateral);

        uint256 result = market.getTotalRealCollateral();
        assertEq(result, totalCollateral);
    }

    function test_GetTotalLiquidityReturnsCorrectTotalLiquidity(uint256 totalLiquidity) external {
        totalLiquidity = bound(totalLiquidity, VIRTUAL_LIQUIDITY * 2, 1000000e18);

        market.mock_call_getTotalLiquidity(totalLiquidity);

        uint256 result = market.getTotalLiquidity();
        assertEq(result, totalLiquidity);
    }
}
