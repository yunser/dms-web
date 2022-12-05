grammar KV ;

prog: expr EOF ;

list: SelectItems EOF ;

expr: SELECT SelectItems
    FROM TABLE_NAME
    (WHERE INT)?;

SELECT: 'select' | 'SELECT';
FROM: 'from' | 'FROM';
WHERE: 'where' | 'WHERE';

// ID : [a-zA-Z]+ ;

YES_OR_NO: 'YES' | 'NO' ; // YES NO

// 可以用：

// NAME : [a-zA-Z0-9]+ ; // a z abc A Abc aA0 不行：9 table2 tbl

SEP: ',';

SelectItems: (star='*' | SelectItem) (SEP SelectItem)* ;

SelectItem: IDENTIFIER;

IDENTIFIER
    : (LETTER | '_') (LETTER | DIGIT | '_' | '@' | ':')*
    ;

fragment LETTER
    : [a-zA-Z]
    ;
 

INT : [0-9]+ ; // 0 9 100

// 1.
FLOAT: DIGIT+ '.' DIGIT*    // 匹配1. 39. 3.14159等等
     | '.' DIGIT+           // 匹配.1 .14159
     ;


TABLE_NAME: '"' F_NNN+ '"' ;

WHERE_COND: F_NNN '=' F_NNN ;

WS : [ \t\r\n]+ -> skip ;

// 不能用
NUMBER: INT 
    | FLOAT
    ;


FLOATP: DIGIT+
    | DIGIT+ '.' DIGIT*    // 匹配1. 39. 3.14159等等
     | '.' DIGIT+           // 匹配.1 .14159
     ;



ATTRS: '*'
    | F_NNN (',' F_NNN)* ;

fragment F_NNN : [a-zA-Z0-9]+ ; // a z abc A Abc aA0 不行：9
fragment DIGIT: [0-9] ;              // 匹配单个数字
