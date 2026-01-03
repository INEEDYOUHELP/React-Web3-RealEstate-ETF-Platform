// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title TestToken
/// @notice 测试用的 ERC20 代币，用于模拟 USDC/USDT 等稳定币
/// @dev 在测试环境中使用，生产环境应使用真实的稳定币合约
contract TestToken is ERC20 {
    /// @notice 部署时给部署者铸造大量代币用于测试
    constructor() ERC20("Test USDC", "TUSDC") {
        // 给部署者铸造 1,000,000 个代币（18 位小数）
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }
    
    /// @notice 方便测试：任何人都可以给自己铸造代币
    /// @dev 仅用于测试环境，生产环境应移除此功能
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    /// @notice 批量铸造代币（方便测试）
    function mintBatch(address[] calldata recipients, uint256[] calldata amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
}

