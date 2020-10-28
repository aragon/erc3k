/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

import "../ERC3000.sol";

contract ERC3000BadInterfaceMock is ERC3000 {
    function schedule(ERC3000Data.Container memory) override public returns (bytes32) { }

    function execute(ERC3000Data.Container memory) override public returns (bytes32, bytes[] memory) { }

    function challenge(ERC3000Data.Container memory, bytes memory) override public returns (uint256 resolverId) { }

    function resolve(ERC3000Data.Container memory, uint256) override public returns (bytes32, bytes[] memory) { }

    function veto(bytes32, ERC3000Data.Config memory, bytes memory) override public { }

    function configure(ERC3000Data.Config memory) override public returns (bytes32) { }

    function interfaceID() public pure returns (bytes4) {
        return bytes4(0x75b24222);
    }
}