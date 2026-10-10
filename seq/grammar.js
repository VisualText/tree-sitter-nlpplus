/**
 * @file NLP++ analyzer sequence (analyzer.seq) grammar for tree-sitter
 * @author David de Hilster <dehilster@gmail.com>
 * @license MIT
 *
 * One pass per line: an optional pass number, the pass type, the pass file
 * (or nil) and a comment. A leading slash makes a pass inactive; two slashes
 * start a comment. Follows Ana::parseSeq in nlp-engine.
 *
 *   tokenize	nil	# split the text into tokens
 *   nlp	sentences	# cut the text into sentences
 *   /nlp	oldPass
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// The pass types Ana::internSeq accepts; "pat" is read as "nlp".
const PASS_TYPES = [
  'chartok', 'cmltok', 'cmltokenize', 'dicttok', 'dicttokz', 'end', 'folder',
  'gen', 'genhash', 'hash', 'intern', 'line', 'lines', 'nintern', 'nlp', 'pat',
  'python', 'rec', 'stub', 'tok', 'token', 'tokenize',
];

const caseless = (word) =>
  word
    .split('')
    .map((c) => `[${c.toLowerCase()}${c.toUpperCase()}]`)
    .join('');

export default grammar({
  name: 'nlpplus_seq',

  extras: ($) => [/[ \t]/, $.comment],

  word: ($) => $.name,

  rules: {
    source_file: ($) => seq(optional($.pass), repeat(seq($._newline, optional($.pass)))),

    pass: ($) =>
      seq(
        optional(field('inactive', $.inactive)),
        optional(field('number', $.number)),
        field('type', $.pass_type),
        optional(seq(field('file', choice($.nil, $.name)), repeat($.name))),
      ),

    inactive: (_) => '/',

    pass_type: (_) => token(prec(1, new RegExp(PASS_TYPES.map(caseless).join('|')))),

    nil: (_) => token(prec(1, new RegExp(caseless('nil')))),

    name: (_) => /[^\s#\/]+/,

    number: (_) => token(prec(1, /\d+/)),

    comment: (_) =>
      token(
        choice(
          seq('#', /[^\r\n]*/),
          seq('//', /[^\r\n]*/),
          seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
        ),
      ),

    _newline: (_) => /\r?\n/,
  },
});
