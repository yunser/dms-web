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
console.log('antlr4/========.========.========.========.========')

import antlr4 from 'antlr4';
import MyGrammarLexer from './kv/KVLexer.js';
import MyGrammarParser from './kv/KVParser.js';
import MyGrammarListener from './kv/KVListener.js';

// const input = `SELECT a,b FROM "tbl" where 8`
const input = `aaaa,bbb`

const chars = new antlr4.InputStream(input);
console.log('antlr4/chars:', chars)
const lexer = new MyGrammarLexer(chars);
console.log('antlr4/lexer:', lexer)
const tokens = new antlr4.CommonTokenStream(lexer);
const parser = new MyGrammarParser(tokens);
// parser.buildParseTrees = true;
console.log('antlr4/prog:')
const tree = parser.list()
// const tree = parser.prog()
console.log('antlr4/tree', tree)
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

// extends antlr4.tree.ParseTreeListener
class Visitor extends antlr4.tree.ParseTreeVisitor {
    visitChildren(ctx) {
        console.log('visitChildren',)
        if (!ctx) {
            return;
        }

        if (ctx.children) {
            return ctx.children.map(child => {
                console.log('child', child)
                if (child.children && child.children.length != 0) {
                    return child.accept(this);
                } else {
                    // const text = child.getText();
                    const text = child.toString()
                    console.log('text', text)
                    child.__text = text
                    return text
                }
            });
        }
    }
}

const acc = tree.accept(new Visitor());
console.log('antlr4/acc', JSON.stringify(acc))

console.log('antlr4/ttt', tree.toString())
console.log('antlr4/end')
export function SqlLab({ config, connectionId, event$ }: any) {

    return (
        <div>SqlLab</div>
    )
}
