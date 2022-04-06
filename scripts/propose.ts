import { ethers, network } from "hardhat";
import * as fs from "fs";
import {
  VOTING_DELAY,
  NEW_STORE_VALUE,
  FUNC,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  proposalFile,
  ProposalState,
} from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";

export async function propose(
  args: any[],
  functionCall: string,
  proposalDescription: string
) {
  const governor = await ethers.getContract("GovernorContract");
  const box = await ethers.getContract("Box");
  const encodedFunctionCall = box.interface.encodeFunctionData(
    functionCall,
    args
  );
  console.log(`Proposing ${functionCall} on ${box.address} with ${args}`);
  console.log(`Proposal description: ${proposalDescription}`);
  const proposalTx = await governor.propose(
    [box.address],
    [0],
    [encodedFunctionCall],
    proposalDescription
  );
  const proposeReceipt = await proposalTx.wait();
  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_DELAY + 1);
  }

  const proposalId = proposeReceipt.events[0].args.proposalId;
  console.log(`Proposed with Proposal ID: ${proposalId}`);

  const proposals = JSON.parse(fs.readFileSync(proposalFile, "utf8"));
  if (!proposals[network.config.chainId!]) {
    proposals[network.config.chainId!.toString()] = [proposalId.toString()];
  } else {
    proposals[network.config.chainId!.toString()].push(proposalId.toString());
  }
  fs.writeFileSync(proposalFile, JSON.stringify(proposals, null, 2));

  const proposalState = await governor.state(proposalId);
  const proposalSnapshot = await governor.proposalSnapshot(proposalId);
  const proposalDeadline = await governor.proposalDeadline(proposalId);

  console.log(`Proposal state: ${ProposalState[proposalState]}`);
  console.log(`Proposal snapshot at Block: ${proposalSnapshot}`);
  console.log(`Proposal deadline at Block: ${proposalDeadline}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
propose([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
