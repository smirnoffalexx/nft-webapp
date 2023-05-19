// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Collection is ERC721URIStorage {
    event TokenMinted(address collection, address recipient, uint256 tokenId, string tokenUri);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(address to, uint256 tokenId, string memory uri) external {
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit TokenMinted(address(this), to, tokenId, uri);
    }
}