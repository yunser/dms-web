// import * as monaco from 'monaco-editor';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// import * as monaco from 'monaco-editor/esm/vs/editor/editor.all.js';
// import './contrib/suggest/browser/suggestController.js';
// import './contrib/suggest/browser/suggestInlineCompletions.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestInlineCompletions.js';



// import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
// import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
console.log('monaco', 'import sql')
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';
// import 'monaco-editor/esm/vs/basic-languages/monaco.contribution';

// 首先，我们自己可以设想一下，假如要自己来实现代码补全以及错误提示，我们会怎么做？
// 第一，我们要解析输入的文本，这时，我们就需要写一个Parser。
// 第二，根据Parser解析的结果来调用monaco的标注接口来标注错误的代码从而实现错误提示功能
// 第三，根据Parser解析的结果信息，提供上下文相关的代码候选项来实现代码补全功能。
// 可以看出来，实现起来难度会很大，涉及到的点很多，不过，和语法高亮一样，monaco也帮助我们实现了这些功能，
// 目前支持html，css，ts / js，json四种语言，我们只需要引入即可。但是这边的引入可没有语法高亮那么简单。
// Monaco的实现采用worker的方式，因为语法解析需要耗费大量时间，所以用worker来异步处理返回结果比较高效。我们使用的话需要两步。


import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
// import sqlWorker from 'monaco-editor/esm/vs/basic-languages/sql/sql.worker?worker';

// @ts-ignore
self.MonacoEnvironment = {
    getWorker(_: any, label: string) {
        // 
        console.log('monaco.getWorker', label)
        // 全部引入时会调用（即使editor 里没有其他提示逻辑），输出：
        // getWorker editorWorkerService
        // 部分引入不会，为什么？

        // if (label === 'sql') {
        //     return new sqlWorker();
        // }
		// if (label === 'json') {
		// 	return new jsonWorker();
		// }
		// if (label === 'css' || label === 'scss' || label === 'less') {
		// 	return new cssWorker();
		// }
		// if (label === 'html' || label === 'handlebars' || label === 'razor') {
		// 	return new htmlWorker();
		// }
		// if (label === 'typescript' || label === 'javascript') {
		// 	return new tsWorker();
		// }
        // 这边默认会加载一个editor.worker.js，这是一个基础功能文件，提供了所有语言通用的功能（例如已定义常量的代码补全提示），
        // 无论使用什么语言，monaco都会去加载他。
		return new editorWorker();
	}
};
// 无法去掉，不然没法高亮，很奇怪？
// 可以实现高亮了，但代码提示没用实现
// 全局引入即使没用 worker 和 这一行也可以高亮和代码提示
// monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
console.log('monaco.languages', monaco.languages)
console.log('monaco.getLanguages', monaco.languages.getLanguages())
// console.log('monaco.getLanguages', monaco.getLanguages())
// 全部 css html json typescript
