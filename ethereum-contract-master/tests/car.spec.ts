import path from 'path';
import assert from 'assert';
import ganache from 'ganache-cli';
import Web3 from 'web3';

// 1. get the bytecodeå
const contractPath = path.resolve(__dirname, '../compiled/Car.json');
const { interface, bytecode } = require(contractPath);

// 2. config provider
const web3 = new Web3(ganache.provider());

let accounts;
let contract;
const initialBrand = 'AUDI';

describe('Car Contract', () => {
  // 3. Each time you run a single test, you need to deploy a brand new contract instance to serve as isolation
  beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    console.log('Deploy contract account：', accounts[0]);

    contract = await new web3.eth.Contract(JSON.parse(interface))
      .deploy({ data: bytecode, arguments: [initialBrand] })
      .send({ from: accounts[0], gas: '1000000' });
    console.log('Success deploy contract：', contract.options.address);
  });

  // 4. contract's unit test
  it('deploy a contract', () => {
    assert.ok(contract.options.address);
  });

  it('has a default brand', async () => {
    const brand = await contract.methods.brand().call();
    assert.equal(brand, initialBrand);
  });

  it('can change the brand', async () => {
    const newBrand = 'BWM';
    await contract.methods.setBrand(newBrand).send({ from: accounts[0] });
    const brand = await contract.methods.brand().call();
    assert.equal(brand, newBrand);
  });
});
