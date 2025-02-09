const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry", function () {
    let LandRegistry, landRegistry;
    let owner, user1, user2, authority;

    beforeEach(async function () {
        [owner, user1, user2, authority] = await ethers.getSigners();
        LandRegistry = await ethers.getContractFactory("LandRegistry");
        landRegistry = await LandRegistry.deploy();
    });

    it("Should register a new land parcel", async function () {
        await expect(landRegistry.connect(user1).registerLand("5.6037, -0.1870", "Qm1234IPFSHash"))
            .to.emit(landRegistry, "LandRegistered")
            .withArgs(1, user1.address, "5.6037, -0.1870");

        const land = await landRegistry.getLandDetails(1);
        expect(land.owner).to.equal(user1.address);
        expect(land.location).to.equal("5.6037, -0.1870");
        expect(land.documentHash).to.equal("Qm1234IPFSHash");
    });

    it("Should allow only verified authority to verify land", async function () {
        await landRegistry.connect(owner).addVerifiedAuthority(authority.address);
        await landRegistry.connect(user1).registerLand("5.6037, -0.1870", "Qm1234IPFSHash");

        await expect(landRegistry.connect(authority).verifyLand(1))
            .to.emit(landRegistry, "LandVerified")
            .withArgs(1, true);

        const land = await landRegistry.getLandDetails(1);
        expect(land.verified).to.equal(true);
    });

    it("Should not allow unverified users to verify land", async function () {
        await landRegistry.connect(user1).registerLand("5.6037, -0.1870", "Qm1234IPFSHash");

        await expect(landRegistry.connect(user2).verifyLand(1)).to.be.revertedWith("Not an authorized entity");
    });

    it("Should transfer ownership", async function () {
        await landRegistry.connect(user1).registerLand("5.6037, -0.1870", "Qm1234IPFSHash");
        await landRegistry.connect(owner).addVerifiedAuthority(authority.address);
        await landRegistry.connect(authority).verifyLand(1);

        await expect(landRegistry.connect(user1).transferLand(1, user2.address))
            .to.emit(landRegistry, "OwnershipTransferred(uint256,address)")
            .withArgs(1, user2.address);

        const land = await landRegistry.getLandDetails(1);
        expect(land.owner).to.equal(user2.address);
    });

    it("Should not allow unverified land to be transferred", async function () {
        await landRegistry.connect(user1).registerLand("5.6037, -0.1870", "Qm1234IPFSHash");

        await expect(landRegistry.connect(user1).transferLand(1, user2.address))
            .to.be.revertedWith("Land must be verified");
    });

    it("Should allow only land owner to transfer ownership", async function () {
        await landRegistry.connect(user1).registerLand("5.6037, -0.1870", "Qm1234IPFSHash");
        await landRegistry.connect(owner).addVerifiedAuthority(authority.address);
        await landRegistry.connect(authority).verifyLand(1);

        await expect(landRegistry.connect(user2).transferLand(1, user2.address))
            .to.be.revertedWith("Not the landowner");
    });

    it("Should allow owner to add and remove verified authority", async function () {
        await landRegistry.connect(owner).addVerifiedAuthority(authority.address);
        expect(await landRegistry.verifiedAuthorities(authority.address)).to.equal(true);

        await landRegistry.connect(owner).removeVerifiedAuthority(authority.address);
        expect(await landRegistry.verifiedAuthorities(authority.address)).to.equal(false);
    });

    it("Should not allow non-owner to add verified authority", async function () {
        await expect(landRegistry.connect(user1).addVerifiedAuthority(user2.address))
            .to.be.revertedWithCustomError(landRegistry, "OwnableUnauthorizedAccount")
            .withArgs(user1.address);
    });
});