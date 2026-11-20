package lint

import (
	"slices"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type lintDirective struct {
	location  core.TextRange
	position  int
	line      int
	kind      string
	rules     []string
	used      bool
	usedRules map[string]bool
}

func parseDirectives(file *ast.SourceFile, customRules map[string]bool) ([]lintDirective, []*ast.Diagnostic) {
	var directives []lintDirective
	var errors []*ast.Diagnostic
	for location := range scanner.GetCommentRanges(file) {
		text := file.Text()[location.Pos()+2 : location.End()]
		if file.Text()[location.Pos()+1] == '*' {
			text = strings.TrimSuffix(text, "*/")
		}
		text = strings.TrimSpace(text)
		if !strings.HasPrefix(text, "eslint-") {
			continue
		}
		kind := strings.Fields(text)[0]
		names := strings.TrimSpace(text[len(kind):])
		kind = strings.TrimPrefix(kind, "eslint-")
		if kind != "disable" && kind != "enable" && kind != "disable-line" && kind != "disable-next-line" {
			continue
		}
		if reason := strings.Index(names, "--"); reason >= 0 {
			previous, _ := utf8.DecodeLastRuneInString(names[:reason])
			if reason == 0 || unicode.IsSpace(previous) || previous == '\uFEFF' {
				names = names[:reason]
			}
		}
		directive := lintDirective{location: location, position: location.End(), line: -1, kind: kind}
		invalid := ""
		if kind == "disable-line" || kind == "disable-next-line" {
			first := scanner.GetECMALineOfPosition(file, location.Pos())
			last := scanner.GetECMALineOfPosition(file, location.End())
			if kind == "disable-line" && first != last {
				invalid = "eslint-disable-line must be on a single line"
			}
			directive.line = last
			if kind == "disable-next-line" {
				directive.line++
			}
		}
		if strings.TrimSpace(names) != "" {
			for name := range strings.SplitSeq(names, ",") {
				name = strings.TrimSpace(name)
				if len(name) >= 2 && (name[0] == '"' || name[0] == '\'') && name[len(name)-1] == name[0] {
					name = name[1 : len(name)-1]
				}
				if name == "" {
					continue
				}
				if _, exists := rules.Factories[name]; !exists && !customRules[name] {
					errors = append(errors, ast.NewDiagnostic(file, location, diagnostics.Unknown_lint_rule_0, name))
				}
				directive.rules = append(directive.rules, name)
			}
		}
		if invalid != "" {
			errors = append(errors, ast.NewDiagnostic(file, location, diagnostics.Invalid_lint_directive_Colon_0, invalid))
			continue
		}
		directives = append(directives, directive)
	}
	return directives, errors
}

func isSuppressed(file *ast.SourceFile, directives []lintDirective, name string, location core.TextRange) bool {
	line := scanner.GetECMALineOfPosition(file, location.Pos())
	suppression := -1
	for index := range directives {
		directive := &directives[index]
		if len(directive.rules) != 0 && !slices.Contains(directive.rules, name) {
			continue
		}
		if directive.line >= 0 {
			if directive.line == line {
				suppression = index
			}
		} else if directive.position <= location.Pos() {
			if directive.kind == "disable" {
				suppression = index
			} else {
				suppression = -1
			}
		}
	}
	if suppression < 0 {
		return false
	}
	directive := &directives[suppression]
	directive.used = true
	if len(directive.rules) > 1 {
		if directive.usedRules == nil {
			directive.usedRules = make(map[string]bool)
		}
		directive.usedRules[name] = true
	}
	return true
}

func unusedDirectiveDiagnostics(file *ast.SourceFile, directives []lintDirective, severity string) []*ast.Diagnostic {
	var result []*ast.Diagnostic
	for _, directive := range directives {
		if directive.kind == "enable" {
			continue
		}
		unused := !directive.used || len(directive.rules) > 1 && slices.ContainsFunc(directive.rules, func(name string) bool { return !directive.usedRules[name] })
		if unused {
			diagnostic := ast.NewDiagnostic(file, directive.location, diagnostics.Unused_lint_disable_directive)
			if severity == "error" {
				diagnostic.SetCategory(diagnostics.CategoryError)
			}
			result = append(result, diagnostic)
		}
	}
	return result
}
