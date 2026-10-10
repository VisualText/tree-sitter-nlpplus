package tree_sitter_nlpplus_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_nlpplus "github.com/VisualText/tree-sitter-nlpplus/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_nlpplus.Language())
	if language == nil {
		t.Errorf("Error loading NLP++ grammar")
	}
}
