import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CollectionFactory", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCollectionFactoryFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const name = "TestName";
    const symbol = "TestSymbol";
    const CollectionFactory = await ethers.getContractFactory("CollectionFactory");
    const collectionFactory = await CollectionFactory.deploy();

    return { collectionFactory, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Successful deployment", async function () {
      const { collectionFactory } = await loadFixture(deployCollectionFactoryFixture);

      expect(collectionFactory.address).to.not.equal(ethers.constants.AddressZero);
    });
  });

  describe("createCollection", function () {
    it("Successfully create collection", async function () {
      const { collectionFactory, owner } = await loadFixture(deployCollectionFactoryFixture);

      const name = "TestName";
      const symbol = "TestSymbol";
      await expect(collectionFactory.createCollection(name, symbol))
          .to.emit(collectionFactory, "CollectionCreated")
          .withArgs(anyValue, name, symbol);

      expect(await collectionFactory.collections(0)).to.not.equal(ethers.constants.AddressZero);
    });
  });
});
