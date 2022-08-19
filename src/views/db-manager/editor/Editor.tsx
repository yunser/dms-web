import { VFC, useRef, useState, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import styles from './Editor.module.css';
import { language } from 'monaco-editor/esm/vs/basic-languages/sql/sql.js'

const { keywords } = language
console.log('keywords', keywords)

const hintData = {
    adbs: ['dim_realtime_recharge_paycfg_range', 'dim_realtime_recharge_range'],
    dimi: ['ads_adid', 'ads_spec_adid_category'],
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

monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: ['.', ...keywords],
    provideCompletionItems: (model, position) => {
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

export const Editor: VFC = ({ value, onChange }) => {
	const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoEl = useRef(null);

    // value = { code }
    //  = { e => setCode(e.target.value)}
    
	useEffect(() => {
        let _editor = editor
		if (monacoEl && !editor) {
            _editor = monaco.editor.create(monacoEl.current!, {
                value: `{}`,
                // language: 'json',
                language: 'sql',
                minimap: {
                    enabled: false,
                },
                // tabSize: 4,
            })
            _editor.getModel().onDidChangeContent((event) => {
                const newValue = _editor?.getValue()
                console.log('onDidChangeContent', newValue)
                onChange && onChange(newValue)
            });
			setEditor(_editor);
		}
        // if (monacoEl) {
        //     console.log('monacoEl', monacoEl.current.getValue)
        // }
        if (_editor && value) {
            // console.log('editor', _editor.getValue)
            if (value != _editor?.getValue()) {
                console.log('compare', value, _editor?.getValue())
                console.log('setValue', value)
                _editor.setValue(value)
            }
        }
        // if (monacoEl && value) {
        //     monacoEl.setValue(value)
        // }
		return () => editor?.dispose();
    }, [monacoEl.current, value]);

	return <div className={styles.Editor} ref={monacoEl}></div>;
};
