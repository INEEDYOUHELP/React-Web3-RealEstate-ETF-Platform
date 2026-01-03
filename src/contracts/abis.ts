// Minimal ABIs for on-chain role checks and management
export const myTokenAbi = [
  {
    type: 'function',
    name: 'hasRole',
    stateMutability: 'view',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'grantRole',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [],
  },
] as const;

export const realEstateLogicAbi = [
  {
    type: 'function',
    name: 'hasRole',
    stateMutability: 'view',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'addPublisher',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'publisher', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'createProperty',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'location', type: 'string' },
      { name: 'metadataURI', type: 'string' },
      { name: 'maxSupply', type: 'uint256' },
    ],
    outputs: [{ name: 'propertyId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'mintShares',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'propertyId', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setPropertyUnitPrice',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'propertyId', type: 'uint256' },
      { name: 'unitPriceWei', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setPropertyAnnualYield',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'propertyId', type: 'uint256' },
      { name: 'annualYieldBps', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setPropertyFinancials',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'propertyId', type: 'uint256' },
      { name: 'unitPriceWei', type: 'uint256' },
      { name: 'annualYieldBps', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'calculateAnnualYield',
    stateMutability: 'view',
    inputs: [{ name: 'propertyId', type: 'uint256' }],
    outputs: [{ name: 'totalYieldWei', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'buyShares',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'propertyId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setRewardToken',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_rewardToken', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'depositYield',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'propertyId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimYield',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'propertyId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getClaimableYield',
    stateMutability: 'view',
    inputs: [
      { name: 'propertyId', type: 'uint256' },
      { name: 'holder', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getYieldPool',
    stateMutability: 'view',
    inputs: [{ name: 'propertyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'rewardToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'applyForPublisher',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'applicationId', type: 'string' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'reviewPublisherApplication',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'applicant', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdrawApplication',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getPendingApplications',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getApplication',
    stateMutability: 'view',
    inputs: [{ name: 'applicant', type: 'address' }],
    outputs: [
      { name: 'applicantAddr', type: 'address' },
      { name: 'applicationId', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'reviewer', type: 'address' },
      { name: 'reviewTimestamp', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'applications',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'applicant', type: 'address' },
      { name: 'applicationId', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'reviewer', type: 'address' },
      { name: 'reviewTimestamp', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'pendingApplications',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

// ERC20 标准 ABI（用于测试代币）
export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export const realEstateStorageAbi = [
  {
    type: 'function',
    name: 'nextPropertyId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getProperty',
    stateMutability: 'view',
    inputs: [{ name: 'propertyId', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'location', type: 'string' },
          { name: 'metadataURI', type: 'string' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'publisher', type: 'address' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'maxSupply', type: 'uint256' },
          { name: 'active', type: 'bool' },
          { name: 'unitPriceWei', type: 'uint256' },
          { name: 'annualYieldBps', type: 'uint256' },
          { name: 'lastYieldTimestamp', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
] as const;

// ERC1155 标准 ABI（用于份额代币转账）
export const erc1155Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOfBatch',
    stateMutability: 'view',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids', type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'safeTransferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

