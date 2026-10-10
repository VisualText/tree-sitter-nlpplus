(separator) @punctuation.special
(pass_header) @markup.heading
(tree_header) @markup.heading

((name) @type
  (#match? @type "^_"))
((name) @variable
  (#not-match? @variable "^_"))

(type) @type.builtin
(flag) @attribute

(variable
  name: (string) @property)
(variable
  value: (string) @string)

(number) @number

[
  "["
  "]"
  "("
  ")"
] @punctuation.bracket

"," @punctuation.delimiter
