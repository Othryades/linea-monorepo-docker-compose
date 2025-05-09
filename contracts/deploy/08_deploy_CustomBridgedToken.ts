import { ethers, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployUpgradableFromFactory } from "../scripts/hardhat/utils";
import { tryVerifyContract, getDeployedContractAddress, tryStoreAddress, getRequiredEnvVar } from "../common/helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;

  const contractName = "CustomBridgedToken";
  const existingContractAddress = await getDeployedContractAddress(contractName, deployments);

  const CustomTokenBridge_name = getRequiredEnvVar("CUSTOMTOKENBRIDGE_NAME");
  const CustomTokenBridge_symbol = getRequiredEnvVar("CUSTOMTOKENBRIDGE_SYMBOL");
  const CustomTokenBridge_decimals = getRequiredEnvVar("CUSTOMTOKENBRIDGE_DECIMALS");
  const CustomTokenBridge_bridge_address = getRequiredEnvVar("CUSTOMTOKENBRIDGE_BRIDGE_ADDRESS");

  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(`Current network's chainId is ${chainId}`);

  if (existingContractAddress === undefined) {
    console.log(`Deploying initial version, NB: the address will be saved if env SAVE_ADDRESS=true.`);
  } else {
    console.log(`Deploying new version, NB: ${existingContractAddress} will be overwritten if env SAVE_ADDRESS=true.`);
  }

  // Deploy proxy for custom bridged token
  const customBridgedToken = await deployUpgradableFromFactory(
    contractName,
    [CustomTokenBridge_name, CustomTokenBridge_symbol, CustomTokenBridge_decimals, CustomTokenBridge_bridge_address],
    {
      initializer: "initializeV2(string,string,uint8,address)",
      unsafeAllow: ["constructor"],
    },
  );

  const txReceipt = await customBridgedToken.deploymentTransaction()?.wait();
  if (!txReceipt) {
    throw "Deployment transaction not found.";
  }

  const contractAddress = await customBridgedToken.getAddress();

  console.log(
    `contract=${contractName} deployed: address=${contractAddress} blockNumber=${txReceipt.blockNumber} chainId=${chainId}`,
  );

  await tryStoreAddress(network.name, contractName, contractAddress, txReceipt.hash);
  await tryVerifyContract(contractAddress);
};

export default func;
func.tags = ["CustomBridgedToken"];
