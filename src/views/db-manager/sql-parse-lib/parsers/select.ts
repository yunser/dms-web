import { Lexter } from '../lexter'
import { Tool } from '../sqlParseTool'
// var util   = require('util');

/**
 * Divide union
 * @param {String} tokens sql
 * @return {Array}
 */
function divideUnion(tokens){

  var res = [];
  var lev = 0;
  var pre = 0;

  for(var i = 0;i < tokens.length; i++){
    var txt = tokens[i].text;
    if(txt === "("){lev++;continue;}
    if(txt === ")"){lev--;continue;}
    if(lev === 0 && /^UNION$/i.test(txt) && tokens[i].type === Lexter.types.KEYWORD){
      res.push(Tool.removeParenthese(tokens.slice(pre,i)));
      pre = i + 1;
    }
  }
  res.push(Tool.removeParenthese(tokens.slice(pre)));

  return res;
}

/**
 * Divide tokens
 * @param {Array} tokens sql
 * @return {Object}
 */
function divideTokens(tokens){

  var posArr  = [];
  var Map     = {};
  var pre     = 0;
  var lev     = 0;

  for(var i = 0;i < tokens.length; i++){

    var txt = tokens[i].text;
    var type = tokens[i].type;

    if(txt === "("){lev++;continue;}
    if(txt === ")"){lev--;continue;}
    if(lev !== 0 || type !== Lexter.types.KEYWORD){continue;}

    if(/^SELECT$/i.test(txt)){
      if(Map["column"] !== undefined){continue;}
      posArr.push({keyword:"column",pos:i});
      Map["column"] = true;

    }else if(/^FROM$/i.test(txt)){
      if(Map["source"] !== undefined){continue;}
      posArr.push({keyword:"source",pos:i});
      Map["source"] = true;

    }else if(/^(JOIN|INNER|OUTER|LEFT|RIGHT)$/i.test(txt)){
      if(Map["joinmap"] !== undefined){continue;}
      posArr.push({keyword:"joinmap",pos:i});
      Map["joinmap"] = true;

    }else if(/^WHERE$/i.test(txt)){
      if(Map["where"] !== undefined){continue;}
      posArr.push({keyword:"where",pos:i});
      Map["where"] = true;

    }else if(/^GROUP$/i.test(txt)){
      if(Map["groupby"] !== undefined){continue;}
      posArr.push({keyword:"groupby",pos:i});
      Map["groupby"] = true;

    }else if(/^ORDER$/i.test(txt)){
      if(Map["orderby"] !== undefined){continue;}
      posArr.push({keyword:"orderby",pos:i});
      Map["orderby"] = true;

    }else if(/^LIMIT$/i.test(txt)){
      if(Map["limit"] !== undefined){continue;}
      posArr.push({keyword:"limit",pos:i});
      Map["limit"] = true;
    }
  }

  var parts = {};
  for(var i = 1; i < posArr.length; i++){
    parts[posArr[i-1].keyword] = tokens.slice(posArr[i-1].pos,posArr[i].pos);
  }
  parts[posArr[posArr.length - 1].keyword] = tokens.slice(posArr[posArr.length-1].pos);
  return parts;
}

/**
 * Parse sql column
 * @param {String} tokens
 * @return {Object}
 */
function parseColumn(tokens){

  var res = {};
  
  var parts = Tool.pickUp(tokens,",");
  parts[0].shift();

  for(var i = 0;i < parts.length;i++){
    var tmp = parts[i];

    var dist = null;
    if(/^(distinct|all|distinctrow)$/i.test(tmp[0].text)){
      tmp[0].text = tmp[0].text.toUpperCase();
      dist        = tmp[0];
      tmp.shift();
    }

    var colName;
    var tmpVar;
    if(tmp[tmp.length - 1].type === Lexter.types.KEYWORD || tmp[tmp.length - 1].type === Lexter.types.VARIABLE){
      if((tmpVar = tmp[tmp.length - 1].text.indexOf(".")) === -1){
        colName = tmp[tmp.length-1].text;
        if(tmp.length === 1){
          res[colName] = {
            dist : dist,
            expr : tmp
          }
        }else if(/^as$/i.test(tmp[tmp.length-2].text)){
          res[colName] = {
            dist : dist,
            expr : tmp.slice(0,tmp.length-2)
          }
        }else{
          res[colName] = {
            dist : dist,
            expr : tmp.slice(0,tmp.length-1)
          }
        }
      }else{
        colName = tmp[tmp.length - 1].text.substr(tmpVar+1);
        res[colName] = {
          dist : dist,
          expr : tmp
        }
      }
    }else{
      colName = Tool.merge(tmp,"");
      res[colName] = {
        dist : dist,
        expr : tmp
      }
    }
  }

  return res;
}

/**
 * Parse source
 * （from join）
 * @param {String} tokens
 * @return {Object}
 */
