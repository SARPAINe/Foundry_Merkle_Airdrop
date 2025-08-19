// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MyToken} from "../src/MyToken.sol";

contract DeployMyToken is Script {
    function run() public returns (MyToken) {
        vm.startBroadcast();

        MyToken token = new MyToken();

        console.log("MyToken deployed to:", address(token));
        console.log("Deployer balance:", token.balanceOf(msg.sender));
        console.log("Total supply:", token.totalSupply());

        vm.stopBroadcast();

        return token;
    }
}
