///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
'use strict'; /// Strict Syntax //////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import Utility from '../Utility'; /// Utility Module /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import * as net from 'net'; /// Network Module ///////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import Service from '../Service'; /// Abstract Service Class /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import Client from './Socket/Client'; /// CommonServiceSocketClient Module ///////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export default abstract class CommonServiceSocket extends Service { /// Socket Class Definition //////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Properties ///////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This property contains a map of connected clients
	 * @name Socket.mClients
	 * @property
	 * @protected
	 * @type {Client[]}
	 */
	protected mClients: Client[] = [];

	/**
	 * This property contains the instance of the server
	 * @name Socket.mServer
	 * @property
	 * @protected
	 * @type {net.Server}
	 */
	protected mServer: net.Server = net.createServer();

	/**
	 * This property contains our shutdown flag
	 * @name Socket.mShutdown
	 * @property
	 * @protected
	 * @type {boolean}
	 */
	protected mShutdown: boolean = false;

	/**
	 * This property contains our socket file path
	 * @name Socket.mSocket
	 * @property
	 * @protected
	 * @type {string}
	 */
	protected mSocket: string = '';

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Constructor //////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method instantiates a new Socket Service
	 * @name Socket.constructor()
	 * @param {string} $socketPath
	 * @param {string, optional} $sysLogId ['tux-systems-socket']
	 * @param {string, optional} $logLevel ['debug']
	 * @protected
	 * @returns {Socket}
	 */
	protected constructor($socketPath: string, $sysLogId: string = 'tux-systems-socket', $logLevel: string = 'debug') {

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		super($sysLogId, $logLevel); /// Super Constructor ///////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//// Assignments /////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// Set the socket path into the instance
		this.mSocket = $socketPath;

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/// Event Registration ///////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// SIGINT
		process.on('SIGINT', async () => {
			// Cleanup the connections and shut the server down
			await this.cleanUp();
		});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	} /// End Constructor ////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Implementations //////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method starts the server
	 * @async
	 * @name Socket.start()
	 * @public
	 * @returns {Promise<void>}
	 * @uses CommonService.logger()
	 * @uses Socket.preFlight()
	 * @uses Socket.clientSetup()
	 * @uses Socket.clientConnect()
	 */
	public async start(): Promise<void> {
		// Try to start the server
		try {
			// Await the pre-flight checks
			await this.preFlight();
			// Instantiate the server
			this.mServer = net.createServer(async ($stream) => {
				// Execute the client setup
				await this.clientSetup($stream);
			});
			// Log the message
			this.logger().info('Starting Server');
			// Start the server
			this.mServer.listen(this.mSocket);
			// Attach to the connection event
			this.mServer.on('connection', this.clientConnect);
		} catch ($error) {
			// Log the error
			this.logger().error($error);
			// We're done, kill the process
			process.exit(1);
		}
	}

	/**
	 * This method shuts down the server
	 * @async
	 * @name Socket.shutdownServer()
	 * @public
	 * @returns {Promise<void>}
	 * @uses CommonService.logger()
	 */
	public async stop(): Promise<void> {
		// Log the message
		this.logger().info('Stopping Server');
		// Close the server
		this.mServer.close();
		// We're done, kill the process
		process.exit(0);
	}

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Public Methods ///////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method cleans up the clients and stops the server
	 * @async
	 * @name Socket.cleanUp()
	 * @public
	 * @returns {Promise<void>}
	 * @uses CommonService.logger()
	 * @uses Socket.clientForceDisconnect()
	 * @uses Socket.stop()
	 */
	public async cleanUp(): Promise<void> {
		// Check the shutdown flag
		if (!this.mShutdown) {
			// Reset the shutdown flag
			this.mShutdown = true;
			// Log the message
			this.logger().info('Cleaning Up Clients');
			// Iterate over the client IDs
			for (const $client of this.mClients) {
				// Emit the event
				await this.clientForceDisconnect($client.id, $client.connection);
				// Log the message
				this.logger().info(Utility.util.format('Forcing Client [%s] Disconnect', $client.id));
				// Close the client
				$client.connection.end();
			}
			// Close the server
			await this.stop();
		}
	}

	/**
	 * This method sets up a client and binds to its events
	 * @async
	 * @name Socket.clientSetup()
	 * @param {net.Socket} $stream
	 * @public
	 * @returns {Promise<void>}
	 * @uses CommonService.logger()
	 * @uses Socket.clientDisconnect()
	 * @uses Socket.clientRequest()
	 */
	public async clientSetup($stream: net.Socket): Promise<void> {
		// Generate the new client
		const $client = new Client($stream);
		// Log the message
		this.logger().info(Utility.util.format('Client [%s] Locked', $client.id));
		// Set the client into the pool
		this.mClients.push($client);
		// Bind to the disconnect event
		$stream.on('end', async () => {
			// Process the client disconnect
			await this.clientDisconnect($client.id, $stream);
			// Log the message
			this.logger().info(Utility.util.format('Client [%s] Disconnected', $client.id));
		});
		// Bind to the data event
		$stream.on('data', async ($payload) => {
			// Localize the payload
			const $data = $payload.toString().trim().toLowerCase();
			// Check for a killswitch
			if ($data === '\\q') {
				// We're done, kill the connection
				return $stream.end();
			} else if ($data === '\\c') {
				this.logger().debug('Clients', this.mClients);
				// Send the client list to this client
				$stream.write(JSON.stringify(this.mClients).concat('\n'));
			} else {
				// Process the client request
				await this.clientRequest($client.id, $stream, $payload);
			}
		});
		// Log the message
		this.logger().info(Utility.util.format('Client [%s] Loaded', $client.id));
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Abstract Methods /////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method responds to an incoming connection
	 * @abstract
	 * @async
	 * @name Socket.clientConnect()
	 * @param {net.Socket} $stream
	 * @protected
	 * @returns {Promise<void>}
	 */
	protected abstract async clientConnect($stream: net.Socket): Promise<void>;

	/**
	 * This method handles a client disconnecting
	 * @abstract
	 * @async
	 * @name Socket.clientDisconnect()
	 * @param {string} $clientId
	 * @param {net.Socket} $stream
	 * @protected
	 * @returns {Promise<void>}
	 */
	protected abstract async clientDisconnect($clientId: string, $stream: net.Socket): Promise<void>;

	/**
	 * This method forces a client to disconnect
	 * @abstract
	 * @async
	 * @name Socket.clientForceDisconnect()
	 * @param {string} $clientId
	 * @param {Socket} $stream
	 * @protected
	 * @returns {Promise<void>}
	 */
	protected abstract async clientForceDisconnect($clientId: string, $stream: net.Socket): Promise<void>;

	/**
	 * This method handles the client request
	 * @abstract
	 * @async
	 * @name Socket.clientRequest()
	 * @param {string} $clientId
	 * @param {net.Socket} $stream
	 * @param {Buffer} $data
	 * @protected
	 * @returns {Promise<void>}
	 */
	protected abstract async clientRequest($clientId: string, $stream: net.Socket, $data: Buffer): Promise<void>;

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Protected Methods ////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * This method executes pre-flight checks to ensure a clean operating environment
	 * @async
	 * @name Socket.preFlight()
	 * @protected
	 * @returns {Promise<void>}
	 * @uses CommonService.logger()
	 */
	protected async preFlight(): Promise<void> {
		// Log the message
		this.logger().info('Running Pre-Flight Checks');
		// Try to stat the socket file
		try {
			// Stat the socket file
			await Utility.fsStat(this.mSocket);
			// Log the message
			this.logger().info('Socket Artifact Found');
			// Try to purge the socket file
			try {
				// Log the message
				this.logger().info('Purging Socket Artifact');
				// Purge the socket file
				await Utility.fsUnlink(this.mSocket);
			} catch ($error) {
				// Log the error
				this.logger().error($error);
				// We're done, kill the process
				process.exit(1);
			}
		} catch ($error) {
			// Log the message
			this.logger().info('Socket Artifact Not Found');
		}
		// Log the message
		this.logger().info('Pre-Flight Checks Finished');
	}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} /// End Socket Class Definition ////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
