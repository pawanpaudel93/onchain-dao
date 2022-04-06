import { ethers, network } from "hardhat";
import * as fs from "fs";
import {
  NEW_STORE_VALUE,
  FUNC,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  proposalFile,
  ProposalState,
  MIN_DELAY,
} from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";
import { moveTime } from "../utils/move-time";

export async function queueAndExecute(
  args: any[],
  functionCall: string,
  proposalDescription: string
) {
  const proposals = JSON.parse(fs.readFileSync(proposalFile, "utf8"));
  const proposalId =
    proposals[network.config.chainId!][
    proposals[network.config.chainId!].length - 1
    ];
  const governor = await ethers.getContract("GovernorContract");
  const box = await ethers.getContract("Box");
  const encodedFunctionCall = box.interface.encodeFunctionData(
    functionCall,
    args
  );
  // keccak256(bytes(description)
  const descriptionHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(proposalDescription)
  );
  console.log(`Queuing ${functionCall} on ${box.address} with ${args}`);
  const queueTx = await governor.queue(
    [box.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await queueTx.wait(1);
  if (developmentChains.includes(network.name)) {
    await moveTime(MIN_DELAY + 1);
    await moveBlocks(1);
  }
  let proposalState = await governor.state(proposalId);
  console.log(`Proposal state: ${ProposalState[proposalState]}`);

  console.log(`Executing ${functionCall} on ${box.address} with ${args}`);
  const executeTx = await governor.execute(
    [box.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await executeTx.wait(1);
  proposalState = await governor.state(proposalId);
  console.log(`Proposal state: ${ProposalState[proposalState]}`);

  const boxNewValue = await box.retrieve();
  console.log(`New value of Box: ${boxNewValue.toString()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
queueAndExecute([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION).catch(
  (error) => {
    console.error(error);
    process.exitCode = 1;
  }
);
