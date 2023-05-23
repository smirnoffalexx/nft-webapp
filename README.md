# NFT Webapp

There is a web application for tracking created collections and minted nfts

In the nft-collections folder there are smart contracts with some tests.
Collection factory contract has been deployed to goerli testnet: https://goerli.etherscan.io/address/0x36Bf5310729927203e43D008f2826DcC61932F8a

Folder backend contains golang backend which is tracking events from factory and created collections and store them in memory. You can backend via air (https://github.com/cosmtrek/air) `~/go/bin/air` or `go run main.go`

Folder frontend contains web application for creating collections and minting NFTs. Installation and running instructions are inside folder.
