import { network } from "hardhat";

export async function moveTime(amount: number) {
    console.log(`Moving ${amount} seconds time forward`);
    await network.provider.send("evm_increaseTime", [amount]);
}
