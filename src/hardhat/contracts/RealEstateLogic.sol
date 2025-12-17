// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {RealEstateStorage} from "./RealEstateStorage.sol";

/// @notice 与 MyToken 交互所需的最小接口
interface IMyToken {
    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external;
    function burn(address from, uint256 id, uint256 amount) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/// @title RealEstateLogic
/// @notice 房地产产品/份额的业务逻辑合约，通过角色控制发布者，并调用 MyToken 进行铸币
contract RealEstateLogic is Initializable, AccessControlUpgradeable {
    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN_ROLE");
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

    /// @notice 份额代币（MyToken 的代理地址）
    IMyToken public shareToken;

    /// @notice 存储合约
    RealEstateStorage public store;

    event PublisherAdded(address indexed account);
    event PropertyCreated(uint256 indexed propertyId, address indexed publisher);
    event SharesMinted(uint256 indexed propertyId, address indexed to, uint256 amount);

    /// @param myToken MyToken 代理地址
    /// @param storageAddr RealEstateStorage 代理地址
    /// @param admin 初始管理员（通常是部署者或多签）
    function initialize(address myToken, address storageAddr, address admin) external initializer {
        require(myToken != address(0), "RealEstateLogic: invalid token");
        require(storageAddr != address(0), "RealEstateLogic: invalid storage");
        require(admin != address(0), "RealEstateLogic: invalid admin");

        __AccessControl_init();

        shareToken = IMyToken(myToken);
        store = RealEstateStorage(storageAddr);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /// @notice 由平台管理员添加房产发布者
    function addPublisher(address publisher) external onlyRole(ADMIN_ROLE) {
        require(publisher != address(0), "RealEstateLogic: invalid publisher");
        _grantRole(PUBLISHER_ROLE, publisher);
        emit PublisherAdded(publisher);
    }

    /// @notice 发布一个新房产/产品记录
    /// @dev 内部会在存储合约中创建记录，并返回 propertyId（同时作为 MyToken 的 tokenId）
    function createProperty(
        string memory name,
        string memory location,
        uint256 maxSupply
    ) external onlyRole(PUBLISHER_ROLE) returns (uint256 propertyId) {
        propertyId = store.createProperty(name, location, msg.sender, maxSupply);
        emit PropertyCreated(propertyId, msg.sender);
    }

    /// @notice 为某房产铸造份额，实际调用 MyToken.mint
    /// @dev 要求：调用者必须是该房产的 publisher
    ///      同时需要事先在 MyToken 中授予本合约 MINTER_ROLE
    function mintShares(
        uint256 propertyId,
        address to,
        uint256 amount
    ) external onlyRole(PUBLISHER_ROLE) {
        require(to != address(0), "RealEstateLogic: invalid to");
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher == msg.sender, "RealEstateLogic: not property publisher");
        require(p.active, "RealEstateLogic: property inactive");

        // 校验供应上限（如设置了 maxSupply）
        if (p.maxSupply > 0) {
            require(p.totalSupply + amount <= p.maxSupply, "RealEstateLogic: exceed maxSupply");
        }

        // 铸造 ERC1155 份额：MyToken.mint
        shareToken.mint(to, p.tokenId, amount, "");

        // 更新存储中的 totalSupply
        store.increaseSupply(propertyId, amount);

        emit SharesMinted(propertyId, to, amount);
    }
}


