import { Button, Descriptions, Dropdown, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './sql-lab.module.less';
import _, { debounce } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { DatabaseOutlined, FormatPainterOutlined, ReloadOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { suggestionAdd } from '../suggestion';
import { SorterResult } from 'antd/lib/table/interface';
import { request } from '../utils/http';


import antlr4 from 'antlr4';
import MyGrammarLexer from './kv/KVLexer.js';
import MyGrammarParser from './kv/KVParser.js';
import MyGrammarListener from './kv/KVListener.js';

const input = "12:34=56"
const chars = new antlr4.InputStream(input);
const lexer = new MyGrammarLexer(chars);
const tokens = new antlr4.CommonTokenStream(lexer);
const parser = new MyGrammarParser(tokens);
// parser.buildParseTrees = true;
const tree = parser.prog()
console.log('tree', tree)
// const tree = parser.MyStartRule();
// const tree = parser.statement();
class KeyPrinter extends MyGrammarListener {
    // override default listener behavior
    exitKey(ctx) {
        console.log("Oh, a key!");
    }
}
const printer = new KeyPrinter();
antlr4.tree.ParseTreeWalker.DEFAULT.walk(printer, tree);


class Visitor {
    visitChildren(ctx) {
        console.log('visitChildren', )
      if (!ctx) {
        return;
      }
  
      if (ctx.children) {
        return ctx.children.map(child => {
          if (child.children && child.children.length != 0) {
            return child.accept(this);
          } else {
            console.log('child', child)
            const text = child.getText();
            console.log('text', text)
            return text
          }
        });
      }
    }
  }
  
  const acc = tree.accept(new Visitor());
  console.log('acc', acc)

  console.log('ttt', tree.toString())
console.log('end')
export function SqlLab({ config, connectionId, event$ }: any) {
    
    return (
        <div>SqlLab</div>
    )
}
