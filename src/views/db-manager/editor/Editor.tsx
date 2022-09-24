import { VFC, useRef, useState, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import styles from './Editor.module.css';
import '../suggestion.ts'
import { suggestionInit } from '../suggestion';
import { getTheme } from '../../../theme'

suggestionInit()

export const Editor: VFC = ({ lang = 'sql', 
    event$,
    connectionId,
    value, 
    onChange,
    onEditor,
    onSelectionChange,
}) => {
	const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = useRef(null)
	const containerRef = useRef(null);

    console.warn('Editor/render')
    // value = { code }
    //  = { e => setCode(e.target.value)}
    
    event$ && event$.useSubscription(msg => {
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
        const handleResize = () => {
            // console.log('resize2', editor, editorRef.current)
            editorRef.current?.layout()
            // focus
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [editor, editorRef, editorRef.current])

	useEffect(() => {
        let _editor = editor
		if (containerRef && !editor && !editorRef.current) {
            console.log('dispose/create')
            const theme = getTheme()
            _editor = monaco.editor.create(containerRef.current!, {
                value: `{}`,
                theme: theme == 'light' ? 'vs-light' : 'vs-dark',
                // language: 'json',
                language: lang,
                minimap: {
                    enabled: false,
                },
                // tabSize: 4,
            })
            // console.log('_editor/mmm', _editor.getModel())
            _editor.getModel().onDidChangeContent((event) => {
                const newValue = _editor?.getValue()
                // console.log('onDidChangeContent', newValue)
                onChange && onChange(newValue)
            })
            // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneCodeEditor.html#onDidFocusEditorText
            _editor.onDidFocusEditorText((event) => {
                // console.log('onDidFocusEditorText')
                window.g_editorConnectionId = connectionId
            })
            _editor.onDidChangeCursorSelection((event) => {
                // console.log('onDidChangeCursorSelection', event)
                // window.g_editorConnectionId = connectionId
                const { selection } = event
                // endColumn: 5
                // endLineNumber: 1
                // positionColumn: 5
                // positionLineNumber: 1
                // selectionStartColumn: 5
                // selectionStartLineNumber: 1
                // startColumn: 5
                // startLineNumber: 1
                const selectionValue = _editor.getModel().getValueInRange(selection)
                // console.log('selectionValue', selectionValue)

                onSelectionChange && onSelectionChange({
                    selection,
                    selectionTextLength: selectionValue.length,
                })

            })
            
            // _editor.onDidBlurEditorText((event) => {
            //     console.log('onDidBlurEditorText')
            // })
            // console.log('_editor', _editor)
			setEditor(_editor);
            editorRef.current = _editor
            // console.log('赋值了啊', editorRef.current)
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
            // console.log('dispose/dispose')
            editor?.dispose()
            // console.log('取消赋值')
            // 下面两句会导致编辑器对象获取不到
            // editorRef.current = null
            // setEditor(null)

            // window.g_completionItemProvider && window.g_completionItemProvider.dispose()
        }
    }, [containerRef.current, value]);


	return (
        <div
            className={styles.Editor}
            ref={containerRef}
        ></div>
    )
};
