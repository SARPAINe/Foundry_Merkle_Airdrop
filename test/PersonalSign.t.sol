// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PersonalSignVerifier} from "../src/PersonalSignVerifier.sol";

contract PersonalSignTest is Test {
    PersonalSignVerifier verifier;

    uint256 private pk;
    address private signer;

    function setUp() public {
        verifier = new PersonalSignVerifier();

        // Load private key from environment (set in .env)
        pk = vm.envUint("PRIVATE_KEY");
        signer = vm.addr(pk);
    }

    function testVerifyPersonalSign() public {
        string memory message = "Hello from Foundry!";

        // 1. Build prefixed hash
        bytes32 ethSignedMessageHash = verifier.getEthSignedMessageHash(
            message
        );

        // console.logBytes32(ethSignedMessageHash);

        // 2. Sign with our real private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, ethSignedMessageHash);
        console.logUint(v);
        console.logBytes32(r);
        console.logBytes32(s);

        // 3. Rebuild signature
        bytes memory signature = abi.encodePacked(r, s, v);
        console.logBytes(signature);

        // 4. Verify on-chain
        bool valid = verifier.verify(message, signature, signer);
        assertTrue(valid, "Signature verification failed");
    }
}
