package rules

import (
	"regexp"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptTripleSlashReferenceRule struct {
	context    Context
	references []typescriptTripleSlashReference
}

func (rule *typescriptTripleSlashReferenceRule) OnEnterNode(node *ast.Node) bool {
	rule.tripleSlash(node)
	return true
}

func (rule *typescriptTripleSlashReferenceRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptTripleSlashReferenceRule) tripleSlash(node *ast.Node) {
	if node.Kind == ast.KindSourceFile {
		lexer := scanner.GetScannerForSourceFile(rule.context.File, 0)
		lexer.SetSkipTrivia(false)
		lexer.ResetTokenState(0)
		for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
			if kind == ast.KindSingleLineCommentTrivia {
				match := typescriptTripleSlashReferencePattern.FindStringSubmatch(strings.TrimPrefix(lexer.TokenText(), "//"))
				if match == nil {
					continue
				}
				reference := typescriptTripleSlashReference{start: lexer.TokenStart(), end: lexer.TokenEnd(), module: match[2]}
				mode, ok := rule.Options()[match[1]].(string)
				if !ok {
					mode = map[string]string{"lib": "always", "path": "never", "types": "prefer-import"}[match[1]]
				}
				if mode == "never" {
					rule.referenceReport(reference)
				} else if match[1] == "types" && mode == "prefer-import" {
					rule.references = append(rule.references, reference)
				}
			} else if kind != ast.KindMultiLineCommentTrivia && kind != ast.KindWhitespaceTrivia && kind != ast.KindNewLineTrivia {
				break
			}
		}
		return
	}
	var source *ast.Node
	if node.Kind == ast.KindImportDeclaration {
		source = node.AsImportDeclaration().ModuleSpecifier
	} else if node.Kind == ast.KindImportEqualsDeclaration {
		reference := node.AsImportEqualsDeclaration().ModuleReference
		if reference.Kind == ast.KindExternalModuleReference {
			source = reference.Expression()
		}
	}
	if source == nil || source.Kind != ast.KindStringLiteral {
		return
	}
	for _, reference := range rule.references {
		if reference.module == source.Text() {
			rule.referenceReport(reference)
		}
	}
}

func (rule *typescriptTripleSlashReferenceRule) Options() map[string]any {
	if len(rule.context.Options) != 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *typescriptTripleSlashReferenceRule) referenceReport(reference typescriptTripleSlashReference) {
	rule.context.Report(core.NewTextRange(reference.start, reference.end), diagnostics.Do_not_use_a_triple_slash_reference_for_0_use_import_style_instead, reference.module)
}

type typescriptTripleSlashReference struct {
	start, end int
	module     string
}

var typescriptTripleSlashReferencePattern = regexp.MustCompile(`^/[\t\n\v\f\r \x{00a0}\x{1680}\x{2000}-\x{200a}\x{2028}\x{2029}\x{202f}\x{205f}\x{3000}\x{feff}]*<reference\s*(types|path|lib)\s*=\s*["|'](.*)["|']`)

func newTypeScriptTripleSlashReference(context Context) Rule {
	return &typescriptTripleSlashReferenceRule{context: context}
}
