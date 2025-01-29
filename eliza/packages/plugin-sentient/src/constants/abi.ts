export const FACTORY_ABI = [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    { inputs: [], name: "EnforcedPause", type: "error" },
    { inputs: [], name: "ExpectedPause", type: "error" },
    { inputs: [], name: "MarketFactory_FeeTooHigh", type: "error" },
    { inputs: [], name: "MarketFactory_InvalidEndTime", type: "error" },
    { inputs: [], name: "MarketFactory_InvalidLiquidity", type: "error" },
    {
        inputs: [],
        name: "MarketFactory_InvalidOutcomeCount",
        type: "error",
    },
    { inputs: [], name: "MarketFactory_InvalidQuestion", type: "error" },
    { inputs: [], name: "MarketFactory_InvalidToken", type: "error" },
    { inputs: [], name: "MarketFactory_MarketExists", type: "error" },
    { inputs: [], name: "MarketFactory_Unauthorized", type: "error" },
    {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "OwnableInvalidOwner",
        type: "error",
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "OwnableUnauthorizedAccount",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "bytes32",
                name: "marketId",
                type: "bytes32",
            },
            {
                indexed: true,
                internalType: "address",
                name: "marketAddress",
                type: "address",
            },
            {
                indexed: false,
                internalType: "string",
                name: "question",
                type: "string",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "endTime",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "address",
                name: "collateralToken",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "virtualLiquidity",
                type: "uint256",
            },
        ],
        name: "MarketCreated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "agent",
                type: "address",
            },
        ],
        name: "MarketCreatorAdded",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "agent",
                type: "address",
            },
        ],
        name: "MarketCreatorRemoved",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "Paused",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "Unpaused",
        type: "event",
    },
    {
        inputs: [],
        name: "MIN_MARKET_DURATION",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "_agent", type: "address" }],
        name: "addMarketCreator",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "string", name: "_question", type: "string" },
            { internalType: "uint256", name: "_endTime", type: "uint256" },
            {
                internalType: "address",
                name: "_collateralToken",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_virtualLiquidity",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_protocolFee",
                type: "uint256",
            },
            {
                internalType: "string[]",
                name: "_outcomeDescriptions",
                type: "string[]",
            },
        ],
        name: "createMarket",
        outputs: [
            {
                internalType: "address",
                name: "marketAddress",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "bytes32", name: "_marketId", type: "bytes32" },
        ],
        name: "getMarket",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "_agent", type: "address" }],
        name: "isMarketCreator",
        outputs: [
            {
                internalType: "bool",
                name: "_isMarketCreator",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "bytes32", name: "_marketId", type: "bytes32" },
        ],
        name: "markets",
        outputs: [
            {
                internalType: "address",
                name: "_marketAddress",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "pause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "paused",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "_agent", type: "address" }],
        name: "removeMarketCreator",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "newOwner", type: "address" },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "unpause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];

export const MARKET_ABI = [
    {
        inputs: [
            { internalType: "string", name: "_question", type: "string" },
            { internalType: "uint256", name: "_endTime", type: "uint256" },
            {
                internalType: "address",
                name: "_collateralToken",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_virtualLiquidity",
                type: "uint256",
            },
            { internalType: "uint256", name: "_protocolFee", type: "uint256" },
            {
                internalType: "string[]",
                name: "_outcomeDescriptions",
                type: "string[]",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [],
        name: "getMarketInfo",
        outputs: [
            { internalType: "string", name: "_question", type: "string" },
            { internalType: "uint256", name: "_endTime", type: "uint256" },
            {
                internalType: "address",
                name: "_collateralToken",
                type: "address",
            },
            {
                internalType: "enum IMarket.Outcome",
                name: "_outcome",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
] as const;
