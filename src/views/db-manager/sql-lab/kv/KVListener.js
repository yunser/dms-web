// Generated from java-escape by ANTLR 4.11.1
// jshint ignore: start
import antlr4 from 'antlr4';

// This class defines a complete listener for a parse tree produced by KVParser.
export default class KVListener extends antlr4.tree.ParseTreeListener {

	// Enter a parse tree produced by KVParser#prog.
	enterProg(ctx) {
        console.log('enterProg')
	}

	// Exit a parse tree produced by KVParser#prog.
	exitProg(ctx) {
        console.log('exitProg')
	}


	// Enter a parse tree produced by KVParser#expr.
	enterExpr(ctx) {
        console.log('enterExpr')
	}

	// Exit a parse tree produced by KVParser#expr.
	exitExpr(ctx) {
        console.log('exitExpr')
	}



}