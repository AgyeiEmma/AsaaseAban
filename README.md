# AsaaseAban

**A Decentralized Land Registry and Transfer Platform Using Blockchain and GIS**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**AsaaseAban** is a blockchain-powered land registry and transfer platform designed for transparency, security, and efficiency in land administration. Leveraging smart contracts, GIS mapping, and decentralized storage, it enables users and administrators to register, verify, transfer, and visualize land ownership with auditability and cryptographic proof.

---

## Features

- **Decentralized Land Registration:** Register land parcels onto a blockchain with cryptographic proof of documents.
- **GIS Visualization:** Interactive map showing all registered lands with details and ownership.
- **Transfer of Ownership:** Secure, auditable land ownership transfer via smart contracts.
- **Document Verification:** Admins can verify land documentation, ensuring authenticity.
- **Role-Based Access:** Distinct interfaces and permissions for admins and regular users.
- **Ownership History:** Transparent tracking of land transfer and verification events.
- **IPFS/Decentralized Storage:** Land documents are hashed and optionally stored on IPFS for immutability.
- **Modern UI:** Responsive web frontend with wallet integration and real-time blockchain interactions.

---

## Architecture

- **Frontend:** JavaScript SPA using Leaflet.js for maps, Web3 for Ethereum connectivity, and a clean UI.
- **Backend:** Node.js/Express API, PostGIS for geospatial data, and integration with the blockchain.
- **Smart Contracts:** Solidity-based contracts deployed on Ethereum testnet (Sepolia), managing land data and ownership.
- **GIS Integration:** Real-time map overlays and parcel visualization.

---

## Technology Stack

- **Frontend:** JavaScript, HTML5, CSS3, Leaflet.js, Web3.js
- **Backend:** Node.js, Express, PostgreSQL + PostGIS, Multer (for uploads)
- **Blockchain:** Solidity, Hardhat, Ethers.js, Ethereum (Sepolia testnet)
- **Decentralized Storage:** IPFS (planned/document hashing)
- **Other:** Docker (optional), .env for secrets, Alchemy for enhanced blockchain access

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm/yarn
- PostgreSQL with PostGIS extension
- [Hardhat](https://hardhat.org/) (for smart contract deployment)
- MetaMask or any EVM-compatible wallet
- (Optional) Docker, Alchemy API key, IPFS node

### Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/AgyeiEmma/AsaaseAban.git
cd AsaaseAban
```

#### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

#### 3. Set Up Environment Variables

Copy `.env.example` to `.env` in the `backend` and `blockchain` folders. Fill in:

- PostgreSQL connection string
- Ethereum RPC URL (Sepolia)
- Wallet private key (for contract admin)
- Contract address (after deployment)
- IPFS/Alchemy keys (if needed)

#### 4. Database Setup

- Ensure PostgreSQL is running with PostGIS enabled.
- Create the required tables (see `backend/src/database.js` for structure).

#### 5. Install Frontend Dependencies

If using a bundler, install dependencies; otherwise, the frontend uses CDN links.

#### 6. Smart Contract Deployment

See [Smart Contract Deployment](#smart-contract-deployment).

#### 7. Start Backend Server

```bash
cd backend
npm start
# or
node src/app.js
```

#### 8. Run Frontend

Open `frontend/index.html` in your browser, or serve via a static server.

---

## Usage

### Connect Wallet

- Click "Connect Wallet" and approve in MetaMask.
- Role determines if you see the admin or user dashboard.

### Register Land

- Enter land location (latitude, longitude) and upload a document.
- Submit to register on blockchain and database.

### Verify Land

- Admins can verify land documents.

### Transfer Ownership

- Select a land and new owner's address, then transfer via smart contract.

### View on Map

- Registered lands are visualized on the built-in map with details and tooltips.

---

## Smart Contract Deployment

1. Enter the `blockchain` directory:

```bash
cd blockchain/blockchain
npm install
```

2. Configure `.env` with your Sepolia RPC URL and private key.

3. Deploy contract:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

4. Copy the deployed contract address to your backend and frontend `.env` files.

---

## Project Structure

```
AsaaseAban/
│
├── backend/          # Express API, database logic, blockchain integration
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── database.js
│
├── blockchain/       # Solidity contracts, deployment scripts, hardhat config
│   └── blockchain/
│       ├── contracts/
│       ├── scripts/
│       └── hardhat.config.js
│
├── frontend/         # HTML, CSS, JS, main UI
│   ├── js/
│   ├── css/
│   └── index.html
│
└── README.md
```

---

## Contributing

Contributions are welcome! Please:

- Fork the repo and create a new branch.
- Submit a pull request with clear description.
- Follow code style and document your changes.
- Raise issues for bugs/feature requests.

---

## License

This project is licensed under the MIT License.

---

**AsaaseAban** — Powering transparent, secure land management for everyone.
