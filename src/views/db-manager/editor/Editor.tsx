import { VFC, useRef, useState, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import styles from './Editor.module.css';
import '../suggestion.ts'
import { suggestionInit } from '../suggestion';

suggestionInit()

export const Editor: VFC = ({ lang = 'sql', value, onChange, onEditor }) => {
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
