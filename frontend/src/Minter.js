import { useEffect, useState } from "react";
import {
  connectWallet,
  getCurrentWalletConnected,
  mintNFT,
  createCollectionFromFactory
} from "./Interact.js";
import axios from "axios"
require("dotenv").config();
const factoryAddress = process.env.REACT_APP_FACTORY_ADDRESS;

const Minter = (props) => {
  const [walletAddress, setWallet] = useState("");
  const [mintStatus, setMintStatus] = useState("");
  const [createStatus, setCreateStatus] = useState("");

  const [tokenId, setTokenId] = useState("");
  const [url, setURL] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");

  const [collectionName, setCollectionName] = useState("");
  const [collectionSymbol, setCollectionSymbol] = useState("");

  const [events, setEvents] = useState("");

  useEffect(async () => {
    const { address, mintStatus, createStatus } = await getCurrentWalletConnected();

    setWallet(address);
    setMintStatus(mintStatus);
    setCreateStatus(createStatus);

    addWalletListener();
    onEvents();
  }, []);

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setCreateStatus("👆🏽 Write a message in the text-field above.");
          setMintStatus("👆🏽 Write a message in the text-field above.");
        } else {
          setWallet("");
          setCreateStatus("🦊 Connect to Metamask using the top right button.");
          setMintStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    } else {
      setMintStatus(
        <p>
          {" "}
          🦊{" "}
          <a target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
      setCreateStatus(
        <p>
          {" "}
          🦊{" "}
          <a target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
    }
  }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setMintStatus(walletResponse.status);
    setCreateStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const onMintPressed = async () => {
    const { success, status } = await mintNFT(collectionAddress, url, tokenId);
    setMintStatus(status);
    if (success) {
      setTokenId("");
      setURL("");
    }
  };

  const onCreatePressed = async () => {
    const { success, status } = await createCollectionFromFactory(collectionName, collectionSymbol);
    setCreateStatus(status);
    if (success) {
      setCollectionName("");
      setCollectionSymbol("");
    }
  };

  const onEvents = async () => {
    const res = await axios.get(`http://localhost:8080/events/${factoryAddress}`);
    const eventsData = res.data.events
    console.log(eventsData)
    let eventsString = "";

    for (let i = 0; i < eventsData.length; i++) {
      const event = eventsData[i]
      eventsString += event["collection"] + " name: " + event["name"] + ", symbol: " + event["symbol"] + " "
    }

    // for (var key in eventsData) {
    //   if (key === factoryAddress) {
    //     continue
    //   }

    //   eventsString += key
    // }
      // for (let i = 0; i < eventsData[key].length; i++) {
      //   eventsString += "\n"  
      //   for (var index in eventsData[key][i]) {
      //     console.log(eventsData[key][i][index])
      //     eventsString += index + ": " + eventsData[key][i][index] + "\n"
      //   }
      // }
      // console.log(eventsData[key][0]["event"])
      // eventsString += key + "\n"
      // for (let i = 0; i < eventsData[key].length; i++) {
      //   for (var index in eventsData[key]) {
      //     console.log(eventsData[key][index])
      //     eventsString += + eventsData[key][index] + "\n"
      //   }
      // }
      // console.log(Object.keys(eventsData))// JSON.stringify(eventsData))
  
    setEvents(eventsString)
  };

  return (
    <div className="Minter">
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>

      <br></br>
      <h1 id="title">Create collection and then mint NFT</h1>
      <p>
        Provide new collection name and symbol
      </p>
      <form>
        <h2>Collection name: </h2>
        <input
          type="text"
          placeholder="Name"
          onChange={(event) => setCollectionName(event.target.value)}
        />
        <h2>Collection symbol: </h2>
        <input
          type="text"
          placeholder="Symbol"
          onChange={(event) => setCollectionSymbol(event.target.value)}
        />
      </form>
      <button id="mintButton" onClick={onCreatePressed}>
        Create
      </button>
      <p id="status" style={{ color: "red" }}>
        {createStatus}
      </p>
      <p>
        Add your collection address, asset's link and token id
      </p>
      <form>
      <h2>Collection address: </h2>
        <input
          type="text"
          placeholder="e.g. 0x3901A3D1FDE500a8E6752263560d25a87173484D"
          onChange={(event) => setCollectionAddress(event.target.value)}
        />
        <h2>🖼 Link to json with name, description and image: </h2>
        <input
          type="text"
          placeholder="e.g. https://ipfs.io/ipfs/<hash>"
          onChange={(event) => setURL(event.target.value)}
        />
        <h2>🤔 Token id: </h2>
        <input
          type="text"
          placeholder="1"
          onChange={(event) => setTokenId(event.target.value)}
        />
      </form>
      <button id="mintButton" onClick={onMintPressed}>
        Mint NFT
      </button>
      <p id="status" style={{ color: "red" }}>
        {mintStatus}
      </p>
      <h1 id="title">Collections created in this session:</h1>
      <h2>{events}</h2>
    </div>
  );
};

export default Minter;
