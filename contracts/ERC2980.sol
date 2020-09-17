pragma solidity ^0.4.23;

interface ERC2980 {
  
  /// @dev This emits when funds are reassigned
  event FundsReassigned(address from, address to, uint256 amount);

  /// @dev This emits when funds are revoked
  event FundsRevoked(address from, uint256 amount);

  /// @dev This emits when an address is frozen
  event FundsFrozen(address target);

  /**
  * @dev getter to determine if address is in frozenlist
  */
  function frozenlist(address _operator) external view returns (bool);

  /**
  * @dev getter to determine if address is in whitelist
  */
  function whitelist(address _operator) external view returns (bool);

}