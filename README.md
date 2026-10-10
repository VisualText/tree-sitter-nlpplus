# tree-sitter-nlpplus

[![CI](https://github.com/VisualText/tree-sitter-nlpplus/actions/workflows/ci.yml/badge.svg)](https://github.com/VisualText/tree-sitter-nlpplus/actions/workflows/ci.yml)

[Tree-sitter](https://tree-sitter.github.io) grammars for [NLP++](https://visualtext.org), the
programming language for natural language processing, and for the files an NLP++ analyzer is made
of. Editors that use tree-sitter (Neovim, Helix, Zed, Emacs) use these grammars for highlighting,
folding and structural navigation.

| Grammar | Directory | Files |
|---|---|---|
| `nlpplus` | `.` | Pass files: `*.nlp`, `*.pat` |
| `nlpplus_dict` | `dict/` | Dictionaries: `*.dict` |
| `nlpplus_kbb` | `kbb/` | Knowledge bases: `*.kbb` |
| `nlpplus_seq` | `seq/` | Pass sequences: `analyzer.seq` |
| `nlpplus_tree` | `tree/` | Parse trees: `*.tree` |

Each grammar has highlight queries in its `queries/` directory. The pass-file grammar also has
fold queries. The queries use the
[nvim-treesitter capture names](https://github.com/nvim-treesitter/nvim-treesitter/blob/main/CONTRIBUTING.md#highlights).

## How closely it follows the engine

The NLP++ engine's own parser for pass files is written in NLP++ (`data/rfb/spec` in
[nlp-engine](https://github.com/VisualText/nlp-engine)). The pass-file grammar follows those rules,
including details such as:

- `<<` binds more loosely than `=`.
- `&&` and `||` share one precedence level.
- Semicolons are optional.
- Region markers are case-insensitive.

The data-format grammars follow the engine's readers for each file type.

Each grammar was checked against every analyzer file in the VisualText repositories:

| Grammar | Files | Parse without errors |
|---|---|---|
| Pass files | 4,305 | 99.6% |
| `.dict` | 432 | 99.1% |
| `.kbb` | 156 | 96.2% |
| `analyzer.seq` | 371 | 100% |
| `.tree` | 3,000 | 100% |

The files that fail have real errors in them, such as unbalanced braces or unterminated strings, or
they are not UTF-8.

## Using it

### Neovim

Neovim (0.10 and later) loads a compiled parser from a `parser/` directory on the runtime path,
along with its queries from `queries/<language>/`:

```sh
git clone https://github.com/VisualText/tree-sitter-nlpplus
cd tree-sitter-nlpplus
tree-sitter build -o ~/.config/nvim/parser/nlpplus.so
mkdir -p ~/.config/nvim/queries/nlpplus
cp queries/*.scm ~/.config/nvim/queries/nlpplus/
```

Then add this to `init.lua`:

```lua
vim.filetype.add({ extension = { nlp = 'nlp' } })
vim.treesitter.language.register('nlpplus', 'nlp')
vim.api.nvim_create_autocmd('FileType', {
  pattern = 'nlp',
  callback = function() vim.treesitter.start() end,
})
```

To set up a data-format grammar, run the same steps in its own directory under its own name. For
example, run `tree-sitter build -o ~/.config/nvim/parser/nlpplus_dict.so dict` and copy
`dict/queries/*.scm` to `queries/nlpplus_dict/`.

For the NLP++ language server, see
[nlpplus-language-server](https://www.npmjs.com/package/nlpplus-language-server).

### Helix

Add this to `languages.toml`:

```toml
[[language]]
name = "nlpplus"
scope = "source.nlp"
file-types = ["nlp", "pat"]
comment-token = "#"
language-servers = ["nlpplus-language-server"]

[language-server.nlpplus-language-server]
command = "nlpplus-language-server"
args = ["--stdio"]

[[grammar]]
name = "nlpplus"
source = { git = "https://github.com/VisualText/tree-sitter-nlpplus", rev = "main" }
```

Then run `hx --grammar fetch` and `hx --grammar build`. Finally, copy `queries/highlights.scm` to
`~/.config/helix/runtime/queries/nlpplus/`.

## Development

```sh
npm install
npx tree-sitter generate     # regenerate src/ after editing grammar.js
npx tree-sitter test         # parse and highlight tests in test/
```

Each data-format grammar is generated in its own directory, for example
`cd dict && npx tree-sitter generate`. The tests for all five grammars are in `test/`.

## License

MIT
