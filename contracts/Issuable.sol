pragma solidity ^0.4.24;


import "./../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./../node_modules/openzeppelin-solidity/contracts/access/rbac/RBAC.sol";


/**
 * @title Issuable
 * @dev The Issuable contract defines the issuer role who can perform certain kind of actions
 * even if he is not the owner.
 * An issuer can transfer his role to a new address.
 */
contract Issuable is Ownable, RBAC {
  string public constant ROLE_ISSUER = "issuer";

  /**
   * @dev Throws if called by any account that's not a issuer.
   */
  modifier onlyIssuer() {
    require(isIssuer(msg.sender), 'Issuable: caller is not the issuer');
    _;
  }

  modifier onlyOwnerOrIssuer() {
    require(msg.sender == owner || isIssuer(msg.sender), 'Issuable: caller is not the issuer or the owner');
    _;
  }

  /**
   * @dev getter to determine if address has issuer role
   */
  function isIssuer(address _addr) public view returns (bool) {
    return hasRole(_addr, ROLE_ISSUER);
  }

  /**
   * @dev add a new issuer address
   * @param _operator address
   * @return true if the address was not an issuer, false if the address was already an issuer
   */
  function addIssuer(address _operator) public onlyOwner {
    addRole(_operator, ROLE_ISSUER);
  }

    /**
   * @dev remove an address from issuers
   * @param _operator address
   * @return true if the address has been removed from issuers, false if the address wasn't in the issuer list in the first place
   */
  function removeIssuer(address _operator) public onlyOwner {
    removeRole(_operator, ROLE_ISSUER);
  }

  /**
   * @dev Allows the current issuer to transfer his role to a newIssuer.
   * @param _newIssuer The address to transfer the issuer role to.
   */
  function transferIssuer(address _newIssuer) public onlyIssuer {
    require(_newIssuer != address(0));
    removeRole(msg.sender, ROLE_ISSUER);
    addRole(_newIssuer, ROLE_ISSUER);
  }

}
