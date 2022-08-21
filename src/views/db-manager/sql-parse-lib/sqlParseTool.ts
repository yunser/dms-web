import { Lexter  } from './lexter'

var RELATE = {
  "=": 1,
  ">": 2,
  ">=": 3,
  "<": 4,
  "<=": 5,
  "<>": 6,
  "!=": 6,
  "in": 7,
  "not in": 8,
  "like": 9,
  "not like": 10,
  "between": 11,
  "is null": 20,
  "not null": 21
};


var ORDER = {
  'ASC' : 1,
  'DESC' : 2
};


var JOIN = {
  'INNER JOIN' : 1,
  'OUTER JOIN' : 2,
  'LEFT JOIN'  : 3,
  'RIGHT JOIN' : 4
};


/**
 * Remove parent
 * @param {Array} tokens
 * @return {Array}
 */
function removeParenthese(tokens){
  if(tokens[0] === undefined || tokens[0].text !== "("){
    return tokens;
  }
  var lev = 0;
  for(var i = 0;i < tokens.length; i++){
    if(tokens[i].text === "("){lev++;}
    if(tokens[i].text === ")"){lev--;}
  }
  if(lev === 0 && tokens[tokens.length-1].text === ")"){
    tokens.pop();
    tokens.shift();
    return removeParenthese(tokens);
  }
  throw new Error("lack parenthese");
}


/**
 * Merge
 * @param {Array} parts token
 * @param {String} sep
 * @return {String}
 */
function merge(parts,sep){
  sep = (sep === undefined) ? " " : sep;
  var res = "";
  for(var i = 0;i < parts.length; i++){
    res += (parts[i].text + sep);
  }
  return res.substr(0,res.length - sep.length);
}


/**
 * Pick up
 * @param {String} tokens
 * @param {String | Array} sep
 * @return {Array}
 */
function pickUp(tokens, sep){
  var separators = (Array.isArray(sep) ? sep : [sep]);
  tokens.push({text:separators[0]});
  var res = [];
  var pre = 0;
  var lev = 0;
  for(var i = 0;i < tokens.length; i++){
    if(tokens[i].text === "("){lev++;}
    if(tokens[i].text === ")"){lev--;}
    for (var x=0;x<separators.length;x++)
    if(new RegExp("^"+separators[x]+"$","i").test(tokens[i].text) && lev === 0){
      var part = tokens.slice(pre,i);
      if(part.length === 0){
        pre = i + 1;
        continue;
      }
      res.push(part);
      pre = i + 1;
    }
  }
  return res;
}


/**
 * PickUp realization for WHERE clause
 * @param {Array} tokens
 */
function parseDeepWhere(tokens) {
  var result = detectLev(tokens);
  // need transformations
  // .......................
  return result;
}

/**
 * Recursive parse WHERE
 * @param {Array} tokens
 */
function detectLev(tokens) {
  if (!tokens) return;
  // brackets
  var open = '(';
  var close = ')';
  // result object
  var result = [];
  // temp obj
  var current = tokens;
  // find position of start br
  while (current.indexOf(open) != -1) {
    var andIndex = current.indexOf('and');
    var orIndex = current.indexOf('or');
    //console.log('got: ' + current);
    var index = current.indexOf(open);
    var j = index;
    var all = 1;
    while ((all != 0) && (j < current.length)) {
      j++;
      if (current[j] == open) all++;
      if (current[j] == close) all--;
    }
    if (j == current.length) {
      //console.log('error');
      //console.log(current);
      current = [];
      break;
    }
    else {
      // get a sub-array except brackets
      var send = current.slice(index + 1, j);
      //console.log('send: ' + send);
      if ((andIndex != -1) && (orIndex))
        result.push({
          link: detectLev(send)
        });
      current = current.slice(j + 1);
      if (current[0] == 'and' || current[0] == 'or') result.push({
        token: current[0]
      });
      //console.log('current after slice: ' + current);
    }
  }
  // if there are something without brackets
  if (current.length > 0) {
    result.push({
      value: current
    });
  }
  return result;
}


/**
 * Hint
 * @param {Array} part
 * @param {int}   pos
 * @return {obj||undefined}
 */
function getHint(part, pos){
  var hint = undefined;
  if(part && part[pos] && part[pos].type === Lexter.types.COMMENT){
    hint = part[pos];
    var tmp = part.slice(0,pos);
    for(var i = 0;i <= pos; i++){
      part.shift();
    }
    while(tmp.length > 0){
      part.unshift(tmp.pop());
    }
  }
  return hint;
}


