import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  TOKEN_ABI,
  TOKEN_ADDRESS,
  signPermit,
  executePermit,
  executeTransferFrom,
} from "./utils.js";

function App() {
  // Wallet state
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0");

  // Form states
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // Permit execution states
  const [permitOwner, setPermitOwner] = useState("");
  const [permitSpender, setPermitSpender] = useState("");
  const [permitAmount, setPermitAmount] = useState("");
  const [permitDeadline, setPermitDeadline] = useState("");
  const [permitV, setPermitV] = useState("");
  const [permitR, setPermitR] = useState("");
  const [permitS, setPermitS] = useState("");

  // Transfer states
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to use this application");
      return;
    }

    setIsConnecting(true);
    setError("");
    setStatus("");

    try {
      console.log("Requesting account access...");

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Creating provider...");
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await ethProvider.getNetwork();
      const ethSigner = await ethProvider.getSigner();

      console.log("🚀 ~ setting account");
      console.log("Accounts:", accounts);
      console.log("Network:", network);
      console.log("Chain ID:", network.chainId);
      console.log("Chain ID type:", typeof network.chainId);

      // Check if we're on the correct network (Anvil = 31337)
      // Convert BigInt to Number for comparison
      const currentChainId = Number(network.chainId);
      if (currentChainId !== 31337) {
        console.warn(
          `Wrong network. Current: ${currentChainId}, Expected: 31337`
        );
        setError(
          `Wrong network! Please switch to Anvil Local (Chain ID: 31337). Current: ${currentChainId}`
        );
        setIsConnecting(false);
        return;
      }

      setAccount(accounts[0]);
      setChainId(currentChainId);
      setProvider(ethProvider);
      setSigner(ethSigner);

      // Get balance
      await updateBalance(ethSigner, accounts[0]);

      setStatus("Wallet connected successfully!");
      console.log("✅ Wallet connected successfully");
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      setError("Failed to connect to MetaMask: " + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Update balance
  const updateBalance = async (signer, address) => {
    try {
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const balance = await contract.balanceOf(address);
      setBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Sign permit
  const handleSignPermit = async (e) => {
    e.preventDefault();
    if (!signer) {
      setError("Please connect wallet first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const amountWei = ethers.parseEther(amount);
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      const result = await signPermit(
        signer,
        account,
        spender,
        amountWei,
        deadlineTimestamp,
        chainId
      );

      setSignature(result);

      // Pre-fill execution form
      setPermitOwner(account);
      setPermitSpender(spender);
      setPermitAmount(amountWei.toString());
      setPermitDeadline(deadlineTimestamp.toString());
      setPermitV(result.v.toString());
      setPermitR(result.r);
      setPermitS(result.s);

      setStatus("Permit signed successfully! You can now share the signature.");
    } catch (error) {
      console.error("Error signing permit:", error);
      setError("Failed to sign permit: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute permit
  const handleExecutePermit = async (e) => {
    e.preventDefault();
    if (!signer) {
      setError("Please connect wallet first");
      return;
    }

    // Check if permit has expired
    const currentTime = Math.floor(Date.now() / 1000);
    const deadlineTime = parseInt(permitDeadline);

    if (deadlineTime <= currentTime) {
      const timeLeft = deadlineTime - currentTime;
      setError(
        `❌ Permit has expired! Deadline was ${new Date(
          deadlineTime * 1000
        ).toLocaleString()}. Please sign a new permit with a fresh deadline.`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log(
        "Executing permit with deadline:",
        deadlineTime,
        "Current time:",
        currentTime
      );

      await executePermit(
        signer,
        permitOwner,
        permitSpender,
        permitAmount,
        permitDeadline,
        permitV,
        permitR,
        permitS
      );

      setStatus("Permit executed successfully! Allowance has been set.");

      // Update balance
      await updateBalance(signer, account);
    } catch (error) {
      console.error("Error executing permit:", error);
      setError("Failed to execute permit: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute transferFrom
  const handleTransferFrom = async (e) => {
    e.preventDefault();
    if (!signer) {
      setError("Please connect wallet first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const amountWei = ethers.parseEther(transferAmount);
      const signerAddress = await signer.getAddress();

      // Check if current signer has allowance to spend from the specified address
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const allowance = await contract.allowance(transferFrom, signerAddress);

      console.log("Checking transferFrom permissions:");
      console.log("From (token owner):", transferFrom);
      console.log("Signer (caller):", signerAddress);
      console.log("Current allowance:", allowance.toString());
      console.log("Required amount:", amountWei.toString());

      if (allowance < amountWei) {
        setError(
          `❌ Insufficient allowance! Current: ${ethers.formatEther(
            allowance
          )} MTK, Required: ${transferAmount} MTK. The current account needs allowance to spend tokens from ${transferFrom}.`
        );
        setLoading(false);
        return;
      }

      await executeTransferFrom(signer, transferFrom, transferTo, amountWei);

      setStatus("Transfer executed successfully!");

      // Update balance
      await updateBalance(signer, account);
    } catch (error) {
      console.error("Error executing transfer:", error);
      setError("Failed to execute transfer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Set default deadline (24 hours from now for better testing)
  useEffect(() => {
    const dayLater = new Date();
    dayLater.setHours(dayLater.getHours() + 24);
    setDeadline(dayLater.toISOString().slice(0, 16));
  }, []);

  // Listen for account changes in MetaMask
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        console.log("Account changed detected:", accounts);
        if (accounts.length === 0) {
          // User disconnected wallet
          setAccount("");
          setProvider(null);
          setSigner(null);
          setBalance("0");
          setStatus("Wallet disconnected");
        } else {
          // Account switched
          const newAccount = accounts[0];
          setAccount(newAccount);
          setStatus(`Switched to account: ${newAccount}`);

          // Update provider and signer for new account
          if (provider) {
            try {
              const newSigner = await provider.getSigner();
              setSigner(newSigner);
              // Update balance for new account
              await updateBalance(newSigner, newAccount);
            } catch (error) {
              console.error("Error updating signer for new account:", error);
            }
          }
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("Chain changed detected:", chainId);
        const decimal = parseInt(chainId, 16);
        setChainId(decimal);
        if (decimal !== 31337) {
          setError(
            `Wrong network! Please switch to Anvil Local (Chain ID: 31337). Current: ${decimal}`
          );
        } else {
          setError("");
        }
      };

      // Add event listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Cleanup function to remove listeners
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [provider]); // Depend on provider so we can update balance

  // Refresh deadline to current time + 24 hours
  const refreshDeadline = () => {
    const dayLater = new Date();
    dayLater.setHours(dayLater.getHours() + 24);
    setDeadline(dayLater.toISOString().slice(0, 16));
    setStatus("⏰ Deadline refreshed! Please sign a new permit.");
    setSignature(null); // Clear existing signature
  };

  return (
    <div className="container">
      <div className="header">
        <h1>⚡ Gasless Token Transfer</h1>
        <p>Transfer tokens without paying gas using EIP-2612 permits</p>
      </div>

      {/* Wallet Connection */}
      {!account ? (
        <div className="card">
          <h2>Connect Wallet</h2>
          <button className="btn" onClick={connectWallet}>
            Connect MetaMask
          </button>
        </div>
      ) : (
        <div className="wallet-info">
          <h3>Wallet Connected</h3>
          <p>
            <strong>Account:</strong> {account}
          </p>
          <p>
            <strong>Chain ID:</strong> {chainId}
          </p>
          <p>
            <strong>MTK Balance:</strong> {balance} MTK
          </p>
          <p>
            <strong>Contract:</strong> {TOKEN_ADDRESS}
          </p>
        </div>
      )}

      {account && (
        <div className="cards-container">
          {/* Sign Permit Card */}
          <div className="card">
            <h2>1. Sign Permit (Gasless)</h2>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              Sign a permit to allow another address to spend your tokens
              without paying gas.
            </p>
            <form onSubmit={handleSignPermit}>
              <div className="form-group">
                <label>Spender Address:</label>
                <input
                  type="text"
                  value={spender}
                  onChange={(e) => setSpender(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (MTK):</label>
                <input
                  type="number"
                  step="0.000000000000000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
              <div className="form-group">
                <label>Deadline:</label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={refreshDeadline}
                    style={{ padding: "8px 12px", fontSize: "14px" }}
                  >
                    🔄 +24h
                  </button>
                </div>
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading && <span className="loading"></span>}
                Sign Permit (No Gas)
              </button>
            </form>
          </div>

          {/* Execute Permit Card */}
          <div className="card">
            <h2>2. Execute Permit (Requires Gas)</h2>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              Execute the permit on-chain. This requires gas and can be done by
              anyone.
            </p>
            <form onSubmit={handleExecutePermit}>
              <div className="form-group">
                <label>Owner:</label>
                <input
                  type="text"
                  value={permitOwner}
                  onChange={(e) => setPermitOwner(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Spender:</label>
                <input
                  type="text"
                  value={permitSpender}
                  onChange={(e) => setPermitSpender(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (Wei):</label>
                <input
                  type="text"
                  value={permitAmount}
                  onChange={(e) => setPermitAmount(e.target.value)}
                  placeholder="1000000000000000000"
                  required
                />
              </div>
              <div className="form-group">
                <label>Deadline (Unix timestamp):</label>
                <input
                  type="text"
                  value={permitDeadline}
                  onChange={(e) => setPermitDeadline(e.target.value)}
                  placeholder="1703980800"
                  required
                />
              </div>
              <div className="form-group">
                <label>V:</label>
                <input
                  type="text"
                  value={permitV}
                  onChange={(e) => setPermitV(e.target.value)}
                  placeholder="27"
                  required
                />
              </div>
              <div className="form-group">
                <label>R:</label>
                <input
                  type="text"
                  value={permitR}
                  onChange={(e) => setPermitR(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="form-group">
                <label>S:</label>
                <input
                  type="text"
                  value={permitS}
                  onChange={(e) => setPermitS(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading && <span className="loading"></span>}
                Execute Permit
              </button>
            </form>
          </div>

          {/* Transfer From Card */}
          <div className="card">
            <h2>3. Transfer Tokens</h2>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              Use the permit allowance to transfer tokens from the owner to any
              address. <strong>Note:</strong> Connect the account that has the
              allowance (the spender from step 1) to execute this transfer.
            </p>
            {permitSpender && (
              <div
                style={{
                  background: "#e3f2fd",
                  padding: "10px",
                  borderRadius: "4px",
                  marginBottom: "15px",
                  fontSize: "14px",
                }}
              >
                💡 <strong>Expected caller:</strong> {permitSpender}
                <br />
                <strong>Current account:</strong> {account}
                {account !== permitSpender && (
                  <div style={{ color: "#d32f2f", marginTop: "5px" }}>
                    ⚠️ Switch to the spender account to execute this transfer
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleTransferFrom}>
              <div className="form-group">
                <label>From (Token Owner):</label>
                <input
                  type="text"
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="form-group">
                <label>To (Recipient):</label>
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (MTK):</label>
                <input
                  type="number"
                  step="0.000000000000000001"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading && <span className="loading"></span>}
                Transfer Tokens
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Signature Display */}
      {signature && (
        <div className="signature-display">
          <h4>📝 Generated Signature</h4>
          <p>Share this signature with someone who can execute the permit:</p>
          <pre>
            {JSON.stringify(
              {
                owner: signature.permitData.owner,
                spender: signature.permitData.spender,
                value: signature.permitData.value.toString(),
                deadline: signature.permitData.deadline.toString(),
                v: signature.v,
                r: signature.r,
                s: signature.s,
                nonce: signature.nonce.toString(),
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Status Messages */}
      {status && <div className="success">✅ {status}</div>}

      {error && <div className="error">❌ {error}</div>}

      {/* Instructions */}
      <div className="card" style={{ marginTop: "30px" }}>
        <h2>📖 How to Use</h2>
        <ol style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>Connect your wallet</strong> - Make sure you have MTK tokens
          </li>
          <li>
            <strong>Sign a permit</strong> - This is gasless and creates a
            signature
          </li>
          <li>
            <strong>Share the signature</strong> - Give it to someone who will
            execute it
          </li>
          <li>
            <strong>Execute the permit</strong> - This requires gas and sets the
            allowance
          </li>
          <li>
            <strong>Transfer tokens</strong> - Use the allowance to transfer
            tokens
          </li>
        </ol>
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#fff3cd",
            borderRadius: "8px",
            border: "1px solid #ffeaa7",
          }}
        >
          <strong>💡 Pro Tip:</strong> Steps 2-4 can be done by different
          people. The token owner only needs to sign (step 2), while someone
          else can pay for gas and execute the permit (steps 3-4).
        </div>
      </div>
    </div>
  );
}

export default App;
