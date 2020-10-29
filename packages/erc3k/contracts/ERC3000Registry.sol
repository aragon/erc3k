/*
 * SPDX-License-Identifier:    GPL-3.0
 */

pragma solidity 0.6.8;

import "./ERC3000.sol";
import "./ERC3000Executor.sol";

abstract contract ERC3000Registry is ERC3000Interface {
    /**
     * @notice Registers a ERC3000Executor and ERC3000 contract by a name and with his metadata
     * @param executor ERC3000Executor contract
     * @param queue ERC3000 contract
     * @param name The name of this DAO
     * @param initialMetadata Additional data to store for this DAO
     */
    function register(ERC3000Executor executor, ERC3000 queue, string calldata name, bytes calldata initialMetadata) virtual external;
    event Registered(ERC3000Executor indexed executor, ERC3000 queue, address indexed registrant, string name);

    /**
     * @notice Sets or updates the metadata of a DAO
     * @param metadata Additional data to store for this DAO
     */
    function setMetadata(bytes memory metadata) virtual public;
    event SetMetadata(ERC3000Executor indexed executor, bytes metadata);
}
