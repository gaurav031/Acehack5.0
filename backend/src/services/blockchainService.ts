import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.POLYGON_RPC_URL || '';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.IDENTITY_CONTRACT_ADDRESS || '';

// Minimal ABI for the functions we need
const ABI = [
    "function registerIdentity(address _tourist, bytes32 _passportHash, uint256 _expiryDate, string memory _issuerAuthority) external",
    "function verifyIdentity(address _tourist) external view returns (bool)",
    "function identities(address) external view returns (bytes32 passportHash, uint256 expiryDate, string issuerAuthority, bool isValid, address owner)"
];

class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.wallet);
    }

    /**
     * @dev Create a hash of passport information for privacy-preserving on-chain storage
     */
    generatePassportHash(passportNumber: string, salt: string) {
        return ethers.keccak256(ethers.toUtf8Bytes(passportNumber + salt));
    }

    /**
     * @dev Register a tourist on-chain
     */
    async registerTouristOnChain(
        touristAddress: string,
        passportNumber: string,
        expiryDate: number,
        issuerAuthority: string
    ) {
        try {
            const salt = process.env.HASH_SALT || 'default_salt';
            const passportHash = this.generatePassportHash(passportNumber, salt);

            const tx = await this.contract.registerIdentity(
                touristAddress,
                passportHash,
                expiryDate,
                issuerAuthority
            );

            console.log('Blockchain Registration TX Sent:', tx.hash);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Blockchain Registration Error:', error);
            throw error;
        }
    }

    /**
     * @dev Verify a tourist's status directly from the blockchain
     */
    async getTouristIdentity(touristAddress: string) {
        try {
            const identity = await this.contract.identities(touristAddress);
            return {
                passportHash: identity.passportHash,
                expiryDate: Number(identity.expiryDate),
                issuerAuthority: identity.issuerAuthority,
                isValid: identity.isValid,
                owner: identity.owner
            };
        } catch (error) {
            console.error('Blockchain Verification Error:', error);
            throw error;
        }
    }
}

export default new BlockchainService();
