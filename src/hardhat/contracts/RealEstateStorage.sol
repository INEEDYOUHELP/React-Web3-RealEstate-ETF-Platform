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
        string metadataURI; // IPFS 元数据 URI（包含图片、详细描述等）
        uint256 tokenId;    // 在 MyToken 中对应的 ERC1155 id
        address publisher;  // 发布者地址
        uint256 totalSupply;// 当前已发行总份额
        uint256 maxSupply;  // 最大发行量（0 表示不限）
        bool active;        // 是否有效
        uint256 unitPriceWei; // 单价（wei 单位，便于精确计算）
        uint256 annualYieldBps; // 年化收益率（基点，10000 = 100%，例如 850 = 8.5%）
        uint256 lastYieldTimestamp; // 上次分配收益的时间戳（0 表示未分配过）
        uint256 createTime;        // 项目创建时间戳（用于收益提取时间锁）
        uint256 projectEndTime;     // 项目结束时间（0 表示未设置）
        uint256 refundLockPeriod;   // 退款锁定期间（秒数，默认 1 年 = 365 * 24 * 60 * 60）
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
        string memory metadataURI,
        address publisher,
        uint256 maxSupply
    ) external onlyManager returns (uint256 propertyId) {
        propertyId = nextPropertyId++;

        _properties[propertyId] = Property({
            name: name,
            location: location,
            metadataURI: metadataURI,
            tokenId: propertyId, // 约定：tokenId == propertyId，便于管理
            publisher: publisher,
            totalSupply: 0,
            maxSupply: maxSupply,
            active: true,
            unitPriceWei: 0, // 初始为 0，需要后续设置
            annualYieldBps: 0, // 初始为 0，需要后续设置
            lastYieldTimestamp: 0, // 初始为 0，表示未分配过
            createTime: block.timestamp,     // 记录创建时间（用于收益提取时间锁）
            projectEndTime: 0,              // 初始为 0，表示未设置
            refundLockPeriod: 365 days      // 默认 1 年锁定
        });
    }

    /// @notice 增加某房产的已发行份额（由业务合约在铸币后调用）
    function increaseSupply(uint256 propertyId, uint256 amount) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        p.totalSupply += amount;
    }

    /// @notice 减少某房产的已发行份额（退款时调用）
    function decreaseSupply(uint256 propertyId, uint256 amount) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        require(p.totalSupply >= amount, "RealEstateStorage: insufficient supply");
        p.totalSupply -= amount;
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

    /// @notice 更新房产的单价（仅 manager）
    function setUnitPrice(uint256 propertyId, uint256 unitPriceWei) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        p.unitPriceWei = unitPriceWei;
    }

    /// @notice 更新房产的年化收益率（仅 manager）
    /// @param annualYieldBps 年化收益率（基点），例如 850 表示 8.5%
    function setAnnualYield(uint256 propertyId, uint256 annualYieldBps) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        require(annualYieldBps <= 10000, "RealEstateStorage: yield exceeds 100%");
        p.annualYieldBps = annualYieldBps;
    }

    /// @notice 更新上次收益分配时间戳（仅 manager，用于收益分配逻辑）
    function setLastYieldTimestamp(uint256 propertyId, uint256 timestamp) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        p.lastYieldTimestamp = timestamp;
    }

    /// @notice 设置项目结束时间（仅 manager）
    function setProjectEndTime(uint256 propertyId, uint256 endTime) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        p.projectEndTime = endTime;
    }

    /// @notice 设置退款锁定期间（仅 manager）
    function setRefundLockPeriod(uint256 propertyId, uint256 period) external onlyManager {
        Property storage p = _properties[propertyId];
        require(p.publisher != address(0), "RealEstateStorage: property not found");
        p.refundLockPeriod = period;
    }
}


