pragma solidity ^0.4.23;

import "./../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./../node_modules/openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "./../node_modules/openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "./../node_modules/openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "./Whitelist.sol";
import "./Frozenlist.sol";
import "./Issuable.sol";
import "./ERC2980.sol";

contract BasicSecurityToken is ERC2980, Ownable, Issuable, DetailedERC20, MintableToken, BurnableToken, Frozenlist, Whitelist {

    constructor(string memory name, string memory symbol, bool enableWhitelist)
    Ownable()
    DetailedERC20(name, symbol, 0)
    Whitelist(enableWhitelist)
    public {
        
    }

    //Modifiers

    modifier onlyOwner() {
        require(msg.sender == owner, 'Ownable: caller is not the owner');
        _;
    }
    
    //Public functions (place the view and pure functions last)

    function mint(address account, uint256 amount) public onlyOwner onlyIfNotFrozen(account) onlyIfWhitelisted(account) returns (bool) {
        super.mint(account, amount);
        return true;
    }

    function burn(uint256 amount) public onlyIfNotFrozen(msg.sender) {
        super._burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public onlyIfNotFrozen(account) {
        super._burn(account, amount);
    }

    function transfer(address recipient, uint256 amount) public onlyIfNotFrozen(msg.sender) onlyIfNotFrozen(recipient) onlyIfWhitelisted(recipient) returns (bool) {
        require(super.transfer(recipient, amount), "Transfer failed");

        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public onlyIfNotFrozen(msg.sender) onlyIfNotFrozen(recipient) onlyIfWhitelisted(recipient) returns (bool) {
        require(super.transferFrom(sender, recipient, amount), "Transfer failed");

        return true;
    }

    function reassign(address from, address to) public onlyIssuer {
        uint256 fundsReassigned = balanceOf(from);
        _transfer(from, to, fundsReassigned);

        emit FundsReassigned(from, to, fundsReassigned);
    }

    function revoke(address from) public onlyIssuer {
        uint256 fundsRevoked = balanceOf(from);
        _transfer(from, msg.sender, fundsRevoked);

        emit FundsRevoked(from, fundsRevoked);
    }

    //Internal functions

    function _transfer(address _from, address _to, uint256 _value) public returns (bool) {
        require(_value <= balances[_from]);
        require(_to != address(0));

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    //Private functions

}