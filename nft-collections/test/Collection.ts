import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Collection", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCollectionFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const name = "TestName";
    const symbol = "TestSymbol";
    const Collection = await ethers.getContractFactory("Collection");
    const collection = await Collection.deploy(name, symbol);

    return { collection, owner, otherAccount, name, symbol };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { collection, name, symbol } = await loadFixture(deployCollectionFixture);

      expect(await collection.name()).to.equal(name);
      expect(await collection.symbol()).to.equal(symbol);
    });
  });

  describe("mint", function () {
    it("Successfully mint token", async function () {
      const { collection, owner } = await loadFixture(deployCollectionFixture);

      const tokenId = 1;
      const uri = "testURI";
      await expect(collection.mint(owner.address, tokenId, uri))
          .to.emit(collection, "TokenMinted")
          .withArgs(collection.address, owner.address, tokenId, uri);

      expect(await collection.tokenURI(tokenId)).to.equal(uri);
      expect(await collection.ownerOf(tokenId)).to.equal(owner.address);
    });
  });
});
