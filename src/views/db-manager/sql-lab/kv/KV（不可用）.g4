grammar KV ;

prog: expr EOF ;

expr: 'select' NAME 'from' NAME;



ID : [a-zA-Z]+ ;


// 可以用：

NAME : [a-zA-Z0-9]+ ;

WS : [ \t\r\n]+ -> skip ;
