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
     * @param marketId The markets unique id
     * @param marketAddress The address of the newly created market contract
     * @param question The question or description of the market
     * @param endTime The timestamp when trading period ends
     * @param collateralToken The address of the token used for trading
     * @param virtualLiquidity The amount of virtual collateral used to start the market
     */
    event MarketCreated(
        bytes32 marketId,
        address indexed marketAddress,
        string question,
        uint256 endTime,
        address collateralToken,
        uint256 virtualLiquidity
    );
    
    /** 
     * @notice Emitted when a new market creator is added
     * @param agent The address of the new market creator
     */
    event MarketCreatorAdded(address indexed agent);

    /** 
     * @notice Emitted when a market creator is removed
     * @param agent The address of the removed market creator
     */
    event MarketCreatorRemoved(address indexed agent);

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

    /** @notice Thrown when the number of outcome descriptions is invalid */
    error MarketFactory_InvalidOutcomeCount();

    /** @notice Thrown when the question is invalid */
    error MarketFactory_InvalidQuestion();

    /////////////////
    /// VARIABLES ///
    /////////////////

    /** 
     * @notice Mapping of market IDs to market addresses
     * @param marketId The unique identifier of the market
     * @return The address of the market contract
     */
    function markets(bytes32 marketId) external view returns (address);


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
     * @param _question The market question/description
     * @param _endTime When trading period ends
     * @param _collateralToken Address of token used for trading (MODE, ETH, etc)
     * @param _virtualLiquidity Amount of virtual collateral to seed market
     * @param _outcomeDescriptions Array of descriptions for each possible outcome
     * @return marketAddress The address of the newly created market
     */
    function createMarket(
        string calldata _question,
        uint256 _endTime,
        address _collateralToken,
        uint256 _virtualLiquidity,
        uint256 _protocolFee,
        string[] calldata _outcomeDescriptions
    ) external returns (address marketAddress);


    /** 
     * @notice Retrieves a market address by its ID
     * @param marketId The unique identifier of the market
     * @return The address of the market contract
     */
    function getMarket(bytes32 marketId) external view returns (address);


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