import assert from 'assert';
import path from 'path';
import ganache from 'ganache-cli';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

const web3 = new Web3(ganache.provider());
const ProjectList = require(path.resolve(__dirname, '../compiled/ProjectList.json'));
const Project = require(path.resolve(__dirname, '../compiled/Project.json'));

let accounts;
let projectList;
let project;

describe('Project Contract', () => {
  // 1. Each time you run a single test, you need to deploy a brand new contract instance to serve as isolation
  beforeEach(async () => {
    // 1.1 Get the account for the ganache local test network
    accounts = await web3.eth.getAccounts();

    // 1.2 deploy ProjectList contract
    projectList = await new web3.eth.Contract(JSON.parse(ProjectList.interface))
      .deploy({ data: ProjectList.bytecode })
      .send({ from: accounts[0], gas: '5000000' });

    // 1.3 invoking ProjectList of createProject method
    await projectList.methods.createProject('Ethereum DApp Tutorial', 100, 10000, 1000000).send({
      from: accounts[0],
      gas: '5000000',
    });

    // 1.4 Get the address of the Project instance you just created
    const [address] = await projectList.methods.getProjects().call();

    // 1.5 Generate available Project contract objects
    project = await new web3.eth.Contract(JSON.parse(Project.interface), address);
  });

  it('should deploy ProjectList and Project', async () => {
    assert.ok(projectList.options.address);
    assert.ok(project.options.address);
  });

  it('should save correct project properties', async () => {
    const owner = await project.methods.owner().call();
    const description = await project.methods.description().call();
    const minInvest = await project.methods.minInvest().call();
    const maxInvest = await project.methods.maxInvest().call();
    const goal = await project.methods.goal().call();

    assert.equal(owner, accounts[0]);
    assert.equal(description, 'Ethereum DApp Tutorial');
    assert.equal(minInvest, 100);
    assert.equal(maxInvest, 10000);
    assert.equal(goal, 1000000);
  });

  it('should allow investor to contribute', async () => {
    const investor = accounts[1];
    await project.methods.contribute().send({
      from: investor,
      value: '200',
    });

    const amount = await project.methods.investors(investor).call();
    assert.ok(amount == '200');
  });

  it('should require minInvest', async () => {
    try {
      const investor = accounts[1];
      await project.methods.contribute().send({
        from: investor,
        value: '10',
      });
      assert.ok(false);
    } catch (err) {
      assert.ok(err);
    }
  });

  it('should require maxInvest', async () => {
    try {
      const investor = accounts[1];
      await project.methods.contribute().send({
        from: investor,
        value: '100000',
      });
      assert.ok(false);
    } catch (err) {
      assert.ok(err);
    }
  });

  it('should allow owner to create payment', async () => {
    const owner = accounts[0];
    const receiver = accounts[2];

    await project.methods.createPayment('Rent Office', '500', receiver).send({
      from: owner,
      gas: '1000000',
    });

    const payment = await project.methods.payments(0).call();
    assert.equal(payment.description, 'Rent Office');
    assert.equal(payment.amount, '500');
    assert.equal(payment.receiver, receiver);
    assert.equal(payment.completed, false);
    assert.equal(payment.voterCount, 0);
  });

  it('allows investor to approve payments', async () => {
    // Project owner, investor, payee accounts
    const owner = accounts[0];
    const investor = accounts[1];
    const receiver = accounts[2];

    // Balance before receipts
    const oldBalance = new BigNumber(await web3.eth.getBalance(receiver));

    // investment project
    await project.methods.contribute().send({
      from: investor,
      value: '5000',
    });

    // Requests for expenditure of funds
    await project.methods.createPayment('Rent Office', 2000, receiver).send({
      from: owner,
      gas: '1000000',
    });

    // voting
    await project.methods.approvePayment(0).send({
      from: investor,
      gas: '1000000',
    });

    // Funds transfer
    await project.methods.doPayment(0).send({
      from: owner,
      gas: '1000000',
    });

    // detecting payment's status
    const payment = await project.methods.payments(0).call();
    assert.equal(payment.completed, true);
    assert.equal(payment.voterCount, 1);

    // Balance after collections
    const newBalance = new BigNumber(await web3.eth.getBalance(receiver));
    const balanceDiff = newBalance.minus(oldBalance);
    console.log({ oldBalance, newBalance, balanceDiff });

    // Ensure accurate balance changes
    assert.equal(balanceDiff, 2000);
  });
});
