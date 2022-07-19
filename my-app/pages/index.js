import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal"
import { providers, utils, Contract } from "ethers"
import React, { useState, useRef, useEffect } from "react"
import { NFT_CONTRACT_ADDRESS, abi } from "../constants"

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [numTokenIds, setNumTokenIds] = useState("0");
  const web3ModalRef = useRef();

  /*
       1. connect wallet using web3modal
          a. connect wallet function
          b. get signer or provider function 
          c. useEffect rendering
  */
  // connect wallet function 
  const connectWallet = async () => {
    try {
      await getSignerOrProvider();
      setWalletConnected(true);
      await getOwner();

    } catch (err) {
      console.error(err);
    }
  }

  // get signer or provider to read or sign transactions
  const getSignerOrProvider = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("CHANGE TO RINKEBY NETWORK");
      throw new Error("ERR: not on rinkeby!");
    }

    if (needSigner) {
      const signer = await web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  // useEffect rendering
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {}
      });
    }
    console.log(walletConnected);
    connectWallet();

    const _presaleStarted = checkIfPresaleStarted();
    if (_presaleStarted) {
      checkIfPresaleEnded();
    }

    getNumTokensMinted();

    const presaleEndedInterval = setInterval(async () => {
      const _presaleStarted = await checkIfPresaleStarted();
      if (_presaleStarted) {
        const _presaleEnded = await checkIfPresaleEnded();
        if (_presaleEnded) {
          clearInterval(presaleEndedInterval);
        }
      }
    }, 5 * 1000);

    setInterval(async () => {
      await getNumTokensMinted();
    }, 5 * 1000);

  }, [walletConnected])

  /* 
       2. check for owner and start presale
          a. getOwner function to get owner
          b. start presale button and wiring
  */

  // get owner
  const getOwner = async () => {
    const signer = await getSignerOrProvider(true);
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      signer
    );
    const nftContractOwner = await nftContract.owner();
    const currentUserAddress = await signer.getAddress();
    const _isOwner = (currentUserAddress.toLowerCase() === nftContractOwner.toLowerCase());
    if (_isOwner) {
      setIsOwner(true);
    }
  };

  // 3. start presale mint
  // check if presale has started 
  // presaleMint function 

  const checkIfPresaleStarted = async () => {
    const provider = await getSignerOrProvider();
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      provider
    );
    const _presaleStarted = await nftContract.presaleStarted();
    setPresaleStarted(_presaleStarted);
    console.log("hasPresaleStarted:", _presaleStarted);
  }

  const presaleMint = async () => {
    try {
      const signer = await getSignerOrProvider(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01")
      });

      setLoading(true);
      await txn.wait();
      setLoading(false);

      window.alert("You have successfully minted an NFT!");


    } catch (err) {
      console.error(err);
    }
  }

  // 4. start public mint
  // check if presale has ended
  // function publicMint()

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getSignerOrProvider();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _presaleEndTime = await nftContract.presaleEnded();
      const _currentTimeInSeconds = Date.now() / 1000;
      const hasPresaleEnded = _presaleEndTime.lt(Math.floor(_currentTimeInSeconds));

      if (hasPresaleEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      console.log("ended:", hasPresaleEnded);

      return hasPresaleEnded;

    } catch (err) {
      console.error(err);
    }
  }

  // public mint function
  const publicMint = async () => {
    try {
      const signer = await getSignerOrProvider(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01")
      });

      setLoading(true);
      await txn.wait();
      setLoading(false);

      window.alert("You have successfully minted an NFT!");


    } catch (err) {
      console.error(err);
    }
  }

  // get no of tokens minted
  const getNumTokensMinted = async () => {
    try {
      const provider = await getSignerOrProvider();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _tokenIds = await nftContract.tokenIds();
      setNumTokenIds(_tokenIds.toString());

    } catch (err) {
      console.error(err);
    }
  }

  const renderButton = () => {

    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>Connect Wallet</button>
      )
    }

    if (loading) {
      return (
        <button className={styles.button}>Loading...</button>
      )
    }

    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} >Start Presale</button>
      )
    } else if (!isOwner && !presaleStarted) {
      return (
        <p><b>Presale has not started yet!</b></p>
      )
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <p>Presale has started! You can mint a crypto dev if you are in whitelist 🥳</p>
          <button className={styles.button} onClick={presaleMint} >Presale Mint</button>
        </div>
      )
    }

    if (presaleStarted && presaleEnded) {
      return (
        // show Public mint button
        <div>
          <p><b>Presale mint has ended. Public mint has started 🤩</b></p>
          <br></br>
          <button className={styles.button} onClick={publicMint} >Public Mint 🚀</button>
        </div>
      )
    }


  }

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numTokenIds}/20 have been minted
          </div>
          {renderButton()}

        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
