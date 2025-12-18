// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MerkleAirdrop is EIP712 {
    using SafeERC20 for IERC20;

    error MerkleAirdrop__InvalidProof();
    error MerkleAirdrop__AlreadyClaimed();
    error MerkleAirdrop__InvalidSignature();

    address[] claimers;
    bytes32 private immutable i_merkleRoot;
    IERC20 private immutable i_airdropToken;
    mapping(address claimer => bool claimed) private s_hasClaimed;

    bytes32 private constant MESSAGE_TYPEHASH =
        keccak256("AirdropClaim(address account,uint256 amount)");

    // The struct representing the data to be signed
    struct AirdropClaim {
        address account;
        uint256 amount;
    }

    event Claimed(address indexed account, uint256 amount);

    constructor(
        bytes32 merkleRoot,
        IERC20 airdropToken
    ) EIP712("MerkleAirdrop", "1") {
        i_merkleRoot = merkleRoot;
        i_airdropToken = airdropToken;
    }

    // Function to compute the EIP-712 digest for the AirdropClaim struct
    function getMessage(
        address account,
        uint256 amount
    ) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                MESSAGE_TYPEHASH,
                AirdropClaim({account: account, amount: amount})
            )
        );
        return _hashTypedDataV4(structHash);
    }

    function claim(
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof,
        uint8 v, // Signature recovery id
        bytes32 r, // Signature component r
        bytes32 s // Signature component s
    ) external {
        if (s_hasClaimed[account]) {
            revert MerkleAirdrop__AlreadyClaimed();
        }

        // Verify signature
        if (!_isValidSignature(account, getMessage(account, amount), v, r, s)) {
            revert MerkleAirdrop__InvalidSignature();
        }

        bytes32 leaf = keccak256(
            bytes.concat(
                keccak256(
                    abi.encodePacked(
                        bytes32(uint256(uint160(account))),
                        bytes32(amount)
                    )
                )
            )
        );
        if (!MerkleProof.verify(merkleProof, i_merkleRoot, leaf)) {
            revert MerkleAirdrop__InvalidProof();
        }

        s_hasClaimed[account] = true;
        emit Claimed(account, amount);
        i_airdropToken.safeTransfer(account, amount);
    }

    function getMerkleRoot() external view returns (bytes32) {
        return i_merkleRoot;
    }

    function getAirdropToken() external view returns (IERC20) {
        return i_airdropToken;
    }

    function _isValidSignature(
        address expectedSigner, // The address we expect to have signed (claim.account)
        bytes32 digest, // The EIP-712 digest calculated by getMessage
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (bool) {
        // Attempt to recover the signer address from the digest and signature components
        // ECDSA.tryRecover is preferred as it handles signature malleability and
        // returns address(0) on failure instead of reverting.
        (address actualSigner, , ) = ECDSA.tryRecover(digest, v, r, s);

        // Check two things:
        // 1. Recovery was successful (actualSigner is not the zero address).
        // 2. The recovered signer matches the expected signer (the 'account' parameter).
        return actualSigner != address(0) && actualSigner == expectedSigner;
    }
}
