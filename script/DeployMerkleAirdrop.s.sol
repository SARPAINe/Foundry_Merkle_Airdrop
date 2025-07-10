// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {MerkleAirdrop} from "../src/MerkleAirdrop.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Sarpaine} from "src/Sarpaine.sol"; // Import Sarpaine if needed, otherwise remove this line
import {ZkSyncChainChecker} from "@foundry-devops/ZkSyncChainChecker.sol"; // Import StringUtils for string manipulation;

contract DeployMerkleAirdrop is Script {
    bytes32 private s_merkleRoot =
        0xaa5d581231e596618465a56aa0f5870ba6e20785fe436d5bfb82b08662ccc7c4; // Replace with actual Merkle root
    uint256 private s_amountToTransfer = 4 * 25e18;

    function run() external returns (MerkleAirdrop, Sarpaine) {
        return deployMerkleAirdrop();
    }

    function deployMerkleAirdrop() public returns (MerkleAirdrop, Sarpaine) {
        vm.startBroadcast();

        // Deploy the Sarpaine contract if needed
        Sarpaine token = new Sarpaine();
        MerkleAirdrop merkleAirdrop = new MerkleAirdrop(
            s_merkleRoot,
            IERC20(address(token))
        );
        token.mint(address(merkleAirdrop), s_amountToTransfer); // Mint 100 tokens to the owner

        vm.stopBroadcast();
        return (merkleAirdrop, token);
    }
}
