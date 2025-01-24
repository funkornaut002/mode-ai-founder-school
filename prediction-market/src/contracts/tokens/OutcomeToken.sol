// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

error OutcomeToken_InvalidId();

contract OutcomeToken is ERC1155, Ownable {
    address public market;
    string[] public outcomeDescriptions;
    
    constructor(
        string memory _uri,
        string[] memory _outcomeDescriptions
    ) ERC1155(_uri) Ownable(msg.sender) {
        market = msg.sender;
        outcomeDescriptions = _outcomeDescriptions;
    }

    function mint(address _to, uint256 _id, uint256 _amount) external onlyOwner {
        _mint(_to, _id, _amount, "");
    }

    function burn(address _from, uint256 _id, uint256 _amount) external onlyOwner {
        _burn(_from, _id, _amount);
    }

    function getOutcomeDescription(uint256 _id) external view returns (string memory) {
        if (_id >= outcomeDescriptions.length) revert OutcomeToken_InvalidId();
        return outcomeDescriptions[_id];
    }
} 