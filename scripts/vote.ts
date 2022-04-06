import { ethers, network } from "hardhat";
import * as fs from "fs";
import {
    developmentChains,
    proposalFile,
    ProposalState,
    VOTING_PERIOD,
} from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";

export async function vote(proposalIndex: number) {
    const proposals = JSON.parse(fs.readFileSync(proposalFile, "utf8"));
    const proposalId = proposals[network.config.chainId!][proposalIndex];
    const governor = await ethers.getContract("GovernorContract");
    // An integer of 0 for against, 1 for in-favor, and 2 for abstain.
    const voteWay = 1;
    const voteTx = await governor.castVoteWithReason(
        proposalId,
        voteWay,
        "I like it"
    );
    await voteTx.wait(1);
    console.log(`Voted on proposal ${proposalId}`);
    let proposalState = await governor.state(proposalId);
    console.log(`Proposal state: ${ProposalState[proposalState]}`);
    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1);
    }
    proposalState = await governor.state(proposalId);
    console.log(`Proposal state: ${ProposalState[proposalState]}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
vote(0).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
