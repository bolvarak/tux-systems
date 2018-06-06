///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
'use strict'; /// Strict Syntax //////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import Utility from '../Common/Utility'; /// Utility Module /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import PublicSuffix from './PublicSuffix'; /// PublibSuffix Library //////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import PowerDnsResult from '../Model/PowerDNS/Result'; /// PowerDNS Result Model /////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import {IFindOptions} from 'sequelize-typescript';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import DnsQuery from '../Model/Fluent/Dns/10-Query'; /// DNS Query Model /////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import DnsDomain from '../Model/Fluent/Dns/00-Domain'; /// DNS Domain Model //////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import DnsRecord from '../Model/Fluent/Dns/05-Record'; /// DNS Record Model //////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import * as log4js from 'log4js'; /// log4js Logging Module //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export default class LibraryPowerDNS { /// LibraryPowerDNS Class Definition //////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Properties ///////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This property contains the instance of our logging module
	 * @name LibraryPowerDNS.mLogger
	 * @type {log4js.Logger}
	 */
	protected mLogger: log4js.Logger;

	/**
	 * This property contains the method translation map
	 * @name LibraryPowerDNS.mMethods
	 * @type {{[requestMethod: string]: string}}
	 */
	protected mMethods: {[requestMethod: string]: string} = {
		aborttransaction: '_abortTransaction',
		activatedomainkey: '_activateDomainKey',
		adddomainkey: '_addDomainKey',
		calculatesoaserial: '_calculateSoaSerial',
		committransaction: '_commitTransaction',
		createslavedomain: 'createSlaveDomain',
		deactivatedomainkey: '_deactivateDomainKey',
		directbackendcmd: '_directBackendCommand',
		feedents: '_feedEnts',
		feedents3: '_feedEnts3',
		feedrecord: '_feedRecord',
		getalldomainmetadata: '_getAllDomainMetaData',
		getalldomains: '_getAllDomains',
		getbeforeandafternamesabsolute: '_getBeforeAndAfterNamesAbsolute',
		getdomaininfo: '_getDomainInfo',
		getdomainkeys: '_getDomainKeys',
		getdomainmetadata: '_getDomainMetaData',
		gettsigkey: '_getTsigKey',
		initialize: '_initialize',
		ismaster: '_isMaster',
		list: '_list',
		lookup: '_lookup',
		removedomainkey: '_removeDomainKey',
		replacerrset: '_replaceRrSet',
		searchrecords: '_searchRecords',
		setdomainmetadata: '_setDomainMetaData',
		setnotified: '_setNotified',
		starttransaction: '_startTransaction',
		supermasterbackend: '_superMasterBackend'
	};

	/**
	 * This property contains the query model instance for the incoming request
	 * @name LibraryPowerDNS.mQuery
	 * @type {DnsQuery}
	 */
	protected mQuery: DnsQuery;

	/**
	 * This property contains the result to send back to PowerDNS
	 * @name LibraryPowerDNS.mResult
	 * @type {PowerDnsResult}
	 */
	protected mResult: PowerDnsResult = new PowerDnsResult();

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Constructor //////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method instantiates a new PowerDNS Library instance
	 * @name LibraryPowerDNS.constructor()
	 * @param {Sequelize.Model} $queryModel
	 * @param {log4js.Logger} $logger
	 */
	constructor($queryModel: DnsQuery, $logger: log4js.Logger) {

		// Set the logger into the instance
		this.mLogger = $logger;
		// Set the query into the instance
		this.mQuery = $queryModel;

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	} /// End Constructor ////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Public Methods ///////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method generates and sends the response
	 * @async
	 * @name LibraryPowerDNS.response()
	 * @public
	 * @returns {Promise<LibraryPowerDNS>}
	 * @uses LibraryPowerDNS.query()
	 * @uses LibraryPowerDNS.result()
	 * @uses LibraryPowerDNS.__unsupported()
	 * @uses LibraryPowerDNS._initialize()
	 * @uses LibraryPowerDNS._lookup()
	 * @uses ModelPowerDNSResult.unsuccessful()
	 * @uses ModelPowerDNSResult.log()
	 */
	public async response(): Promise<LibraryPowerDNS> {
		// Try to process the query to elicit a response
		try {
			// Localize the method
			const $method: string = this.query().request.method.toLowerCase();
			// Check the method
			if ($method === 'initialize') {
				// Initialize the service
				await this.initialize();
			} else if ($method === 'list') {
				// Assert the parameter payload and list the zone
				await this.list(this.query().request.parameters as {zonename: string, domain_id?: number});
			} else if ($method === 'lookup') {
				// Assert the parameter payload and lookup the host
				await this.lookup(this.query().request.parameters as {qtype: string, qname: string, remote: string, local: string, 'real-remote': string, 'zone-id': number});
			} else {
				// Execute the unsupported workflow
				await this.unsupported();
			}
			// Set the response into the query model
			this.query().response = this.result().toObject();
			// Try to save the response
			try {
				// Save the query model
				await this.query().save();
				// We're done, return the instance
				return this;
			} catch ($error) {
				// Log the error
				this.logger().error($error.message);
				// Set the result flag
				this.result().unsuccessful();
				// Add the log message
				this.result().log($error.message);
				// We're done, return the instance
				return this;
			}
			// We're done
		} catch ($error) {
			// Log the error
			this.logger().error($error.message);
			// Set the result flag
			this.result().unsuccessful();
			// Add the log message
			this.result().log($error.message);
			// Set the response into the query model
			this.query().response = this.result().toObject();
			// Try to save the response
			try {
				// Save the query model
				await this.query().save();
				// We're done, return the instance
				return this;
			} catch ($error) {
				// Log the error
				this.logger().error($error.message);
				// Set the result flag
				this.result().unsuccessful();
				// Add the log message
				this.result().log($error.message);
				// We're done, return the instance
				return this;
			}
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Inline Methods ///////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method returns the logger from the instance
	 * @name LibraryPowerDNS.logger()
	 * @public
	 * @returns {log4js.Logger}
	 */
	public logger(): log4js.Logger {
		// Return the logger from the instance
		return this.mLogger;
	}

	/**
	 * This method returns the PowerDNS query model from the instance with the ability to reset it inline
	 * @name LibraryPowerDNS.query()
	 * @param {DnsQuery, optional} $queryModel
	 * @public
	 * @returns {DnsQuery}
	 */
	public query($queryModel?: DnsQuery): DnsQuery {
		// Check for a provided query model
		if ($queryModel) {
			// Reset the query model into the instance
			this.mQuery = $queryModel;
		}
		// We're done, return the query model from the instance
		return this.mQuery;
	}

	/**
	 * This method returns the query result from the instance with the ability to reset it inline
	 * @name LibraryPowerDNS.result()
	 * @param {PowerDnsResult, optional} $result
	 * @public
	 * @returns {PowerDnsResult}
	 */
	public result($result?: PowerDnsResult): PowerDnsResult {
		// Check for a provided result
		if ($result) {
			// Reset the result into the instance
			this.mResult = $result;
		}
		// We're done, return the result from the instance
		return this.mResult;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Lookup Methods ///////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method performs a lookup for a domain and its associated user
	 * @async
	 * @name LibraryPowerDNS.lookupDomain()
	 * @param {string} $domainName
	 * @protected
	 * @returns {Promise<DnsDomain>}
	 * @throws {Error}
	 */
	protected async lookupDomain($domainName: string): Promise<DnsDomain> {
		// Load the domain
		const $domain: DnsDomain | null = await DnsDomain.findOne({
			where: {
				isActive: {
					[DnsDomain.sequelize.Op.eq]: true
				},
				name: {
					[DnsDomain.sequelize.Op.eq]: $domainName.toLowerCase()
				}
			}
		});
		// Check for a domain
		if (Utility.lodash.isNull($domain)) {
			// Throw the exception
			throw new Error(Utility.util.format('Zone [%s] Not Found', $domainName));
		}
		// We're done, return the domain
		return $domain;
	}

	/**
	 * This method looks up the records for the domain
	 * @async
	 * @name LibraryPowerDNS.lookupDomainRecords()
	 * @param {string} $domainId
	 * @param {string} $domainName
	 * @param {string, optional} $host [null]
	 * @param {string, optional} $type ['ANY']
	 * @protected
	 * @returns {Promise<void>}
	 */
	protected async lookupDomainRecords($domainId: string, $domainName: string, $host?: string, $type: string = 'ANY'): Promise<void> {
		// Log the domain ID
		this.logger().debug('Domain ID\t\t=>\t' + $domainId);
		// Log the domain name
		this.logger().debug('Domain Name\t\t=>\t' + $domainName);
		// Log the record type
		this.logger().debug('Record Type\t\t=>\t' + $type);
		// Define our record clause
		const $clause: IFindOptions<DnsRecord> = {};
		// Define the WHERE clause
		$clause.where = {};
		// Set the active flag into the WHERE clause
		$clause.where.isActive = true;
		// Set the domain ID into the WHERE clause
		$clause.where.domainId = $domainId;
		// Check the query type
		if ($type.toLowerCase() !== 'any') {
			// Add the record type to the clause
			$clause.where.type = $type.toUpperCase();
		}
		// Check for a host
		if (Utility.lodash.isUndefined($host) || Utility.lodash.isEmpty($host)) {
			// Reset the host
			$host = '@';
		}
		// Log the hostname we are looking for
		this.logger().debug('Record Host\t\t=>\t' + $host);
		// Add the host to the clause
		$clause.where.host = $host.toLowerCase();
		// Log the clause
		this.logger().debug('Record Clause:\n' + JSON.stringify($clause, null, '\t'));
		// Query for the record(s)
		let $records: DnsRecord[] = await DnsRecord.findAll($clause);
		// Check for records
		if ((!$records || !$records.length) && !Utility.lodash.isUndefined($host) && !Utility.lodash.isEmpty($host)) {
			// Update the host name
			$clause.where.host = '*';
			// Execute the query await
			$records = await DnsRecord.findAll($clause);
		}
		// Check for records
		if (!$records || !$records.length) {
			// Log the message
			this.result().log(Utility.util.format('Zone [%s] Has No Records', $domainName));
			// We're done
			return;
		}
		// Log the message
		this.result().log(Utility.util.format('Zone [%s] Has [%d] Records', $domainName, $records.length));
		// Iterate over the records
		$records.forEach(async ($record: DnsRecord): Promise<void> => {
			// Check the record host
			if ($record.host === '@') {
				// Reset the host
				$record.host = $domainName;
			} else if ($record.host === '*') {
				// Reset the host
				$record.host = ($host + '.' + $domainName);
			} else {
				// Reset the host
				$record.host = ($record.host + '.' + $domainName);
			}
			// Log the record that was found
			this.logger().debug('RecordFound[]\t=>\t' + $record.host + '\t->\t' + $record.type + '\t->\t' + $record.target);
			// Add the record to the result
			await this.result().record($record);
			// Set the record ID into the query
			this.query().recordId.push($record.id.toString());
		});
	}

	/**
	 * This method looks up the records for the domain when an AXFR is requested
	 * @async
	 * @name LibraryPowerDNS.lookupDomainRecordsForTransfer()
	 * @param {string} $domainId
	 * @param {string} $domainName
	 * @protected
	 * @returns {Promise<void>}
	 */
	protected async lookupDomainRecordsForTransfer($domainId: string, $domainName: string): Promise<void> {
		// Define our record clause
		const $clause: IFindOptions<DnsRecord> = {};
		// Define the WHERE clause
		$clause.where = {};
		// Set the active flag into the WHERE clause
		$clause.where.isActive = {[DnsRecord.sequelize.Op.eq]: true};
		// Set the domain ID into the WHERE clause
		$clause.where.domainId = {[DnsRecord.sequelize.Op.eq]: $domainId};
		// Query for the record(s)
		const $records: DnsRecord[] = await DnsRecord.findAll($clause);
		// Check for records
		if (!$records || !$records.length) {
			// Log the message
			this.result().log(Utility.util.format('Zone [%s] Has No Records', $domainName));
			// We're done
			return;
		}
		// Default the record ID list
		this.query().recordId = [];
		// Log the message
		this.result().log(Utility.util.format('Zone [%s] Has [%d] Records', $domainName, $records.length));
		// Iterate over the records
		$records.forEach(async ($record: DnsRecord): Promise<void> => {
			// Reset the host
			$record.host = (
				($record.host === '@') ?
					$domainName : ($record.host + '.' + $domainName)
			);
			// Add the record to the result
			await this.result().record($record);
			// Set the record ID into the query
			this.query().recordId.push($record.id.toString());
		});
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Handler Methods //////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method initializes the backend, it does nothing since NodeJS doesn't need to be initialized, so we just bootstrap the response
	 * @async
	 * @name LibraryPowerDNS.initialize()
	 * @protected
	 * @returns {Promise<void>}
	 * @uses LibraryPowerDNS.result()
	 * @uses ModelPowerDNSResult.successful()
	 * @uses ModelPowerDNSResult.log()
	 */
	protected async initialize(): Promise<void> {
		// Set the result flag
		this.result().successful();
		// Add the log message
		this.result().log('Tux.Systems Initialized');
	}

	/**
	 * This method performs an AXFR on a zone
	 * @async
	 * @name LibraryPowerDNS.list()
	 * @param {{zonename: string, domain_id?: number}} $parameters
	 * @protected
	 * @returns {Promise<void>}
	 * @uses LibraryPowerDNS.lookupDomain()
	 * @uses LibraryPowerDNS.lookupDomainRecords()
	 * @uses LibraryPowerDNS.result()
	 * @uses ModelPowerDNSResult.unsuccessful()
	 * @uses ModelPowerDNSResult.log()
	 * @uses ModelPowerDNSResult.record()
	 */
	protected async list($parameters: {zonename: string, domain_id?: number}): Promise<void> {
		// Define our start
		const $start: number = Date.now();
		// Log the start
		this.result().log('Start:' + $start);
		// Parse the hostname
		await PublicSuffix.parse($parameters.zonename);
		// Load the domain and user
		const $domain: DnsDomain = await this.lookupDomain(PublicSuffix.domain() as string);
		// Log the message
		this.result().log(Utility.util.format('Zone [%s] Matched', PublicSuffix.domain()));
		// Set the domain ID into the query
		this.query().domainId = $domain.id;
		// Set the user ID into the query
		this.query().userId = $domain.userId;
		// Add the SOA record
		this.result().soa($domain.name, $domain.nameServer[0], $domain.serial, $domain.refresh, $domain.retry, $domain.expire, $domain.ttl);
		// Process the records
		await this.lookupDomainRecordsForTransfer($domain.id, $domain.name);
		// Define our finish
		const $finish: number = Date.now();
		// Log the finish
		this.result().log('Finish:' + $finish);
		// Log the time taken
		this.result().log('TimeTaken:' + ($finish - $start));
		// We're done
		return;
	}

	/**
	 * This method performs a lookup on a record
	 * @async
	 * @name LibraryPowerDNS.lookup()
	 * @param {{qtype: string, qname: string, remote: string, local: string, real-remote: string, zone-id: number}} $parameters
	 * @protected
	 * @returns {Promise<void>}
	 * @uses LibraryPowerDNS.lookupDomain()
	 * @uses LibraryPowerDNS.lookupDomainRecords()
	 * @uses LibraryPowerDNS.result()
	 * @uses ModelPowerDNSResult.unsuccessful()
	 * @uses ModelPowerDNSResult.log()
	 * @uses ModelPowerDNSResult.record()
	 */
	protected async lookup($parameters: {qtype: string, qname: string, remote: string, local: string, 'real-remote': string, 'zone-id': number}): Promise<void> {
		// Log the parameters
		this.logger().debug('Query Parameters:\n' + JSON.stringify($parameters, null, '\t'));
		// Define our start
		const $start: number = Date.now();
		// Log the start
		this.result().log('Start:' + $start);
		// Parse the hostname
		await PublicSuffix.parse($parameters.qname);
		// Log the public suffix data
		this.logger().debug('PublicSuffix Result:\n' + PublicSuffix.toJson(true));
		// Loojup the domain and user
		const $domain: DnsDomain = await this.lookupDomain(PublicSuffix.domain() as string);
		// Log the message
		this.result().log(Utility.util.format('Zone [%s] Matched', PublicSuffix.domain()));
		// Set the domain ID into the query
		this.query().domainId = $domain.id;
		// Set the user ID into the query
		this.query().userId = $domain.userId;
		// Check for a SOA type
		if ($parameters.qtype.toLowerCase() === 'soa') {
			// Add the SOA record
			this.result().soa($domain.name, $domain.nameServer[0], $domain.serial, $domain.refresh, $domain.retry, $domain.expire, $domain.ttl);
		} else {
			// Lookup the records for the domain
			await this.lookupDomainRecords($domain.id, $domain.name, (PublicSuffix.host() as string), $parameters.qtype);
		}
		// Define our finish
		const $finish = Date.now();
		// Log the finish
		this.result().log('Finish:' + $finish);
		// Log the time taken
		this.result().log('TimeTaken:' + ($finish - $start));
		// We're done
		return;
	}

	/**
	 * This method is a default response and is sent when a method is unsupported
	 * @async
	 * @name LibraryPowerDNS.unsupported()
	 * @returns {Promise.<void>}
	 * @protected
	 * @uses LibraryPowerDNS.query()
	 * @uses LibraryPowerDNS.logger()
	 * @uses LibraryPowerDNS.result()
	 * @uses ModelPowerDNSResult.unsuccessful()
	 * @uses ModelPowerDNSResult.log()
	 */
	protected async unsupported(): Promise<void> {
		// Define the message
		const $message = Utility.util.format('Method [%s] Is Not Supported', this.query().request.method);
		// Log the message
		this.logger().warn($message);
		// Set the result flag
		this.result().unsuccessful();
		// Add the log message
		this.result().log($message);
	}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} /// End LibraryPowerDNS Class Definition //////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
