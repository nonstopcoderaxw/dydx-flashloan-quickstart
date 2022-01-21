// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./dydx/dydxLibAndInterface.sol";
import "./openzeppelin/IERC20.sol";

import "hardhat/console.sol";

contract Flashloan is ICallee {

    ISoloMargin private soloMargin;

    constructor(ISoloMargin _soloMargin) {
        soloMargin = _soloMargin;
    }

    function flashLoan(
        uint256 marketId,
        uint256 amount,
        bytes memory data
    ) external {

        Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);
        operations[0] = getWithdrawAction(marketId, amount);
        operations[1] = getCallAction(data);
        operations[2] = getDepositAction(marketId, amount);

        Account.Info[] memory accountInfos = new Account.Info[](1);
        accountInfos[0] = Account.Info({owner: address(this), number: 1});

        soloMargin.operate(accountInfos, operations);
    }

    function callFunction(
        address sender,
        Account.Info memory accountInfo,
        bytes memory data
    ) external override {
        IERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2).approve(address(soloMargin), type(uint256).max);
        IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).approve(address(soloMargin), type(uint256).max);
        IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F).approve(address(soloMargin), type(uint256).max);

        console.log("here");

        //be sure to check if the loan can be repaid
        //remember the paid amount is loaned amount + 2
    }
}
