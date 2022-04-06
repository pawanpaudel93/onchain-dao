import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deplpyBox: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("Deploying box...");
  const box = await deploy("Box", {
    from: deployer,
    log: true,
    args: [],
  });
  log("Box deployed at", box.address);
  const timeLock = await hre.ethers.getContract("TimeLock", deployer);
  const boxContract = await hre.ethers.getContract("Box", deployer);
  const transferOwnerTx = await boxContract.transferOwnership(timeLock.address);
  await transferOwnerTx.wait(1);
  log("Box owner set to TimeLock");
};

export default deplpyBox;
