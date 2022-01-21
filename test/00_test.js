//note: forked mainnet required to run the script
const { expect, assert } = require("chai");
const { saveObj, loadObj, clearObj } = require("./helpers/utils.js");

var dydx_constant = {
    SoloMargin: "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e",
    marketIdsBySymbol: {}
};
var deployed_contracts = [];
var signers;
var flashloan;

describe("dydx flashloan", function () {
    before(async function() {

        await migrate_contracts();
        //send weth, dai, usdc to the contract
        signers = await getSigners();
        await getMarketIdsBySymbol(false);
        flashloan = await load_contract("Flashloan", signers.deployer);
    });
    it("#flashLoan", async function(){
        await flashloan.flashLoan(
          dydx_constant.marketIdsBySymbol["DAI"].marketId,
          "1000000000000000000",
          "0x"
        );
    });
})

async function migrate_contracts() {
    const Flashloan = await ethers.getContractFactory("Flashloan");
    const flashloan = await Flashloan.deploy(dydx_constant.SoloMargin);

    deployed_contracts.push({
        name: "Flashloan",
        address: flashloan.address,
        artifact: "Flashloan.sol",
        contract: "Flashloan",
    });
    await saveObj("deployed_contracts", deployed_contracts);
    console.log("       > Info: contract deployed at ", flashloan.address);
}

async function getSigners() {
    const _signers = await ethers.getSigners();
    return {
        deployer : _signers[0]
    }
}

async function load_contract(name, signer) {
    deployed_contracts = await loadObj("deployed_contracts");
    const signers = await getSigners();
    return await ethers.getContractAt("Flashloan", deployed_contracts[0].address, signer);
}

async function getMarketIdsBySymbol(loadCached){
    if(loadCached) {
        dydx_constant = await loadObj("dydx_constant");
        return;
    }

    const abi = [
        "function getNumMarkets() public view returns (uint256)",
        "function getMarketTokenAddress(uint256 marketId) public view returns (address)"
    ];
    const soloMargin = await new ethers.Contract(dydx_constant.SoloMargin, abi, signers.deployer);
    const numberOfMarkets = parseInt((await soloMargin.getNumMarkets()).toString());

    for(var i = 0; i < numberOfMarkets; i++) {
        const address = await soloMargin.getMarketTokenAddress(i);
        if(address == "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359") continue;

        const symbol = await (async function(){
            const abi = [
                "function symbol() public view returns (string)"
            ]
            const erc20 = await new ethers.Contract(address, abi, signers.deployer);
            return await erc20.symbol();
        })();
        dydx_constant.marketIdsBySymbol[symbol] = {
            marketId: i,
            address: address
        };
    }

    await saveObj("dydx_constant", dydx_constant);
}
//to allow soloMargin takes back loan from the contract
async function approve() {
    const abi = [
        "function approve(address spender)",
    ];
    const soloMargin = await new ethers.Contract(dydx_constant.SoloMargin, abi, signers.deployer);
}
