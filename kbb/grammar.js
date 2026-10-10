/**
 * @file NLP++ knowledge base (.kbb) grammar for tree-sitter
 * @author David de Hilster <dehilster@gmail.com>
 * @license MIT
 *
 * An indented hierarchy of concepts, two spaces a level. A concept may be
 * followed by a colon and attributes separated by spaces or commas. Follows
 * CG::parseKBBLine in nlp-engine.
 *
 *   degrees
 *     bs: name="bachelor of science", professional=1, synonym=[bsc,sb]
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: 'nlpplus_kbb',

  // Whitespace is explicit: leading whitespace is the hierarchy.
  extras: (_) => [],

  rules: {
    source_file: ($) => seq(optional($._line), repeat(seq($._newline, optional($._line)))),

    _line: ($) =>
      choice(
        $.indent,
        seq(optional($.indent), $.comment),
        seq($.entry, optional($.comment)),
        // key=value with no concept, as json2kbb writes
        seq(optional($.indent), $._line_attributes, optional($.comment)),
        seq($.indent, alias($.entry, $.nested_entry), optional($.comment)),
      ),

    entry: ($) =>
      seq(
        field('concept', $.concept),
        optional($._space),
        optional(
          seq(
            ':',
            optional($._separator),
            optional($._attributes),
          ),
        ),
      ),

    _attributes: ($) =>
      seq(
        field('attribute', $.attribute),
        repeat(seq($._separator, field('attribute', $.attribute))),
        optional($._separator),
      ),

    // The first name on the line uses the concept token; the parser tells
    // them apart by the "=" that follows.
    _line_attributes: ($) =>
      seq(
        field('attribute', alias($._first_attribute, $.attribute)),
        repeat(seq($._separator, field('attribute', $.attribute))),
        optional($._separator),
      ),

    _first_attribute: ($) =>
      seq(
        field('name', choice($.string, alias($._concept_text, $.name))),
        '=',
        field('value', choice($.string, $.list, $.value)),
      ),

    // A concept name runs to the colon; it may hold spaces, or be quoted. A
    // line with an "=" before any colon is attributes, as json2kbb writes.
    concept: ($) => prec(1, choice($.string, $._concept_text)),

    _concept_text: (_) => /[^\s:#"=]([^:#"=\r\n]*[^\s:#"=])?/,

    attribute: ($) =>
      seq(
        field('name', choice($.string, $.name)),
        optional(seq('=', field('value', choice($.string, $.list, $.value)))),
      ),

    name: (_) => /[^\s=,:#"\[\]]+/,

    value: (_) => /[^\s,#"\[\]]+/,

    // [a, b c, "d"] or a concept path: ["concept" "parent" "child"]
    list: ($) => seq('[', repeat(choice($.string, $.item, ',', $._space)), ']'),

    item: (_) => /[^\s,\]#"]([^,\]\r\n#"]*[^\s,\]#"])?/,

    string: (_) => /"([^"\\\r\n]|\\.)*"/,

    indent: (_) => /[ \t]+/,

    _space: (_) => /[ \t]+/,

    _separator: (_) => /[ \t]*,[ \t]*|[ \t]+/,

    comment: (_) =>
      token(choice(seq('#', /[^\r\n]*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'))),

    _newline: (_) => /\r?\n/,
  },
});
