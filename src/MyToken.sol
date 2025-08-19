// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyToken {
    string public constant name = "MyToken";
    string public constant symbol = "MTK";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public nonces;

    // EIP-712 domain separator
    bytes32 public immutable DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")
    bytes32 public constant PERMIT_TYPEHASH =
        0xd505accf4b0f9678739f2b1e3f6c7dc3df4e4c6d0f6cce96e3d1cb3b9e8e8d33;

    constructor() {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );

        // Mint 1000 MTK to msg.sender
        balanceOf[msg.sender] = 1000 ether;
        totalSupply = 1000 ether;
    }

    /// @notice Transfer tokens
    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    /// @notice Transfer from allowance
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "not allowed");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(balanceOf[from] >= value, "insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
    }

    /// @notice Approve via EIP-712 signature
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp <= deadline, "expired");

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        PERMIT_TYPEHASH,
                        owner,
                        spender,
                        value,
                        nonces[owner]++,
                        deadline
                    )
                )
            )
        );

        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0) && recovered == owner, "invalid sig");

        allowance[owner][spender] = value;
    }
}
