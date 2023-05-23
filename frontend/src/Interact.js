require("dotenv").config();
const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY;
const factoryAddress = process.env.REACT_APP_FACTORY_ADDRESS;
const collectionABI = require("./abi/Collection.json");
const factoryABI = require("./abi/CollectionFactory.json");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(alchemyKey);

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const obj = {
        status: "👆🏽 Write a message in the text-field above.",
        address: addressArray[0],
      };
      return obj;
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      ),
    };
  }
};

export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (addressArray.length > 0) {
        return {
          address: addressArray[0],
          status: "👆🏽 Write a message in the text-field above.",
        };
      } else {
        return {
          address: "",
          status: "🦊 Connect to Metamask using the top right button.",
        };
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      ),
    };
  }
};
async function loadFactoryContract() {
  return new web3.eth.Contract(factoryABI, factoryAddress);
}

async function loadCollectionContract(collectionAddress) {
  return new web3.eth.Contract(collectionABI, collectionAddress);
}

export const mintNFT = async (collectionAddress, url, tokenId) => {
  if (collectionAddress.trim() === "" || url.trim() === "" || tokenId.trim() === "") {
    return {
      success: false,
      status: "❗Please make sure all fields are completed before minting.",
    };
  }

  window.contract = await loadCollectionContract(collectionAddress);

  const transactionParameters = {
    to: collectionAddress,
    from: window.ethereum.selectedAddress,
    data: window.contract.methods
      .mint(window.ethereum.selectedAddress, tokenId, url)
      .encodeABI(),
  };

  try {
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    });
    return {
      success: true,
      status:
        "✅ Check out your transaction on Etherscan: https://goerli.etherscan.io/tx/" +
        txHash,
    };
  } catch (error) {
    return {
      success: false,
      status: "😥 Something went wrong: " + error.message,
    };
  }
};

export const createCollectionFromFactory = async (name, symbol) => {
  if (name.trim() === "" || symbol.trim() === "") {
    return {
      success: false,
      status: "❗Please make sure all fields are completed.",
    };
  }

  window.contract = await loadFactoryContract();

  const transactionParameters = {
    to: factoryAddress,
    from: window.ethereum.selectedAddress,
    data: window.contract.methods
      .createCollection(name, symbol)
      .encodeABI(),
  };

  try {
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    });
    return {
      success: true,
      status:
        "✅ Check out your transaction on Etherscan: https://goerli.etherscan.io/tx/" +
        txHash,
    };
  } catch (error) {
    return {
      success: false,
      status: "😥 Something went wrong: " + error.message,
    };
  }
};
