# 🚀 Gasless Token Transfer Setup Guide

## Overview

This frontend allows you to test gasless token transfers using EIP-2612 permits. Users can sign transaction approvals without paying gas, while relayers execute them on-chain.

## ✅ Current Setup Status

✅ **Contract Deployed**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`  
✅ **Frontend Running**: http://localhost:3000  
✅ **Local Anvil Node**: Chain ID 31337

## 🔧 Quick Start

### 1. Connect MetaMask to Local Network

Add this network to MetaMask:

```
Network Name: Anvil Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH
```

### 2. Import Test Account

Import this private key to MetaMask for testing:

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This account has:

- ✅ 10,000 ETH (for gas)
- ✅ 1,000 MTK tokens (for testing)

### 3. Open the Application

Visit: http://localhost:3000

## 📋 Testing Scenarios

### Scenario 1: Self-Service Transfer

1. Connect your wallet (should show 1,000 MTK balance)
2. **Sign Permit**: Allow yourself to spend 100 MTK (no gas)
3. **Execute Permit**: Set the allowance on-chain (pays gas)
4. **Transfer**: Move tokens to another address

### Scenario 2: Gasless for Others

1. **Alice** (Token Owner): Signs permit allowing Bob to spend tokens
2. **Bob** (Gas Payer): Executes Alice's permit
3. **Bob** (or anyone): Transfers Alice's tokens to any address
4. **Result**: Alice's tokens transferred without Alice paying gas

## 🔄 Testing Flow

### Step 1: Sign Permit (Gasless)

```
Spender: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Amount: 100
Deadline: [1 hour from now]
```

### Step 2: Execute Permit (Requires Gas)

The frontend will auto-populate the permit execution form with:

- Owner, Spender, Amount, Deadline
- Signature components (v, r, s)

### Step 3: Transfer Tokens

```
From: [Token owner address]
To: [Any recipient address]
Amount: 100
```

## 🧪 Advanced Testing

### Multi-Account Testing

Import additional test accounts:

**Account 2** (No MTK, has ETH):

```
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

**Account 3** (No MTK, has ETH):

```
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

### Cross-Account Workflow

1. **Account 1** (has MTK): Signs permit for Account 2
2. **Account 2** (has ETH): Executes permit + transfers tokens
3. **Account 3**: Receives the tokens

## 🔍 Debugging

### Check Balances

```javascript
// In browser console
const contract = new ethers.Contract(
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  TOKEN_ABI,
  provider
);

await contract.balanceOf("0xYourAddress");
```

### Check Allowances

```javascript
await contract.allowance("0xOwner", "0xSpender");
```

### Check Nonces

```javascript
await contract.nonces("0xOwner");
```

## 🔧 Troubleshooting

| Error                   | Solution                                          |
| ----------------------- | ------------------------------------------------- |
| "MetaMask not detected" | Install MetaMask browser extension                |
| "Wrong network"         | Switch MetaMask to Anvil network (Chain ID 31337) |
| "Insufficient balance"  | Use test account with MTK tokens                  |
| "Invalid signature"     | Check contract address and chain ID               |
| "Transaction reverted"  | Verify amounts and allowances                     |

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Token Owner   │    │     Relayer      │    │   Recipient     │
│  (Signs Permit) │    │  (Pays Gas)      │    │ (Receives)      │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Has MTK       │───▶│ • Executes       │───▶│ • Gets MTK      │
│ • No ETH needed │    │   Permit         │    │ • No interaction│
│ • Signs off-chain│    │ • Calls transfer │    │   needed        │
└─────────────────┘    │ • Pays gas fees  │    └─────────────────┘
                       └──────────────────┘
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.jsx          # Main UI components
│   ├── utils.js         # Contract interactions
│   ├── index.css        # Styling
│   └── main.jsx         # Entry point
├── package.json         # Dependencies
└── vite.config.js       # Build config
```

## 🔐 Security Notes

⚠️ **For Development Only**

- Private keys are exposed for testing
- No input validation implemented
- No transaction confirmations
- Use only on local networks

## 🚀 Next Steps

1. **Test the basic flow** with one account
2. **Try multi-account scenarios** with different roles
3. **Experiment with different amounts** and deadlines
4. **Deploy to testnet** for realistic testing
5. **Add error handling** for production use

## 📚 Learn More

- [EIP-2612: Permit Extension for ERC-20](https://eips.ethereum.org/EIPS/eip-2612)
- [Meta-Transactions Explained](https://docs.openzeppelin.com/contracts/4.x/api/metatx)
- [Foundry Documentation](https://book.getfoundry.sh/)

Happy testing! 🎉
