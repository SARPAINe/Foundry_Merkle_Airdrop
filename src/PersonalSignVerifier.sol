// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {console} from "forge-std/console.sol";

contract PersonalSignVerifier {
    /**
     * @notice Returns the Ethereum signed message hash for a given message following EIP-191 standard
     * @dev This function implements Ethereum's personal message signing format:
     *      Format: \x19Ethereum Signed Message:\n{length}{message}
     *
     *      Escape sequences explanation:
     *      - \x19: Hexadecimal escape sequence representing byte 0x19 (25 in decimal)
     *               This byte ensures the signed data is not valid RLP encoding
     *      - \n: Newline character (ASCII 10, or 0x0A in hex)
     *
     *      When logged, you'll see actual byte values instead of escape sequences:
     *      Example for "Hello from Foundry!" (19 chars):
     *      0x19457468657265756d205369676e6564204d6573736167653a0a3139
     *      Breaking down:
     *      - 0x19: The \x19 byte
     *      - 457468...653a: "Ethereum Signed Message:" in hex
     *      - 0a: The \n newline character in hex
     *      - 3139: "19" (message length) in hex
     *
     * @param message The original message to be signed
     * @return bytes32 The keccak256 hash of the prefixed message ready for signing
     */
    function getEthSignedMessageHash(
        string memory message
    ) public pure returns (bytes32) {
        bytes memory prefix = abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            _uintToString(bytes(message).length)
        );
        console.log("Prefix:");
        console.logBytes(prefix);
        return keccak256(abi.encodePacked(prefix, message));
    }

    /**
     * @notice Verify a personal_sign signature against a message and expected signer
     * @dev This function implements the complete signature verification workflow:
     *      1. Recreates the Ethereum signed message hash from the original message
     *      2. Splits the signature into its r, s, v components
     *      3. Uses ecrecover to extract the signer's address from the signature
     *      4. Compares the recovered address with the expected signer
     *
     *      The verification process ensures that:
     *      - The signature was created by the private key corresponding to expectedSigner
     *      - The signature is valid for the exact message provided
     *      - The signature follows Ethereum's personal_sign format (EIP-191)
     *
     * @param message The original plaintext message that was signed
     * @param signature The 65-byte signature in format: r (32 bytes) + s (32 bytes) + v (1 byte)
     * @param expectedSigner The address that should have created this signature
     * @return bool True if the signature is valid and was created by expectedSigner, false otherwise
     */
    function verify(
        string memory message,
        bytes memory signature,
        address expectedSigner
    ) public pure returns (bool) {
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(message);

        (bytes32 r, bytes32 s, uint8 v) = _split(signature);
        address signer = ecrecover(ethSignedMessageHash, v, r, s);

        return signer == expectedSigner;
    }

    // --- Helpers ---
    /**
     * @notice Splits a 65-byte signature into its r, s, v components
     * @dev Uses inline assembly for efficient memory access to extract signature components.
     *      ECDSA signatures consist of:
     *      - r (bytes 0-31): x-coordinate of the elliptic curve point
     *      - s (bytes 32-63): scalar value representing the signature
     *      - v (byte 64): recovery identifier (usually 27 or 28)
     *
     *      Memory layout in signatures:
     *      - First 32 bytes at offset 32: r value
     *      - Next 32 bytes at offset 64: s value
     *      - Last byte at offset 96: v value
     *
     *      V value normalization: Some tools produce v as 0/1, so we add 27 if v < 27
     *      to ensure compatibility with ecrecover which expects v to be 27 or 28.
     *
     * @param sig The 65-byte signature to split
     * @return r The r component of the signature (32 bytes)
     * @return s The s component of the signature (32 bytes)
     * @return v The recovery identifier (1 byte, normalized to 27 or 28)
     */
    function _split(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        console.log("Signature in split:");
        console.logBytes(sig);
        console.log("Signature length:", sig.length);

        // Show the actual memory pointer and what's stored there
        uint256 sigPointer;
        assembly {
            sigPointer := sig
        }
        console.log("Memory pointer for sig:", sigPointer);

        // Read the length field manually
        bytes32 lengthField;
        assembly {
            lengthField := mload(sig) // This reads the length field
        }
        console.log("Length field in memory:");
        console.logBytes32(lengthField);

        // Show what's at each offset
        bytes32 dataAtOffset32;
        bytes32 dataAtOffset64;
        bytes32 dataAtOffset96;
        assembly {
            dataAtOffset32 := mload(add(sig, 32))
            dataAtOffset64 := mload(add(sig, 64))
            dataAtOffset96 := mload(add(sig, 96))
        }
        console.log("Data at sig+32 (r):");
        console.logBytes32(dataAtOffset32);
        console.log("Data at sig+64 (s):");
        console.logBytes32(dataAtOffset64);
        console.log("Data at sig+96 (v + padding):");
        console.logBytes32(dataAtOffset96);

        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        console.log("Final extracted values:");
        console.logBytes32(r);
        console.logBytes32(s);
        console.logUint(v);
        if (v < 27) v += 27;
    }

    /**
     * @notice Converts a uint256 to its string representation
     * @dev Implements manual digit extraction and ASCII conversion without using external libraries
     *
     *      Algorithm breakdown:
     *      1. Handle edge case: if input is 0, return "0"
     *      2. Count digits by repeatedly dividing by 10
     *      3. Create a bytes buffer with exact digit count
     *      4. Fill buffer from right to left (reverse order) by:
     *         - Getting last digit: v % 10
     *         - Converting to ASCII: add 48 (ASCII '0' = 48)
     *         - Store in buffer and move to next position
     *         - Remove processed digit: v /= 10
     *
     *      Examples:
     *      - Input: 123 → digits=3 → buffer=['1','2','3'] → "123"
     *      - Input: 7   → digits=1 → buffer=['7'] → "7"
     *      - Input: 0   → return "0" (special case)
     *
     *      ASCII conversion: 48 + digit gives ASCII character
     *      - 48 + 0 = 48 (ASCII '0')
     *      - 48 + 9 = 57 (ASCII '9')
     *
     * @param v The unsigned integer to convert
     * @return str The string representation of the input number
     */
    function _uintToString(
        uint256 v
    ) internal pure returns (string memory str) {
        console.log("v:", v);
        if (v == 0) return "0";
        uint256 temp = v;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (v != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
        str = string(buffer);
    }
}
