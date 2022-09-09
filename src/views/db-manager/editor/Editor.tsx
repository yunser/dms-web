import { VFC, useRef, useState, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import styles from './Editor.module.css';
import '../suggestion.ts'
import { suggestionInit } from '../suggestion';
import { getTheme } from '../../../theme'

suggestionInit()

export const Editor: VFC = ({ lang = 'sql', event$, value, onChange, onEditor }) => {
	const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = useRef(null)
	const monacoEl = useRef(null);

    // value = { code }
    //  = { e => setCode(e.target.value)}
    
    event$.useSubscription(msg => {
        console.log('dbManager/onmessage', msg)
        // console.log(val);
        if (msg.type == 'type_theme_changed') {
            const { theme } = msg.data
            console.log('type_theme_changed', msg.data, editorRef)
            monaco.editor.setTheme(theme == 'light' ? 'vs-light' : 'vs-dark')
            if (editorRef.current) {
                console.log('editor', editor)
                // monaco.editor.
            }
        }
    }, [editor])

	useEffect(() => {
        let _editor = editor
		if (monacoEl && !editor) {
            const theme = getTheme()
            _editor = monaco.editor.create(monacoEl.current!, {
                value: `{}`,
                theme: theme == 'light' ? 'vs-light' : 'vs-dark',
                // language: 'json',
                language: lang,
                minimap: {
                    enabled: false,
                },
                // tabSize: 4,
            })
            _editor.getModel().onDidChangeContent((event) => {
                const newValue = _editor?.getValue()
                // console.log('onDidChangeContent', newValue)
                onChange && onChange(newValue)
            });
			setEditor(_editor);
            editorRef.current = _editor
            onEditor && onEditor(_editor)
            setTimeout(() => {
                _editor?.focus()
            }, 0)
		}
        // if (monacoEl) {
        //     console.log('monacoEl', monacoEl.current.getValue)
        // }
        if (_editor && (value || value === '')) {
            // console.log('editor', _editor.getValue)
            if (value != _editor?.getValue()) {
                // console.log('compare', value, _editor?.getValue())
                // console.log('setValue', value)
                _editor.setValue(value)
            }
        }
        // if (monacoEl && value) {
        //     monacoEl.setValue(value)
        // }
		return () => {
            // console.log('editor.dispose')
            editor?.dispose();
            setEditor(null)
        }
    }, [monacoEl.current, value]);


	return (
        <div
            className={styles.Editor}
            ref={monacoEl}
        ></div>
    )
};
