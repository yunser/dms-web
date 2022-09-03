import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { language } from 'monaco-editor/esm/vs/basic-languages/sql/sql.js'
import { mysql_keywords } from './mysql/keywords';

const { keywords: all_keyword } = language

// 用于判断是否 MySQL 关键词
let mysqlAllKeywordMap = {}
all_keyword.forEach(keyword => {
    mysqlAllKeywordMap[keyword] = 1
})
// const keywords = ['SELECT', 'FROM', 'WHERE']
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

let g_init = false

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
        }))
    }
    
    function list2Suggest(list, { backquote = false } = {}) {
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
            }))
    }

    function getSymbolSuggest() {
        const fields = [
            '=',
            '<>',
            '>',
            '<',
            'IN',
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

    function getFieldSuggest() {

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
        // return [
        //     {
        //         label: 'SELECT * FROM ',
        //         kind: monaco.languages.CompletionItemKind.Constant,
        //         insertText: 'SELECT * FROM',
        //     }
        // ]
    }
    
    

    function getFunctionSuggest() {
        const list = [
            'COUNT',
        ]
        return list2Suggest(list)
    }

    function getDBSuggest() {
        const results = Object.keys(hintData)
            .map((key) => {
                const name = `\`${key}\``
                return {
                    label: name,
                    kind: monaco.languages.CompletionItemKind.Constant,
                    insertText: name,
                }
            })
        // results.unshift({
        //     label: 'SELECT * FROM ',
        //     kind: monaco.languages.CompletionItemKind.Constant,
        //     insertText: 'SELECT * FROM',
        // })
        // return [
        //     {
        //         label: 'SELECT * FROM ',
        //         kind: monaco.languages.CompletionItemKind.Constant,
        //         insertText: 'SELECT * FROM',
        //     }
        // ]
        return results
    }
    
    // console.log('monaco.registerCompletionItemProvider',)
    if (!g_init) {
        monaco.languages.registerCompletionItemProvider('sql', {
            triggerCharacters: ['', '\n', ':', '.', ' ', ...all_keyword],
            provideCompletionItems: (model, position) => {
                console.log('monaco/provideCompletionItems',)
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
                    const tokenNoDot = lastToken.slice(0, lastToken.length - 1)
                    if (Object.keys(hintData).includes(tokenNoDot)) {
                        suggestions = [...getTableSuggest(tokenNoDot)]
                    }
                }
                // Before from
                else if (lastToken === 'WHERE' || lastToken === 'where') {
                    console.log('monaco/match', 'where')
                    suggestions = [...getFieldSuggest()]
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
                    suggestions = [...getFieldSuggest()]
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
                // select ?
                else if (lastTokenLowerCase == 'select') {
                    suggestions = [
                        ...list2Suggest(['*', 'ALL']),
                        ...getFunctionSuggest(),
                        ...getFieldSuggest()
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
                        ...getFieldSuggest()
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
                        ...getFieldSuggest(),
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
                        ...getFieldSuggest(),
                    ]
                }
                else if (lastToken.endsWith(',')) {
                    console.log('monaco/match', 'field_more')
                    suggestions = [
                        ...getFieldSuggest(),
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

export function setAllFields(dbName, fields) {
    // console.log('suggestionAdd', dbName, tables)
    // allFieldMap[dbName] = fields
    allFieldMap = fields
}
