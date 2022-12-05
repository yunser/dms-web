grammar KV ;

prog: expr EOF ;

expr: 'select' NAME 'from' NAME 'where' FLOATP ;



ID : [a-zA-Z]+ ;


// 可以用：

NAME : [a-zA-Z0-9]+ ; // a z abc A Abc aA0 不行：9 table2 tbl

WS : [ \t\r\n]+ -> skip ;

YES_OR_NO: 'YES' | 'NO' ; // YES NO

INT : [0-9]+ ; // 0 9 100

// 1.
FLOAT: DIGIT+ '.' DIGIT*    // 匹配1. 39. 3.14159等等
     | '.' DIGIT+           // 匹配.1 .14159
     ;


// F_NNN : [a-zA-Z0-9]+ ; // a z abc A Abc aA0 不行：9


// 不能用
NUMBER: INT 
    | FLOAT
    ;


FLOATP: DIGIT+
    | DIGIT+ '.' DIGIT*    // 匹配1. 39. 3.14159等等
     | '.' DIGIT+           // 匹配.1 .14159
     ;



// ATTRS: F_NNN (',' F_NNN)* ;

fragment
DIGIT: [0-9] ;              // 匹配单个数字