/**
 * Parse one source
 * @param {Object} part
 * @return {Object}
 */
function parseOneSource(part){
  var name;
  var type;
  var source;
  var res;
  var idx = part[0].text.indexOf(".");
  type = part[0].text.substr(0,idx);

  if(idx === -1){
    if(part[0].text === "("){
      var innerLev = 1;
      for(var j = 1;j < part.length; j++){
        if(part[j].text === "("){innerLev++;}
        if(part[j].text === ")"){innerLev--;}
        if(innerLev === 0){
          source = merge(part.slice(1,j)," ");
          part = part.slice(j+1,part.length);
          break;
        }
      }
    }else{
      source = part[0].text;
      part.shift();
    }
  }else if(idx === part[0].text.length - 1){
    if(part[1].text !== "("){throw new Error("something wrong in 'source' part");}
    var innerLev = 0;
    var j;
    for(j = 1;j < part.length; j++){
      if(part[j].text === "("){innerLev++;}
      if(part[j].text === ")"){innerLev--;}
      if(innerLev === 0){
        source = merge(part.slice(2,j)," ");
        part = part.slice(j+1,part.length);
        break;
      }
    }
    if(j === part.length){throw new Error("lack parentheses in 'source' part");}
  }else{
    source = part[0].text.substr(idx+1);
    part.shift();
  }

  if(part.length === 0){
    res = {
      name : source,
      type : type,
      source : source
    }
  }else{
    if(part.length >= 3 || (part.length === 2 && !(/^as$/i.test(part[0].text))) || (part[part.length-1].type !== Lexter.types.KEYWORD && part[part.length-1].type !== Lexter.types.VARIABLE)){throw new Error("something wrong in 'source' part");}
    res = {
      name : part[part.length-1].text,
      type : type,
      source : source
    }
  }

  return res;
}


/**
 * Parse One Where
 * @param {Object} part
 * @return {Object}
 */
function parseOneWhere(part){
  var res = {};
  var relate = part[1];
  res["column"] = part[0];
  if(relate.type === Lexter.types.OPERATOR){
    if(RELATE[relate.text] === undefined){
      throw new Error("unrecognized operator");
    }
    res["relate"] = RELATE[relate.text];
    res["values"] = group(part.slice(2),',');
  }else{
    if(relate.text.toLowerCase() === "between"){
      res["relate"] = RELATE[relate.text.toLowerCase()];
      res["values"] = group(part.slice(3,part.length-1),"and");
    }else if(relate.text.toLowerCase() === "in"){
      res["relate"] = RELATE[relate.text.toLowerCase()];
      res["values"] = group(part.slice(3,part.length-1),',');
    }else if(relate.text.toLowerCase() === "like"){
      res["relate"] = RELATE[relate.text.toLowerCase()];
      res["values"] = [[part[2]]];
    }else if(relate.text.toLowerCase() === "is"){
      if(part[2].text.toLowerCase() === "not"){
        res["relate"] = RELATE["not null"];
        res["values"] = null;
      }else if(part[2].text.toLowerCase() === "null"){
        res["relate"] = RELATE["is null"];
        res["values"] = null;
      }else{
        throw new Error("wrong key word after \"is\"");
      }
    }else if(relate.text.toLowerCase() === "not"){
      if(part[2].text.toLowerCase() === "in"){
        res["relate"] = RELATE["not in"];
        res["values"] = group(part.slice(4,part.length-1),',');
      }else if(part[2].text.toLowerCase() === "like"){
        res["relate"] = RELATE["not like"];
        res["values"] = [[part[3]]];
      }else{
        throw new Error("wrong key word after \"not\"");
      }
    }else{
      throw new Error("unrecognized relate");
    }
  }
  return res;
}


/**
 * Group
 * @param {array} part token
 * @param {string} sep
 * @param {}
 */
function group(part,sep){
  sep = new RegExp(sep,'i');

  var res = [];
  var pos = 0;
  var tmp = [];
  for(var i in part){
    if(sep.test(part[i].text)){
      res.push(tmp);
      tmp = [];
    }else{
      tmp.push(part[i]);
    }
  }

  if(tmp.length !== 0){
    res.push(tmp);
  }
  return res;
}

export const Tool = {
    RELATE,
    ORDER,
    JOIN,
    removeParenthese,
    merge,
    pickUp,
    parseDeepWhere,
    getHint,
    parseOneSource,
    parseOneWhere,
}