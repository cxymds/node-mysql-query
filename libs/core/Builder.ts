import { IBuildResult, IObject } from '../typings'
import { toKeys, toValues, isStr, isArray, typeOf, isObj, isPrimitive, toUpperCase, isDate, each, isRegExp, isBool, isInt } from '../utils'
export default class Builder {
	private sql: string = ''
	protected _resultCode: string = ''
	protected _expMap: string[] = []
	
	constructor() {
		;[
			'=,eq',
			'<>,neq',
			'>,gt',
			'<,lt',
			'<=,elt',
			'>=,egt',
			'like',
			'between',
			'not between',
			'in',
			'not in',
			'null',
			'not null'
		].forEach((key) => {
			let split = (key as string).split(',')
			;(split || []).forEach((v) => {
				if (!this._expMap.includes(v)) this._expMap.push(v)
			})
		})
	}
	protected buildQuery($options: any): IBuildResult {
		let where: IBuildResult = this.buildWhere($options['where'], $options['keyword'])
		let table: string = this.buildTable($options['table'], $options['alias'])
		let field: string = this.buildField($options['field'])
		let join: string = this.buildJoin($options['join'], $options['alias'])
		let group: string = this.buildGroup($options['group'])
		let order: string = this.buildOrder($options['group'])
		let limit: string = this.buildLimit($options['limit'])
		let distinct: string = $options['distinct'] === true ? 'DISTINCT' : ''
		const sql: string[] = [
			`SELECT`,
			`${distinct}`,
			`${field}`,
			`FROM`,
			`${table}`,
			`${join}`,
			`${where['sql']}`,
			`${order}`,
			`${group}`,
			`${limit}`,
		].filter((item) => item !== '')
		return {
			sql: sql.join(' '),
			params: where['params'],
		}
	}
	protected build($options: any) {
		console.log($options)
		const fields = toKeys($options || {})
		let where: IObject = {}
		let table: string = ''
		let field: string = '*'
		let select: boolean | undefined = $options['select']
		let join: string = ''
		let alias: string = ''
		let order: string = ''
		let group: string = ''
		let from: string = ''
		let limit: string = ''
		fields.forEach((v) => {
			if (v === 'where') {
				where = this.buildWhere($options['where'], $options['keyword'])
				// 'SELECT ?? FROM `orm_user` WHERE'
			} else if (v === 'table') {
				table = this.buildTable($options['table'], $options['alias'])
			} else if (v === 'field') {
				field = this.buildField($options['field'])
			} else if (v === 'join') {
				join = this.buildJoin($options['join'], $options['alias'])
			} else if (v === 'from') {
				from = this.buildFrom($options['from'], $options['alias'])
			} else if (v === 'group') {
				group = this.buildGroup($options['group'])
			} else if (v === 'order') {
				order = this.buildOrder($options['group'])
			} else if (v === 'limit') {
				limit = this.buildLimit($options['limit'])
			}
		})
		if (select) {
			let sql: string = `SELECT ${field} FROM ${from} ${join} ${where['sql']} ${order} ${group} ${limit}`
		}
		return where
	}
	/**
	 * @description 过滤SQL关键字
	 *
	 * @private
	 * @param {string} str
	 * @param {(string | undefined)} [replace=undefined]
	 * @return {*}  {(boolean | string)}
	 * @memberof BuildSQL
	 */
	private filterSqlSyntax(str: string, replace: string | undefined = undefined): boolean | string {
		const reg: RegExp = /and|exec|execute|insert|select|delete|update|count|drop|chr|mid|master|truncate|char|declare|sitename|net user|xp_cmdshell|or|like|and|exec|execute|insert|create|drop|table|from|grant|use|group_concat|column_name|information_schema.columns|table_schema|union|where|select|delete|update|order|by|count|chr|mid|master|truncate|char|declare/gi
		return replace === undefined || replace === null ? reg.test(str) : str.replace(reg, replace)
	}
	/**
	 * @description 特殊字符过滤
	 *
	 * @private
	 * @param {string} str
	 * @param {string} [replace]
	 * @return {*}  {(boolean | string)}
	 * @memberof BuildSQL
	 */
	private filterChar(str: string, replace?: string): boolean | string {
		const reg: RegExp = /[~'\-`"？《》“”‘’；;！#￥……&*（）\{\}——+：\{\}【】!\[\]<>@#$%^&*()-+=:\s\|]/gi
		return replace === undefined || replace === null ? reg.test(str) : str.replace(reg, replace)
	}
	/**
	 * 解析查询语句
	 */
	private buildWhere(whereOption: Array<any> = [], query: string[] = []): IBuildResult {
		console.log('++', whereOption, query)
		const sqlMap: string[] = ['WHERE']
		const data: any[] = [] //参数化
		whereOption.forEach((item, index) => {
			let len: number = 0
			let field: string[] = item['field'] //获取字段
			let length: number = field.length
			let fiedlQuery: string[] = item['query']
			let operator: IObject = item['operator'] //获取表达式
			let condition: IObject = item['condition'] //获取条件
			let keyword: IObject = item['keyword'] //获取OR | AND  多个条件查询 id=1 or id=2
			fiedlQuery.forEach((v) => sqlMap.push(v))
			while (len < length) {
				let key: string = field[len]
				let keywordOption: string[] = keyword[key] || []
				let conditionOption: string[] = condition[key] || []
				let operatorOption: string[] = operator[key] || []
				let operatorLength: number = operatorOption.length
				let i: number = 0
				while (i < operatorLength) {
					if (operatorLength >= 2 && i === 0) sqlMap.push('(') //多个表达式用()包含
					if (!key.includes('.')) {
						sqlMap.push(`\`${key}\``, toUpperCase(operatorOption[i]), '?')
					} else {
						sqlMap.push(`${key}`, toUpperCase(operatorOption[i]), '?')
					}
					if(/IN|NOT IN/.test(toUpperCase(operatorOption[i]))) {
						if(sqlMap[sqlMap.length - 1] === '?') sqlMap[sqlMap.length - 1] = '(?)'
						if(isArray(conditionOption)) data.push(conditionOption)
					}else if(/BETWEEN|NOT BETWEEN/.test(toUpperCase(operatorOption[i]))) {
						if(isArray(conditionOption) && conditionOption.length === 2) {		// between   [1,2]
							each(conditionOption, (v, key) => {
								data.push([v])
							})
						}
					}else if(/NULL|NOT NULL/.test(toUpperCase(String(conditionOption[i])))) {
						sqlMap[sqlMap.length - 1] = toUpperCase(conditionOption[i])
						sqlMap[sqlMap.length - 2] = 'IS'
					}else {
						data.push(conditionOption[i] !== '' ? conditionOption[i] : "''")
					}
					
					if (i === operatorLength - 1 && operatorLength >= 2) sqlMap.push(')')

					if (keywordOption[i]) sqlMap.push(keywordOption[i])
					else if (length >= 2 && i + 1 < operatorLength) sqlMap.push('AND') //多个条件
					i++
				}
				len++
			}
			if (query[index]) {
				if (['AND', 'OR'].includes(sqlMap[sqlMap.length - 1])) {
					sqlMap[sqlMap.length - 1] = query[index]
				} else {
					sqlMap.push(query[index])
				}
			}
		})
		if (sqlMap.lastIndexOf('AND') === sqlMap.length - 1 || sqlMap.lastIndexOf('OR') === sqlMap.length - 1) {
			sqlMap.splice(sqlMap.length - 1, 1)
		}
		return {
			sql: sqlMap.join(' '),
			params: data,
		}
	}
	/**
	 * @description 解析数据表
	 * @param $table 数据表
	 * @param $alias 数据表别名
	 */
	private buildTable($table: string[], $alias: IObject): string {
		const alias: string[] = toKeys($alias)
		if ($table.length) {
			alias.forEach((item) => {
				let name: string = $alias[item]
				let index: number = $table.indexOf(name)
				if (index > -1) {
					$table[index] = `${$table[index]} ${item}`
				}
			})
			return $table.join(',')
		}
		return 'NOT TABLE'
	}

	/**
	 * @description 解析字段
	 */
	private buildField($fields: string = ''): string {
		if ($fields === undefined || $fields === '') {
			return '*'
		}
		return $fields
	}

	/**
	 * 关联查询
	 */
	private buildJoin($config: IObject, $alias: IObject): string {
		let join: string = ''
		let table: string[] = toKeys($config)
		let alias: string[] = toKeys($alias)
		each(table, (item) => {
			let name: string = item
			let condition: string = $config[item][0]
			let joinType: string = $config[item][1]
			let filter: string[] = alias.filter((key) => table.includes($alias[key]))
			each(filter, (v) => {
				if($alias[v] === item) {
					name = `${item} ${v}`
				}
			})
			// name = `${item} ${filter[0]}`
			join += `${joinType} JOIN ${name} ON ${condition} `
		})
		return join
	}
	/**
	 * 解析From
	 */
	private buildFrom($table: string[], $alias: IObject): string {
		let keys: string[] = toKeys($alias)
		let from: string[] = []
		$table.forEach((table, index) => {
			let value: string[] = keys.filter((key) => $alias[key] === table)
			console.log(value)
			if (value[0]) {
				if (!from.includes(`${table} ${value[0]}`)) from.push(`${table} ${value[0]}`)
			}
		})
		return from.join(',')
	}

	/**
	 * 解析group by
	 */
	private buildGroup($group: string = ''): string {
		let group: string = 'GROUP BY '
		let map: string[] = []
		let split: string[] = $group.split(',')
		split.forEach((item: string) => {
			let key: string[] = item.split('.')
			let name: string = ''
			if (key.length === 2) {
				name = `\`${key[0]}\`.\`${key[1]}\``
			} else {
				name = `\`${key[0]}\``
			}
			if (!map.includes(name)) map.push(name)
		})
		group += `${map.join(',')}`
		return !$group ? '' : group
	}
	/**
	 * 解析order by
	 */
	private buildOrder($order: string = ''): string {
		let order: string = 'ORDER BY '
		let map: string[] = []
		let split: string[] = $order.split(',')
		split.forEach((item: string) => {
			let key: string[] = item.split('.')
			let name: string = ''
			if (key.length === 2) {
				name = `\`${key[0]}\`.\`${key[1]}\``
			} else {
				name = `\`${key[0]}\``
			}
			if (!map.includes(name)) map.push(name)
		})
		order += `${map.join(',')}`
		return !$order ? '' : order
	}

	/**
	 * 解析limit
	 */
	private buildLimit($limit): string {
		let limit: string = 'LIMIT '
		limit += `${$limit}`
		return !$limit ? '' : limit
	}
	/**
	 * 解析插入数据
	 */
	protected buildInsert($insert: any, $table: string | string[]): IBuildResult {
		if (isArray($table)) {
			$table = $table[0]
		}
		if (isObj($insert)) $insert = [$insert]
		let fields:string[] = toKeys($insert[0])
		const dataMap:any[] = []
		;($insert as []).forEach((item) => {
			let keys: string[] = toKeys(item)
			let data: any[] = []
			keys.forEach((key) => {
				if(isBool(item[key]) || isInt(item[key])) {
					data.push(item[key])
				}else {
					data.push(`'${item[key]}'`)
				}
			})
			dataMap.push(data)
		})
		let insert: string = `INSERT INTO ${$table} (${fields.join(',')}) VALUES ?`
		console.log({
			sql:insert,
			params:[dataMap]
		})
		return {
			sql:insert,
			params:[dataMap]
		}
	}

	/**
	 * 解析更新数据
	 */
	protected buildUpdate(
		$update: IObject,
		$where: Array<any> = [],
		$query: string[] = [],
		$table: string | string[]
	): string {
		const where: IObject = this.buildWhere($where, $query)
		if (!where['sql']) return ''
		const keys: string[] = toKeys($update)
		if (isArray($table)) {
			$table = $table[0]
		}
		let sql: string[] = ['UPDATE', $table as string, 'SET']
		let update: string[] = []
		keys.forEach((key) => {
			if (isStr($update[key]) || isDate($update[key])) {
				update.push(`${key}='${$update[key]}'`)
			} else {
				update.push(`${key}=${$update[key]}`)
			}
		})
		sql.push(update.join(','), where['sql'])
		return sql.join(' ')
	}
	/**
	 * 解析删除
	 */
	protected buildDelete($where: Array<any> = [], $query: string[] = [], $table: string | string[]): string {
		const where: IObject = this.buildWhere($where, $query)
		if (!where['sql']) return ''
		if (isArray($table)) {
			$table = $table[0]
		}
		let sql: string[] = ['DELETE', 'FROM', $table as string]

		sql.push(where['sql'])
		return sql.join(' ')
	}
}
