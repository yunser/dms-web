// Generated from /Users/yunser/app/dms-projects/sql-parse/kv/KV.g4 by ANTLR 4.9.2
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.misc.*;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class KVLexer extends Lexer {
	static { RuntimeMetaData.checkVersion("4.9.2", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		SELECT=1, FROM=2, WHERE=3, YES_OR_NO=4, SEP=5, SelectItems=6, SelectItem=7, 
		IDENTIFIER=8, INT=9, FLOAT=10, TABLE_NAME=11, WHERE_COND=12, WS=13, NUMBER=14, 
		FLOATP=15, ATTRS=16;
	public static String[] channelNames = {
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN"
	};

	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	private static String[] makeRuleNames() {
		return new String[] {
			"SELECT", "FROM", "WHERE", "YES_OR_NO", "SEP", "SelectItems", "SelectItem", 
			"IDENTIFIER", "LETTER", "INT", "FLOAT", "TABLE_NAME", "WHERE_COND", "WS", 
			"NUMBER", "FLOATP", "ATTRS", "F_NNN", "DIGIT"
		};
	}
	public static final String[] ruleNames = makeRuleNames();

	private static String[] makeLiteralNames() {
		return new String[] {
			null, null, null, null, null, "','"
		};
	}
	private static final String[] _LITERAL_NAMES = makeLiteralNames();
	private static String[] makeSymbolicNames() {
		return new String[] {
			null, "SELECT", "FROM", "WHERE", "YES_OR_NO", "SEP", "SelectItems", "SelectItem", 
			"IDENTIFIER", "INT", "FLOAT", "TABLE_NAME", "WHERE_COND", "WS", "NUMBER", 
			"FLOATP", "ATTRS"
		};
	}
	private static final String[] _SYMBOLIC_NAMES = makeSymbolicNames();
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}


	public KVLexer(CharStream input) {
		super(input);
		_interp = new LexerATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@Override
	public String getGrammarFileName() { return "KV.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public String[] getChannelNames() { return channelNames; }

	@Override
	public String[] getModeNames() { return modeNames; }

	@Override
	public ATN getATN() { return _ATN; }

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\2\22\u00cd\b\1\4\2"+
		"\t\2\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4"+
		"\13\t\13\4\f\t\f\4\r\t\r\4\16\t\16\4\17\t\17\4\20\t\20\4\21\t\21\4\22"+
		"\t\22\4\23\t\23\4\24\t\24\3\2\3\2\3\2\3\2\3\2\3\2\3\2\3\2\3\2\3\2\3\2"+
		"\3\2\5\2\66\n\2\3\3\3\3\3\3\3\3\3\3\3\3\3\3\3\3\5\3@\n\3\3\4\3\4\3\4\3"+
		"\4\3\4\3\4\3\4\3\4\3\4\3\4\5\4L\n\4\3\5\3\5\3\5\3\5\3\5\5\5S\n\5\3\6\3"+
		"\6\3\7\3\7\5\7Y\n\7\3\7\3\7\3\7\7\7^\n\7\f\7\16\7a\13\7\3\b\3\b\3\t\3"+
		"\t\5\tg\n\t\3\t\3\t\3\t\7\tl\n\t\f\t\16\to\13\t\3\n\3\n\3\13\6\13t\n\13"+
		"\r\13\16\13u\3\f\6\fy\n\f\r\f\16\fz\3\f\3\f\7\f\177\n\f\f\f\16\f\u0082"+
		"\13\f\3\f\3\f\6\f\u0086\n\f\r\f\16\f\u0087\5\f\u008a\n\f\3\r\3\r\6\r\u008e"+
		"\n\r\r\r\16\r\u008f\3\r\3\r\3\16\3\16\3\16\3\16\3\17\6\17\u0099\n\17\r"+
		"\17\16\17\u009a\3\17\3\17\3\20\3\20\5\20\u00a1\n\20\3\21\6\21\u00a4\n"+
		"\21\r\21\16\21\u00a5\3\21\6\21\u00a9\n\21\r\21\16\21\u00aa\3\21\3\21\7"+
		"\21\u00af\n\21\f\21\16\21\u00b2\13\21\3\21\3\21\6\21\u00b6\n\21\r\21\16"+
		"\21\u00b7\5\21\u00ba\n\21\3\22\3\22\3\22\3\22\7\22\u00c0\n\22\f\22\16"+
		"\22\u00c3\13\22\5\22\u00c5\n\22\3\23\6\23\u00c8\n\23\r\23\16\23\u00c9"+
		"\3\24\3\24\2\2\25\3\3\5\4\7\5\t\6\13\7\r\b\17\t\21\n\23\2\25\13\27\f\31"+
		"\r\33\16\35\17\37\20!\21#\22%\2\'\2\3\2\7\5\2<<BBaa\4\2C\\c|\3\2\62;\5"+
		"\2\13\f\17\17\"\"\5\2\62;C\\c|\2\u00e4\2\3\3\2\2\2\2\5\3\2\2\2\2\7\3\2"+
		"\2\2\2\t\3\2\2\2\2\13\3\2\2\2\2\r\3\2\2\2\2\17\3\2\2\2\2\21\3\2\2\2\2"+
		"\25\3\2\2\2\2\27\3\2\2\2\2\31\3\2\2\2\2\33\3\2\2\2\2\35\3\2\2\2\2\37\3"+
		"\2\2\2\2!\3\2\2\2\2#\3\2\2\2\3\65\3\2\2\2\5?\3\2\2\2\7K\3\2\2\2\tR\3\2"+
		"\2\2\13T\3\2\2\2\rX\3\2\2\2\17b\3\2\2\2\21f\3\2\2\2\23p\3\2\2\2\25s\3"+
		"\2\2\2\27\u0089\3\2\2\2\31\u008b\3\2\2\2\33\u0093\3\2\2\2\35\u0098\3\2"+
		"\2\2\37\u00a0\3\2\2\2!\u00b9\3\2\2\2#\u00c4\3\2\2\2%\u00c7\3\2\2\2\'\u00cb"+
		"\3\2\2\2)*\7u\2\2*+\7g\2\2+,\7n\2\2,-\7g\2\2-.\7e\2\2.\66\7v\2\2/\60\7"+
		"U\2\2\60\61\7G\2\2\61\62\7N\2\2\62\63\7G\2\2\63\64\7E\2\2\64\66\7V\2\2"+
		"\65)\3\2\2\2\65/\3\2\2\2\66\4\3\2\2\2\678\7h\2\289\7t\2\29:\7q\2\2:@\7"+
		"o\2\2;<\7H\2\2<=\7T\2\2=>\7Q\2\2>@\7O\2\2?\67\3\2\2\2?;\3\2\2\2@\6\3\2"+
		"\2\2AB\7y\2\2BC\7j\2\2CD\7g\2\2DE\7t\2\2EL\7g\2\2FG\7Y\2\2GH\7J\2\2HI"+
		"\7G\2\2IJ\7T\2\2JL\7G\2\2KA\3\2\2\2KF\3\2\2\2L\b\3\2\2\2MN\7[\2\2NO\7"+
		"G\2\2OS\7U\2\2PQ\7P\2\2QS\7Q\2\2RM\3\2\2\2RP\3\2\2\2S\n\3\2\2\2TU\7.\2"+
		"\2U\f\3\2\2\2VY\7,\2\2WY\5\17\b\2XV\3\2\2\2XW\3\2\2\2Y_\3\2\2\2Z[\5\13"+
		"\6\2[\\\5\17\b\2\\^\3\2\2\2]Z\3\2\2\2^a\3\2\2\2_]\3\2\2\2_`\3\2\2\2`\16"+
		"\3\2\2\2a_\3\2\2\2bc\5\21\t\2c\20\3\2\2\2dg\5\23\n\2eg\7a\2\2fd\3\2\2"+
		"\2fe\3\2\2\2gm\3\2\2\2hl\5\23\n\2il\5\'\24\2jl\t\2\2\2kh\3\2\2\2ki\3\2"+
		"\2\2kj\3\2\2\2lo\3\2\2\2mk\3\2\2\2mn\3\2\2\2n\22\3\2\2\2om\3\2\2\2pq\t"+
		"\3\2\2q\24\3\2\2\2rt\t\4\2\2sr\3\2\2\2tu\3\2\2\2us\3\2\2\2uv\3\2\2\2v"+
		"\26\3\2\2\2wy\5\'\24\2xw\3\2\2\2yz\3\2\2\2zx\3\2\2\2z{\3\2\2\2{|\3\2\2"+
		"\2|\u0080\7\60\2\2}\177\5\'\24\2~}\3\2\2\2\177\u0082\3\2\2\2\u0080~\3"+
		"\2\2\2\u0080\u0081\3\2\2\2\u0081\u008a\3\2\2\2\u0082\u0080\3\2\2\2\u0083"+
		"\u0085\7\60\2\2\u0084\u0086\5\'\24\2\u0085\u0084\3\2\2\2\u0086\u0087\3"+
		"\2\2\2\u0087\u0085\3\2\2\2\u0087\u0088\3\2\2\2\u0088\u008a\3\2\2\2\u0089"+
		"x\3\2\2\2\u0089\u0083\3\2\2\2\u008a\30\3\2\2\2\u008b\u008d\7$\2\2\u008c"+
		"\u008e\5%\23\2\u008d\u008c\3\2\2\2\u008e\u008f\3\2\2\2\u008f\u008d\3\2"+
		"\2\2\u008f\u0090\3\2\2\2\u0090\u0091\3\2\2\2\u0091\u0092\7$\2\2\u0092"+
		"\32\3\2\2\2\u0093\u0094\5%\23\2\u0094\u0095\7?\2\2\u0095\u0096\5%\23\2"+
		"\u0096\34\3\2\2\2\u0097\u0099\t\5\2\2\u0098\u0097\3\2\2\2\u0099\u009a"+
		"\3\2\2\2\u009a\u0098\3\2\2\2\u009a\u009b\3\2\2\2\u009b\u009c\3\2\2\2\u009c"+
		"\u009d\b\17\2\2\u009d\36\3\2\2\2\u009e\u00a1\5\25\13\2\u009f\u00a1\5\27"+
		"\f\2\u00a0\u009e\3\2\2\2\u00a0\u009f\3\2\2\2\u00a1 \3\2\2\2\u00a2\u00a4"+
		"\5\'\24\2\u00a3\u00a2\3\2\2\2\u00a4\u00a5\3\2\2\2\u00a5\u00a3\3\2\2\2"+
		"\u00a5\u00a6\3\2\2\2\u00a6\u00ba\3\2\2\2\u00a7\u00a9\5\'\24\2\u00a8\u00a7"+
		"\3\2\2\2\u00a9\u00aa\3\2\2\2\u00aa\u00a8\3\2\2\2\u00aa\u00ab\3\2\2\2\u00ab"+
		"\u00ac\3\2\2\2\u00ac\u00b0\7\60\2\2\u00ad\u00af\5\'\24\2\u00ae\u00ad\3"+
		"\2\2\2\u00af\u00b2\3\2\2\2\u00b0\u00ae\3\2\2\2\u00b0\u00b1\3\2\2\2\u00b1"+
		"\u00ba\3\2\2\2\u00b2\u00b0\3\2\2\2\u00b3\u00b5\7\60\2\2\u00b4\u00b6\5"+
		"\'\24\2\u00b5\u00b4\3\2\2\2\u00b6\u00b7\3\2\2\2\u00b7\u00b5\3\2\2\2\u00b7"+
		"\u00b8\3\2\2\2\u00b8\u00ba\3\2\2\2\u00b9\u00a3\3\2\2\2\u00b9\u00a8\3\2"+
		"\2\2\u00b9\u00b3\3\2\2\2\u00ba\"\3\2\2\2\u00bb\u00c5\7,\2\2\u00bc\u00c1"+
		"\5%\23\2\u00bd\u00be\7.\2\2\u00be\u00c0\5%\23\2\u00bf\u00bd\3\2\2\2\u00c0"+
		"\u00c3\3\2\2\2\u00c1\u00bf\3\2\2\2\u00c1\u00c2\3\2\2\2\u00c2\u00c5\3\2"+
		"\2\2\u00c3\u00c1\3\2\2\2\u00c4\u00bb\3\2\2\2\u00c4\u00bc\3\2\2\2\u00c5"+
		"$\3\2\2\2\u00c6\u00c8\t\6\2\2\u00c7\u00c6\3\2\2\2\u00c8\u00c9\3\2\2\2"+
		"\u00c9\u00c7\3\2\2\2\u00c9\u00ca\3\2\2\2\u00ca&\3\2\2\2\u00cb\u00cc\t"+
		"\4\2\2\u00cc(\3\2\2\2\34\2\65?KRX_fkmuz\u0080\u0087\u0089\u008f\u009a"+
		"\u00a0\u00a5\u00aa\u00b0\u00b7\u00b9\u00c1\u00c4\u00c9\3\b\2\2";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}