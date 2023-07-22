import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { language } from 'monaco-editor/esm/vs/basic-languages/sql/sql.js'
import { mysql_keywords } from './mysql/keywords';
import { useTranslation } from 'react-i18next'
import { i18n } from '../../i18n';
// import i18n from "../i18n";

const { keywords: all_keyword } = language

function aftersplit(text: string, sep: string = '.') {
    const idx = text.lastIndexOf(sep)
    if (idx == -1) {
        return text.replaceAll('`', '')
    }
    return text.substring(idx + 1).replaceAll('`', '')
}

// 用于判断是否 MySQL 关键词
let mysqlAllKeywordMap = {}
all_keyword.forEach(keyword => {
    mysqlAllKeywordMap[keyword] = 1
})
// console.log('keywords', JSON.stringify(keywords))
const keywords = [
    ...mysql_keywords,
    // 组合关键词
    "ORDER BY",
    'GROUP BY',
    'SELECT * FROM',
    'DELETE FROM',
    'INSERT INTO',
    'LEFT JOIN',
    'INNER JOIN',
]

const hintData = {
    // adbs: ['dim_realtime_recharge_paycfg_range', 'dim_realtime_recharge_range'],
    // dimi: ['ads_adid', 'ads_spec_adid_category'],
    // edu: ['students', 'course'],
}

let allFieldMap: string[] = []
// TODO 实例和数据库
interface TableFieldMap {
    [key: string]: string[]
}
window.tableFieldMap = {}
const tableFieldMap: TableFieldMap = window.tableFieldMap

window.connectionSchemaMap = {}
const connectionSchemaMap: TableFieldMap = window.connectionSchemaMap

