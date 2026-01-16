// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CronosMindsPayment
 * @notice Pay-per-prompt payment contract for CronosMinds AI service
 * @dev Handles payments, tracks usage stats, and emits events for backend verification
 */
contract CronosMindsPayment {
    // ============ State Variables ============
    address public owner;

    // Model pricing in wei (1 TCRO = 1e18 wei)
    mapping(string => uint256) public modelPrices;

    // User statistics
    struct UserStats {
        uint256 totalPrompts;
        uint256 totalSpent;
        uint256 lastPaymentTime;
    }
    mapping(address => UserStats) public userStats;

    // Global statistics
    uint256 public totalPrompts;
    uint256 public totalRevenue;

    // Supported models list
    string[] public supportedModels;

    // ============ Events ============
    event PromptPaid(
        address indexed user,
        string indexed model,
        uint256 amount,
        uint256 timestamp,
        uint256 userTotalPrompts
    );

    event ModelPriceUpdated(string model, uint256 oldPrice, uint256 newPrice);
    event Withdrawal(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Modifiers ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;

        // Initialize model prices (in wei, 1 TCRO = 1e18)
        // Prices match backend/src/config/pricing.ts
        _setModelPrice("gpt-4o", 0.5 ether);
        _setModelPrice("gpt-4o-mini", 0.15 ether);
        _setModelPrice("gemini-2.5-flash", 0.2 ether);
        _setModelPrice("gemini-2.5-pro", 0.5 ether);
        _setModelPrice("gemini-2.0-flash", 0.15 ether);
        _setModelPrice("groq", 0.1 ether);
    }

    // ============ Core Functions ============

    /**
     * @notice Pay for a prompt using a specific AI model
     * @param model The model identifier (e.g., "groq", "gpt-4o")
     * @dev Emits PromptPaid event for backend verification
     */
    function payForPrompt(string calldata model) external payable {
        uint256 price = modelPrices[model];
        require(price > 0, "Model not supported");
        require(msg.value >= price, "Insufficient payment");

        // Update user stats
        UserStats storage stats = userStats[msg.sender];
        stats.totalPrompts++;
        stats.totalSpent += msg.value;
        stats.lastPaymentTime = block.timestamp;

        // Update global stats
        totalPrompts++;
        totalRevenue += msg.value;

        // Emit event for backend verification
        emit PromptPaid(
            msg.sender,
            model,
            msg.value,
            block.timestamp,
            stats.totalPrompts
        );

        // Refund excess payment
        if (msg.value > price) {
            (bool success, ) = msg.sender.call{value: msg.value - price}("");
            require(success, "Refund failed");
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get the price for a specific model
     * @param model The model identifier
     * @return Price in wei (0 if model not supported)
     */
    function getModelPrice(string calldata model) external view returns (uint256) {
        return modelPrices[model];
    }

    /**
     * @notice Get user statistics
     * @param user The user address
     * @return totalPrompts Total number of prompts by user
     * @return totalSpent Total amount spent by user in wei
     * @return lastPaymentTime Timestamp of last payment
     */
    function getUserStats(address user) external view returns (
        uint256, // totalPrompts
        uint256, // totalSpent
        uint256  // lastPaymentTime
    ) {
        UserStats storage stats = userStats[user];
        return (stats.totalPrompts, stats.totalSpent, stats.lastPaymentTime);
    }

    /**
     * @notice Get all supported model names
     * @return Array of model identifiers
     */
    function getSupportedModels() external view returns (string[] memory) {
        return supportedModels;
    }

    /**
     * @notice Get contract balance
     * @return Balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update or add a model price
     * @param model The model identifier
     * @param priceInWei The price in wei
     */
    function setModelPrice(string calldata model, uint256 priceInWei) external onlyOwner {
        uint256 oldPrice = modelPrices[model];
        _setModelPrice(model, priceInWei);
        emit ModelPriceUpdated(model, oldPrice, priceInWei);
    }

    /**
     * @notice Withdraw contract balance to owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner, balance);
    }

    /**
     * @notice Transfer ownership to a new address
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ============ Internal Functions ============

    function _setModelPrice(string memory model, uint256 priceInWei) internal {
        // Add to supportedModels if new model
        if (modelPrices[model] == 0 && priceInWei > 0) {
            supportedModels.push(model);
        }
        modelPrices[model] = priceInWei;
    }

    // ============ Receive Function ============

    /**
     * @notice Reject direct ETH transfers (must use payForPrompt)
     */
    receive() external payable {
        revert("Use payForPrompt()");
    }
}
