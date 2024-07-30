; Identifiers

(type_identifier) @type
(primitive_type) @type.builtin
(field_identifier) @property

; Identifier conventions

; Assume all-caps names are constants
((identifier) @constant
 (#match? @constant "^[A-Z][A-Z\\d_]+$'"))

; Function calls

(call_expression
  function: (identifier) @function)
(call_expression
  function: (field_expression
    field: (field_identifier) @function.method))

; Function definitions

(function_definition (identifier) @function)

(line_comment) @comment
(block_comment) @comment

"(" @punctuation.bracket
")" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket

"." @punctuation.delimiter
"," @punctuation.delimiter
";" @punctuation.delimiter

(parameter (identifier) @variable.parameter)

"else" @keyword
"fn" @keyword
"if" @keyword
"let" @keyword
"record" @keyword
"while" @keyword

(string_literal) @string

(boolean_literal) @constant.builtin
(integer_literal) @constant.builtin
(float_literal) @constant.builtin
