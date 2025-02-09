// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // ✅ Updated to match OpenZeppelin's latest version

import "@openzeppelin/contracts/access/Ownable.sol";

contract LandRegistry is Ownable {
    struct LandParcel {
        uint256 id;
        address owner;
        string location; // GPS Coordinates (latitude, longitude)
        string documentHash; // IPFS Hash
        bool verified; // Admin verifies land before transactions
        address[] ownershipHistory;
    }

    uint256 public landCounter;
    mapping(uint256 => LandParcel) public lands;
    mapping(address => bool) public verifiedAuthorities; // Chiefs, Land Commission

    event LandRegistered(uint256 indexed landId, address indexed owner, string location);
    event OwnershipTransferred(uint256 indexed landId, address indexed newOwner);
    event LandVerified(uint256 indexed landId, bool verified);

    modifier onlyVerifiedAuthority() {
        require(verifiedAuthorities[msg.sender], "Not an authorized entity");
        _;
    }

    modifier onlyLandOwner(uint256 landId) {
        require(lands[landId].owner == msg.sender, "Not the landowner");
        _;
    }

    constructor() Ownable(msg.sender) {
        // The deployer of the contract is automatically the owner
    }

    // ✅ Register new land
    function registerLand(string memory _location, string memory _documentHash) public {
        landCounter++;

        // Create new land record
        LandParcel storage newLand = lands[landCounter];
        newLand.id = landCounter;
        newLand.owner = msg.sender;
        newLand.location = _location;
        newLand.documentHash = _documentHash;
        newLand.verified = false;

        // Push first owner into ownership history
        newLand.ownershipHistory.push(msg.sender);

        emit LandRegistered(landCounter, msg.sender, _location);
    }

    // ✅ Verify land (Only admins)
    function verifyLand(uint256 _landId) public onlyVerifiedAuthority {
        require(lands[_landId].id != 0, "Land does not exist");
        lands[_landId].verified = true;
        emit LandVerified(_landId, true);
    }

    // ✅ Transfer ownership (Buyer & Seller Agreement)
    function transferLand(uint256 _landId, address _newOwner) public onlyLandOwner(_landId) {
        require(lands[_landId].verified, "Land must be verified");
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
        address[] memory ownershipHistory
    ) {
        require(lands[_landId].id != 0, "Land does not exist");
        LandParcel storage land = lands[_landId];
        return (land.owner, land.location, land.documentHash, land.verified, land.ownershipHistory);
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
