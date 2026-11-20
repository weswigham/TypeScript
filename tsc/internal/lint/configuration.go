package lint

import (
	"fmt"
	"maps"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/glob"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
)

type lintPattern struct {
	glob        *glob.Glob
	descendants *glob.Glob
	negated     bool
}

type lintConfigBlock struct {
	files   []lintPattern
	ignores []lintPattern
	rules   map[string]any
	global  bool
}

func compileLintPatterns(patterns []string, cache map[string]lintPattern) ([]lintPattern, error) {
	result := make([]lintPattern, 0, len(patterns))
	for _, pattern := range patterns {
		if compiled, ok := cache[pattern]; ok {
			result = append(result, compiled)
			continue
		}
		original := pattern
		compiled := lintPattern{}
		for strings.HasPrefix(pattern, "!") {
			compiled.negated = !compiled.negated
			pattern = pattern[1:]
		}
		pattern = strings.TrimPrefix(strings.ReplaceAll(pattern, "\\", "/"), "./")
		for _, operator := range []string{"!(", "?(", "*(", "+(", "@("} {
			if strings.Contains(pattern, operator) {
				return nil, fmt.Errorf("unsupported extended glob in lint configuration: %q", original)
			}
		}
		var err error
		compiled.glob, err = glob.Parse(strings.TrimSuffix(pattern, "/"))
		if err != nil {
			return nil, fmt.Errorf("invalid lint pattern %q: %w", original, err)
		}
		compiled.descendants, err = glob.Parse(strings.TrimSuffix(pattern, "/") + "/**")
		if err != nil {
			return nil, fmt.Errorf("invalid lint pattern %q: %w", original, err)
		}
		cache[original] = compiled
		result = append(result, compiled)
	}
	return result, nil
}

func matchesLintPatterns(patterns []lintPattern, path string, descendants bool) bool {
	matched := false
	for _, pattern := range patterns {
		if pattern.glob.Match(path) || descendants && pattern.descendants.Match(path) {
			matched = !pattern.negated
		}
	}
	return matched
}

func mergeLintRules(target map[string]any, source map[string]any) {
	for name, value := range source {
		var severity any = value
		positional := false
		if tuple, ok := value.([]any); ok {
			positional = len(tuple) > 1
			if len(tuple) != 0 {
				severity = tuple[0]
			}
		}
		if !positional {
			if previous, ok := target[name].([]any); ok && len(previous) > 1 {
				value = append([]any{severity}, previous[1:]...)
			}
		}
		target[name] = value
	}
}

func planRuleSets(files []*ast.SourceFile, blocks []tsoptions.LintOverride, ignores []string, baseRules map[string]any, customRules map[string]bool) ([]*fileRuleSet, []*ast.Diagnostic, error) {
	patterns := make(map[string]lintPattern)
	globalIgnores, err := compileLintPatterns(ignores, patterns)
	if err != nil {
		return nil, nil, err
	}
	compiled := make([]lintConfigBlock, len(blocks))
	for index, block := range blocks {
		filePatterns, err := compileLintPatterns(block.Files, patterns)
		if err != nil {
			return nil, nil, err
		}
		ignorePatterns, err := compileLintPatterns(block.Ignores, patterns)
		if err != nil {
			return nil, nil, err
		}
		compiled[index] = lintConfigBlock{filePatterns, ignorePatterns, block.Rules, block.Rules == nil && len(block.Files) == 0}
	}
	sets := make([]*fileRuleSet, len(files))
	var result []*ast.Diagnostic
	configurations := make(map[string]*fileRuleSet)
	signature := make([]byte, (len(blocks)+7)/8)
	for index, file := range files {
		path := file.FileName().AsString()
		ignored := matchesLintPatterns(globalIgnores, path, true)
		for _, block := range compiled {
			if block.global {
				for _, pattern := range block.ignores {
					if pattern.glob.Match(path) || pattern.descendants.Match(path) {
						ignored = !pattern.negated
					}
				}
			}
		}
		if ignored {
			continue
		}
		clear(signature)
		for blockIndex, block := range compiled {
			if block.global || len(block.files) != 0 && !matchesLintPatterns(block.files, path, false) || matchesLintPatterns(block.ignores, path, true) {
				continue
			}
			signature[blockIndex/8] |= 1 << (blockIndex % 8)
		}
		set := configurations[string(signature)]
		if set == nil {
			values := maps.Clone(baseRules)
			if values == nil {
				values = make(map[string]any)
			}
			for blockIndex, block := range compiled {
				if signature[blockIndex/8]&(1<<(blockIndex%8)) != 0 {
					mergeLintRules(values, block.rules)
				}
			}
			var diagnostics []*ast.Diagnostic
			set, diagnostics = prepareRuleSet(values, customRules)
			result = append(result, diagnostics...)
			configurations[string(signature)] = set
		}
		sets[index] = set
	}
	return sets, result, nil
}

type pluginBatch struct {
	states []*fileState
	files  []*ast.SourceFile
	rules  map[string]any
}

func pluginBatches(states []fileState, workers int) []pluginBatch {
	count := 0
	for index := range states {
		if states[index].rules != nil && len(states[index].rules.custom) != 0 {
			count++
		}
	}
	maxFiles := max(1, min(32, (count+workers*4-1)/(workers*4)))
	var batches []pluginBatch
	var order []*fileRuleSet
	pending := make(map[*fileRuleSet]*pluginBatch)
	sizes := make(map[*fileRuleSet]int)
	for index := range states {
		state := &states[index]
		if state.rules == nil || len(state.rules.custom) == 0 {
			continue
		}
		batch := pending[state.rules]
		if batch == nil {
			order = append(order, state.rules)
		}
		if batch == nil || len(batch.files) >= maxFiles || sizes[state.rules]+len(state.file.Text()) > 256<<10 {
			if batch != nil {
				batches = append(batches, *batch)
			}
			batch = &pluginBatch{rules: state.rules.custom}
			pending[state.rules] = batch
			sizes[state.rules] = 0
		}
		batch.states = append(batch.states, state)
		batch.files = append(batch.files, state.file)
		sizes[state.rules] += len(state.file.Text())
	}
	for _, set := range order {
		batches = append(batches, *pending[set])
	}
	return batches
}
