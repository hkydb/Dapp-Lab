import Web3 from 'web3';
import ABI from 'human-standard-token-abi';  // Because all ERC20 tokens follow the same interface specification, here the ABI can use the same

const contractAddress = '0xa974c709cfb4566686553a20790685a47aceaa33'; // MIXIN contracted address, found by searching on Etherscan
const accountAddress = '0x464fc4a06af689186154a4c0d4b062474f040a8a'; // user's wallet address
const infuraUrl = 'https://mainnet.infura.io/145318c65eb443c2bf7c0ec83591e49d'; // pay attention to the network, here is the mainnet

const web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));

(async () => {
  try {
    const token = await new web3.eth.Contract(ABI, contractAddress);

    const [name, symbol, totalSupply, balanceOf] = await Promise.all([
      token.methods.name().call(),
      token.methods.symbol().call(),
      token.methods.totalSupply().call(),
      token.methods.balanceOf(accountAddress).call(),
    ]);

    console.log({
      name,
      symbol,
      totalSupply: `${web3.utils.fromWei(totalSupply.toString())} ${symbol}`,
      balanceOf: `${web3.utils.fromWei(balanceOf.toString())} ${symbol}`,
    });
  } catch (err) {
    console.error(err);
  }
})();
