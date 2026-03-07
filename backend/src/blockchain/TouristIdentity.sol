// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TouristIdentity
 * @dev Manages digital identity for tourists using immutable blockchain records.
 */
contract TouristIdentity {
    struct Identity {
        bytes32 passportHash; // keccak256(passportNumber + salt)
        uint256 expiryDate;
        string issuerAuthority;
        bool isValid;
        address owner;
    }

    mapping(address => Identity) public identities;
    mapping(bytes32 => bool) public registeredHashes;

    event IdentityRegistered(address indexed tourist, bytes32 passportHash);
    event IdentityRevoked(address indexed tourist);

    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Register a new tourist identity.
     * passportHash is pre-calculated off-chain for privacy.
     */
    function registerIdentity(
        address _tourist,
        bytes32 _passportHash,
        uint256 _expiryDate,
        string memory _issuerAuthority
    ) external onlyAdmin {
        require(!identities[_tourist].isValid, "Identity already registered for this address");
        require(!registeredHashes[_passportHash], "Passport hash already exists");

        identities[_tourist] = Identity({
            passportHash: _passportHash,
            expiryDate: _expiryDate,
            issuerAuthority: _issuerAuthority,
            isValid: true,
            owner: _tourist
        });

        registeredHashes[_passportHash] = true;

        emit IdentityRegistered(_tourist, _passportHash);
    }

    /**
     * @dev Revoke an identity if documents are lost or stolen.
     */
    function revokeIdentity(address _tourist) external onlyAdmin {
        require(identities[_tourist].isValid, "No valid identity found");
        identities[_tourist].isValid = false;
        
        emit IdentityRevoked(_tourist);
    }

    /**
     * @dev Verify if a tourist identity is valid.
     */
    function verifyIdentity(address _tourist) external view returns (bool) {
        return identities[_tourist].isValid && identities[_tourist].expiryDate > block.timestamp;
    }
}
