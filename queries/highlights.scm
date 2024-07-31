; Identifier conventions

(identifier) @variable

; Assume all-caps names are constants
((identifier) @constant
  (#lua-match? @constant "^[A-Z][A-Z%d_]*$"))

; Other identifiers
(type_identifier) @type

(primitive_type) @type.builtin

(field_identifier) @variable.member

; Function definitions
(function_definition
  (identifier) @function)

(parameter
  [
    (identifier)
  ] @variable.parameter)

; Function calls
(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (field_expression
    field: (field_identifier) @function.call))

; Literals
[
  (line_comment)
  (block_comment)
] @comment @spell

(boolean_literal) @boolean
(integer_literal) @number
(float_literal) @number.float
(string_literal) @string

[
  "let"
] @keyword

[
  "record"
] @keyword.type

[
  (mutable_specifier)
] @keyword.modifier

"fn" @keyword.function

[
  "if"
  "else"
] @keyword.conditional

[
  "while"
] @keyword.repeat

; Operators
[
 "!="
 "%"
 "%="
 "&"
 "&&"
 "&="
 "*"
 "*="
 "+"
 "+="
 "-"
 "-="
 "/"
 "/="
 "<"
 "<="
 "="
 "=="
 ">"
 ">="
 "^"
 "^="
 "|"
 "|="
 "||"
] @operator

; Punctuation
[
  "("
  ")"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  "."
  ":"
  ";"
  "->"
] @punctuation.delimiter
