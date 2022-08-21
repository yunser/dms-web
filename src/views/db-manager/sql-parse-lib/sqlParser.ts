import { Lexter } from './lexter'
import { Tool } from './sqlParseTool'
import { update } from './parsers/update'
import { insert } from './parsers/insert'
import { select } from './parsers/select'
import { _delete } from './parsers/delete'
var parsers = {
    update,
    delete: _delete,
    insert,
    select,
};

// function init(){
//   require('fs').readdirSync(__dirname + '/parsers').forEach(function(file) {
//     var match = file.match(/^(\w+)\.js$/);
//       if (!match) {
//         return;
//       }
//       parsers[match[1].trim().toLowerCase()] = require(__dirname + '/parsers/' + file);
//   });
// }

// init();

var parse = function(sql) {
  sql = sql.trim();
  var who = sql.substr(0,sql.indexOf(' ')).toLowerCase();
  if(parsers[who] === undefined){
    throw new Error("Unsupported sentence");
  }
  return  parsers[who].createObj(sql);
};

export const SqlParser = {
    parse,
    RELATE: Tool.RELATE,
    JOIN: Tool.JOIN,
    ORDER: Tool.ORDER,
    types: Lexter.types,
}
