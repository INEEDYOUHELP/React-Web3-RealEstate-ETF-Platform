// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN_ROLE");
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

    /// @notice 份额代币（MyToken 的代理地址）
    IMyToken public shareToken;

    /// @notice 存储合约
    RealEstateStorage public store;

    /// @notice 收益代币（USDC/USDT/测试代币）
    IERC20 public rewardToken;

    /// @notice 房产收益池：propertyId => 累计收益金额
    mapping(uint256 => uint256) public yieldPools;

    /// @notice 用户已提取收益：propertyId => (address => 已提取金额)
    mapping(uint256 => mapping(address => uint256)) public claimedRewards;

    // ============================================
    // 退款功能相关
    // ============================================

    /// @notice 用户购买记录结构体
    struct PurchaseRecord {
        uint256 amount;         // 购买的份额数量
        uint256 payAmount;      // 支付的金额（wei）
        uint256 purchaseTime;   // 购买时间戳
        bool refunded;          // 是否已退款
    }

    /// @notice 购买记录：propertyId => (buyer => PurchaseRecord[])
    mapping(uint256 => mapping(address => PurchaseRecord[])) public purchaseRecords;

    /// @notice 房产托管资金池：propertyId => 总托管金额
    mapping(uint256 => uint256) public escrowPools;

    // ============================================
    // 发布者申请功能
    // ============================================

    /// @notice 申请状态枚举
    enum ApplicationStatus {
        Pending,    // 待审核
        Approved,   // 已通过
        Rejected,   // 已拒绝
        Withdrawn   // 已撤回
    }

    /// @notice 申请结构体
    struct PublisherApplication {
        address applicant;
        string applicationId;  // 数据库中的申请ID（用于关联）
        uint256 timestamp;
        ApplicationStatus status;
        address reviewer;
        uint256 reviewTimestamp;
    }

    /// @notice 申请记录：address => PublisherApplication
    mapping(address => PublisherApplication) public applications;
    
    /// @notice 待审核申请列表
    address[] public pendingApplications;

    event PublisherAdded(address indexed account);
    event PropertyCreated(uint256 indexed propertyId, address indexed publisher);
    event SharesMinted(uint256 indexed propertyId, address indexed to, uint256 amount);
    event PropertyPriceUpdated(uint256 indexed propertyId, uint256 unitPriceWei);
    event PropertyYieldUpdated(uint256 indexed propertyId, uint256 annualYieldBps);
    event RewardTokenSet(address indexed token);
    event YieldDeposited(uint256 indexed propertyId, address indexed publisher, uint256 amount);
    event YieldClaimed(uint256 indexed propertyId, address indexed holder, uint256 amount);
    event SharesPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 payAmount);
    event SharesRefunded(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 amount,
        uint256 refundAmount,
        uint256 purchaseTime
    );
    event EscrowWithdrawn(uint256 indexed propertyId, address indexed publisher, uint256 amount);
    event ProjectEndTimeSet(uint256 indexed propertyId, uint256 endTime);
    
    // 发布者申请相关事件
    event PublisherApplicationSubmitted(
        address indexed applicant, 
        string indexed applicationId,
        uint256 timestamp
    );
    
    event PublisherApplicationReviewed(
        address indexed applicant,
        string indexed applicationId,
        ApplicationStatus status,
        address indexed reviewer,
        uint256 timestamp
    );

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

    /// @notice 用户提交发布者申请（链上）
    /// @param applicationId 数据库中的申请ID（UUID）
    function applyForPublisher(string memory applicationId) external {
        require(!hasRole(PUBLISHER_ROLE, msg.sender), "RealEstateLogic: already a publisher");
        require(
            applications[msg.sender].status == ApplicationStatus.Pending || 
            applications[msg.sender].status == ApplicationStatus.Rejected ||
            applications[msg.sender].applicant == address(0),
            "RealEstateLogic: application already exists"
        );
        
        applications[msg.sender] = PublisherApplication({
            applicant: msg.sender,
            applicationId: applicationId,
            timestamp: block.timestamp,
            status: ApplicationStatus.Pending,
            reviewer: address(0),
            reviewTimestamp: 0
        });
        
        pendingApplications.push(msg.sender);
        emit PublisherApplicationSubmitted(msg.sender, applicationId, block.timestamp);
    }

    /// @notice 管理员审核发布者申请
    /// @param applicant 申请者地址
    /// @param approved 是否通过
    function reviewPublisherApplication(
        address applicant,
        bool approved
    ) external onlyRole(ADMIN_ROLE) {
        PublisherApplication storage app = applications[applicant];
        require(
            app.status == ApplicationStatus.Pending, 
            "RealEstateLogic: invalid application status"
        );
        require(app.applicant != address(0), "RealEstateLogic: application not found");
        
        app.status = approved ? ApplicationStatus.Approved : ApplicationStatus.Rejected;
        app.reviewer = msg.sender;
        app.reviewTimestamp = block.timestamp;
        
        if (approved) {
            _grantRole(PUBLISHER_ROLE, applicant);
            emit PublisherAdded(applicant);
        }
        
        // 从待审核列表中移除
        _removeFromPending(applicant);
        
        emit PublisherApplicationReviewed(
            applicant,
            app.applicationId,
            app.status,
            msg.sender,
            block.timestamp
        );
    }

    /// @notice 用户撤回申请
    function withdrawApplication() external {
        PublisherApplication storage app = applications[msg.sender];
        require(
            app.status == ApplicationStatus.Pending,
            "RealEstateLogic: can only withdraw pending applications"
        );
        
        app.status = ApplicationStatus.Withdrawn;
        _removeFromPending(msg.sender);
        
        emit PublisherApplicationReviewed(
            msg.sender,
            app.applicationId,
            ApplicationStatus.Withdrawn,
            address(0),
            block.timestamp
        );
    }

    /// @notice 获取待审核申请列表
    function getPendingApplications() external view returns (address[] memory) {
        return pendingApplications;
    }

    /// @notice 获取申请信息
    function getApplication(address applicant) 
        external 
        view 
        returns (
            address applicantAddr,
            string memory applicationId,
            uint256 timestamp,
            ApplicationStatus status,
            address reviewer,
            uint256 reviewTimestamp
        ) 
    {
        PublisherApplication memory app = applications[applicant];
        return (
            app.applicant,
            app.applicationId,
            app.timestamp,
            app.status,
            app.reviewer,
            app.reviewTimestamp
        );
    }

    /// @notice 内部函数：从待审核列表中移除
    function _removeFromPending(address applicant) internal {
        for (uint256 i = 0; i < pendingApplications.length; i++) {
            if (pendingApplications[i] == applicant) {
                pendingApplications[i] = pendingApplications[pendingApplications.length - 1];
                pendingApplications.pop();
                break;
            }
        }
    }

    /// @notice 发布一个新房产/产品记录
    /// @dev 内部会在存储合约中创建记录，并返回 propertyId（同时作为 MyToken 的 tokenId）
    /// @param metadataURI IPFS 元数据 URI，包含房产的详细信息和图片链接
    function createProperty(
        string memory name,
        string memory location,
        string memory metadataURI,
        uint256 maxSupply
    ) external onlyRole(PUBLISHER_ROLE) returns (uint256 propertyId) {
        propertyId = store.createProperty(name, location, metadataURI, msg.sender, maxSupply);
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

    /// @notice 更新房产的单价（仅该房产的发布者）
    /// @param unitPriceWei 单价（wei 单位），例如 1e18 表示 1 ETH
    function setPropertyUnitPrice(uint256 propertyId, uint256 unitPriceWei) external onlyRole(PUBLISHER_ROLE) {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher == msg.sender, "RealEstateLogic: not property publisher");
        store.setUnitPrice(propertyId, unitPriceWei);
        emit PropertyPriceUpdated(propertyId, unitPriceWei);
    }

    /// @notice 更新房产的年化收益率（仅该房产的发布者）
    /// @param annualYieldBps 年化收益率（基点），例如 850 表示 8.5%
    function setPropertyAnnualYield(uint256 propertyId, uint256 annualYieldBps) external onlyRole(PUBLISHER_ROLE) {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher == msg.sender, "RealEstateLogic: not property publisher");
        require(annualYieldBps <= 10000, "RealEstateLogic: yield exceeds 100%");
        store.setAnnualYield(propertyId, annualYieldBps);
        emit PropertyYieldUpdated(propertyId, annualYieldBps);
    }

    /// @notice 批量更新房产的单价和年化收益率（仅该房产的发布者）
    /// @dev 方便一次性设置多个参数
    function setPropertyFinancials(
        uint256 propertyId,
        uint256 unitPriceWei,
        uint256 annualYieldBps
    ) external onlyRole(PUBLISHER_ROLE) {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher == msg.sender, "RealEstateLogic: not property publisher");
        require(annualYieldBps <= 10000, "RealEstateLogic: yield exceeds 100%");
        
        store.setUnitPrice(propertyId, unitPriceWei);
        store.setAnnualYield(propertyId, annualYieldBps);
        
        emit PropertyPriceUpdated(propertyId, unitPriceWei);
        emit PropertyYieldUpdated(propertyId, annualYieldBps);
    }

    /// @notice 计算某房产的预计年化收益（基于当前已发行份额）
    /// @dev 这是一个只读函数，用于前端显示
    function calculateAnnualYield(uint256 propertyId) external view returns (uint256 totalYieldWei) {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        if (p.annualYieldBps == 0 || p.unitPriceWei == 0 || p.totalSupply == 0) {
            return 0;
        }
        // 总价值 = 单价 × 已发行份额
        uint256 totalValue = p.unitPriceWei * p.totalSupply;
        // 年化收益 = 总价值 × 年化收益率 / 10000
        totalYieldWei = (totalValue * p.annualYieldBps) / 10000;
    }

    /// @notice 计算基于实际发行量的保障金要求
    /// @dev 用于前端显示和验证保障金是否足够
    /// @param propertyId 房产 ID
    /// @return requiredGuaranteeWei 所需的保障金金额（wei）
    function calculateRequiredGuaranteeFund(uint256 propertyId) external view returns (uint256 requiredGuaranteeWei) {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        if (p.annualYieldBps == 0 || p.unitPriceWei == 0 || p.totalSupply == 0) {
            return 0;
        }
        // 总价值 = 单价 × 实际发行量
        uint256 totalValue = p.unitPriceWei * p.totalSupply;
        // 保障金 = 总价值 × 年化收益率 / 10000
        requiredGuaranteeWei = (totalValue * p.annualYieldBps) / 10000;
    }

    /// @notice 查询当前收益池金额是否达到保障金要求（用于前端显示状态）
    /// @param propertyId 房产 ID
    /// @return 如果收益池金额 >= 保障金要求，返回 true；否则返回 false
    function isGuaranteeFundSufficient(uint256 propertyId) external view returns (bool) {
        uint256 required = this.calculateRequiredGuaranteeFund(propertyId);
        // 如果保障金要求为0（通常是因为 totalSupply == 0，还没有铸造份额）
        // 只有当收益池中确实有资金时，才认为已满足（避免未充值就显示已完成）
        if (required == 0) {
            return yieldPools[propertyId] > 0;
        }
        return yieldPools[propertyId] >= required;
    }

    // ============================================
    // 收益分配功能
    // ============================================

    /// @notice 设置收益代币地址（仅管理员）
    /// @param _rewardToken 收益代币合约地址（USDC/USDT/测试代币）
    function setRewardToken(address _rewardToken) external onlyRole(ADMIN_ROLE) {
        require(_rewardToken != address(0), "RealEstateLogic: invalid token");
        rewardToken = IERC20(_rewardToken);
        emit RewardTokenSet(_rewardToken);
    }

    /// @notice 发布者向收益池充值收益
    /// @param propertyId 房产 ID
    /// @param amount 充值金额（收益代币的最小单位，如 wei）
    function depositYield(uint256 propertyId, uint256 amount) external {
        require(address(rewardToken) != address(0), "RealEstateLogic: reward token not set");
        require(amount > 0, "RealEstateLogic: amount must be > 0");

        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher == msg.sender, "RealEstateLogic: not property publisher");
        require(p.active, "RealEstateLogic: property inactive");

        // 从发布者钱包转账收益代币到合约
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);

        // 更新收益池
        yieldPools[propertyId] += amount;

        emit YieldDeposited(propertyId, msg.sender, amount);
    }

    /// @notice 代币持有者提取收益
    /// @param propertyId 房产 ID
    function claimYield(uint256 propertyId) external {
        require(address(rewardToken) != address(0), "RealEstateLogic: reward token not set");

        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.active, "RealEstateLogic: property inactive");

        // 时间锁检查：必须满足以下条件之一：
        // 1. 项目创建时间 + 1 年 <= 当前时间
        // 2. 项目已结束（projectEndTime > 0 && block.timestamp >= projectEndTime）
        bool oneYearPassed = block.timestamp >= p.createTime + 365 days;
        bool projectEnded = (p.projectEndTime > 0 && block.timestamp >= p.projectEndTime);
        require(oneYearPassed || projectEnded, "RealEstateLogic: yield locked for 1 year or until project ends");

        // 获取用户持有的份额
        uint256 balance = shareToken.balanceOf(msg.sender, p.tokenId);
        require(balance > 0, "RealEstateLogic: no shares");

        // 计算应得收益 - 使用 totalSupply（实际发行量）作为分母
        require(p.totalSupply > 0, "RealEstateLogic: no shares minted");

        uint256 totalReward = yieldPools[propertyId];
        if (totalReward == 0) {
            revert("RealEstateLogic: no yield in pool");
        }

        // 计算用户应得收益 = (持有份额 / 实际发行量) × 收益池总额
        uint256 userReward = (totalReward * balance) / p.totalSupply;

        // 减去已提取部分
        uint256 claimed = claimedRewards[propertyId][msg.sender];
        uint256 claimable = userReward > claimed ? userReward - claimed : 0;
        require(claimable > 0, "RealEstateLogic: no claimable reward");

        // 更新已提取记录
        claimedRewards[propertyId][msg.sender] += claimable;

        // 从收益池中减少已提取的金额
        yieldPools[propertyId] -= claimable;

        // 转账给用户
        rewardToken.safeTransfer(msg.sender, claimable);

        emit YieldClaimed(propertyId, msg.sender, claimable);
    }

    /// @notice 查询用户可提取收益
    /// @param propertyId 房产 ID
    /// @param holder 持有者地址
    /// @return 可提取的收益金额
    function getClaimableYield(uint256 propertyId, address holder) external view returns (uint256) {
        if (address(rewardToken) == address(0)) {
            return 0;
        }

        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        if (!p.active) {
            return 0;
        }

        // 时间锁检查：必须满足以下条件之一才能提取收益：
        // 1. 项目创建时间 + 1 年 <= 当前时间
        // 2. 项目已结束（projectEndTime > 0 && block.timestamp >= projectEndTime）
        bool oneYearPassed = block.timestamp >= p.createTime + 365 days;
        bool projectEnded = (p.projectEndTime > 0 && block.timestamp >= p.projectEndTime);
        if (!oneYearPassed && !projectEnded) {
            return 0; // 收益仍在锁定中
        }

        // 需要至少有一些份额已发行
        if (p.totalSupply == 0) {
            return 0;
        }

        uint256 balance = shareToken.balanceOf(holder, p.tokenId);
        if (balance == 0) {
            return 0;
        }

        uint256 totalReward = yieldPools[propertyId];
        if (totalReward == 0) {
            return 0;
        }

        // 计算用户应得收益 = (持有份额 / 实际发行量) × 收益池总额
        uint256 userReward = (totalReward * balance) / p.totalSupply;
        uint256 claimed = claimedRewards[propertyId][holder];

        return userReward > claimed ? userReward - claimed : 0;
    }

    /// @notice 查询收益池总额
    /// @param propertyId 房产 ID
    /// @return 收益池中的总金额
    function getYieldPool(uint256 propertyId) external view returns (uint256) {
        return yieldPools[propertyId];
    }

    // ============================================
    // 购买份额：buyer -> 合约托管
    // ============================================

    /// @notice 购买房产份额，支付 rewardToken 到托管池，份额立即铸造给买家
    /// @dev 需先由买家调用 rewardToken.approve(logic, payAmount)
    /// @param propertyId 房产 ID
    /// @param amount 购买份额数量
    function buyShares(uint256 propertyId, uint256 amount) external {
        require(address(rewardToken) != address(0), "RealEstateLogic: reward token not set");
        require(amount > 0, "RealEstateLogic: amount must be > 0");

        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher != address(0), "RealEstateLogic: property not found");
        require(p.active, "RealEstateLogic: property inactive");

        if (p.maxSupply > 0) {
            require(p.totalSupply + amount <= p.maxSupply, "RealEstateLogic: exceed maxSupply");
        }

        // 单价使用 unitPriceWei（18 位精度），总价 = 单价 * 数量
        require(p.unitPriceWei > 0, "RealEstateLogic: unit price not set");
        uint256 payAmount = p.unitPriceWei * amount;

        // 从买家转账到合约托管池（而不是直接给发布者）
        rewardToken.safeTransferFrom(msg.sender, address(this), payAmount);

        // 更新托管池
        escrowPools[propertyId] += payAmount;

        // 记录购买信息
        purchaseRecords[propertyId][msg.sender].push(PurchaseRecord({
            amount: amount,
            payAmount: payAmount,
            purchaseTime: block.timestamp,
            refunded: false
        }));

        // 铸造份额给买家
        shareToken.mint(msg.sender, p.tokenId, amount, "");
        store.increaseSupply(propertyId, amount);

        emit SharesPurchased(propertyId, msg.sender, amount, payAmount);
    }

    // ============================================
    // 退款功能
    // ============================================

    /// @notice 退款函数：用户可以退款购买的份额
    /// @param propertyId 房产 ID
    /// @param purchaseIndex 购买记录的索引（用户可能有多次购买）
    function refundShares(uint256 propertyId, uint256 purchaseIndex) external {
        require(address(rewardToken) != address(0), "RealEstateLogic: reward token not set");

        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher != address(0), "RealEstateLogic: property not found");

        PurchaseRecord[] storage records = purchaseRecords[propertyId][msg.sender];
        require(purchaseIndex < records.length, "RealEstateLogic: invalid purchase index");

        PurchaseRecord storage record = records[purchaseIndex];
        require(!record.refunded, "RealEstateLogic: already refunded");

        // 检查退款条件
        bool canRefund = false;
        
        // 条件1: 购买后已满锁定期间（默认1年）
        if (block.timestamp >= record.purchaseTime + p.refundLockPeriod) {
            canRefund = true;
        }

        // 条件2: 项目已结束
        if (p.projectEndTime > 0 && block.timestamp >= p.projectEndTime) {
            canRefund = true;
        }

        require(canRefund, "RealEstateLogic: refund conditions not met");

        // 检查用户是否还持有足够的份额
        uint256 balance = shareToken.balanceOf(msg.sender, p.tokenId);
        require(balance >= record.amount, "RealEstateLogic: insufficient shares");

        // 标记为已退款
        record.refunded = true;

        // 销毁用户的份额代币
        shareToken.burn(msg.sender, p.tokenId, record.amount);

        // 从托管池中退款给用户
        require(escrowPools[propertyId] >= record.payAmount, "RealEstateLogic: insufficient escrow");
        escrowPools[propertyId] -= record.payAmount;

        // 减少总供应量
        store.decreaseSupply(propertyId, record.amount);

        // 退款给用户
        rewardToken.safeTransfer(msg.sender, record.payAmount);

        emit SharesRefunded(
            propertyId,
            msg.sender,
            record.amount,
            record.payAmount,
            record.purchaseTime
        );
    }

    /// @notice 查询用户是否可以退款
    /// @param propertyId 房产 ID
    /// @param buyer 买家地址
    /// @param purchaseIndex 购买记录索引
    /// @return canRefund 是否可以退款
    /// @return reason 原因（如果不能退款）
    /// @return refundAmount 可退款金额
    function canRefundShares(
        uint256 propertyId,
        address buyer,
        uint256 purchaseIndex
    ) external view returns (
        bool canRefund,
        string memory reason,
        uint256 refundAmount
    ) {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        if (p.publisher == address(0)) {
            return (false, "property not found", 0);
        }

        PurchaseRecord[] storage records = purchaseRecords[propertyId][buyer];
        if (purchaseIndex >= records.length) {
            return (false, "invalid purchase index", 0);
        }

        PurchaseRecord memory record = records[purchaseIndex];
        if (record.refunded) {
            return (false, "already refunded", 0);
        }

        // 检查是否还持有份额
        uint256 balance = shareToken.balanceOf(buyer, p.tokenId);
        if (balance < record.amount) {
            return (false, "insufficient shares", 0);
        }

        // 检查退款条件
        if (block.timestamp >= record.purchaseTime + p.refundLockPeriod) {
            return (true, "lock period expired", record.payAmount);
        }

        if (p.projectEndTime > 0 && block.timestamp >= p.projectEndTime) {
            return (true, "project ended", record.payAmount);
        }

        uint256 timeRemaining = (record.purchaseTime + p.refundLockPeriod) - block.timestamp;
        uint256 daysRemaining = timeRemaining / 1 days;
        return (false, string(abi.encodePacked("wait ", _uintToString(daysRemaining), " days")), 0);
    }

    /// @notice 获取用户的所有购买记录数量
    /// @param propertyId 房产 ID
    /// @param buyer 买家地址
    /// @return 购买记录数量
    function getPurchaseRecordCount(uint256 propertyId, address buyer) external view returns (uint256) {
        return purchaseRecords[propertyId][buyer].length;
    }

    /// @notice 发布者提取托管资金（可选功能，用于项目运行期间提取部分资金）
    /// @param propertyId 房产 ID
    /// @param amount 提取金额
    function withdrawEscrow(uint256 propertyId, uint256 amount) external {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher == msg.sender, "RealEstateLogic: not property publisher");

        require(escrowPools[propertyId] >= amount, "RealEstateLogic: insufficient escrow");
        escrowPools[propertyId] -= amount;

        rewardToken.safeTransfer(p.publisher, amount);
        emit EscrowWithdrawn(propertyId, msg.sender, amount);
    }

    /// @notice 设置项目结束时间（仅发布者）
    /// @dev 在项目结束前，会检查收益池是否有足够的资金支付给所有持有者
    /// @param propertyId 房产 ID
    /// @param endTime 结束时间戳（Unix timestamp）
    function setProjectEndTime(uint256 propertyId, uint256 endTime) external onlyRole(PUBLISHER_ROLE) {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher == msg.sender, "RealEstateLogic: not property publisher");
        
        // 如果项目还未结束，检查收益池是否有足够的资金
        if (p.projectEndTime == 0 || block.timestamp < p.projectEndTime) {
            // 计算所需的保障金（基于实际发行量）
            uint256 requiredGuarantee = this.calculateRequiredGuaranteeFund(propertyId);
            uint256 currentYieldPool = yieldPools[propertyId];
            
            // 要求收益池金额 >= 保障金要求
            require(
                currentYieldPool >= requiredGuarantee,
                "RealEstateLogic: insufficient yield pool. Publisher must deposit enough funds before ending project"
            );
        }
        
        store.setProjectEndTime(propertyId, endTime);
        emit ProjectEndTimeSet(propertyId, endTime);
    }

    /// @notice 设置退款锁定期间（仅发布者，可选）
    /// @param propertyId 房产 ID
    /// @param period 锁定期间（秒数）
    function setRefundLockPeriod(uint256 propertyId, uint256 period) external onlyRole(PUBLISHER_ROLE) {
        RealEstateStorage.Property memory p = store.getProperty(propertyId);
        require(p.publisher == msg.sender, "RealEstateLogic: not property publisher");
        store.setRefundLockPeriod(propertyId, period);
    }


    /// @notice 内部函数：将 uint256 转换为 string
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}


