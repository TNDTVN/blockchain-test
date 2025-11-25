import { viem } from "hardhat";

async function main() {
  const walletClient = await viem.getWalletClient();
  console.log("Deploying contracts with account:", walletClient.account.address);

  const address = await viem.deployContract("ProductRegistry", []);
  console.log("ProductRegistry deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });