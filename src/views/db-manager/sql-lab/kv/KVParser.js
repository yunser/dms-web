// Generated from java-escape by ANTLR 4.11.1
// jshint ignore: start
import antlr4 from 'antlr4';
import KVListener from './KVListener.js';
const serializedATN = [4,1,16,21,2,0,7,0,2,1,7,1,2,2,7,2,1,0,1,0,1,0,1,1,
1,1,1,1,1,2,1,2,1,2,1,2,1,2,1,2,3,2,19,8,2,1,2,0,0,3,0,2,4,0,0,18,0,6,1,
0,0,0,2,9,1,0,0,0,4,12,1,0,0,0,6,7,3,4,2,0,7,8,5,0,0,1,8,1,1,0,0,0,9,10,
5,6,0,0,10,11,5,0,0,1,11,3,1,0,0,0,12,13,5,1,0,0,13,14,5,6,0,0,14,15,5,2,
0,0,15,18,5,11,0,0,16,17,5,3,0,0,17,19,5,9,0,0,18,16,1,0,0,0,18,19,1,0,0,
0,19,5,1,0,0,0,1,18];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.PredictionContextCache();

export default class KVParser extends antlr4.Parser {

    static grammarFileName = "java-escape";
    static literalNames = [ null, null, null, null, null, "','" ];
    static symbolicNames = [ null, "SELECT", "FROM", "WHERE", "YES_OR_NO", 
                             "SEP", "SelectItems", "SelectItem", "IDENTIFIER", 
                             "INT", "FLOAT", "TABLE_NAME", "WHERE_COND", 
                             "WS", "NUMBER", "FLOATP", "ATTRS" ];
    static ruleNames = [ "prog", "list", "expr" ];

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
	        this.state = 6;
	        this.expr();
	        this.state = 7;
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



	list() {
	    let localctx = new ListContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 2, KVParser.RULE_list);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 9;
	        this.match(KVParser.SelectItems);
	        this.state = 10;
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
	    this.enterRule(localctx, 4, KVParser.RULE_expr);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 12;
	        this.match(KVParser.SELECT);
	        this.state = 13;
	        this.match(KVParser.SelectItems);
	        this.state = 14;
	        this.match(KVParser.FROM);
	        this.state = 15;
	        this.match(KVParser.TABLE_NAME);
	        this.state = 18;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===3) {
	            this.state = 16;
	            this.match(KVParser.WHERE);
	            this.state = 17;
	            this.match(KVParser.INT);
	        }

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
KVParser.SELECT = 1;
KVParser.FROM = 2;
KVParser.WHERE = 3;
KVParser.YES_OR_NO = 4;
KVParser.SEP = 5;
KVParser.SelectItems = 6;
KVParser.SelectItem = 7;
KVParser.IDENTIFIER = 8;
KVParser.INT = 9;
KVParser.FLOAT = 10;
KVParser.TABLE_NAME = 11;
KVParser.WHERE_COND = 12;
KVParser.WS = 13;
KVParser.NUMBER = 14;
KVParser.FLOATP = 15;
KVParser.ATTRS = 16;

KVParser.RULE_prog = 0;
KVParser.RULE_list = 1;
KVParser.RULE_expr = 2;

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



class ListContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = KVParser.RULE_list;
    }

	SelectItems() {
	    return this.getToken(KVParser.SelectItems, 0);
	};

	EOF() {
	    return this.getToken(KVParser.EOF, 0);
	};

	enterRule(listener) {
	    if(listener instanceof KVListener ) {
	        listener.enterList(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof KVListener ) {
	        listener.exitList(this);
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

	SELECT() {
	    return this.getToken(KVParser.SELECT, 0);
	};

	SelectItems() {
	    return this.getToken(KVParser.SelectItems, 0);
	};

	FROM() {
	    return this.getToken(KVParser.FROM, 0);
	};

	TABLE_NAME() {
	    return this.getToken(KVParser.TABLE_NAME, 0);
	};

	WHERE() {
	    return this.getToken(KVParser.WHERE, 0);
	};

	INT() {
	    return this.getToken(KVParser.INT, 0);
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
KVParser.ListContext = ListContext; 
KVParser.ExprContext = ExprContext; 
