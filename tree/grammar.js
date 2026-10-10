/**
 * @file NLP++ parse tree (.tree) grammar for tree-sitter
 * @author David de Hilster <dehilster@gmail.com>
 * @license MIT
 *
 * The parse trees the engine writes after each pass: one node per line,
 * indented under its parent, with its offsets, type, flags and variables.
 *
 *   _np [0,6,0,6,8,23,node,fired,blt, ("head" "dog")]
 *      dog [4,6,4,6,0,0,alpha]
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: 'nlpplus_tree',

  extras: (_) => [/[ \t]/],

  word: ($) => $.word,

  rules: {
    source_file: ($) => seq(optional($._line), repeat(seq($._newline, optional($._line)))),

    _line: ($) => choice($.separator, $.pass_header, $.tree_header, $.node),

    separator: (_) => token(prec(1, /\*\*+/)),

    //     PASS 12 (doses)
    pass_header: (_) => token(prec(1, /PASS[ \t]+\d+[ \t]+\([^)\r\n]*\)/)),

    // FINAL OUTPUT TREE:
    tree_header: (_) => token(prec(1, /[A-Z][A-Z ]* TREE:/)),

    // A whitespace token prints no name, and a "[" token's name looks like
    // the start of its record.
    node: ($) =>
      seq(
        optional(field('name', choice($.name, alias('[', $.name)))),
        field('record', $.record),
      ),

    name: (_) => /[^\s\[]\S*/,

    // [start,end,ostart,oend,rule,pass,type,flags..., ("var" value...)...]
    record: ($) =>
      seq(
        '[',
        repeat(choice($.number, ',', $.type, $.flag, $.variable, $.word, $.string)),
        ']',
      ),

    type: (_) => choice('null', 'node', 'alpha', 'num', 'punct', 'white', 'ctrl', 'emoji'),

    flag: (_) => choice('b', 'un', 'sem', 'fired', 'blt'),

    // ("name" value...)
    variable: ($) =>
      seq('(', field('name', $.string), repeat(field('value', choice($.string, $.number, $.word))), ')'),

    word: (_) => /[^\s\[\](),"]+/,

    number: (_) => token(prec(1, /-?\d+(\.\d+)?/)),

    string: (_) => /"([^"\\\r\n]|\\.)*"/,

    _newline: (_) => /\r?\n/,
  },
});
