// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MyToken.sol";

contract PermitTest is Test {
    MyToken token;

    uint256 alicePk;
    address alice;
    address bob;

    function setUp() public {
        token = new MyToken();

        // Create test accounts
        alicePk = 0xA11CE; // test private key (safe in Foundry)
        alice = vm.addr(alicePk);
        bob = address(0xB0B);

        // Give Alice initial tokens
        token.transfer(alice, 100 ether);
    }

    function testPermitAndTransfer() public {
        uint256 value = 10 ether;
        uint256 deadline = block.timestamp + 1 days;

        // Construct EIP-712 digest just like in contract
        bytes32 structHash = keccak256(
            abi.encode(
                token.PERMIT_TYPEHASH(),
                alice,
                bob,
                value,
                token.nonces(alice),
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", token.DOMAIN_SEPARATOR(), structHash)
        );

        // Alice signs off-chain (simulated here with vm.sign)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePk, digest);

        // Bob submits permit on-chain
        token.permit(alice, bob, value, deadline, v, r, s);

        // Bob can now transfer tokens from Alice
        vm.prank(bob);
        token.transferFrom(alice, bob, value);

        assertEq(token.balanceOf(bob), value);
        assertEq(token.balanceOf(alice), 90 ether);
    }
}
