// Generated from java-escape by ANTLR 4.11.1
// jshint ignore: start
import antlr4 from 'antlr4';
import KVListener from './KVListener.js';
const serializedATN = [4,1,3,14,2,0,7,0,2,1,7,1,1,0,1,0,1,0,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,0,0,2,0,2,0,0,11,0,4,1,0,0,0,2,7,1,0,0,0,4,5,3,2,1,0,5,6,
5,0,0,1,6,1,1,0,0,0,7,8,5,3,0,0,8,9,5,1,0,0,9,10,5,3,0,0,10,11,5,2,0,0,11,
12,5,3,0,0,12,3,1,0,0,0,0];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.PredictionContextCache();

export default class KVParser extends antlr4.Parser {

    static grammarFileName = "java-escape";
    static literalNames = [ null, "':'", "'='" ];
    static symbolicNames = [ null, null, null, "INT" ];
    static ruleNames = [ "prog", "expr" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = KVParser.ruleNames;
        this.literalNames = KVParser.literalNames;
        this.symbolicNames = KVParser.symbolicNames;
    }

    get atn() {
        return atn;
    }



	prog() {
	    let localctx = new ProgContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, KVParser.RULE_prog);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 4;
	        this.expr();
	        this.state = 5;
	        this.match(KVParser.EOF);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	expr() {
	    let localctx = new ExprContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 2, KVParser.RULE_expr);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 7;
	        this.match(KVParser.INT);
	        this.state = 8;
	        this.match(KVParser.T__0);
	        this.state = 9;
	        this.match(KVParser.INT);
	        this.state = 10;
	        this.match(KVParser.T__1);
	        this.state = 11;
	        this.match(KVParser.INT);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}


}

KVParser.EOF = antlr4.Token.EOF;
KVParser.T__0 = 1;
KVParser.T__1 = 2;
KVParser.INT = 3;

KVParser.RULE_prog = 0;
KVParser.RULE_expr = 1;

class ProgContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = KVParser.RULE_prog;
    }

	expr() {
	    return this.getTypedRuleContext(ExprContext,0);
	};

	EOF() {
	    return this.getToken(KVParser.EOF, 0);
	};

	enterRule(listener) {
	    if(listener instanceof KVListener ) {
	        listener.enterProg(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof KVListener ) {
	        listener.exitProg(this);
		}
	}


}



class ExprContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = KVParser.RULE_expr;
    }

	INT = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(KVParser.INT);
	    } else {
	        return this.getToken(KVParser.INT, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof KVListener ) {
	        listener.enterExpr(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof KVListener ) {
	        listener.exitExpr(this);
		}
	}


}




KVParser.ProgContext = ProgContext; 
KVParser.ExprContext = ExprContext; 
