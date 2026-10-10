/**
 * @file NLP++ dictionary (.dict) grammar for tree-sitter
 * @author David de Hilster <dehilster@gmail.com>
 * @license MIT
 *
 * One entry per line: a headword of one or more words, then attribute=value
 * pairs. Follows CG::parseDictLine in nlp-engine.
 *
 *   american samoan nationality=1 country="american samoa"
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: 'nlpplus_dict',

  extras: ($) => [/[ \t]/, $.comment],

  // Which word ends the headword is only known at the "=" after the next
  // word, one token further than LR(1) can see.
  conflicts: ($) => [[$.headword]],

  rules: {
    source_file: ($) => seq(optional($.entry), repeat(seq($._newline, optional($.entry)))),

    // The engine skips a line with no "=" only when it is commented out, but
    // a bare headword is common while a dictionary is being written.
    entry: ($) =>
      choice(
        seq(field('headword', $.headword), optional($._attributes)),
        $._attributes,
      ),

    // A word with no "=" after the first attribute is a stray word.
    _attributes: ($) => seq(field('attribute', $.attribute), repeat($._tail)),

    _tail: ($) => choice(field('attribute', $.attribute), $.word),

    headword: ($) => repeat1($.word),

    attribute: ($) =>
      seq(
        field('name', $.word),
        '=',
        optional(field('value', choice($.string, $.list, $.value))),
      ),

    list: ($) => seq(token(prec(2, '[')), repeat(choice($.string, $.item, ',')), ']'),

    item: (_) => /[^\s,\]#"]+/,

    // A backslash escapes a character: \= \" \#
    word: (_) => /([^\s="#\\]|\\[^\r\n])+/,

    // After "=", a value wins over the next word.
    value: (_) => token(prec(1, /[^\s"#\[][^\s"#]*/)),

    string: (_) => /"([^"\\\r\n]|\\.)*"/,

    // The engine skips the whole line when it sees a "#" outside a string.
    comment: (_) =>
      token(choice(seq('#', /[^\r\n]*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'))),

    _newline: (_) => /\r?\n/,
  },
});
