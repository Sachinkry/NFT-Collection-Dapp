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
  const [isOwner, setIsOwner] = useState(false);
  const web3ModalRef = useRef();

  useEffect(() => {
    web3ModalRef.current = new Web3Modal({
      network: "rinkeby",
      providerOptions: {},
      disableInjectedProvider: false,
    });
    connectWallet();

    checkIfPresaleStarted();
  }, [walletConnected])

  // get owner
  const getOwner = async () => {
    try {
      const provider = await getSignerOrProvider();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const owner = await nftContract.owner();
      const signer = await getSignerOrProvider(true);
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOnwer(true);
      }

    } catch (err) {
      console.error(err);
    }
  }

  const getSignerOrProvider = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4) {
      window.alert("CHANGE THE NEWTWORK TO RINKEBY");
      throw new Error("not on rinkeby network");
    }

    if (needSigner) {
      const signer = await web3Provider.getSigner();
      return signer;
    }

  }


  // start presale
  const startPresale = async () => {
    try {
      const signer = await getSignerOrProvider(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);

    } catch (err) {
      console.error(err);
    }
  }

  // check if presale started
  const checkIfPresaleStarted = () => {
    try {
      const provider = await getSignerOrProvider();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const _presaleStarted = await nftContract.presaleStarted();

      setPresaleStarted(_presaleStarted);
      return _presaleStarted;

    } catch (error) {
      console.error(err);
      return false;
    }
  }

  // check if presale ended
  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getSignerOrProvider();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );

      // it will return a Big number (timestamp in seconds)
      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Data.now() / 1000;

      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );

      setPresaleEnded(hasPresaleEnded);

    } catch (err) {
      console.error(err);
    }
  }


  const connectWallet = async () => {
    try {
      await getSignerOrProvider();
      setWalletConnected(true);
      console.log("hello");
    } catch (err) {
      console.error(err);
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
            0/20 have been minted
          </div>
          {walletConnected ?
            null :
            <button className={styles.button} onClick={connectWallet}>connect wallet</button>
          }

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
