// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {

    // minDelay: Delay until execution after a proposal is approved.
    // proposers is list of addresses that can perform queuing operations.
    // executors is list of addresses that can execute a proposal.
    constructor(uint256 minDelay,
        address[] memory proposers,
        address[] memory executors) TimelockController(minDelay, proposers, executors) {}
}