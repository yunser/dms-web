import antlr4 from 'antlr4';
import MyGrammarLexer from './KVLexer.js';
import MyGrammarParser from './KVParser.js';
import MyGrammarListener from './KVListener.js';

const input = "12:34=56"
const chars = new antlr4.InputStream(input);
const lexer = new MyGrammarLexer(chars);
const tokens = new antlr4.CommonTokenStream(lexer);
const parser = new MyGrammarParser(tokens);
// parser.buildParseTrees = true;
const tree = parser.prog()
console.log('tree', tree)
// const tree = parser.MyStartRule();