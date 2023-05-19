// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Collection.sol";

contract CollectionFactory {
    Collection[] public collections;

    event CollectionCreated(address collection, string name, string symbol);

    constructor() {}

    function createCollection(string memory name, string memory symbol) external {
        Collection collection = new Collection(name, symbol);
        collections.push(collection);

        emit CollectionCreated(address(collection), name, symbol);
    }
}