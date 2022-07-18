// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

// does importing costs gas in case of openzeppelin contract?
// if yes why dont we use interface which can save some gas?
// what's the significance of using @dev in the comments

// when we import an openzeppelin contracts, does gas cost depends on the how much of contract's attributes or methods we use in a given contract or something else

// What happens when we import a contract,iterface or library, does the whole code gets compiled along with the current contract while compiling or something else happens behind the hood?
contract CryptoDevs is ERC721Enumerable, Ownable {
    string _baseTokenURI;

    uint256 public _price = 0.01 ether;

    // max no of cryptodevs nft to be minted
    uint256 public maxTokenIds = 20;

    // no of token ids minted
    uint256 public tokenIds;

    // used in case of an emergency-pause contract
    bool public _paused;

    // presale started or not (boolean)
    bool public presaleStarted;

    // create an instance of Iwhitelist
    IWhitelist whitelist;

    // presaleEnded time
    uint256 public presaleEnded;

    // modifier to check if contract is paused 
    modifier onlyWhenNotPaused() {
        require(!_paused, "contract is paused");
        _;
    }

    constructor(string memory _baseURI, address whitelistContractAddress) ERC721("CryptoDevs", "CD") {
        _baseTokenURI = _baseURI;
        whitelist = IWhitelist(whitelistContractAddress);
    }

    // start presale nft sale
    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }
    

    // presale nft mint
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "presale not started" );
        require(whitelist.whitelistedAddresses(msg.sender), "you are not whitelisted");
        require(tokenIds < maxTokenIds, "exceeded max CryptoDevs supply");
        require(msg.value >= _price, "not paying enough eth");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    // nft mint for others
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp  >= presaleEnded, "presale is going on");
        require(tokenIds < maxTokenIds, "exceeded max CryptoDevs supply");
        require(msg.value >= _price, "not paying enough eth");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);

    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    } 

    function _setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    // withdraw function : all ether from the contract to the owner
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "transfer failed");
    }

    // will be called when msg.data is empty
    receive() external payable {}

    // will be called when msg.data is not empty
    fallback() external payable {}

}