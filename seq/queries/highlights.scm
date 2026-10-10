(comment) @comment

(pass_type) @keyword
(nil) @constant.builtin
(number) @number

(pass
  file: (name) @function)

(inactive) @comment.note

; An inactive pass reads as switched off.
(pass
  inactive: (inactive)
  type: (pass_type) @comment)
