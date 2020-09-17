pragma solidity ^0.4.23;

interface ERCX {
  
  /// @dev This emits when funds are reassigned
  event FundsReassigned(address from, address to, uint256 amount);

  /// @dev This emits when funds are revoked
  event FundsRevoked(address from, uint256 amount);

  /// @dev This emits when an address is frozen
  event FundsFrozen(address target);

  /**
  * @dev Transfer tokens from a specified address to another one
  * this operation can be performmed only by an Issuer.
  * @param _from The address from which the tokens are withdrawn
  * @param _to The address that receives the tokens
  * @return true if the tokens are transferred
  */
  function reassign(address _from, address _to) external;

  /**
  * @dev Transfer tokens from a specified address to the contract owner (issuer)
  * this operation can be performmed only by an Issuer.
  * @param _from The address from which the tokens are withdrawn
  * @return true if the tokens are transferred
  */
  function revoke(address _from) external;

  /**
  * @dev getter to determine if address is in frozenlist
  */
  function frozenlist(address _operator) external view returns (bool);

  /**
  * @dev add an address to the frozenlist
  * this operation can be performmed only by an Issuer.
  * @param _operator address
  * @return true if the address was added to the frozenlist, false if the address was already in the frozenlist
  */
  function addAddressToFrozenlist(address _operator) external;

  /**
  * @dev remove an address from the frozenlist
  * this operation can be performmed only by an Issuer.
  * @param _operator address
  * @return true if the address was removed from the frozenlist,
  * false if the address wasn't in the frozenlist in the first place
  */
  function removeAddressFromFrozenlist(address _operator) external;

  /**
  * @dev getter to determine if address is in whitelist
  */
  function whitelist(address _operator) external view returns (bool);

  /**
  * @dev add an address to the whitelist
  * this operation can be performmed only by an Issuer.
  * @param _operator address
  * @return true if the address was added to the whitelist, false if the address was already in the whitelist
  */
  function addAddressToWhitelist(address _operator) external;

  /**
  * @dev remove an address from the whitelist
  * this operation can be performmed only by an Issuer.
  * @param _operator address
  * @return true if the address was removed from the whitelist,
  * false if the address wasn't in the whitelist in the first place
  */
  function removeAddressFromWhitelist(address _operator) external;

  /**
  * @dev add a new issuer address
  * this operation can be performmed only by the contract Owner.
  * @param _operator address
  * @return true if the address was not an issuer, false if the address was already an issuer
  */
  function addIssuer(address _operator) external;

  /**
  * @dev remove an address from issuers
  * this operation can be performmed only by the contract Owner.
  * @param _operator address
  * @return true if the address has been removed from issuers,
  * false if the address wasn't in the issuer list in the first place
  */
  function removeIssuer(address _operator) external;

  /**
  * @dev Allows the current issuer to transfer his role to a newIssuer.
  * this operation can be performmed only by an Issuer.
  * @param _newIssuer The address to transfer the issuer role to.
  */
  function transferIssuer(address _newIssuer) external;

}