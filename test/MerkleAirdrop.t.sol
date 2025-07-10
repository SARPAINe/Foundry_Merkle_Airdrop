// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {MerkleAirdrop} from "../src/MerkleAirdrop.sol";
import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Sarpaine} from "../src/Sarpaine.sol";
import {ZkSyncChainChecker} from "@foundry-devops/ZkSyncChainChecker.sol"; // Import StringUtils for string manipulation;
import {DeployMerkleAirdrop} from "script/DeployMerkleAirdrop.s.sol"; // Import the deployment script if needed

contract MerkleAirdropTest is Test, ZkSyncChainChecker {
    MerkleAirdrop public merkleAirdrop;
    Sarpaine public sarpaine;

    bytes32 public constant MERKLE_ROOT =
        0xaa5d581231e596618465a56aa0f5870ba6e20785fe436d5bfb82b08662ccc7c4;
    bytes32 proofOne =
        0x0fd7c981d39bece61f7499702bf59b3114a90e66b51ba2c53abdf7b62986c00a;
    bytes32 proofTwo =
        0xe5ebd1e1b5a5478a944ecab36a9a954ac3b6b8216875f6524caa7a1d87096576;
    bytes32[] public PROOF = [proofOne, proofTwo];
    address user;
    uint256 userPrivateKey;

    function setUp() external {
        if (!isZkSyncChain()) {
            // deploy with the script
            DeployMerkleAirdrop deployer = new DeployMerkleAirdrop();
            (merkleAirdrop, sarpaine) = deployer.deployMerkleAirdrop();
        } else {
            sarpaine = new Sarpaine();
            merkleAirdrop = new MerkleAirdrop(MERKLE_ROOT, sarpaine);
            sarpaine.mint(
                address(merkleAirdrop),
                100 * 1e18 // Mint 100 SP tokens to the airdrop contract
            );
        }
        (user, userPrivateKey) = makeAddrAndKey("user");
    }

    function testUsersCanClaim() public {
        uint256 startingBalance = sarpaine.balanceOf(user);

        uint256 amount = 25 * 1e18;
        console.log(user);
        vm.prank(user);
        // bytes32[] memory merkleProof = new bytes32[](2);
        merkleAirdrop.claim(user, amount, PROOF);
        uint256 endingBalance = sarpaine.balanceOf(user);
        assertEq(endingBalance, startingBalance + amount);
    }
}