function parseSource(tokens){

  var res = {};

  var parts = Tool.pickUp(tokens,",");
  parts[0].shift();

  for(var i = 0;i < parts.length;i++){
    var get = Tool.parseOneSource(parts[i]);
    res[get["name"]] = {
      type   : get["type"],
      source : get["source"]
    }
  }

  return res;
}


/**
 * Parse Join map
 * @param {String} tokens
 * @return {Object}
 */
function parseJoinmap(tokens){

  var res = {}; 

  var parts   = Tool.pickUp(tokens,"JOIN");
  var forNext = undefined;

  for(var i = 0;i < parts.length; i++){
    var tmp = parts[i];

    if(tmp.length === 1){
      forNext = tmp[0].text.toUpperCase();
      continue;
    }

    var method = (forNext === undefined) ? "INNER JOIN" : forNext + " JOIN";
    var type;
    var source;
    var name;

    forNext = (/^(LEFT|RIGHT|OUTER|INNER)$/i.test(tmp[tmp.length-1].text)) ? tmp.pop().text : undefined;
    var onPos = undefined;

    for(var j = 0;j < tmp.length; j++){
      if(/^on$/i.test(tmp[j].text)){
        onPos   = j;
        var joinTableTokens = tmp.slice(0,j);
        var get = Tool.parseOneSource(joinTableTokens);
        name    = get["name"];
        type    = get["type"];
        source  = get["source"];
        break;
      }
    }

    if(onPos === undefined){
      throw new Error("no keyword 'on' in join part");
    }

    var where = [];
    var pre   = onPos+1;
    tmp.push({text:"and",type:1});

    for(var j = pre;j < tmp.length; j++){
      if(/^and$/i.test(tmp[j].text)){
        var ele = tmp.slice(pre,j);
        where.push(Tool.parseOneWhere(ele));
        pre = j + 1;
      }
    }

    res[name] = {
      type   : type,
      source : source,
      method : Tool.JOIN[method.toUpperCase()],
      where  : where
    }
  }
  return res;
}


/**
 * Parse where
 * @param {String} tokens
 * @return {Object}
 */
function parseWhere(tokens){

  var res = [];

  var parts = Tool.pickUp(tokens,["and", "or"]);

  parts[0].shift();

  parts.forEach(function(part){
    res.push(Tool.parseOneWhere(part));
  });

  return res;
}


/**
 * Parse group by
 * @param {String} tokens
 * @return {Object}
 */
function parseGroupby(tokens){

  var res = [];

  var parts = Tool.pickUp(tokens,",");
  parts[0].shift();
  parts[0].shift();

  parts.forEach(function(part){
    res.push(part);
  });

  return res;
}


/**
 * Parse order by
 * @param {String} tokens
 * @return {Object}
 */
function parseOrderby(tokens){

  var res = [];
  var parts = Tool.pickUp(tokens,",");
  parts[0].shift();
  parts[0].shift();

  for(var i = 0;i < parts.length; i++){
    var tmp  = parts[i];
    var type;
    var last = tmp[tmp.length-1].text.toUpperCase();
    if(/^(ASC|DESC)$/i.test(last)){
      type = Tool.ORDER[last];
      tmp.pop();
    }else{
      type = Tool.ORDER["ASC"];
    }
    if(tmp.length === 0){continue;}
    res.push({
      type : type,
      expr : tmp
    });
  }

  return res;
}

/**
 * Parse limit
 * @param {String} tokens
 * @return {Object}
 */
function parseLimit(tokens){

  var res   = [];
  var parts = Tool.pickUp(tokens,",");
  parts[0].shift();

  for(var i = 0;i < parts.length; i++){
    var tmp = parts[i];

    if(tmp.length >= 2){
      throw new Error("something wrong in 'limit' part");
    }

    res.push(tmp[0]);
  }
  if(res.length === 1){
    res.unshift({text:0,type:2});
  }

  return res;
}


/**
 * Create SQL object
 * @param {String} sql
 * @return {Object}
 */
const createObj= function(sql){

  var result = [];

  var tokens      = Lexter.create(sql).getAll();
  var tokenGroups = divideUnion(tokens);


  for(var i = 0;i < tokenGroups.length; i++){
    var res = {};
    var parts = divideTokens(tokenGroups[i]);
    var hint = Tool.getHint(parts['column'],1);
    if(hint){res.hint = hint;}
    if(parts["column"]){res.column   = parseColumn(parts["column"]);}
    if(parts["source"]){res.source   = parseSource(parts["source"]);}
    if(parts["joinmap"]){res.joinmap = parseJoinmap(parts["joinmap"]);}
    if(parts["where"]){res.where = parseWhere(parts["where"]);}
    if(parts["groupby"]){res.groupby = parseGroupby(parts["groupby"]);}
    if(parts["orderby"]){res.orderby = parseOrderby(parts["orderby"]);}
    if(parts["limit"]){res.limit = parseLimit(parts["limit"]);}
    result.push(res);
  }

  return result;
};

export const select = {
    parseGroupby,
    parseWhere,
    parseSource,
    parseJoinmap,
    parseColumn,
    parseOrderby,
    parseLimit,
    createObj,
}