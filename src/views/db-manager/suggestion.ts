import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { language } from 'monaco-editor/esm/vs/basic-languages/sql/sql.js'

const { keywords } = language
// const keywords = ['SELECT', 'FROM', 'WHERE']
// console.log('keywords', JSON.stringify(keywords))

const hintData = {
    // adbs: ['dim_realtime_recharge_paycfg_range', 'dim_realtime_recharge_range'],
    // dimi: ['ads_adid', 'ads_spec_adid_category'],
    edu: ['students', 'course'],
}

function getTableSuggest(dbName) {
    const tableNames = hintData[dbName]
    if (!tableNames) {
        return []
    }
    return tableNames.map((name) => ({
        label: name,
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: name,
    }))
}

// 获取 SQL 语法提示
function getSQLSuggest() {
    return keywords.map((key) => ({
        label: key,
        kind: monaco.languages.CompletionItemKind.Enum,
        insertText: key,
    }))
}

function getDBSuggest() {
    return Object.keys(hintData).map((key) => ({
        label: key,
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: key,
    }))
}

console.log('monaco.registerCompletionItemProvider',)
monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: [':', '.', ...keywords],
    provideCompletionItems: (model, position) => {
        console.log('monaco.provideCompletionItems',)
        let suggestions: any[] = []

        const { lineNumber, column } = position

        const textBeforePointer = model.getValueInRange({
            startLineNumber: lineNumber,
            startColumn: 0,
            endLineNumber: lineNumber,
            endColumn: column,
        })

        const tokens = textBeforePointer.trim().split(/\s+/)
        const lastToken = tokens[tokens.length - 1] // 获取最后一段非空字符串

        if (lastToken.endsWith('.')) {
            const tokenNoDot = lastToken.slice(0, lastToken.length - 1)
            if (Object.keys(hintData).includes(tokenNoDot)) {
                suggestions = [...getTableSuggest(tokenNoDot)]
            }
        } else if (lastToken === '.') {
            suggestions = []
        } else {
            suggestions = [...getDBSuggest(), ...getSQLSuggest()]
        }

        return {
            suggestions,
        }
    },
})

export function suggestionInit() {

}

export function suggestionAdd(dbName, tables) {
    console.log('suggestionAdd', dbName, tables)
    hintData[dbName] = tables
}
