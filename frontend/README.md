# Gasless Token Transfer Frontend

A React frontend for testing gasless token transfers using EIP-2612 permits with MetaMask.

## Features

- 🔐 **Gasless Signing**: Users can sign permit transactions without paying gas
- ⚡ **Meta Transactions**: Allow others to execute permits and pay gas fees
- 🎯 **Full Workflow**: Complete permit → execute → transfer flow
- 🔗 **MetaMask Integration**: Connect and interact with MetaMask wallet
- 📱 **Responsive Design**: Works on desktop and mobile

## Quick Start

### 1. Deploy the Token Contract

First, deploy your MyToken contract and get the address:

```bash
# In the root directory
forge script script/DeployMyToken.s.sol --rpc-url <YOUR_RPC_URL> --private-key <YOUR_PRIVATE_KEY> --broadcast
```

### 2. Update Contract Address

Edit `frontend/src/utils.js` and update the `TOKEN_ADDRESS`:

```javascript
export const TOKEN_ADDRESS = "0xYourDeployedContractAddress";
```

### 3. Install Dependencies

```bash
cd frontend
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## How It Works

### The Gasless Flow

1. **Token Owner**: Signs a permit (no gas required)
2. **Relayer/Friend**: Executes the permit on-chain (pays gas)
3. **Anyone**: Can now transfer tokens using the allowance

### EIP-2612 Permit

The permit function allows token approvals via signatures instead of transactions:

```solidity
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external
```

## Usage Examples

### Scenario 1: Self-Service

1. Connect your wallet with MTK tokens
2. Sign a permit to allow yourself to spend tokens
3. Execute the permit (pay gas)
4. Transfer tokens to another address

### Scenario 2: Gasless for Others

1. **Alice** (has MTK, no ETH): Signs permit allowing Bob to spend her tokens
2. **Bob** (has ETH): Executes Alice's permit and transfers her tokens
3. **Result**: Alice's tokens moved without Alice paying gas

## Contract Requirements

Your MyToken contract must implement:

- `permit()` function (EIP-2612)
- `transferFrom()` function
- `nonces()` mapping
- `DOMAIN_SEPARATOR` constant

## Network Support

Works with any EVM-compatible network:

- Ethereum Mainnet/Testnets
- Polygon
- Arbitrum
- Optimism
- Local networks (Anvil/Hardhat)

## File Structure

```
frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── utils.js         # Contract interaction utilities
│   ├── index.css        # Styling
│   └── main.jsx         # Entry point
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── index.html           # HTML template
```

## Troubleshooting

### Common Issues

1. **"MetaMask not detected"**: Install MetaMask browser extension
2. **"Invalid signature"**: Make sure contract address and chain ID are correct
3. **"Transaction reverted"**: Check token balance and allowances
4. **"Deadline expired"**: Set a future deadline

### Development Tips

- Use browser dev tools to debug transactions
- Check MetaMask network matches your contract deployment
- Verify contract address is correct in `utils.js`
- Test with small amounts first

## Security Notes

⚠️ **Important**: This is for educational/testing purposes. For production:

- Add proper error handling
- Implement nonce validation
- Add transaction confirmations
- Use proper wallet management
- Add input validation and sanitization
