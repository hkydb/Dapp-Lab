import fs from 'fs-extra';
import path from 'path';
import config from 'config';
import Web3 from 'web3';
import HDWalletProvider from 'truffle-hdwallet-provider';
import { ethers } from "hardhat";

// 1. 拿到 bytecode
const contractPath = path.resolve(__dirname, '../compiled/ProjectList.json');
const { interface, bytecode } = require(contractPath);

// 2. 配置 provider
const provider = new HDWalletProvider(
  config.get('hdwallet'),
  config.get('infuraUrl'),
);

// 3. 初始化 web3 实例
const web3 = new Web3(provider);

(async () => {
  // 4. 获取钱包里面的账户
  const accounts = await web3.eth.getAccounts();
  console.log('合约部署账户:', accounts[0]);

  // 5. 创建合约实例并且部署
  console.time('合约部署耗时');
  const result = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '5000000' });
  console.timeEnd('合约部署耗时');

  const contractAddress = result.options.address;

  console.log('合约部署成功:', contractAddress);
  console.log('合约查看地址:', `https://rinkeby.etherscan.io/address/${contractAddress}`);

  // 6. 合约地址写入文件系统
  const addressFile = path.resolve(__dirname, '../address.json');
  fs.writeFileSync(addressFile, JSON.stringify(contractAddress));
  console.log('地址写入成功:', addressFile);

  process.exit();
})();


// another deploy merging

async function main() {

  const ArtistNFT = await ethers.getContractFactory("ArtistNFT");
  const nft = await ArtistNFT.deploy();

  await nft.deployed();

  console.log(
    `ArtistNFT   deployed to ${nft.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
