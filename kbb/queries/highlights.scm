(comment) @comment

; A concept at the left margin, then concepts nested under it.
(_line
  .
  (entry
    concept: (concept) @module))
(source_file
  (entry
    concept: (concept) @module))
(source_file
  (indent)
  .
  (entry
    concept: (concept) @type))

(attribute
  name: (_) @property)

[
  ":"
  "="
] @operator

[
  "["
  "]"
] @punctuation.bracket

"," @punctuation.delimiter

(number) @number
(value) @string.special
(item) @string.special
(list
  (string) @string)
(attribute
  value: (string) @string)
