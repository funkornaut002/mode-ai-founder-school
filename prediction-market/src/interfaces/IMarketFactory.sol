// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/** 
 * @title IMarketFactory - Interface for creating and managing prediction markets
 * @notice This interface defines the core functionality for a prediction market factory
 */
interface IMarketFactory {
    //////////////
    /// EVENTS ///
    //////////////
    
    /** 
     * @notice Emitted when a new prediction market is created
     * @param marketAddress The address of the newly created market contract
     * @param question The question or description of the market
     * @param endTime The timestamp when trading period ends
     * @param collateralToken The address of the token used for trading
     * @param initialLiquidity The amount of collateral used to seed the market
     */
    event MarketCreated(
        address indexed marketAddress,
        string question,
        uint256 endTime,
        address collateralToken,
        uint256 initialLiquidity
    );

    /** 
     * @notice Emitted when the protocol fee is updated
     * @param oldFee The previous fee value in basis points
     * @param newFee The new fee value in basis points
     */
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);

    //////////////
    /// Errors ///
    //////////////

    /** @notice Thrown when the provided end time is not in the future */
    error MarketFactory_InvalidEndTime();

    /** @notice Thrown when an invalid token address is provided */
    error MarketFactory_InvalidToken();

    /** @notice Thrown when the initial liquidity amount is invalid */
    error MarketFactory_InvalidLiquidity();

    /** @notice Thrown when attempting to create a market that already exists */
    error MarketFactory_MarketExists();

    /** @notice Thrown when the fee is set higher than the maximum allowed */
    error MarketFactory_FeeTooHigh();

    /** @notice Thrown when caller lacks required role */
    error MarketFactory_Unauthorized();

    /////////////////
    /// VARIABLES ///
    /////////////////

    /** 
     * @notice The protocol fee in basis points (1/10000)
     * @return The current protocol fee
     */
    function protocolFee() external view returns (uint256);

    /** 
     * @notice Mapping of market IDs to market addresses
     * @param marketId The unique identifier of the market
     * @return The address of the market contract
     */
    function markets(bytes32 marketId) external view returns (address);

    /** 
     * @notice Mapping to track valid market addresses
     * @param market The address to check
     * @return True if the address is a valid market, false otherwise
     */
    function validMarkets(address market) external view returns (bool);

    /** 
     * @notice Mapping to track authorized market creators
     * @param _agent The address to check
     * @return True if the address is an authorized market creator
     */
    function isMarketCreator(address _agent) external view returns (bool);

    /////////////
    /// LOGIC ///
    /////////////

    /** 
     * @notice Creates a new prediction market
     * @dev The market creator must be authorized and provide sufficient initial liquidity
     * @param question The market question/description
     * @param endTime When trading period ends
     * @param collateralToken Address of token used for trading (MODE, ETH, etc)
     * @param initialLiquidity Amount of collateral to seed market
     * @param whitelist Array of addresses allowed to participate in the market
     * @return marketAddress The address of the newly created market
     */
    function createMarket(
        string calldata question,
        uint256 endTime,
        address collateralToken,
        uint256 initialLiquidity,
        address[] calldata whitelist
    ) external returns (address marketAddress);

    /** 
     * @notice Updates the protocol fee
     * @dev Only callable by the contract owner
     * @param newFee The new fee value in basis points (max 1000 = 10%)
     */
    function setProtocolFee(uint256 newFee) external;

    /** 
     * @notice Retrieves a market address by its ID
     * @param marketId The unique identifier of the market
     * @return The address of the market contract
     */
    function getMarket(bytes32 marketId) external view returns (address);

    /** 
     * @notice Checks if an address is a valid market
     * @param market The address to validate
     * @return True if the address is a valid market, false otherwise
     */
    function isValidMarket(address market) external view returns (bool);

    /** 
     * @notice Adds a new market creator
     * @dev Only callable by contract owner
     * @param _agent The address to add as market creator
     */
    function addMarketCreator(address _agent) external;

    /** 
     * @notice Removes a market creator
     * @dev Only callable by contract owner
     * @param _agent The address to remove as market creator
     */
    function removeMarketCreator(address _agent) external;

    /** 
     * @notice Pauses market creation
     * @dev Only callable by contract owner
     */
    function pause() external;

    /** 
     * @notice Unpauses market creation
     * @dev Only callable by contract owner
     */
    function unpause() external;
} 