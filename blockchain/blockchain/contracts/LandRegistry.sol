// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract LandRegistry is Ownable {
    struct LandParcel {
        uint256 id;
        address owner;
        string location;
        string documentHash; // ✅ IPFS Hash
        bool verified;
        bool documentVerified; // ✅ New: Stores document verification status
        address[] ownershipHistory;
    }

    uint256 public landCounter;
    mapping(uint256 => LandParcel) public lands;
    mapping(address => bool) public verifiedAuthorities; // Chiefs, Land Commission

    event LandRegistered(uint256 indexed landId, address indexed owner, string location);
    event OwnershipTransferred(uint256 indexed landId, address indexed newOwner);
    event LandVerified(uint256 indexed landId, bool verified);
    event DocumentVerified(uint256 indexed landId, bool verified); // ✅ New event

    modifier onlyVerifiedAuthority() {
        require(verifiedAuthorities[msg.sender], " Not an authorized entity");
        _;
    }

    modifier onlyLandOwner(uint256 landId) {
        require(lands[landId].owner == msg.sender, " Not the landowner");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ✅ Register new land
    function registerLand(string memory _location, string memory _documentHash) public {
        landCounter++;

        LandParcel storage newLand = lands[landCounter];
        newLand.id = landCounter;
        newLand.owner = msg.sender;
        newLand.location = _location;
        newLand.documentHash = _documentHash;
        newLand.verified = false;
        newLand.documentVerified = false; // ✅ Set document verification to false

        newLand.ownershipHistory.push(msg.sender);

        emit LandRegistered(landCounter, msg.sender, _location);
    }

    // ✅ Verify land ownership (Admins Only)
    function verifyLand(uint256 _landId) public onlyVerifiedAuthority {
        require(lands[_landId].id != 0, " Land does not exist");
        require(lands[_landId].documentVerified, " Document must be verified first");
        
        lands[_landId].verified = true;
        emit LandVerified(_landId, true);
    }

    // ✅ Verify document (Admins Only)
    function verifyDocument(uint256 _landId) public onlyVerifiedAuthority {
        require(lands[_landId].id != 0, " Land does not exist");
        
        lands[_landId].documentVerified = true;
        emit DocumentVerified(_landId, true);
    }

    // ✅ Transfer land ownership
    function transferLand(uint256 _landId, address _newOwner) public onlyLandOwner(_landId) {
        require(lands[_landId].verified, " Land must be verified");
        require(_newOwner != address(0), "Invalid new owner");

        lands[_landId].ownershipHistory.push(_newOwner);
        lands[_landId].owner = _newOwner;

        emit OwnershipTransferred(_landId, _newOwner);
    }

    // ✅ Get land details
    function getLandDetails(uint256 _landId) public view returns (
        address owner,
        string memory location,
        string memory documentHash,
        bool verified,
        bool documentVerified, // ✅ New field
        address[] memory ownershipHistory
    ) {
        require(lands[_landId].id != 0, " Land does not exist");
        LandParcel storage land = lands[_landId];
        return (land.owner, land.location, land.documentHash, land.verified, land.documentVerified, land.ownershipHistory);
    }

    // ✅ Add verified land authorities
    function addVerifiedAuthority(address _authority) public onlyOwner {
        verifiedAuthorities[_authority] = true;
    }

    // ✅ Remove verified land authority
    function removeVerifiedAuthority(address _authority) public onlyOwner {
        verifiedAuthorities[_authority] = false;
    }
}
