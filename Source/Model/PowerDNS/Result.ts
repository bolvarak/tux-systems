///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
'use strict'; /// Strict Syntax //////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import Configuration from '../../Common/Configuration'; /// Configuration Settings ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import Utility from '../../Common/Utility'; /// Utility Module ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import PublicSuffix from '../../Library/PublicSuffix'; /// PublicSuffix Module ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import DnsRecord from '../Fluent/Dns/05-Record'; /// DnsRecord Model /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import PowerDnsRecord from './Record'; /// ModelPowerDNSRecord ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export default class ModelPowerDNSResult { /// ModelPowerDNSResult Class Definition //////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Properties ///////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This property contains the log for the result
	 * @name ModelPowerDNSResult.mLog
	 * @property
	 * @protected
	 * @type {string[]}
	 */
	protected mLog: string[] = [];

	/**
	 * This property contains the result records or flag
	 * @name ModelPowerDNSResult.mResult
	 * @property
	 * @protected
	 * @type {boolean | PowerDnsRecord[]}
	 */
	protected mResult: boolean | PowerDnsRecord[] = false;

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Normalization Methods ////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method normalizes a target host for CNAME, MX, NS and SRV types
	 * @async
	 * @name ModelPowerDNSResult.normalizeTargetHost()
	 * @param {string} $host
	 * @public
	 * @returns {Promise<string>}
	 */
	public async normalizeTargetHost($host: string): Promise<string> {
		// Parse the host via PublicSuffix
		await PublicSuffix.parse($host);
		// Check for a domain
		if (Utility.lodash.isNull(PublicSuffix.domain())) {
			// We're done, return the host
			return $host.replace(/\.+$/, '').trim();
		}
		// We're done, return the fully qualified domain name
		return ($host.replace(/\.+$/, '').trim() + '.');
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Record Bootstrapper Methods //////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method adds a DNS A record to the result
	 * @async
	 * @name ModelPowerDNSResult.a()
	 * @param {string} $name
	 * @param {number} $ttl
	 * @param {string} $content
	 * @param {boolean, optional} $auth [true]
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.add()
	 */
	public async a($name: string, $ttl: number, $content: string, $auth: boolean = true): Promise<ModelPowerDNSResult> {
		// Define our record object
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'A';
		// Define the name
		$record.qname = $name;
		// Define the TTL
		$record.ttl = $ttl;
		// Define the content
		$record.content = $content;
		// Define the authority
		$record.auth = $auth;
		// Add the record to the result
		return this.add($record);
	}

	/**
	 * This method adds a DNS AAAA record to the result
	 * @async
	 * @name ModelPowerDNSResult.aaaa()
	 * @param {string} $name
	 * @param {number} $ttl
	 * @param {string} $content
	 * @param {boolean, optional} $auth [true]
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.add()
	 */
	public async aaaa($name: string, $ttl: number, $content: string, $auth: boolean = true): Promise<ModelPowerDNSResult> {
		// Define our record object
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'AAAA';
		// Define the name
		$record.qname = $name;
		// Define the TTL
		$record.ttl = $ttl;
		// Define the content
		$record.content = $content;
		// Define the authority
		$record.auth = $auth;
		// Add the record to the result
		return this.add($record);
	}

	/**
	 * This method adds a DNS CAA record to the result
	 * @async
	 * @name ModelPowerDNSResult.caa()
	 * @param {string} $name
	 * @param {number} $ttl
	 * @param {number} $flags
	 * @param {string} $tag
	 * @param {string} $content
	 * @param {boolean, optional} $auth [true]
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.add()
	 */
	public async caa($name: string, $ttl: number, $flags: number, $tag: string, $content: string, $auth: boolean = true): Promise<ModelPowerDNSResult> {
		// Define our record
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'CAA';
		// Define the name
		$record.qname = $name;
		// Define the TTL
		$record.ttl = $ttl;
		// Define the content
		$record.content = Utility.util.format('%d %s %s', $flags, $tag, ['"', $content.trim().replace(/"/, ''), '"'].join(''));
		// Define the authority
		$record.auth = $auth;
		// Add the record to the result
		return this.add($record);
	}

	/**
	 * This method adds a DNS CNAME record to the result
	 * @async
	 * @name ModelPowerDNSResult.cname()
	 * @param {string} $name
	 * @param {number} $ttl
	 * @param {string} $content
	 * @param {boolean, optional} $auth [true]
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.normalizeTargetHost()
	 * @uses ModelPowerDNSResult.add()
	 */
	public async cname($name: string, $ttl: number, $content: string, $auth: boolean = true): Promise<ModelPowerDNSResult> {
		// Define our record
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'CNAME';
		// Define the name
		$record.qname = $name;
		// Define the TTL
		$record.ttl = $ttl;
		// Define the content
		$record.content = await this.normalizeTargetHost($content);
		// Define the authority
		$record.auth = $auth;
		// Add the record to the result
		return this.add($record);
	}

	/**
	 * This method adds a DNS MX record to the result
	 * @async
	 * @name ModelPowerDNSResult.mx()
	 * @param {string} $name
	 * @param {number} $ttl
	 * @param {string} $content
	 * @param {number} $priority
	 * @param {boolean, optional} $auth [true]
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.normalizeTargetHost()
	 * @uses ModelPowerDNSResult.add()
	 */
	public async mx($name: string, $ttl: number, $content: string, $priority: number, $auth: boolean = true): Promise<ModelPowerDNSResult> {
		// Define our record object
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'MX';
		// Define the name
		$record.qname = $name;
		// Define the TTL
		$record.ttl = $ttl;
		// Define the content
		$record.content = Utility.util.format('%d %s', $priority, await this.normalizeTargetHost($content));
		// Define the authority
		$record.auth = $auth;
		// Add the record to the result
		return this.add($record);
	}

	/**
	 * This method adds a DNS NS record to the result
	 * @async
	 * @name ModelPowerDNSResult.ns()
	 * @param {string} $name
	 * @param {number} $ttl
	 * @param {string} $content
	 * @param {boolean, optional} $auth [true]
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.normalizeTargetHost()
	 * @uses ModelPowerDNSResult.add()
	 */
	public async ns($name: string, $ttl: number, $content: string, $auth: boolean = true): Promise<ModelPowerDNSResult> {
		// Define our record
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'NS';
		// Define the name
		$record.qname = $name;
		// Define the TTL
		$record.ttl = $ttl;
		// Define the content
		$record.content = await this.normalizeTargetHost($content);
		// Define the authority
		$record.auth = $auth;
		// Add the record to the result
		return this.add($record);
	}

	/**
	 * This method adds an SOA record to the result
	 * @async
	 * @name ModelPowerDNSResult.soa()
	 * @param {string} $zone
	 * @param {string} $nameServer
	 * @param {number} $serial
	 * @param {number} $refresh
	 * @param {number} $retry
	 * @param {number} $expire
	 * @param {number} $ttl
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.normalizeTargetHost()
	 * @uses ModelPowerDNSResult.add()
	 */
	public async soa($zone: string, $nameServer: string, $serial: number, $refresh: number, $retry: number, $expire: number, $ttl: number): Promise<ModelPowerDNSResult> {
		// Define our record object
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'SOA';
		// Define the zone name
		$record.qname = $zone;
		// Define the content
		$record.content = Utility.util.format(
			'%s %s %d %d %d %d %d',
			await this.normalizeTargetHost($nameServer),
			Configuration.pdns.hostMaster.replace(/\.+$/, '').concat('.'),
			$serial,
			$refresh,
			$retry,
			$expire,
			$ttl
		);
		// Define the TTL
		$record.ttl = $ttl;
		// Add the record to the result
		return this.add($record);
	}

	/**
	 * This method adds a DNS SRV record to the result
	 * @async
	 * @name ModelPowerDNSResult.srv()
	 * @param {string} $name
	 * @param {number} $ttl
	 * @param {string} $content
	 * @param {boolean, optional} $auth [true]
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.normalizeTargetHost()
	 * @uses ModelPowerDNSResult.add()
	 */
	public async srv($name: string, $ttl: number, $priority: number, $weight: number, $port: number, $content: string, $auth: boolean = true): Promise<ModelPowerDNSResult> {
		// Define our record
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'SRV';
		// Define the name
		$record.qname = $name;
		// Define the TTL
		$record.ttl = $ttl;
		// Define the content
		$record.content = Utility.util.format('%d %d %d %s', $priority, $weight, $port, await this.normalizeTargetHost($content));
		// Define the authority
		$record.auth = $auth;
		// Add the record to the result
		return this.add($record);
	}

	/**
	 * This method adds a DNS TXT record to the result
	 * @async
	 * @name ModelPowerDNSResult.txt()
	 * @param {string} $name
	 * @param {number} $ttl
	 * @param {string} $content
	 * @param {boolean, optional} $auth [true]
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.add()
	 */
	public async txt($name: string, $ttl: number, $content: string, $auth: boolean = true): Promise<ModelPowerDNSResult> {
		// Define our record
		const $record: PowerDnsRecord = new PowerDnsRecord();
		// Define the type
		$record.qtype = 'TXT';
		// Define the name
		$record.qname = $name;
		// Define the TTL
		$record.ttl = $ttl;
		// Define the content
		$record.content = $content;
		// Define the authority
		$record.auth = $auth;
		// Add the record to the result
		return this.add($record);
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Public Methods ///////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method appends a record to the result list
	 * @name ModelPowerDNSResult.add()
	 * @param {PowerDnsRecord} $record
	 * @public
	 * @returns {ModelPowerDNSResult}
	 */
	public add($record: PowerDnsRecord): ModelPowerDNSResult {
		// Check to see if the result is a boolean
		if (Utility.lodash.isBoolean(this.mResult)) {
			// Reset the result
			this.mResult = [];
		}
		// Add the record to the result
		this.mResult.push($record);
		// We're done, return the instance
		return this;
	}

	/**
	 * This method adds a log entry to the result
	 * @name ModelPowerDNSResult.log()
	 * @param {string} $message
	 * @public
	 * @returns {ModelPowerDNSResult}
	 */
	public log($message: string): ModelPowerDNSResult {
		// Add the log entry to the instance
		this.mLog.push($message);
		// We're done, return the instance
		return this;
	}

	/**
	 * This method determines what method to execute based on the record type
	 * @async
	 * @name ModelPowerDNSResult.record()
	 * @param {DnsRecord} $record
	 * @public
	 * @returns {Promise<ModelPowerDNSResult>}
	 * @uses ModelPowerDNSResult.a()
	 * @uses ModelPowerDNSResult.aaaa()
	 * @uses ModelPowerDNSResult.caa()
	 * @uses ModelPowerDNSResult.cname()
	 * @uses ModelPowerDNSResult.dnssec()
	 * @uses ModelPowerDNSResult.mx()
	 * @uses ModelPowerDNSResult.ns()
	 * @uses ModelPowerDNSResult.srv()
	 * @uses ModelPowerDNSResult.txt()
	 */
	public async record($record: DnsRecord): Promise<ModelPowerDNSResult> {
		// Localize the type
		const $type = $record.type.toLowerCase();
		// Check the record type
		if ($type === 'a') {
			// Return the A record bootstrapper
			return this.a($record.host, $record.ttl, $record.target);
		} else if ($type === 'aaaa') {
			// Return the AAAA record bootstrapper
			return this.aaaa($record.host, $record.ttl, $record.target);
		} else if ($type === 'caa') {
			// Return the CAA record bootstrapper
			return this.caa($record.host, $record.ttl, $record.flag, $record.tag, $record.target);
		} else if ($type === 'cname') {
			// Return the CNAME record bootstrapper
			return this.cname($record.host, $record.ttl, $record.target);
		} else if ($type === 'dnssec') {
			// Return the DNSSEC record bootstrapper
			return this;
		} else if ($type === 'mx') {
			// Return the MX record bootstrapper
			return this.mx($record.host, $record.ttl, $record.target, $record.priority);
		} else if ($type === 'ns') {
			// Return the NS record bootstrapper
			return this.ns($record.host, $record.ttl, $record.target);
		} else if ($type === 'srv') {
			// Return the SRV record bootstrapper
			return this.srv($record.host, $record.ttl, $record.priority, $record.weight, $record.port, $record.target);
		} else if ($type === 'txt') {
			// Return the TXT record bootstrapper
			return this.txt($record.host, $record.ttl, $record.target);
		} else {
			// We're done, return the instance, the record type is unsupported
			return this;
		}
	}

	/**
	 * This method sets the result to a hard success
	 * @name ModelPowerDNSResult.successful()
	 * @public
	 * @returns {ModelPowerDNSResult}
	 */
	public successful(): ModelPowerDNSResult {
		// Reset the result to true
		this.mResult = true;
		// We're done, return the instance
		return this;
	}

	/**
	 * This method sets the result to a hard failure
	 * @name ModelPowerDNSResult.unsuccessful()
	 * @public
	 * @returns {ModelPowerDNSResult}
	 */
	public unsuccessful(): ModelPowerDNSResult {
		// Reset the result to false
		this.mResult = false;
		// We're done, return the instance
		return this;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Converters ///////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method converts the result to a JSON payload
	 * @name ModelPowerDNSResult.toJson()
	 * @public
	 * @returns {string}
	 * @uses ModelPowerDNSResult.toObject()
	 */
	public toJson(): string {
		// Return the JSON encoded result
		return JSON.stringify(this.toObject());
	}

	/**
	 * This method converts the result to a payload
	 * @name ModelPowerDNSResult.toObject()
	 * @public
	 * @returns {{result: boolean | PowerDnsRecord[], log: string[]}}
	 */
	public toObject(): {result: boolean | PowerDnsRecord[], log: string[]} {
		// Return the object format of our result
		return {
			result: this.mResult,
			log: this.mLog
		};
	}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} /// End ModelPowerDNSResult Class Definition ///////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
