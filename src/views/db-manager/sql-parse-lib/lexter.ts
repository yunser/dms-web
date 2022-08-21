var Types = {
  UNKNOWN     : 0,
  KEYWORD     : 1,
  NUMBER      : 2,
  STRING      : 3,
  FUNCTION    : 4,
  VARIABLE    : 5,
  PARAMS      : 6,
  OPERATOR    : 7,
  COMMAS      : 8,
  MEMORY	  : 9,
  COMMENT     : 99
};

var Parser  = function(query) {
  var tks = [], pre = Types.UNKNOWN;
  var tmp = '', cur = '', sub = '', nxt = '';

  for (var i = 0; i < query.length; i++) {
    cur = query.charAt(i);

    if ('/' == cur && '*' == query.charAt(i + 1)) {
      tmp = '';
      i++;
      while (++i < query.length) {
        sub = query.charAt(i);
        nxt = query.charAt(i+1);
        if ('*' == sub && '/' == nxt) {
          tmp = tmp.substr(0,tmp.length-1);
          i++;
          break;
        }
        if(tmp === ''){
          tmp += (sub + nxt);
        }else{
          tmp += nxt;
        }
      }
      tks[tks.length] = {
        'text'  : tmp.replace(/^[\*\s]+/, '').replace(/[\s\*]+$/, ''),
        'type'  : Types.COMMENT
      };
    }

    else if ("'" == cur || '"' == cur || '`' == cur) {
      tmp = '';
      while (i < query.length && cur != (sub = query.charAt(++i))) {
        tmp += ("\\" == sub) ? query.charAt(++i) : sub;
      }
      tks[tks.length] = {
        'text'  : tmp,
        'type'  : ('`' == cur) ? Types.VARIABLE : Types.STRING
      };
    }

    else if (':' == cur) {
      tmp = cur;
      while (i < query.length) {
        sub = query.charAt(++i);
        if (!(/^\w+$/i.test(sub))) {
          break;
        }
        tmp += sub;
      }
      i--;
      tks[tks.length] = {
        'text'  : tmp,
        'type'  : Types.PARAMS
      };
    }

    else if (/^[a-z_]+$/i.test(cur)) {
      tmp = cur;
      while (i < query.length) {
        sub = query.charAt(++i);
        if (!(/^[\w\.:]+$/i.test(sub))) {
          break;
        }
        tmp += sub;
      }
      i--;
      tks[tks.length] = {
        'text'  : tmp,
        'type'  : '(' == sub ? Types.FUNCTION : Types.KEYWORD,
      };
    }

    else if (('-' == cur && Types.VARIABLE != pre) || /\d+/.test(cur)) {
      tmp = cur;
      while (i < query.length) {
        sub = query.charAt(++i);
        if (!(/^[\d\.]+$/.test(sub))) {
          break;
        }
        tmp += sub;
      }
      i--;

      if("-" == tmp){
        tks[tks.length] = {
          'text'  : '-',
          'type'  : Types.OPERATOR
        };	
      }else{
        tks[tks.length] = {
          'text'  : tmp - 0,
          'type'  : Types.NUMBER
        };	
      }
    }

    else if (/^[\,;\(\)]+$/.test(cur)) {
      tks[tks.length] = {
        'text'  : cur,
        'type'  : Types.COMMAS
      };
    }

    else if (/^(\+|\-|\*|\/|>|<|=|!)$/.test(cur)) {
      tmp = cur;
      while (i < query.length) {
        sub = query.charAt(++i);
        if (!(/^(\+|\*|\/|>|<|=|!)+$/.test(sub))) {
          break;
        }
        tmp += sub;
      }
      i--;

      tks[tks.length] = {
        'text'  : tmp,
        'type'  : Types.OPERATOR
      };
    }

    pre = (tks.length === 0) ? pre : tks[tks.length - 1].type;
  }

  return tks;
};

var LexterInner  = function(query) {
  this.tokens = (query instanceof Array) ? query : Parser(query.toString());
  this.blocks = [];

  var express = 0;
  var calcmap = {
    "(" : 1,
    ")" : -1
  };

  for (var i = 0; i < this.tokens.length; ++i) {
    var tks = this.tokens[i];
    if (tks.type == Types.COMMAS && undefined !== calcmap[tks.text]) {
      express += calcmap[tks.text];
    } else if (!express) {
      this.blocks[this.blocks.length] = i;
    }
  }
};

LexterInner.prototype.getAll     = function() {
  return this.tokens;
};

LexterInner.prototype.indexOf    = function(who, off) {
  var pos = 0;
  var tks = null;

  try {
    var exp = new RegExp(who.text, 'i');
  } catch (e) {
    var exp = who.text.toLowerCase();
  }
  var off = (off == undefined) ? 0 : off + 1;

  for (var i = 0; i < this.blocks.length; ++i) {
    pos = this.blocks[i];
    if (pos < off) {
      continue;
    }

    tks = this.tokens[pos];
    if (who.type == tks.type && ((exp instanceof RegExp && exp.test(tks.text)) || exp == tks.text.toLowerCase())) {
      return this.blocks[i];
    }
  }

  return -1;
};

const vars = function(idx,tokens,isString){
  var res;
  if(isString){
    var lexter = new LexterInner(tokens);
    tokens = lexter.getAll();
  }
  if(!tokens[idx]){return null;}
  switch(tokens[idx]["type"]){
    case Types.OPERATOR:
      res = [tokens[idx-1],tokens[idx+1]];
      break;
    case Types.FUNCTION:
      res = [];
      var temp = [];
      var expr = 0;
      for(var i  = idx+1, count=tokens.length;i<count;i++){
        var tk = tokens[i];
        if(tk["type"] != Types.COMMAS){
          temp.push(tk);
          continue;
        }
        switch(tk["text"]){
          case "(":
            if(expr>0){
              temp.push(tk);
            }
          expr++;
          break;
          case ")":
            if((--expr)==0){
              res.push(temp);
              temp = [];
              i = count;
              break;
            }else{temp.push(tk);}
          break;
          case ",":
            if(expr == 1){
              res.push(temp);
              temp = [];
            }else{temp.push(tk);}
          break;
          default:
          break;
        }
      }
      break;
    default :
      res = null;
      break;
  }
  return res;
};

const text = function(stack,comma){
  var res = [];
  for(var idx in stack){
    var token = stack[idx];
    if(!token || !token.type || token.text == null){
      res.push(null);
    }else{
      switch(token.type){
        case Types.STRING :
          res.push("'"+token.text+"'");
          break;
        case Types.VARIABLE :
          res.push(token.text);
          break;
        default:
          res.push(token.text);
          break;
      }
    }
    if(comma){
      res.push(comma);
    }
  }
  if(comma){res.pop();}
  return res;
};

const types   = Types;
const create  = function(query) {
  return new LexterInner(query);
};

export const Lexter = {
    vars,
    text,
    types,
    create,
}