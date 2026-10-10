/**
 * @file NLP++ grammar for tree-sitter
 * @author David de Hilster <dehilster@gmail.com>
 * @license MIT
 *
 * An NLP++ pass file is a flat sequence of regions, each opened by a marker
 * such as @CODE, @NODES, @POST or @RULES. @RULES holds pattern rules; the code
 * regions (@CODE, @DECL, @PRE, @CHECK, @POST) hold statements. The engine's
 * own parser for this language is written in NLP++ (data/rfb/spec in
 * nlp-engine); this grammar follows it.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Lowest to highest. `<<` binds looser than `=`, and `&&` and `||` share a
// level, as in the engine.
const PREC = {
  output: 1,
  assign: 2,
  logical: 3,
  compare: 4,
  add: 5,
  multiply: 6,
  unary: 7,
  postfix: 8,
  call: 9,
};

// Region markers are case-insensitive: @CODE, @code.
const caseless = (word) =>
  word
    .split('')
    .map((c) => `[${c.toLowerCase()}${c.toUpperCase()}]`)
    .join('');

const marker = (name) => token(prec(1, new RegExp('@' + caseless(name))));
const endMarker = (name) => token(prec(1, new RegExp('@@' + caseless(name))));

// A region: its marker, its body, and an optional closing @@ marker. The
// closing marker is rarely written, so a region runs to the next marker.
const region = ($, name, ...body) =>
  prec.right(
    seq(
      alias(marker(name), $.section_start),
      ...body,
      optional(alias(endMarker(name), $.section_end)),
    ),
  );

const commaSep = (rule) => optional(seq(rule, repeat(seq(',', rule))));

export default grammar({
  name: 'nlpplus',

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._section),

    _section: ($) =>
      choice(
        $.code_section,
        $.decl_section,
        $.select_section,
        $.nodes_section,
        $.path_section,
        $.multi_section,
        $.recurse_section,
        $._region_section,
      ),

    _region_section: ($) =>
      choice($.pre_section, $.check_section, $.post_section, $.rules_section),

    // @CODE runs once, before the pass matches anything.
    code_section: ($) =>
      region($, 'CODE', repeat($._statement)),

    // @DECL holds user-defined functions.
    decl_section: ($) =>
      region($, 'DECL', repeat($.function_definition)),

    // @NODES, @PATH and @MULTI choose where in the parse tree the pass runs.
    select_section: ($) =>
      region($, 'SELECT', optional(choice($.nodes_section, $.path_section, $.multi_section))),

    nodes_section: ($) =>
      region($, 'NODES', repeat($.node_name)),

    path_section: ($) =>
      region($, 'PATH', repeat($.node_name)),

    multi_section: ($) =>
      region($, 'MULTI', repeat($.node_name)),

    // A named set of rules that rule elements invoke with recurse=(name).
    recurse_section: ($) =>
      seq(
        alias(marker('RECURSE'), $.section_start),
        field('name', $.identifier),
        repeat($._region_section),
        alias(endMarker('RECURSE'), $.section_end),
        optional(field('end_name', $.identifier)),
      ),

    // @PRE, @CHECK and @POST belong to the @RULES that follow them.
    pre_section: ($) =>
      region($, 'PRE', repeat(choice($.pre_action, $._statement))),

    check_section: ($) =>
      region($, 'CHECK', repeat($._statement)),

    post_section: ($) =>
      region($, 'POST', repeat($._statement)),

    rules_section: ($) =>
      region($, 'RULES', repeat($.rule)),

    // <1,2> cap();  applies the call to rule elements 1 through 2.
    pre_action: ($) =>
      prec.right(seq(
        '<',
        field('start', $.number),
        ',',
        field('end', $.number),
        '>',
        $.call_expression,
        optional(';'),
      )),

    // ---- Rules ------------------------------------------------------------

    // _np <- _det [opt] _adj [star] _noun @@
    rule: ($) =>
      seq(
        field('suggested', $.rule_element),
        '<-',
        repeat(field('element', $.rule_element)),
        '@@',
      ),

    rule_element: ($) =>
      seq(
        field('name', choice($.node_name, $.attribute_match, $.identifier, $.number, $.escape_char, $.symbol)),
        optional(field('modifiers', $.modifiers)),
      ),

    // [s one match=(_noun _verb) layer=_np]
    modifiers: ($) => seq('[', repeat(choice($.modifier, '*')), ']'),

    modifier: ($) =>
      seq(
        field('name', $.identifier),
        optional(seq('=', field('value', choice($._modifier_value, $.modifier_list)))),
      ),

    modifier_list: ($) => seq('(', repeat($._modifier_value), ')'),

    _modifier_value: ($) =>
      choice($.node_name, $.attribute_match, $.identifier, $.string, $.number, $.escape_char, $.symbol),

    // _xVAR("attr") matches a node that has the attribute.
    attribute_match: ($) =>
      seq(
        field('name', $.node_name),
        '(',
        field('attribute', choice($.string, $.identifier, $.number)),
        ')',
      ),

    // A non-ASCII character that is not a letter or digit (emoji, curly
    // quotes, ±) is literal in a rule without a backslash.
    symbol: (_) => /[^\x00-\x7F\p{L}\p{M}\p{N}\s]+/,

    // A literal character in a rule: \. \, \( \n
    escape_char: (_) => token(/\\[^\r\n]/),

    // ---- Code -------------------------------------------------------------

    function_definition: ($) =>
      seq(
        field('name', $.identifier),
        field('parameters', $.parameter_list),
        field('body', $.block),
      ),

    parameter_list: ($) => seq('(', commaSep($._expression), ')'),

    // A statement's semicolon is optional.
    _statement: ($) =>
      choice(
        $.expression_statement,
        $.block,
        $.if_statement,
        $.while_statement,
        $.return_statement,
        $.empty_statement,
      ),

    expression_statement: ($) => prec.right(seq($._expression, optional(';'))),

    empty_statement: (_) => ';',

    block: ($) => seq('{', repeat($._statement), '}'),

    if_statement: ($) =>
      prec.right(
        seq(
          'if',
          field('condition', $._expression),
          field('consequence', $._statement),
          optional(seq('else', field('alternative', $._statement))),
        ),
      ),

    while_statement: ($) =>
      seq('while', field('condition', $._expression), field('body', $._statement)),

    return_statement: ($) =>
      prec.right(seq('return', optional($._expression), optional(';'))),

    _expression: ($) =>
      choice(
        $.variable,
        $.call_expression,
        $.binary_expression,
        $.assignment_expression,
        $.unary_expression,
        $.update_expression,
        $.parenthesized_expression,
        $.string,
        $.number,
        $.float,
        $.identifier,
      ),

    // G("x") global, L("x") local, N("x", 2) rule element, S("x") suggested
    // node, X("x") context node, P("x") pass; an optional [index] for arrays.
    variable: ($) =>
      prec(
        PREC.call,
        seq(
          field('scope', alias(choice('G', 'g', 'L', 'l', 'N', 'n', 'S', 's', 'X', 'x', 'P', 'p'), $.variable_scope)),
          field('arguments', $.argument_list),
          optional(seq('[', optional(field('index', $._expression)), ']')),
        ),
      ),

    call_expression: ($) =>
      prec(
        PREC.call,
        seq(
          optional(seq(field('scope', $.identifier), '::')),
          field('function', $.identifier),
          field('arguments', $.argument_list),
        ),
      ),

    // An & passes a variable by reference.
    argument_list: ($) =>
      seq('(', commaSep(seq(optional($.reference), $._expression)), ')'),

    reference: (_) => '&',

    binary_expression: ($) => {
      const table = [
        [PREC.output, '<<'],
        [PREC.logical, choice('&&', '||')],
        [PREC.compare, choice('<', '>', '<=', '>=', '==', '!=')],
        [PREC.add, choice('+', '-')],
        [PREC.multiply, choice('*', '/', '%', '%%')],
      ];
      return choice(
        ...table.map(([precedence, operator]) =>
          prec.left(
            /** @type {number} */ (precedence),
            seq(
              field('left', $._expression),
              field('operator', /** @type {RuleOrLiteral} */ (operator)),
              field('right', $._expression),
            ),
          ),
        ),
      );
    },

    assignment_expression: ($) =>
      prec.right(
        PREC.assign,
        seq(field('left', $.variable), '=', field('right', $._expression)),
      ),

    unary_expression: ($) =>
      prec(
        PREC.unary,
        seq(field('operator', choice('!', '-', '+')), field('argument', $._expression)),
      ),

    update_expression: ($) =>
      choice(
        prec(PREC.unary, seq(field('operator', choice('++', '--')), field('argument', $.variable))),
        prec(PREC.postfix, seq(field('argument', $.variable), field('operator', choice('++', '--')))),
      ),

    parenthesized_expression: ($) => seq('(', $._expression, ')'),

    // ---- Tokens -----------------------------------------------------------

    // _noun, _xWILD, _ROOT
    node_name: (_) => /_[\p{L}\p{M}\p{N}\p{So}]+/,

    identifier: (_) => /[\p{L}][\p{L}\p{M}\p{N}_]*/,

    number: (_) => /\d+/,

    float: (_) => /\d+\.\d+/,

    // A string ends at its closing quote or, unclosed, at the end of the line.
    string: ($) =>
      seq(
        '"',
        repeat(choice(token.immediate(prec(1, /[^"\\\r\n]+/)), $.escape_sequence)),
        choice('"', token.immediate(/\r?\n/)),
      ),

    escape_sequence: (_) => token.immediate(/\\[^\r\n]/),

    comment: (_) =>
      token(
        choice(
          seq('#', /[^\r\n]*/),
          seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
        ),
      ),
  },
});
