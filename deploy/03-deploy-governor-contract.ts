import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { verify } from "../utils/verify";
import {
    VOTING_DELAY,
    VOTING_PERIOD,
    QUORUM_PERCENTAGE,
    developmentChains,
    networkConfig,
} from "../helper-hardhat-config";

const deployGovernorContract: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const governanceToken = await get("GovernanceToken");
    const timeLock = await get("TimeLock");
    log("Deploying GovernorContract....");
    const args = [
        governanceToken.address,
        timeLock.address,
        VOTING_DELAY,
        VOTING_PERIOD,
        QUORUM_PERCENTAGE,
    ];
    const governorContract = await deploy("GovernorContract", {
        from: deployer,
        args,
        log: true,
        waitConfirmations:
            networkConfig[hre.network.name].blockConfirmations || 1,
    });
    log(`TimeLock deployed at ${governorContract.address}`);
    if (
        !developmentChains.includes(hre.network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(governorContract.address, args);
    }
};

export default deployGovernorContract;
deployGovernorContract.tags = ["all", "governor"];