export function suggestionInit() {
    
    function getAllTableSuggest() {
        const tables = []
        for (let db in hintData) {
            tables.push(...hintData[db])
        }
        return list2Suggest(tables, {
            backquote: true,
        })
    }

    function getTableSuggest(dbName) {
        const tableNames = hintData[dbName]
        if (!tableNames) {
            return []
        }
        return tableNames.map((name) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Constant,
            insertText: `\`${name}\``,
            detail: i18n.t('table'),
        }))
    }
    
    function list2Suggest(list, { backquote = false, detail = '' } = {}) {
        return list
            .map((key) => {
                // let score = 0
                // if (key == 'SELECT') {
                //     score = 100
                // }
                return {
                    keyword: key,
                    // score,
                }
            })
            // .sort((a, b) => {
            //     return b.score - a.score
            // })
            .map((item) => ({
                label: item.keyword,
                kind: monaco.languages.CompletionItemKind.Enum,
                insertText: backquote ? `\`${item.keyword}\`` : item.keyword,
                detail,
            }))
    }

    function getSymbolSuggest() {
        const fields = [
            '=',
            '<>',
            '>',
            '>=',
            '<',
            '<=',
            'IN',
            'NOT IN',
            'LIKE',
            `LIKE '%%'`,
            'IS NULL',
            'IS NOT NULL',
        ]
        return fields
            .map((key) => {
                let score = 0
                if (key == 'SELECT') {
                    score = 100
                }
                return {
                    keyword: key,
                    score,
                }
            })
            // .sort((a, b) => {
            //     return b.score - a.score
            // })
            .map((item) => ({
                label: item.keyword,
                kind: monaco.languages.CompletionItemKind.Enum,
                insertText: item.keyword,
            }))
    }

    function getAllFieldSuggest() {

        let fields = [
            // 'id',
            // 'name',
            ...allFieldMap,
        ]
        // if (allFieldMap)
        return fields
            .map((key) => {
                let score = 0
                if (key == 'SELECT') {
                    score = 100
                }
                return {
                    keyword: key,
                    score,
                }
            })
            // .sort((a, b) => {
            //     return b.score - a.score
            // })
            .map((item) => ({
                label: item.keyword,
                kind: monaco.languages.CompletionItemKind.Enum,
                insertText: `\`${item.keyword}\``,
                detail: i18n.t('column'),
            }))
    }

    // 获取 SQL 语法提示
    function getSQLSuggest() {
        console.log('monaco/getSQLSuggest')
        return keywords
            .map((key) => {
                let score = 0
                if (key == 'SELECT') {
                    score = 100
                }
                return {
                    keyword: key,
                    score,
                }
            })
            .sort((a, b) => {
                return b.score - a.score
            })
            .map((item) => ({
                label: item.keyword,
                kind: monaco.languages.CompletionItemKind.Enum,
                insertText: item.keyword,
                // insertText: item.keyword + ' ',
            }))
    }
    
    

    function getFunctionSuggest() {
        const list = [
            'COUNT',
        ]
        return list2Suggest(list)
    }

    function getDBSuggest() {
        console.log('db?', i18n.language, window.g_editorConnectionId, hintData)
        let schemas
        if (window.g_editorConnectionId && connectionSchemaMap[window.g_editorConnectionId]) {
            schemas = connectionSchemaMap[window.g_editorConnectionId]
        }
        else {
            schemas = Object.keys(hintData)
        }
        const results = schemas
            .map((key) => {
                const name = `\`${key}\``
                return {
                    label: key,
                    kind: monaco.languages.CompletionItemKind.Constant,
                    insertText: name,
                    detail: i18n.t('schema'),
                    // documentation: '这是文档',
                }
            })
        return results
    }
    
    // console.log('monaco.registerCompletionItemProvider',)
    if (window.g_init) {
        window.g_completionItemProvider && window.g_completionItemProvider.dispose()
        window.g_init = null
    }
    if (!window.g_init) {
        window.g_init = true
        console.log('dispose/g_init', 223567)
        window.g_completionItemProvider = monaco.languages.registerCompletionItemProvider('sql', {
            triggerCharacters: ['', '\n', ':', '.', ' ', ...all_keyword],
            provideCompletionItems: (model, position, context, token) => {
                console.log('monaco/provideCompletionItems', model, position, context, token)
                console.log('monaco/provideCompletionItems/context', context)
                let suggestions: any[] = []
        
                const { lineNumber, column } = position
                console.log('monaco/position', lineNumber, column)
        
                let startLineNumber = lineNumber
                if (startLineNumber > 1) {
                    startLineNumber -= 1
                }
                const textBeforePointer = model.getValueInRange({
                    startLineNumber,
                    startColumn: 0,
                    endLineNumber: lineNumber,
                    endColumn: column,
                })
        
                const tokens = textBeforePointer.trim().split(/\s+/)
                console.log('monaco/tokens', tokens)
                const lastToken = tokens[tokens.length - 1] // 获取最后一段非空字符串
                console.log('monaco/lastToken', lastToken)
                const lastTokenLowerCase = lastToken.toLowerCase()
                console.log('monaco/lastTokenLowerCase', lastTokenLowerCase)
        
                if (lastToken.endsWith('.')) {
                    console.log('monaco/match', 'endsWith .')
                    const tokenNoDot = lastToken.slice(0, lastToken.length - 1).replaceAll('`', '')
                    console.log('tokenNoDot', tokenNoDot)
                    const asList = []
                    for (let idx = 0; idx < tokens.length; idx++) {
                        const token = tokens[idx]
                        if ((token.startsWith('a') || token.startsWith('A')) && token.toLowerCase() == 'as') {
                            const nextToken = tokens[idx + 1]
                            if (nextToken) {
                                asList.push(nextToken.replaceAll('`', ''))
                            }
                        }
                    }
                    console.log('asList', asList)
                    if (asList.includes(tokenNoDot)) {
                        suggestions = [
                            ...getAllFieldSuggest()
                        ]
                    }
                    else {
                        if (Object.keys(hintData).includes(tokenNoDot)) {
                            suggestions = [...getTableSuggest(tokenNoDot)]
                        }
                    }
                }
                // Before from
                else if (lastTokenLowerCase === 'where' || lastTokenLowerCase === 'and' || lastTokenLowerCase === 'or') {
                    console.log('monaco/match', 'where')
                    // console.log('monaco/match', 'where', tokens)
                    // if (tokens.includes('AS')) {}
                    const asList = []
                    for (let idx = 0; idx < tokens.length; idx++) {
                        const token = tokens[idx]
                        if ((token.startsWith('a') || token.startsWith('A')) && token.toLowerCase() == 'as') {
                            const nextToken = tokens[idx + 1]
                            if (nextToken) {
                                asList.push(nextToken.replaceAll('`', ''))
                            }
                        }
                    }
                    console.log('asList', asList)
                    
                    // select xx from xxx where
                    // select xx from `xxx`.`xxx` where

                    let tableName
                    tokens.forEach((token, idx) => {
                        if (token.toLowerCase() == 'from' && tokens[idx + 1]) {
                            tableName = aftersplit(tokens[idx + 1])
                            console.log('tableName', tableName)
                        }
                    })
                    // for (let token of tokens) {
                    // }
                    // if (tokens[tokens.length - 3]?.toLowerCase() == 'from') {
                    //     tableName = tokens[tokens.length - 2].split('.')[1].replaceAll('`', '')
                    //     console.log('tableName', tableName)
                    // }

                    let fields = []
                    if (tableName && tableFieldMap[tableName]) {
                        fields = list2Suggest(tableFieldMap[tableName], {
                            backquote: true,
                            detail: i18n.t('column'),
                        })
                    }
                    else {
                        fields = getAllFieldSuggest()
                    }
                    console.log('fields ', fields, tableFieldMap)

                    suggestions = [
                        ...list2Suggest(asList, {
                            backquote: true,
                        }),
                        ...fields,
                    ]
                }
                // order ?
                else if (lastTokenLowerCase == 'order') {
                    suggestions = [
                        ...list2Suggest(['BY'])
                    ]
                }
                // group ?
                else if (lastTokenLowerCase == 'group') {
                    suggestions = [
                        ...list2Suggest(['BY'])
                    ]
                }
                // by ?
                else if (lastTokenLowerCase == 'by') {
                    suggestions = [...getAllFieldSuggest()]
                }
                // select ?（before 「want to select」）
                else if (lastTokenLowerCase == 'select') {
                    suggestions = [
                        ...list2Suggest(['*', 'ALL']),
                        ...getFunctionSuggest(),
                        ...getAllFieldSuggest()
                    ]
                }
                // want to select
                else if (tokens.length == 1 && 'select'.startsWith(lastTokenLowerCase)) {
                    suggestions = [
                        ...list2Suggest([
                            'SELECT',
                            'SELECT * FROM',
                        ]),
                    ]
                }
                // update ?
                else if (lastTokenLowerCase == 'update') {
                    suggestions = [
                        // ...list2Suggest(['*', 'ALL']),
                        // ...getFunctionSuggest(),
                        // ...getFieldSuggest()
                        ...getAllTableSuggest(),
                    ]
                }
                // update xx ?
                else if (tokens[tokens.length - 2]?.toLowerCase() == 'update') {
                    suggestions = [
                        ...list2Suggest(['SET']),
                    ]
                }
                // update xx set ?
                else if (lastTokenLowerCase == 'set') {
                    suggestions = [
                        ...getAllFieldSuggest()
                    ]
                }
                // delete ?
                else if (lastTokenLowerCase == 'delete') {
                    suggestions = [
                        ...list2Suggest(['FROM']),
                    ]
                }
                // want to delete
                else if (tokens.length == 1 && 'delete'.startsWith(lastTokenLowerCase)) {
                    console.log('monaco/match', 'want to delete')
                    // else if (tokens.length == 1 && tokens[0] == 'i') {
                    suggestions = [
                        ...list2Suggest(['DELETE FROM']),
                    ]
                }
                // delete from xx
                else if (tokens[tokens.length - 3]?.toLowerCase() == 'delete' && tokens[tokens.length - 2]?.toLowerCase() == 'from') {
                    suggestions = [
                        ...list2Suggest(['WHERE']),
                    ]
                }
                // insert ? (must before 「want to insert」)
                else if (lastTokenLowerCase == 'insert') {
                    console.log('monaco/match', 'nsert ? (must before 「want to insert」)')
                    suggestions = [
                        ...list2Suggest(['INTO']),
                    ]
                }
                // want to insert
                else if (tokens.length == 1 && 'insert'.startsWith(lastTokenLowerCase)) {
                    console.log('monaco/match', 'want to insert')
                    // else if (tokens.length == 1 && tokens[0] == 'i') {
                    suggestions = [
                        ...list2Suggest(['INSERT INTO']),
                    ]
                }
                // insert into ?
                else if (tokens[tokens.length - 2]?.toLowerCase() == 'insert' && tokens[tokens.length - 1]?.toLowerCase() == 'into') {
                    console.log('monaco/match', 'insert into ?')
                    suggestions = [
                        ...getDBSuggest(),
                        ...getAllTableSuggest(),
                    ]
                }
                // insert into xx ?
                else if (tokens[tokens.length - 3]?.toLowerCase() == 'insert' && tokens[tokens.length - 2]?.toLowerCase() == 'into') {
                    console.log('monaco/match', 'insert into xx ?')
                    suggestions = [
                        ...list2Suggest(['()']),
                        ...list2Suggest(['VALUES']),
                    ]
                }
                // insert into xx (?)
                else if (lastTokenLowerCase.includes('(')) {
                    console.log('monaco/match', 'insert into xx (?)')
                    suggestions = [
                        ...getAllFieldSuggest(),
                    ]
                }
                // left ?
                else if (lastTokenLowerCase == 'left') {
                    suggestions = [
                        ...list2Suggest(['JOIN']),
                    ]
                }
                // inner ?
                else if (lastTokenLowerCase == 'inner') {
                    suggestions = [
                        ...list2Suggest(['JOIN']),
                    ]
                }
                // join?
                else if (lastTokenLowerCase == 'join') {
                    suggestions = [
                        ...getAllTableSuggest(),
                    ]
                }
                else if (lastTokenLowerCase == 'from') {
                    console.log('monaco/match', 'from')
                    suggestions = [
                        ...getDBSuggest(),
                        ...getAllTableSuggest(),
                        // ...getSQLSuggest(),
                    ]
                }
                else if (lastTokenLowerCase == '*') {
                    suggestions = [
                        ...list2Suggest(['FROM']),
                        // ...getFieldSuggest()
                    ]
                }
                else if (lastToken === '.') {
                    console.log('monaco/match', '.')
                    suggestions = [
                        ...getAllFieldSuggest(),
                    ]
                }
                else if (lastToken.endsWith(',')) {
                    console.log('monaco/match', 'field_more')
                    suggestions = [
                        ...getAllFieldSuggest(),
                    ]
                }
                else if (lastToken.endsWith('`')) {
                    console.log('monaco/match', 'field_after')
                    if (tokens[tokens.length - 2]?.toLowerCase() == 'from') {
                        // suggestions = list2Suggest(['WHERE'])
                        return {
                            suggestions: list2Suggest(['WHERE', 'AS', 'ORDER BY', 'GROUP BY', 'LEFT JOIN', 'INNER JOIN'])
                        }
                    }
                    else if (tokens.length >= 3) {
                        console.log('??', tokens[tokens.length - 2])
                        // ORDER BY xx 
                        if (tokens[tokens.length - 3].toLowerCase() == 'order' && tokens[tokens.length - 2].toLowerCase() == 'by') {
                            return {
                                suggestions: list2Suggest(['ASC', 'DESC'])
                            }
                        }
                        // ORDER BY xx d
                        else if (tokens[tokens.length - 4].toLowerCase() == 'order' && tokens[tokens.length - 3].toLowerCase() == 'by'
                            && tokens[tokens.length - 2] && !mysqlAllKeywordMap[tokens[tokens.length - 2]]) {
                            return {
                                suggestions: list2Suggest(['ASC', 'DESC'])
                            }
                        }
                    }
                    suggestions = [...getSymbolSuggest()]
                }
                else if (mysqlAllKeywordMap[lastToken.toUpperCase()]) {
                    console.log('monaco/match', 'other keyword')
                    suggestions = [...getDBSuggest(), ...getSQLSuggest()]
                }
                else {
                    console.log('monaco/match', 'unknown')
                    suggestions = [
                        ...getDBSuggest(),
                        // ...getSQLSuggest()
                        ...list2Suggest(all_keyword),
                    ]
                }
        
                return {
                    suggestions,
                }
            },
        })
    }
}

export function suggestionAdd(dbName, tables) {
    // console.log('suggestionAdd', dbName, tables)
    hintData[dbName] = tables
}

export function suggestionAddSchemas(connectionId, names) {
    // console.log('suggestionAdd', dbName, tables)
    for (let name of names) {
        if (!hintData[name]) {
            hintData[name] = []
        }
    }
    connectionSchemaMap[connectionId] = names
}

export function setAllFields(dbName, fields) {
    // console.log('suggestionAdd', dbName, tables)
    // allFieldMap[dbName] = fields
    allFieldMap = fields
}

export function setTabbleAllFields(tableName: string, fields: string[]) {
    // console.log('suggestionAdd', dbName, tables)
    // allFieldMap[dbName] = fields
    tableFieldMap[tableName] = fields
    // allFieldMap = fields
}

export function getTableFieldMap() {
    return tableFieldMap
}