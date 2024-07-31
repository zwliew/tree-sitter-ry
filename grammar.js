/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  call: 15,
  field: 14,
  multiplicative: 10,
  additive: 9,
  shift: 8,
  bitand: 7,
  bitxor: 6,
  bitor: 5,
  comparative: 4,
  and: 3,
  or: 2,
  assign: 0,
};

module.exports = grammar({
  name: "ry",

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  inline: $ => [
    $._type_identifier,
  ],

  rules: {
    source_file: $ => repeat($._top_level),

    _top_level: $ => choice(
      $.function_definition,
      $.record_definition,
    ),

    function_definition: $ => seq(
      'fn',
      field('name', $.identifier),
      field('parameters', $.parameters),
      '->',
      field('return_type', $._type),
      field('body', $.block),
    ),

    parameters: $ => seq(
      '(',
      sepBy(',', seq(
        $.parameter,
      )),
      optional(','),
      ')',
    ),

    parameter: $ => seq(
      optional($.mutable_specifier),
      field('name', $.identifier),
      ':',
      field('type', $._type),
    ),

    block: $ => seq(
      '{',
      repeat($._statement),
      optional($._expression),
      '}',
    ),

    _statement: $ => choice(
      $.expression_statement,
      $._declaration_statement,
    ),

    expression_statement: $ => seq(
      $._expression,
      ';',
    ),

    _declaration_statement: $ => $.let_declaration,

    _expression: $ => choice(
      prec.left($.identifier),
      $.call_expression,
      alias($._literal, $.identifier),
      $.field_expression,
      $.binary_expression,
      $.record_expression,
      $.assignment_expression,
      $.compound_assignment_expression,
      $._expression_ending_with_block,
    ),

    _literal: $ => choice(
      $.boolean_literal,
      $.integer_literal,
      $.float_literal,
      $.string_literal,
    ),

    boolean_literal: _ => choice('true', 'false'),
    integer_literal: _ => /\d+/,
    float_literal: _ => /\d+\.\d+/,
    string_literal: $ => seq(
      alias(/[bc]?"/, '"'),
      alias(token.immediate(prec(1, /[^\\"\n]+/)), $.string_content),
      token.immediate('"'),
    ),

    field_expression: $ => prec(PREC.field, seq(
      field('value', $._expression),
      '.',
      field('field', $._field_identifier),
    )),

    binary_expression: $ => {
      const table = [
        [PREC.and, '&&'],
        [PREC.or, '||'],
        [PREC.bitand, '&'],
        [PREC.bitor, '|'],
        [PREC.bitxor, '^'],
        [PREC.comparative, choice('==', '!=', '<', '<=', '>', '>=')],
        [PREC.shift, choice('<<', '>>')],
        [PREC.additive, choice('+', '-')],
        [PREC.multiplicative, choice('*', '/', '%')],
      ];

      // @ts-ignore
      return choice(...table.map(([precedence, operator]) => prec.left(precedence, seq(
        field('left', $._expression),
        // @ts-ignore
        field('operator', operator),
        field('right', $._expression),
      ))));
    },

    call_expression: $ => prec(PREC.call, seq(
      field('function', $._expression),
      field('arguments', $.arguments),
    )),

    arguments: $ => seq(
      '(',
      sepBy(',', $._expression),
      optional(','),
      ')',
    ),

    assignment_expression: $ => prec.left(PREC.assign, seq(
      field('left', $._expression),
      '=',
      field('right', $._expression),
    )),

    compound_assignment_expression: $ => prec.left(PREC.assign, seq(
      field('left', $._expression),
      field('operator', choice('+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=')),
      field('right', $._expression),
    )),

    let_declaration: $ => seq(
      'let',
      optional($.mutable_specifier),
      field('name', $.identifier),
      optional(seq(
        ':',
        field('type', $._type),
      )),
      '=',
      field('value', $._expression),
      ';',
    ),

    _expression_ending_with_block: $ => choice(
      $.if_expression,
      $.while_expression,
    ),

    if_expression: $ => prec.right(seq(
      'if',
      field('condition', $._condition),
      field('consequence', $.block),
      optional(field('alternative', $.else_clause)),
    )),

    _condition: $ => $._expression,

    else_clause: $ => seq(
      'else',
      choice(
        $.block,
        $.if_expression,
      ),
    ),

    while_expression: $ => seq(
      'while',
      field('condition', $._condition),
      field('body', $.block),
    ),

    record_expression: $ => seq(
      field('name', $._type_identifier),
      field('body', $.field_initializer_list),
    ),

    field_initializer_list: $ => seq(
      '{',
      sepBy(',', $.field_initializer),
      optional(','),
      '}',
    ),

    field_initializer: $ => seq(
      field('field', $._field_identifier),
      ':',
      field('value', $._expression),
    ),

    record_definition: $ => seq(
      'record',
      field('name', $._type_identifier),
      field('body', $.field_declaration_list),
    ),

    field_declaration_list: $ => seq(
      '{',
      sepBy(',', seq($.field_declaration)),
      optional(','),
      '}',
    ),

    field_declaration: $ => seq(
      field('name', $._field_identifier),
      ':',
      field('type', $._type),
    ),

    _type: $ => choice(
      $.primitive_type,
      $._type_identifier,
    ),

    primitive_type: _ => choice(
      'i64', 'f64', 'bool', "unit",
    ),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    _type_identifier: $ => alias($.identifier, $.type_identifier),
    _field_identifier: $ => alias($.identifier, $.field_identifier),

    line_comment: _ => seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),

    block_comment: _ => seq(
      '/*',
      /[^*]*\*+([^/*][^*]*\*+)*/,
      '/',
    ),

    mutable_specifier: _ => 'mut',
  }
});

/**
 * Creates a rule to match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @return {SeqRule}
 *
 */
function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @return {ChoiceRule}
 *
 */
function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule));
}
