import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import {
    GovernorContract,
    GovernanceToken,
    TimeLock,
    Box,
} from "../../typechain";
import {
    VOTING_DELAY,
    NEW_STORE_VALUE,
    FUNC,
    PROPOSAL_DESCRIPTION,
    ProposalState,
    VOTING_PERIOD,
    MIN_DELAY,
} from "../../helper-hardhat-config";
import { moveBlocks } from "../../utils/move-blocks";
import { moveTime } from "../../utils/move-time";

describe("Governor Flow", async () => {
    let governor: GovernorContract;
    let governanceToken: GovernanceToken;
    let timeLock: TimeLock;
    let box: Box;
    const voteWay = 1;
    const reason = "I like it";

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        governor = await ethers.getContract("GovernorContract");
        governanceToken = await ethers.getContract("GovernanceToken");
        timeLock = await ethers.getContract("TimeLock");
        box = await ethers.getContract("Box");
    });

    it("Box value can only be changed through governance", async () => {
        await expect(box.store(NEW_STORE_VALUE)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    it("Box value can be changed through proposal, votes, waits, queues and execution", async () => {
        const encodedFunctionCall = box.interface.encodeFunctionData(FUNC, [
            NEW_STORE_VALUE,
        ]);
        // Propose
        const proposalTx = await governor.propose(
            [box.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
        );
        const proposeReceipt = await proposalTx.wait(1);
        const proposalId = proposeReceipt.events![0].args!.proposalId;

        expect(await governor.state(proposalId)).to.equal(
            ProposalState.Pending
        );

        await moveBlocks(VOTING_DELAY + 1);

        // Vote
        expect(await governor.state(proposalId)).to.equal(ProposalState.Active);
        const voteTx = await governor.castVoteWithReason(
            proposalId,
            voteWay,
            reason
        );
        await voteTx.wait(1);
        await moveBlocks(VOTING_PERIOD + 1);

        // Queue and Execute
        expect(await governor.state(proposalId)).to.equal(
            ProposalState.Succeeded
        );

        const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION);
        const queueTx = await governor.queue(
            [box.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
        );
        await queueTx.wait(1);
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);

        expect(await governor.state(proposalId)).to.equal(ProposalState.Queued);

        const executeTx = await governor.execute(
            [box.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
        );
        await executeTx.wait(1);
        expect(await governor.state(proposalId)).to.equal(
            ProposalState.Executed
        );
        expect(await box.retrieve()).to.equal(NEW_STORE_VALUE);
    });
});
