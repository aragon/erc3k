/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

import "../IERC3000Executor.sol";

contract ERC3000ExecutorMock is IERC3000Executor {
    function exec(ERC3000Data.Action[] memory, bytes32, bytes32) override public returns (bytes32, bytes[] memory) {

    }

    function interfaceID() public pure returns (bytes4) {
        return ERC3000_EXEC_INTERFACE_ID;
    }
}
