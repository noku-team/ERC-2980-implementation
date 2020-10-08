const Token = artifacts.require('BasicSecurityToken');

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const MAX_GAS = 6721975;

contract('Token', accounts => {
	const owner = accounts[0];
	const newOwner = accounts[1];
	const Alice = accounts[2];
	const Bob = accounts[3];
	const Francis = accounts[4]; //Frozen
	const Igor = accounts[5]; //Issuer
	const stranger = accounts[9];
	let tokenInstance;

	beforeEach(async function () {
		tokenInstance = await Token.new('ERC2980 Token', 'ST', false, { from: owner });
		await tokenInstance.addIssuer(Igor, {from: owner, gas: MAX_GAS});
	});


	describe("#Ownable", function() {

		it('has correct owner', async function () {
			const ownerResult = await tokenInstance.owner();
			assert.equal(ownerResult, owner);
		});

		it('has transferred ownership to the correct address', async function () {
			await tokenInstance.transferOwnership(newOwner, {from: owner, gas: MAX_GAS});
			const ownerResult = await tokenInstance.owner();
			assert.equal(ownerResult, newOwner);
		});

		it('should fail transfer ownership when called by not owner', async function () {
			await expectRevert(tokenInstance.transferOwnership(newOwner, {from: stranger, gas: MAX_GAS}), 'Ownable: caller is not the owner');
		});

		it('should fail transfer ownership to zero address', async function () {
			await expectRevert.unspecified(tokenInstance.transferOwnership(constants.ZERO_ADDRESS, {from: owner, gas: MAX_GAS}));
		});

		it('has has renounced ownership', async function () {
			await tokenInstance.renounceOwnership({from: owner, gas: MAX_GAS});
			const ownerResult = await tokenInstance.owner();
			assert.equal(ownerResult, constants.ZERO_ADDRESS);
		});

		it('should fail renounce ownership from not owner', async function () {
			await expectRevert(tokenInstance.renounceOwnership({from: stranger, gas: MAX_GAS}), 'Ownable: caller is not the owner');
		});

		it('has renounced ownership and is no more issuer (no whitelisted token)', async function () {
			let isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, true);

			await tokenInstance.renounceOwnership({from: owner, gas: MAX_GAS});
			
			isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, false);
		});

		it('has renounced ownership and is no more issuer & whitelisted (whitelisted token)', async function () {
			tokenInstance = await Token.new('ERC2980 Token', 'ST', true, { from: owner });
			let isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, true);
			let isWhitelisted = await tokenInstance.whitelist(owner);
			assert.equal(isWhitelisted, true);

			await tokenInstance.renounceOwnership({from: owner, gas: MAX_GAS});

			isWhitelisted = await tokenInstance.whitelist(owner);
			assert.equal(isWhitelisted, false);			
			isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, false);
		});

		it('has transferred ownership to the correct address and the new address is issuer (no whitelisted token)', async function () {
			let isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, true);
			isIssuer = await tokenInstance.isIssuer(newOwner);
			assert.equal(isIssuer, false);

			await tokenInstance.transferOwnership(newOwner, {from: owner, gas: MAX_GAS});
			
			isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, false);
			isIssuer = await tokenInstance.isIssuer(newOwner);
			assert.equal(isIssuer, true);
		});

		it('has transferred ownership to the correct address and the new address is issuer (whitelist token)', async function () {
			tokenInstance = await Token.new('ERC2980 Token', 'ST', true, { from: owner });
			let isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, true);
			isIssuer = await tokenInstance.isIssuer(newOwner);
			assert.equal(isIssuer, false);

			let isWhitelisted = await tokenInstance.whitelist(owner);
			assert.equal(isWhitelisted, true);
			isWhitelisted = await tokenInstance.whitelist(newOwner);
			assert.equal(isWhitelisted, false);

			await tokenInstance.transferOwnership(newOwner, {from: owner, gas: MAX_GAS});

			isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, false);
			isIssuer = await tokenInstance.isIssuer(newOwner);
			assert.equal(isIssuer, true);

			isWhitelisted = await tokenInstance.whitelist(owner);
			assert.equal(isWhitelisted, false);
			isWhitelisted = await tokenInstance.whitelist(newOwner);
			assert.equal(isWhitelisted, true);
		});

	});

	describe("#addAddressToFrozenlist()", function() {

		beforeEach(async function () {
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.mint(Francis, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.addAddressToFrozenlist(Francis, { from: Igor, gas: MAX_GAS });
		});

		it('is frozen', async function () {
			let isFrozen = await tokenInstance.frozenlist(Francis);
			assert.equal(isFrozen, true);
		});

		it('is not frozen', async function () {
			let isFrozen = await tokenInstance.frozenlist(Alice);
			assert.equal(isFrozen, false);
		});

		it('owner is not frozen by default', async function () {
			let isFrozen = await tokenInstance.frozenlist(owner);
			assert.equal(isFrozen, false);
		});

		it('should fail sender frozen account transfer', async function () {
			await expectRevert(tokenInstance.transfer(Alice, 1, {from: Francis, gas: MAX_GAS}), 'Account frozen');
		});

		it('owner is issuer by default', async function () {
			let isIssuer = await tokenInstance.isIssuer(owner);
			assert.equal(isIssuer, true);
		});

		it('should fail unfreeze from non-issuer (stranger)', async function () {
			await expectRevert(tokenInstance.removeAddressFromFrozenlist(Alice, {from: stranger, gas: MAX_GAS}), 'Issuable: caller is not the issuer');
		});

		it('should fail recepient frozen account transfer', async function () {
			await expectRevert(tokenInstance.transfer(Francis, 1, {from: Alice, gas: MAX_GAS}), 'Account frozen');
		});

		it('unfreezed can send', async function () {
			await tokenInstance.removeAddressFromFrozenlist(Francis, { from: Igor, gas: MAX_GAS });
			await tokenInstance.transfer(Alice, 1, {from: Francis, gas: MAX_GAS});
			let balance = await tokenInstance.balanceOf(Alice);
			assert.equal(balance, 11);
		});

		it('should fail mint frozen account', async function () {
			await expectRevert(tokenInstance.mint(Francis, 1, {from: owner, gas: MAX_GAS}), 'Account frozen');
		});

		it('should fail burn frozen account', async function () {
			await expectRevert(tokenInstance.burn(1, {from: Francis, gas: MAX_GAS}), 'Account frozen');
		});

	});

	describe("#Mint()", function() {

		beforeEach(async function () {
			await tokenInstance.addAddressToFrozenlist(Francis, { from: Igor, gas: MAX_GAS });
		});

		it('should fail minting from not owner', async function () {
			await expectRevert(tokenInstance.mint(Alice, 10, {from: stranger, gas: MAX_GAS}), 'Ownable: caller is not the owner');
		});

		it('has correct balance after minting', async function () {
			let balance = await tokenInstance.balanceOf(Alice);
			assert.equal(balance, 0);
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});
			balance = await tokenInstance.balanceOf(Alice);
			assert.equal(balance, 10);
		});

		it('has correct total supply after minting', async function () {
			let totalSupply = await tokenInstance.totalSupply();
			assert.equal(totalSupply, 0);
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});
			totalSupply = await tokenInstance.totalSupply();
			assert.equal(totalSupply, 10);
		});

		it('should fail minting to a frozen account', async function () {
			await expectRevert(tokenInstance.mint(Francis, 10, {from: owner, gas: MAX_GAS}), 'Account frozen');
		});

	});

	describe("#Reassign()", function() {

		beforeEach(async function () {
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.mint(Bob, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.mint(Francis, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.addAddressToFrozenlist(Francis, { from: Igor, gas: MAX_GAS });
		});

		it('should fail reassign from not issuer (stranger)', async function () {
			await expectRevert(tokenInstance.reassign(Alice, Bob, {from: stranger, gas: MAX_GAS}), 'Issuable: caller is not the issuer');
		});

		it('has reassigned tokens', async function () {
			let reassign = await tokenInstance.reassign(Alice, Bob, {from: Igor, gas: MAX_GAS});
			expectEvent(reassign, 'FundsReassigned', {
				from: Alice,
				to: Bob,
				amount: "10"
			});
			let balanceAlice = await tokenInstance.balanceOf(Alice);
			assert.equal(balanceAlice, 0);
			let balanceBob = await tokenInstance.balanceOf(Bob);
			assert.equal(balanceBob, 20);
		});

		it('has reassigned tokens from a 0 tokens holder', async function () {
			let reassign = await tokenInstance.reassign(stranger, Bob, {from: Igor, gas: MAX_GAS});
			expectEvent(reassign, 'FundsReassigned', {
				from: stranger,
				to: Bob,
				amount: "0"
			});
			let balanceStranger = await tokenInstance.balanceOf(stranger);
			assert.equal(balanceStranger, 0);
			let balanceBob = await tokenInstance.balanceOf(Bob);
			assert.equal(balanceBob, 10);
		});

		it('has reassigned from frozen account', async function () {
			let reassign = await tokenInstance.reassign(Francis, Bob, {from: Igor, gas: MAX_GAS});
			expectEvent(reassign, 'FundsReassigned', {
				from: Francis,
				to: Bob,
				amount: "10"
			});
			let balanceFrancis = await tokenInstance.balanceOf(Francis);
			assert.equal(balanceFrancis, 0);
			let balanceBob = await tokenInstance.balanceOf(Bob);
			assert.equal(balanceBob, 20);
		});

	});

	describe("#Revoke()", function() {

		beforeEach(async function () {
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.mint(Francis, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.addAddressToFrozenlist(Francis, { from: Igor, gas: MAX_GAS });
		});

		it('should fail revoke from not issuer (stranger)', async function () {
			await expectRevert(tokenInstance.revoke(Alice, {from: stranger, gas: MAX_GAS}), 'Issuable: caller is not the issuer');
		});

		it('has revoked tokens', async function () {
			let revoke = await tokenInstance.revoke(Alice, {from: Igor, gas: MAX_GAS});
			expectEvent(revoke, 'FundsRevoked', {
				from: Alice,
				amount: "10"
			});
			let balanceAlice = await tokenInstance.balanceOf(Alice);
			assert.equal(balanceAlice, 0);
			let balanceIgor = await tokenInstance.balanceOf(Igor);
			assert.equal(balanceIgor, 10);
		});

		it('has revoked from frozen account', async function () {
			let revoke = await tokenInstance.revoke(Francis, {from: Igor, gas: MAX_GAS});
			expectEvent(revoke, 'FundsRevoked', {
				from: Francis,
				amount: "10"
			});
			let balanceFrancis = await tokenInstance.balanceOf(Francis);
			assert.equal(balanceFrancis, 0);
			let balanceIgor = await tokenInstance.balanceOf(Igor);
			assert.equal(balanceIgor, 10);
		});

		it('has revoked tokens from a 0 tokens holder', async function () {
			let revoke = await tokenInstance.revoke(stranger, {from: Igor, gas: MAX_GAS});
			expectEvent(revoke, 'FundsRevoked', {
				from: stranger,
				amount: "0"
			});
			let balanceStranger = await tokenInstance.balanceOf(stranger);
			assert.equal(balanceStranger, 0);
		});

	});

	describe("#Burn()", function() {

		beforeEach(async function () {
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.mint(Francis, 10, {from: owner, gas: MAX_GAS});
			await tokenInstance.addAddressToFrozenlist(Francis, { from: Igor, gas: MAX_GAS });
		});

		it('has burned tokens', async function () {
			let balanceAlice = await tokenInstance.balanceOf(Alice);
			assert.equal(balanceAlice, 10);
			await tokenInstance.burn(6, {from: Alice, gas: MAX_GAS});
			balanceAlice = await tokenInstance.balanceOf(Alice);
			assert.equal(balanceAlice, 4);
		});

		it('should fail burn from frozen account', async function () {
			await expectRevert(tokenInstance.burn(5, {from: Francis, gas: MAX_GAS}), 'Account frozen');
		});

	});


	describe("#Whitelisting", function() {

		beforeEach(async function () {
			await tokenInstance.enableWhitelist({from: owner, gas: MAX_GAS});
		});

		it('has disabled whitelist', async function () {
			let whitelistEnabled = await tokenInstance.whitelistEnabled();
			assert.equal(whitelistEnabled, true);			
			await tokenInstance.disableWhitelist({from: owner, gas: MAX_GAS});
			whitelistEnabled = await tokenInstance.whitelistEnabled();
			assert.equal(whitelistEnabled, false);			
		});

		it('owner is not whitelisted by default if whitelist is not enabled', async function () {
			let isWhitelisted = await tokenInstance.whitelist(owner);
			assert.equal(isWhitelisted, false);
		});


		it('owner is whitelisted by default if whitelist enabled', async function () {
			tokenInstance = await Token.new('ERC2980 Token', 'ST', true, { from: owner });
			let isWhitelisted = await tokenInstance.whitelist(owner);
			assert.equal(isWhitelisted, true);
		});

		it('has minted tokens to whitelisted account', async function () {
			let balanceAlice = await tokenInstance.balanceOf(Alice);
			assert.equal(balanceAlice, 0);			
			await tokenInstance.addAddressToWhitelist(Alice, {from: Igor, gas: MAX_GAS});
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});
			balanceAlice = await tokenInstance.balanceOf(Alice);
			assert.equal(balanceAlice, 10);
		});

		it('has transferred tokens to whitelisted account', async function () {

			await tokenInstance.addAddressToWhitelist(Alice, {from: Igor, gas: MAX_GAS});
			await tokenInstance.addAddressToWhitelist(Bob, {from: Igor, gas: MAX_GAS});
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});

			await tokenInstance.transfer(Bob, 1, {from: Alice, gas: MAX_GAS});
			let balanceAlice = await tokenInstance.balanceOf(Alice);
			assert.equal(balanceAlice, 9);
			let balanceBob = await tokenInstance.balanceOf(Bob);
			assert.equal(balanceBob, 1);
		});

		it('should fail mint to not whitelisted account', async function () {
			await expectRevert.unspecified(tokenInstance.mint(Alice, 10, {from: Igor, gas: MAX_GAS}));
		});

		it('should fail remove whitelist from non-issuer (stranger)', async function () {
			await expectRevert(tokenInstance.removeAddressFromWhitelist(Alice, {from: stranger, gas: MAX_GAS}), 'Issuable: caller is not the issuer');
		});

		it('should fail trasfer to not whitelisted account', async function () {
			await tokenInstance.addAddressToWhitelist(Alice, {from: Igor, gas: MAX_GAS});
			await tokenInstance.mint(Alice, 10, {from: owner, gas: MAX_GAS});
			await expectRevert.unspecified(tokenInstance.transfer(Bob, 1, {from: Alice, gas: MAX_GAS}));
		});

	});

	describe("#Issuable", function() {

		it('is issuer', async function () {
			let isIssuer = await tokenInstance.isIssuer(Igor);
			assert.equal(isIssuer, true);
		});

		it('is not issuer', async function () {
			let isIssuer = await tokenInstance.isIssuer(stranger);
			assert.equal(isIssuer, false);
		});

		it('has added issuer', async function () {
			let isIssuer = await tokenInstance.isIssuer(Alice);
			assert.equal(isIssuer, false);
			await tokenInstance.addIssuer(Alice, {from: owner, gas: MAX_GAS});
			isIssuer = await tokenInstance.isIssuer(Alice);
			assert.equal(isIssuer, true);
		});


		it('has removed issuer', async function () {
			await tokenInstance.removeIssuer(Igor, {from: owner, gas: MAX_GAS});
			let isIssuer = await tokenInstance.isIssuer(Igor);
			assert.equal(isIssuer, false);
		});

		it('has transferred issuership', async function () {
			await tokenInstance.transferIssuer(Alice, {from: Igor, gas: MAX_GAS});
			let isIssuerAlice = await tokenInstance.isIssuer(Alice);
			assert.equal(isIssuerAlice, true);
			let isIssuerIgor = await tokenInstance.isIssuer(Igor);
			assert.equal(isIssuerIgor, false);
		});

	});

});