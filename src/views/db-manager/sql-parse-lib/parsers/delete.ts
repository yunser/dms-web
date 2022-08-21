import { Lexter } from '../lexter'
import { Tool } from '../sqlParseTool'

/**
 * Devide tokens
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
    if(/^WHERE$/i.test(txt)){
      parts.source = tokens.slice(0,i);
      parts.where = tokens.slice(i);
    }
  }

  if(parts.source === undefined){
    parts.source = tokens;
  }

  return parts;
}

/**
 * Parse source
 * @param {Array} tokens
 * @return {Object}
 */
function parseSource(tokens) {

  if (!(/^delete$/i.test(tokens.shift().text))) {
    throw new Error("no keyword 'delete'");
  }
  if (!(/^from$/i.test(tokens.shift().text))) {
    throw new Error("no keyword 'from'");
  }

  var get = Tool.parseOneSource(tokens);

  return {
    name: get["name"],
    type: get["type"],
    source: get["source"],
  };
}


/**
 * Parse 'where'
 * @param {Array} tokens
 * @return {Object}
 */
function parseWhere(tokens){

  var res   = [];
  var parts = Tool.pickUp(tokens,"and");

  parts[0].shift();
  parts.forEach(function(part){
    res.push(Tool.parseOneWhere(part));
  });

  return res;
}


/**
 * Create SQL Obj
 * @param {String} sql
 * @return {Object}
 */
const createObj = function(sql){
  var res    = {};

  var tokens = Lexter.create(sql).getAll();
  var parts  = divideTokens(tokens);

  var hint = Tool.getHint(parts['source'],1);
  if(hint){res.hint = hint;}
  if(parts["source"]){res.source = parseSource(parts["source"]);}
  if(parts["where"]){res.where   = parseWhere(parts["where"]);}

  return res;
};

export const _delete = {
    parseSource,
    parseWhere,
    createObj,
    parseWhere,
}