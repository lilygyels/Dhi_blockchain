import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import abi from "./contracts/TandinToken.json";

const contract_ABI = abi.abi;
const contract_address = "0x48AAd96976F1A4018825FFBFFff39EB1Da5cc39d";

function App() {
  const [loading, setLoading] = useState(true); // Define loading state
  const [contractAPI, setContractAPI] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0);
  const [tokenName, setTokenName] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    const connectWallet = async () => {
      setLoading(true); // Start loading
      let providerInstance;

      if (window.ethereum == null) {
        console.log("MetaMask not installed; using read-only defaults");
        providerInstance = ethers.getDefaultProvider();
      } else {
        providerInstance = new ethers.BrowserProvider(window.ethereum);
        try {
          const signerInstance = await providerInstance.getSigner();
          setSigner(signerInstance);
          setAddress(await signerInstance.getAddress());
          console.log(signerInstance);
        } catch (error) {
          console.error(error);
        }

        // Initialize contract API
        const contract_api = new ethers.Contract(
          contract_address,
          contract_ABI,
          providerInstance
        );
        if (contract_api) {
          setContractAPI(contract_api);
          console.log(contract_api);
        }
      }

      console.log(providerInstance);
      setProvider(providerInstance);
      setLoading(false); // Stop loading
    };

    window.ethereum.on("accountsChanged", function () {
      window.location.reload();
    });

    connectWallet();
  }, []);

  const fetchTokenDetail = async () => {
    if (contractAPI && address) {
      try {
        setLoading(true); // Start loading
        const _tokenName = await contractAPI.name();
        setTokenName(_tokenName);
        const _tokenDescription = await contractAPI.description();
        setTokenDescription(_tokenDescription);

        const bal = await contractAPI.balanceOf(address);
        // setBalance(ethers.formatEther(bal));
        setBalance(bal.toString());
        console.log(bal);

        const tokenSymbol = await contractAPI.symbol();
        setSymbol(tokenSymbol);
        setLoading(false); // Stop loading
      } catch (error) {
        console.error(error);
        setLoading(false); // Stop loading on error
      }
    }
  };

  useEffect(() => {
    fetchTokenDetail();
  }, [contractAPI, address]);

  const transferToken = async () => {
    if (contractAPI && address && recipient && amount) {
      try {
        setLoading(true); // Start loading
        const decimals = await contractAPI.decimals();
        const amountInUnits = ethers.parseUnits(amount.toString(), decimals);

        console.log("Amount in units:", amountInUnits.toString());
        const tx = await contractAPI
          .connect(signer)
          .transfer(recipient, amountInUnits);

        console.log("Transaction sent:", tx);

        // Wait for the transaction to be mined
        await tx.wait();

        console.log("Transaction confirmed");
        fetchTokenDetail(); // Update token details after transfer
        toast.success("Token transfer successful!");
        setLoading(false); // Stop loading
      } catch (error) {
        console.error("Error during token transfer:", error);
        toast.error("Error during token transfer.");
        setLoading(false); // Stop loading on error
      }
    } else {
      toast.warn("Missing contractAPI, address, recipient, or amount");
    }
  };

  return (
    <div className="relative">
      <div className={`flex justify-center items-center h-screen ${loading ? 'blur-md' : ''}`}>
        <div className="card p-6 shadow-lg rounded-lg">
          <nav className="navbar mb-4">
            <h1 className="text-xl font-bold text-center">ERC20 Token</h1>
          </nav>
          <div className="flex flex-col space-y-4">
            <div className="account">
              {address ? <div>Connected: {address}</div> : "Not connected"}
            </div>
            <div className="tokenName">
              {tokenName ? <div>Token Name: {tokenName}</div> : ""}
            </div>
            <div className="tokenDescrip">
              {tokenDescription ? (
                <div>Token Description: {tokenDescription}</div>
              ) : (
                ""
              )}
            </div>
            <div className="tokenSymbol">
              {symbol ? <div>Token Symbol: {symbol}</div> : ""}
            </div>
            <div className="balance">Balance: {balance}</div>
            <div className="transfer">
              <div className="input-container mb-2">
                <input
                  type="text"
                  placeholder="Recipient Address"
                  className="recipient p-2 border rounded w-full"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="input-container mb-4">
                <input
                  type="number"
                  placeholder="Amount"
                  id="amount"
                  className="amount p-2 border rounded w-full"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <button
                className="btn bg-blue-500 text-white py-2 px-4 rounded"
                onClick={transferToken}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="overlay">
          <div className="loader"></div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default App;
