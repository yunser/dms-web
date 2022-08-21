import { Lexter } from '../lexter'
import { Tool } from '../sqlParseTool'

/**
 * Divide tokens
 * @param {Array} tokens
 * @return {Object}
 */
function divideTokens(tokens){

  var parts = {};
  var lev   = 0;

  for(var i = 0;i < tokens.length; i++){
    var txt = tokens[i].text;
    if(txt === "("){lev++;continue;}
    if(txt === ")"){lev--;continue;}
    if(lev !== 0 || tokens[i].type !== Lexter.types.KEYWORD){continue;}
    if(/^VALUES$/i.test(txt)){
      parts.source = tokens.slice(0,i);
      parts.values = tokens.slice(i);
    }
  }

  if(parts.source === undefined){
    parts.source = tokens;
  }

  return parts;
}

/**
 * Parse source
 * @param {String} tokens
 * @return {Object}
 */
function parseSource(tokens){

  if(!(/^insert$/i.test(tokens.shift().text))){throw new Error("no keyword 'insert'");}
  if(!(/^into$/i.test(tokens.shift().text))){throw new Error("no keyword 'into'");}

  var sourceInfo;
  var columnPos;
  var column = [];

  if((tokens[0].text === "(") || (tokens[0].text.indexOf(".") === tokens[0].text.length-1 && tokens[1].text === "(")){
    var lev = 0;

    for(var i = 0;i < tokens.length; i++){
      if(tokens[i].text === "("){lev++;}
      if(tokens[i].text === ")"){lev--;}
      if(tokens[i].text === "(" && lev === 1 && i > 1){
        sourceInfo = Tool.parseOneSource(tokens.slice(0,i));
        break;
      }
    }

    if(sourceInfo === undefined && lev !== 0){
      throw new Error("parentheses are not paired");
    }

    if(sourceInfo === undefined){
      sourceInfo = Tool.parseOneSource(tokens);
    }else{
      tokens = tokens.slice(i);
    }

  }else{
    sourceInfo = Tool.parseOneSource([tokens[0]]);
    tokens.shift();
  }

  if(tokens.length !== 0){
    if(tokens[0].text !== "("){
      throw new Error("something wrong after source name");
    }

    var get = Tool.removeParenthese(tokens);
    for(var i = 0;i < get.length; i++){
      if(get[i].text === ","){continue;}
      column.push(get[i]);
    }
  }

  return {
    name : sourceInfo["name"],
    type : sourceInfo["type"],
    source : sourceInfo["source"],
    column : column
  }
}


/**
 * Parse value
 * @param {String} tokens
 * @return {Object}
 */
function parseValues(tokens){

  var res = [];

  tokens.shift();
  if(tokens.length === 0){
    throw new Error("empty after keyword 'value'");
  }

  var lev = 0;
  var pre = 0;

  for(var i = 0;i < tokens.length;i++){
    if(tokens[i].text === "("){lev++;continue;}
    if(tokens[i].text === ")"){lev--;continue;}
    if(tokens[i].text === "," && lev === 0){
      var get = Tool.removeParenthese(tokens.slice(pre,i));
      pre = i + 1;
      var tmp = [];
      for(var j = 0;j < get.length; j++){
        if(get[j].text === ","){continue;}
        tmp.push(get[j]);
      }
      res.push(tmp);
    }
  }

  var getText = Tool.removeParenthese(tokens.slice(pre));
  var tmp = [];

  for(var i = 0;i < getText.length; i++){
    if(getText[i].text === ","){continue;}
    tmp.push(getText[i]);
  }
  res.push(tmp);

  return res;
}

/**
 * Create SQL object
 * @param {String} sql
 * @return {Object}
 */
const createObj = function(sql){

  var res = {};

  var tokens = Lexter.create(sql).getAll();
  var parts  = divideTokens(tokens);

  var hint = Tool.getHint(parts['source'],1);
  if(hint){res.hint = hint;}
  if(parts["source"]){res.source = parseSource(parts["source"]);}
  if(parts["values"]){res.values = parseValues(parts["values"]);}

  return res;
};

export const insert = {
    parseValues,
    createObj,
    parseSource,
}