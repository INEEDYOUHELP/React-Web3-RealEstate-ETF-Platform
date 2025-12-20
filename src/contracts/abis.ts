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
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
] as const;

