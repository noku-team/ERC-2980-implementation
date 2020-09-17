pragma solidity ^0.4.24;

import "./Issuable.sol";

/**
 * @title Frozenlist
 * @dev The Frozenlist contract has a frozen list of addresses, and provides basic authorization control functions.
 * This simplifies the implementation of "user permissions".
 */
contract Frozenlist is Issuable {

  event FundsFrozen(address target);

  string public constant ROLE_FROZENLIST = "frozenlist";

  /**
   * @dev Throws if operator is frozen.
   * @param _operator address
   */
  modifier onlyIfNotFrozen(address _operator) {
    require(!hasRole(_operator, ROLE_FROZENLIST), "Account frozen");
    _;
  }

  /**
   * @dev add an address to the frozenlist
   * @param _operator address
   * @return true if the address was added to the frozenlist, false if the address was already in the frozenlist
   */
  function addAddressToFrozenlist(address _operator) public onlyIssuer {
    addRole(_operator, ROLE_FROZENLIST);
    emit FundsFrozen(_operator);
  }

  /**
   * @dev getter to determine if address is in frozenlist
   */
  function frozenlist(address _operator) public view returns (bool) {
    return hasRole(_operator, ROLE_FROZENLIST);
  }

  /**
   * @dev add addresses to the frozenlist
   * @param _operators addresses
   * @return true if at least one address was added to the frozenlist,
   * false if all addresses were already in the frozenlist
   */
  function addAddressesToFrozenlist(address[] _operators) public onlyIssuer {
    for (uint256 i = 0; i < _operators.length; i++) {
      addAddressToFrozenlist(_operators[i]);
    }
  }

  /**
   * @dev remove an address from the frozenlist
   * @param _operator address
   * @return true if the address was removed from the frozenlist,
   * false if the address wasn't in the frozenlist in the first place
   */
  function removeAddressFromFrozenlist(address _operator) public onlyIssuer {
    removeRole(_operator, ROLE_FROZENLIST);
  }

  /**
   * @dev remove addresses from the frozenlist
   * @param _operators addresses
   * @return true if at least one address was removed from the frozenlist,
   * false if all addresses weren't in the frozenlist in the first place
   */
  function removeAddressesFromFrozenlist(address[] _operators) public onlyIssuer {
    for (uint256 i = 0; i < _operators.length; i++) {
      removeAddressFromFrozenlist(_operators[i]);
    }
  }

}
