# sql-parse
### A tool for parsing SQL queries.  
[![Build Status](https://travis-ci.org/invercity/sql-parse.svg)](https://travis-ci.org/invercity/sql-parse)
[![NPM Version][npm-image]][npm-url]

## Installing

```bash
$ npm install sql-parse
```
## Usage

```javascript
var parse = require('sql-parse').parse;
var result = parse('SELECT * FROM table');
```
## Testing

* make test
* make cov, coverage.html

## License
### MIT

[npm-image]: https://img.shields.io/npm/v/sql-parse.svg
[npm-url]: https://npmjs.org/package/sql-parse