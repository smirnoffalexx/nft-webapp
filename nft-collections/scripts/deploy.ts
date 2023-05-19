import { ethers } from "hardhat";

async function main() {
  // const CollectionFactory = await ethers.getContractFactory("CollectionFactory");
  // const collectionFactory = await CollectionFactory.deploy();
  // await collectionFactory.deployed();

  // console.log(
  //   `CollectionFactory deployed to ${collectionFactory.address}`
  // );

  const Collection = await ethers.getContractFactory("Collection");
  const collection = await Collection.deploy("Zero", "ZO");
  await collection.deployed();

  console.log(
    `collection deployed to ${collection.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
