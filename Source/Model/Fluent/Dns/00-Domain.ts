///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
'use strict'; /// Strict Syntax //////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Sequelize Dependencies ///////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import {
	BeforeCreate,
	BeforeUpdate,
	BelongsTo,
	Column,
	DataType,
	ForeignKey,
	HasMany,
	IsInt,
	Model,
	Table
} from 'sequelize-typescript';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import User from '../05-User'; /// User Model ////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import DnsRecord from './05-Record'; /// DNS Record Model ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import DnsQuery from './10-Query'; /// DNS Query Model ///////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// DNS Domain Table Model Definition ////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

@Table({
	indexes: [
		{fields: ['is_active']},
		{fields: ['is_public']},
		{fields: ['name']},
		{fields: ['name', 'version', 'deleted_at', 'is_active'], unique: true},
		{fields: ['serial']},
		{fields: ['user_id']}
	],
	tableName: 'dns_domain'
})
export default class DnsDomain extends Model<DnsDomain> {

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Hooks ////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@BeforeCreate
	@BeforeUpdate
	public static normalizeDomainNameAndNameServers($instance: DnsDomain): void {
		// Reset the domain name
		$instance.name = $instance.name.toLowerCase().trim();
		// Iterate over the name servers
		for (let $index = 0; $index < $instance.nameServer.length; ++$index) {
			// Reset the name server
			$instance.nameServer[$index] = $instance.nameServer[$index].toLowerCase().trim();
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Columns //////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@IsInt
	@Column({
		allowNull: false,
		defaultValue: 604800,
		field: 'expire',
		type: DataType.INTEGER
	})
	public expire!: number;

	@Column({
		allowNull: false,
		defaultValue: DataType.UUIDV4,
		field: 'id',
		primaryKey: true,
		type: DataType.UUID
	})
	public id!: string;

	@Column({
		allowNull: false,
		defaultValue: true,
		field: 'is_active',
		type: DataType.BOOLEAN
	})
	public isActive!: boolean;

	@Column({
		allowNull: false,
		defaultValue: false,
		field: 'is_public',
		type: DataType.BOOLEAN
	})
	public isPublic!: boolean;

	@Column({
		allowNull: true,
		field: 'name',
		type: DataType.TEXT
	})
	public name!: string;

	@Column({
		allowNull: false,
		field: 'name_server',
		type: DataType.ARRAY(DataType.TEXT)
	})
	public nameServer!: string[];

	@IsInt
	@Column({
		allowNull: false,
		defaultValue: 10800,
		field: 'refresh',
		type: DataType.INTEGER
	})
	public refresh!: number;

	@IsInt
	@Column({
		allowNull: false,
		defaultValue: 3600,
		field: 'retry',
		type: DataType.INTEGER
	})
	public retry!: number;

	@Column({
		allowNull: false,
		defaultValue: Math.round(Date.now() / 1000),
		field: 'serial',
		type: DataType.INTEGER
	})
	public serial!: number;

	@IsInt
	@Column({
		allowNull: false,
		defaultValue: 3600,
		field: 'ttl',
		type: DataType.INTEGER
	})
	public ttl!: number;

	@ForeignKey(() => User)
	@Column({
		allowNull: false,
		field: 'user_id',
		type: DataType.UUID
	})
	public userId!: string;

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/// Associations /////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@BelongsTo(() => User)
	public user!: User;

	@HasMany(() => DnsRecord)
	public domainRecordList!: DnsRecord[];

	@HasMany(() => DnsQuery)
	public queryList!: DnsQuery[];

}
