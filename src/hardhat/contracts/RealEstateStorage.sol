// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title RealEstateStorage
/// @notice 独立的存储合约，用于保存房产/份额的元数据与状态
contract RealEstateStorage is Initializable, OwnableUpgradeable {
    struct Property {
        string name;        // 房产名称或产品名称
        string location;    // 位置/描述
        uint256 tokenId;    // 在 MyToken 中对应的 ERC1155 id
        address publisher;  // 发布者地址
        uint256 totalSupply;// 当前已发行总份额
        uint256 maxSupply;  // 最大发行量（0 表示不限）
        bool active;        // 是否有效
    }

    /// @notice 下一个可用的 propertyId，从 1 开始自增
    uint256 public nextPropertyId;

    /// @dev propertyId => Property
    mapping(uint256 => Property) private _properties;

    /// @dev 允许写入存储的业务合约地址（通常是 RealEstateLogic 代理地址）
    address public manager;

    modifier onlyManager() {
        require(msg.sender == manager, "RealEstateStorage: not manager");
        _;
    }

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        nextPropertyId = 1;
    }

    /// @notice 设置业务管理合约地址（仅 owner）
    function setManager(address _manager) external onlyOwner {
        manager = _manager;
    }

    /// @notice 由业务合约创建新的房产记录，返回 propertyId
    function createProperty(
        string memory name,
        string memory location,
        address publisher,
        uint256 maxSupply
    ) external onlyManager returns (uint256 propertyId) {
        propertyId = nextPropertyId++;

        _properties[propertyId] = Property({
            name: name,
            location: location,
            tokenId: propertyId, // 约定：tokenId == propertyId，便于管理
            publisher: publisher,
            totalSupply: 0,
            maxSupply: maxSupply,
            active: true
        });
    }

    /// @notice 增加某房产的已发行份额（由业务合约在铸币后调用）
    function increaseSupply(uint256 propertyId, uint256 amount) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        p.totalSupply += amount;
    }

    /// @notice 启用/停用某房产
    function setActive(uint256 propertyId, bool active_) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        p.active = active_;
    }

    /// @notice 只读：获取房产详情
    function getProperty(uint256 propertyId) external view returns (Property memory) {
        return _properties[propertyId];
    }
}


