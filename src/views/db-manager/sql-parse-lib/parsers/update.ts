import { Lexter } from '../lexter'
import {Tool} from '../sqlParseTool'

/**
 * Divide tokens
 * @param {Array} tokens
 * @return {Object}
 */
function divideTokens(tokens){

  var parts = {};
  var lev   = 0;
  var pos   = 0;

  for(var i = 0;i < tokens.length; i++){
    var txt = tokens[i].text;

    if(txt === "("){lev++;continue;}
    if(txt === ")"){lev--;continue;}
    if(lev !== 0 || tokens[i].type !== Lexter.types.KEYWORD){continue;}

    if(/^SET$/i.test(txt)){
      if(i === tokens.length - 1){
        throw new Error("empty after keyword 'set'");
      }
      parts["source"] = tokens.slice(0,i);
      pos = i;
    }else if(/^WHERE$/i.test(txt)){
      if(i === tokens.length - 1){
        throw new Error("empty after keyword 'where'");
      }
      parts["column"] = tokens.slice(pos,i);
      pos = i;
    }
  }

  parts["where"] = tokens.slice(pos);
  return parts;
}

/**
 * Parse source
 * @param {Array} tokens
 * @return {Object}
 */
function parseSource(tokens){
  if(!(/^update$/i.test(tokens.shift().text))){i
    throw new Error("no keyword 'update'");
  }

  var get = Tool.parseOneSource(tokens);

  return {
    name: get["name"],
    type: get["type"],
    source : get["source"],
  }
}


/**
 * Parse column
 * @param {Array} tokens
 * @return {Object}
 */
function parseColumn(tokens){

  var res = [];

  var parts = Tool.pickUp(tokens,",");
  parts[0].shift();
  
  parts.forEach(function(part){
    res.push(Tool.parseOneWhere(part))
  });

  return res;
}


/**
 * Parse where
 * @param {Array} tokens
 * @return {Object}
 */
function parseWhere(tokens){

  var res = [];

  var parts = Tool.pickUp(tokens,"and");
  parts[0].shift();

  parts.forEach(function(part){
    res.push(Tool.parseOneWhere(part));
  });

  return res;
}


/**
 * Create object
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
  if(parts["column"]){res.column = parseColumn(parts["column"]);}
  if(parts["where"]){res.where   = parseWhere(parts["where"]);}

  return res;
};

export const update = {
    parseWhere,
    createObj,
    parseSource,
    parseColumn,
}
