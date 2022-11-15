// Generated from java-escape by ANTLR 4.11.1
// jshint ignore: start
import antlr4 from 'antlr4';


const serializedATN = [4,0,3,16,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,1,0,1,0,1,1,
1,1,1,2,4,2,13,8,2,11,2,12,2,14,0,0,3,1,1,3,2,5,3,1,0,1,1,0,48,57,16,0,1,
1,0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,1,7,1,0,0,0,3,9,1,0,0,0,5,12,1,0,0,0,7,8,
5,58,0,0,8,2,1,0,0,0,9,10,5,61,0,0,10,4,1,0,0,0,11,13,7,0,0,0,12,11,1,0,
0,0,13,14,1,0,0,0,14,12,1,0,0,0,14,15,1,0,0,0,15,6,1,0,0,0,2,0,14,0];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

export default class KVLexer extends antlr4.Lexer {

    static grammarFileName = "KV.g4";
    static channelNames = [ "DEFAULT_TOKEN_CHANNEL", "HIDDEN" ];
	static modeNames = [ "DEFAULT_MODE" ];
	static literalNames = [ null, "':'", "'='" ];
	static symbolicNames = [ null, null, null, "INT" ];
	static ruleNames = [ "T__0", "T__1", "INT" ];

    constructor(input) {
        super(input)
        this._interp = new antlr4.atn.LexerATNSimulator(this, atn, decisionsToDFA, new antlr4.PredictionContextCache());
    }

    get atn() {
        return atn;
    }
}

KVLexer.EOF = antlr4.Token.EOF;
KVLexer.T__0 = 1;
KVLexer.T__1 = 2;
KVLexer.INT = 3;



