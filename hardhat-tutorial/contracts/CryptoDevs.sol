// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contract/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    string _baseTokenURI;

    // price of one crypto dev nft
    uint256 public _price = 0.01 ether;

    // pause the contract in case of emergency
    bool public _paused;

    // max no of crypto devs
    uint256 public maxTokenIds = 20;

    // total no of tokenIds minted
    uint256 public tokenIds;

    // whitelist contract instance
    IWhitelist whitelist;

    // boolean to keep track of whether presale started or not
    bool public presaleStarted;

    // timestamp for when presale would end
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }

    constructor (string memory baseURI, address whitelistContract) ERC721("CryptoDevs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    // @dev startPresale starts a presale for the whitelist addresses
    function startPresale() public onlyOwner{
        presaleStarted = true;

        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistedAddress(msg.sender), "you are not whitelisted");
        require(tokenIds < maxTokenIds, "exceeded max crypto devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;

        // _safeMint is a safer version of the _mint function as it ensures that
        // if the address being minted to is a contract, then it knows how to deal with ERC721
        // if the address beingh minted to is not a contract, it works the same way as _mint
        _safeMint(msg.sender, tokenIds);
    }

    // @dev mint allows a user to mint 1 NFT per transaction after the presale has ended
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded, "presale has not ended yet");
        require(tokenIds < maxTokenIds, "Exceed maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
    }

    // @dev _baseURI overrides the openzeppelin's ERC721 implementation which by default returned an empty string for the baseURI
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // @dev setPaused makes the contract paused or unpaused
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    // @dev withdraw sends all the ether in the contract
    // to the owner of the contract
    function withdraw() public ownlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent,) = _owner.call{value: amount}("");
        require(sent, "falied to send Ether");
    }

    // function to receive Ether(when msg.data is empty)
    receive() external payable {}

    // fallback function is called when msg.data is not empty
    fallback() external payable {}


}