import { VFC, useRef, useState, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import styles from './Editor.module.css';
import '../suggestion.ts'
import { suggestionInit } from '../suggestion';
import { getTheme } from '../../../theme'
import { useInterval } from 'ahooks';

suggestionInit()

export const Editor: VFC = ({ lang = 'sql', 
    autoFocus = true,
    event$,
    connectionId,
    value, 
    onChange,
    onEditor,
    onSelectionChange,
}) => {
    const editorRef = useRef(null)
	const containerRef = useRef<HTMLElement>(null);

    console.warn('Editor/render')
    // value = { code }
    //  = { e => setCode(e.target.value)}
    const refData = useRef({
        selection: null,
    })
    
    event$ && event$.useSubscription(msg => {
        // console.log(val);
        if (msg.type == 'type_theme_changed') {
            const { theme } = msg.data
            console.log('type_theme_changed', msg.data, editorRef)
            monaco.editor.setTheme(theme == 'light' ? 'vs-light' : 'vs-dark')
            // monaco.editor.defineTheme('myTheme', {
            //     base: 'vs',
            //     inherit: true,
            //     rules: [{ background: 'EDF9FA' }],
            //     colors: {
            //         'editor.lineHighlightBackground': '#00000000',
            //         'editor.lineHighlightBorder': '#00000000'
            //     }
            // })
            // monaco.editor.setTheme('myTheme')
            if (editorRef.current) {
                // monaco.editor.
            }
        }
    }, [])

    useEffect(() => {
        const handleResize = () => {
            // console.log('resize2', editor, editorRef.current)
            editorRef.current?.layout()
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [editorRef, editorRef.current])

	useEffect(() => {
        let _editor = null
        console.log('Editor/life/check', containerRef.current)
		if (containerRef && !editorRef.current) {
            console.log('Editor/life/create')
            console.log('Editor/life/html', containerRef.current?.innerHTML)
            const theme = getTheme()
            _editor = monaco.editor.create(containerRef.current!, {
                value: `{}`,
                theme: theme == 'light' ? 'vs-light' : 'vs-dark',
                // language: 'json',
                language: lang,
                minimap: {
                    enabled: false,
                },
                // renderLineHighlight: "line",
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
                
                refData.current.selection = selection
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
            editorRef.current = _editor
            // console.log('赋值了啊', editorRef.current)
            onEditor && onEditor(_editor)
            if (autoFocus) {
                setTimeout(() => {
                    _editor?.focus()
                }, 0)
            }
            console.log('Editor/life/created')
            setTimeout(() => {
                editorRef.current?.layout()

            }, 0)
		}
        // if (_editor && (value || value === '')) {
        //     // console.log('editor', _editor.getValue)
        //     if (value != _editor?.getValue()) {
        //         // console.log('compare', value, _editor?.getValue())
        //         // console.log('setValue', value)
        //         console.log('degg/setValue in')
        //         _editor.setValue(value)
        //     }
        // }
		return () => {
            console.log('Editor/life/dispose', editorRef.current)
            console.log('Editor/life/editorRef.current', editorRef.current)
            
            editorRef.current?.dispose()
            editorRef.current = null
            if (containerRef.current) {
                containerRef.current.innerHTML = ''
            }
            // console.log('取消赋值')
            // 下面两句会导致编辑器对象获取不到
            // editorRef.current = null

            // window.g_completionItemProvider && window.g_completionItemProvider.dispose()
        }
    }, [containerRef.current]);

    // useInterval(() => {
    //     if (!containerRef.current) {
    //         return
    //     }
    //     if (!editorRef.current) {
    //         return
    //     }
    //     const elem = containerRef.current.children[0]
    //     if (!elem) {
    //         return
    //     }
    //     // console.log('elem.clientWidth', elem.clientWidth, elem.clientHeight)
    //     // console.log('ele', window.getComputedStyle(elem).display)
    //     if (elem.clientWidth) {
    //         // editorRef.current?.layout()
    //     }
    // }, 1000)

    useEffect(() => {
        const _editor = editorRef.current
        if (_editor && (value || value === '')) {
            // console.log('editor', _editor.getValue)
            if (value != _editor?.getValue()) {
                console.log('degg/setValue in')
                _editor.setValue(value)
            }
        }
    }, [containerRef.current, value]);

	return (
        <div
            className={styles.Editor}
            ref={containerRef}
        ></div>
    )
};
