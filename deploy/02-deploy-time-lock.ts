import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
    MIN_DELAY,
    networkConfig,
    developmentChains,
} from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const deployTimeLock: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    log("Deploying TimeLock....");
    const timeLock = await deploy("TimeLock", {
        from: deployer,
        args: [MIN_DELAY, [], []],
        log: true,
        waitConfirmations:
            networkConfig[hre.network.name].blockConfirmations || 1,
    });
    log(`TimeLock deployed at ${timeLock.address}`);
    if (
        !developmentChains.includes(hre.network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(timeLock.address, [MIN_DELAY, [], []]);
    }
};

export default deployTimeLock;
deployTimeLock.tags = ["all", "timelock"];
