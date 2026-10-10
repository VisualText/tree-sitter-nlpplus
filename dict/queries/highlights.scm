(comment) @comment

(headword
  (word) @label)

(attribute
  name: (word) @property)

"=" @operator

(string) @string

((value) @number
  (#match? @number "^-?[0-9]+(\.[0-9]+)?$"))
((value) @string.special
  (#not-match? @string.special "^-?[0-9]+(\.[0-9]+)?$"))

(list
  (item) @string.special)

[
  "["
  "]"
] @punctuation.bracket

"," @punctuation.delimiter
