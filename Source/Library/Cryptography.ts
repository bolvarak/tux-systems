///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
'use strict'; /// Strict Syntax //////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import Configuration from '../Common/Configuration'; /// Configuration Settings //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import Utility from '../Common/Utility'; /// Utility Module //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import * as crypto from 'crypto'; /// Cryptography Module ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export default class LibraryCryptography { /// Cryptography Library Module Definition ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Public Static Methods ////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method decrypts a hash using a static secret
	 * @name LibraryCryptography.staticKeyDecrypt()
	 * @param {string} $hash
	 * @public
	 * @returns {string}
	 * @static
	 * @throws {Error}
	 * @uses LibraryCryptography.secret()
	 */
	public static staticKeyDecrypt($hash: string): string {
		// Grab the encryption data
		const $matches: RegExpMatchArray | null = $hash.match(/^{(.*?)}\$([0-9]+)\$([0-9]+)\$(.*?)$/i);
		// Make sure we have matches
		if (Utility.lodash.isNull($matches) || ($matches.length !== 5)) {
			// We're done
			throw new Error('Invalid Hash');
		}
		// Localize the algorithm
		const $algorithm: string = $matches[1].toLowerCase();
		// Localize the IV length
		const $ivLength: number = parseInt($matches[2], 10);
		// Localize our passes
		const $passes: number = parseInt($matches[3], 10);
		// Define our text
		let $text: string = $matches[4];
		// Iterate to the passes
		for (let $pass = 0; $pass < $passes; ++$pass) {
			// Localize our initialization vector
			const $initializationVector: Buffer = Buffer.from($text.substr(0, ($ivLength * 2)), 'hex');
			// Define our decryption
			const $decipher: crypto.Decipher = crypto.createDecipheriv($algorithm, this.secret(), $initializationVector);
			// Localize the cipher text
			const $cipherText: string = Buffer.from($text.substr($ivLength * 2)).toString();
			// Define our decrypted data
			const $textPartial: Buffer = Buffer.concat([
				$decipher.update($cipherText, 'base64'),
				$decipher.final()
			]);
			// Reset the text
			$text = $textPartial.toString();
		}
		// We're done, send the response
		return $text;
	}

	/**
	 * This method encrypts textual data using a static secret
	 * @name LibraryCryptography.staticKeyEncrypt()
	 * @param {string} $data
	 * @param {number, optional} $passes
	 * @public
	 * @returns {string}
	 * @static
	 * @uses LibraryCryptography.passes()
	 * @uses LibraryCryptography.algorithm()
	 * @uses LibraryCryptography.secret()
	 */
	public static staticKeyEncrypt($data: string, $passes?: number): string {
		// Define our hash
		let $hash: string = $data;
		// Check for a provided number of passes
		if (!$passes) {
			// Reset the passes
			$passes = this.passes();
		}
		// Iterate to the passes
		for (let $pass = 0; $pass < $passes; ++$pass) {
			// Define our IV
			const $initializationVector: Buffer = crypto.randomBytes(16);
			// Define our cipher
			const $cipher: crypto.Cipher = crypto.createCipheriv(this.algorithm(), this.secret(), $initializationVector);
			// Encrypt our data
			const $hashPartial: Buffer = Buffer.concat([
				$cipher.update(Buffer.from($hash)),
				$cipher.final()
			]);
			// Reset the hash with the hash partial
			$hash = Utility.util.format('%s%s', $initializationVector.toString('hex'), $hashPartial.toString('base64'));
		}
		// We're done, return the final hash
		return Utility.util.format('{%s}$%d$%d$%s', this.algorithm().toUpperCase(), 16, $passes, $hash);
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Static Determinants //////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method determines whether or not a string is a hash that was encrypted by this system, or follows the same pattern
	 * @name LibraryCryptography.isHash()
	 * @param {string} $test
	 * @public
	 * @returns {boolean}
	 * @static
	 */
	public static isHash($test: string): boolean {
		// Grab the encryption data
		const $matches = $test.match(/^{(.*?)}\$([0-9]+)\$([0-9]+)\$(.*?)$/i);
		// Make sure we have matches
		if (!$matches || ($matches.length !== 5)) {
			// We're done, not a hash
			return false;
		}
		// We're done, we have a hash
		return true;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Static Inline Methods ////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method returns the cryptographic algorithm from the configuration
	 * @name LibraryCryptography.algorithm()
	 * @public
	 * @returns {string}
	 * @static
	 */
	public static algorithm(): string {
		// Return the algorithm from the configuration
		return Configuration.crypto.algorithm;
	}

	/**
	 * This method returns the cryptographic redundancy, or passes, from the configuration
	 * @name LibraryCryptography.passes()
	 * @public
	 * @returns {number}
	 * @static
	 */
	public static passes(): number {
		// Return the number of passes from the configuration
		return Configuration.crypto.passes;
	}

	/**
	 * This method returns the cryptographic public key from the configuration, with the ability to reset it inline, for private key encryption and decryption
	 * @async
	 * @name LibraryCryptography.privateKey()
	 * @param {boolean, optional} $trim [false]
	 * @param {string, optional} $key ['']
	 * @public
	 * @static
	 * @uses LibraryCryptography.getKey()
	 */
	public static async privateKey($trim: boolean = false, $key: string = ''): Promise<string> {
		// Check for a key in the configuration
		if (Utility.lodash.isEmpty($key)) {
			// Reset the key
			$key = Configuration.crypto.privateKey;
		}
		// Return the key
		return this.getKey($key, $trim);
	}

	/**
	 * This method returns the cryptographic public key from the configuration, with the ability to reset it inline, for public key encryption and decryption
	 * @async
	 * @name LibraryCryptography.publicKey()
	 * @param {boolean, optional} $trim [false]
	 * @param {string, optional} $key ['']
	 * @public
	 * @static
	 * @uses LibraryCryptography.getKey()
	 */
	public static async publicKey($trim: boolean = false, $key: string = ''): Promise<string> {
		// Check for a key in the configuration
		if (Utility.lodash.isEmpty($key)) {
			// Reset the key
			$key = Configuration.crypto.publicKey;
		}
		// Return the key
		return this.getKey($key, $trim);
	}

	/**
	 * This method returns the cryptographic secret from the configuration, for static key encryption and decryption
	 * @name LibraryCryptography.secret()
	 * @public
	 * @returns {string}
	 * @static
	 */
	public static secret(): string {
		// Return the secret from the configuration
		return Configuration.crypto.secret;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Protected Static Methods /////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method loads a key from the file system or cleans a raw key file
	 * @async
	 * @name LibraryCryptography.getKey()
	 * @param {string} $key
	 * @param {boolean, optional} $trim [false]
	 * @protected
	 * @returns {Promise<string>}
	 * @static
	 */
	protected static async getKey($key: string, $trim: boolean = false): Promise<string> {
		// Check for a file
		if ($key.substr(0, 7).toLowerCase() === 'file://') {
			// Load the file
			$key = (await Utility.fsReadFile($key.slice(7))).toString();
		}
		// We're done, return the string
		return ($trim ? $key.replace(/(-----(BEGIN|END)(.*?)KEY-----)/mi, '').trim() : $key);
	}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} /// End Cryptography Library Module Definition /////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
