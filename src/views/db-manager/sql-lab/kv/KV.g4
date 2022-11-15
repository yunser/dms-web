grammar KV;
prog: expr EOF;
expr: INT ':' INT '=' INT;
INT     : [0-9]+ ;
