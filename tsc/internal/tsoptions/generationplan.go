package tsoptions

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/glob"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
)

type GenerationPattern struct {
	Text            string
	Root            tspath.RootedDirectoryPath
	matcher         *glob.Glob
	relativeMatcher *glob.Glob
	literal         tspath.RootedFilePath
	caseSensitivity tspath.CaseSensitivity
}

func compileGenerationPattern(directory tspath.RootedDirectoryPath, pattern string, caseSensitivity tspath.CaseSensitivity) GenerationPattern {
	pattern = tspath.NormalizeSlashes(pattern)
	prefix := pattern
	wildcard := strings.IndexAny(prefix, "*?{[")
	if wildcard >= 0 {
		prefix = prefix[:wildcard]
	}
	separator := strings.LastIndex(prefix, "/") + 1
	root := directory
	if separator > 0 {
		root = tspath.ToRootedDirectoryPath(pattern[:separator], directory)
	}
	matcher, err := glob.Parse(caseSensitivity.Canonicalize(pattern[separator:]))
	if err != nil {
		panic(err)
	}
	relativeMatcher := matcher
	matcher = matcher.WithLiteralPrefix(caseSensitivity.Canonicalize(tspath.EnsureTrailingDirectorySeparator(root.AsString())))
	result := GenerationPattern{
		Text: caseSensitivity.Canonicalize(tspath.NormalizePath(tspath.CombinePaths(directory.AsString(), pattern))),
		Root: root, matcher: matcher, relativeMatcher: relativeMatcher, caseSensitivity: caseSensitivity,
	}
	if wildcard < 0 {
		result.literal = directory.ResolveFile(pattern)
	}
	return result
}

func (pattern GenerationPattern) Matches(path tspath.RootedPath) bool {
	return pattern.matcher.Match(pattern.caseSensitivity.Canonicalize(path.AsString()))
}

func (pattern GenerationPattern) physicalMatcher(fs vfs.FS) *glob.Glob {
	if pattern.literal != "" && fs.FileExists(pattern.literal) {
		return (&glob.Glob{}).WithLiteralPrefix(pattern.caseSensitivity.Canonicalize(fs.Realpath(pattern.literal.AsPath()).AsString()))
	}
	root := pattern.Root
	var missing []string
	for !fs.DirectoryExists(root) && root.AsPath().Directory() != root {
		missing = append(missing, root.BaseName())
		root = root.AsPath().Directory()
	}
	resolved := tspath.RootedDirectoryPathFromPath(fs.Realpath(root.AsPath()))
	for _, name := range slices.Backward(missing) {
		resolved = resolved.ResolveDirectory(name)
	}
	prefix := pattern.caseSensitivity.Canonicalize(tspath.EnsureTrailingDirectorySeparator(resolved.AsString()))
	return pattern.relativeMatcher.WithLiteralPrefix(prefix)
}

func (pattern GenerationPattern) Files(fs vfs.FS) []tspath.RootedFilePath {
	if pattern.literal != "" {
		if fs.FileExists(pattern.literal) {
			return []tspath.RootedFilePath{pattern.literal}
		}
		return nil
	}
	var files []tspath.RootedFilePath
	var visited collections.Set[tspath.PathKey]
	var visit func(tspath.RootedDirectoryPath)
	visit = func(directory tspath.RootedDirectoryPath) {
		key := pattern.caseSensitivity.PathKey(fs.Realpath(directory.AsPath()))
		if visited.Has(key) {
			return
		}
		visited.Add(key)
		entries := fs.GetAccessibleEntries(directory)
		for _, name := range entries.Files {
			file := directory.ResolveFile(name)
			if pattern.Matches(file.AsPath()) {
				files = append(files, file)
			}
		}
		for _, name := range entries.Directories {
			child := directory.ResolveDirectory(name)
			prefix := pattern.caseSensitivity.Canonicalize(tspath.EnsureTrailingDirectorySeparator(child.AsString()))
			if pattern.matcher.CanMatchPrefix(prefix) {
				visit(child)
			}
		}
	}
	visit(pattern.Root)
	slices.Sort(files)
	return files
}

type GenerationCommandPlan struct {
	Spec    GenerateCommand
	Inputs  []GenerationPattern
	Outputs []GenerationPattern
}

type GenerationPlan struct {
	Commands        []GenerationCommandPlan
	caseSensitivity tspath.CaseSensitivity
}

func NewGenerationPlan(commands []GenerateCommand, caseSensitivity tspath.CaseSensitivity) *GenerationPlan {
	plan := &GenerationPlan{caseSensitivity: caseSensitivity}
	for _, command := range commands {
		command.Inputs = slices.Clone(command.Inputs)
		command.Outputs = slices.Clone(command.Outputs)
		command.Command = slices.Clone(command.Command)
		entry := GenerationCommandPlan{Spec: command}
		for _, text := range command.Inputs {
			entry.Inputs = append(entry.Inputs, compileGenerationPattern(command.Directory, text, caseSensitivity))
		}
		for _, text := range command.Outputs {
			entry.Outputs = append(entry.Outputs, compileGenerationPattern(command.Directory, text, caseSensitivity))
		}
		plan.Commands = append(plan.Commands, entry)
	}
	return plan
}

func (p *ParsedCommandLine) GenerationPlan() *GenerationPlan {
	p.generationPlanOnce.Do(func() {
		if p.generationPlan == nil {
			p.generationPlan = NewGenerationPlan(p.ParsedConfig.Generate, p.caseSensitivity)
		}
	})
	return p.generationPlan
}

func (plan *GenerationPlan) OutputFiles(fs vfs.FS) []tspath.RootedFilePath {
	var files []tspath.RootedFilePath
	var seen collections.Set[tspath.PathKey]
	for _, command := range plan.Commands {
		for _, pattern := range command.Outputs {
			for _, file := range pattern.Files(fs) {
				key := plan.caseSensitivity.PathKey(file.AsPath())
				if !seen.Has(key) {
					seen.Add(key)
					files = append(files, file)
				}
			}
		}
	}
	return files
}

func (p *ParsedCommandLine) CleanOutputFiles(fs vfs.FS) []tspath.RootedFilePath {
	generated := p.GenerationPlan().OutputFiles(fs)
	var protected, seen collections.Set[tspath.PathKey]
	for _, file := range p.FileNames() {
		protected.Add(p.caseSensitivity.PathKey(file.AsPath()))
	}
	for _, file := range generated {
		protected.Delete(p.caseSensitivity.PathKey(file.AsPath()))
	}
	candidates := append(slices.Collect(p.GetOutputFileNames()), generated...)
	candidates = append(candidates, p.GetBuildInfoFileName())
	var outputs []tspath.RootedFilePath
	for _, file := range candidates {
		if file == "" {
			continue
		}
		key := p.caseSensitivity.PathKey(file.AsPath())
		if !protected.Has(key) && !seen.Has(key) {
			seen.Add(key)
			outputs = append(outputs, file)
		}
	}
	return outputs
}

func (plan *GenerationPlan) WatchDirectories(fs vfs.FS) []tspath.RootedDirectoryPath {
	var directories []tspath.RootedDirectoryPath
	var seen collections.Set[tspath.PathKey]
	for _, command := range plan.Commands {
		for _, pattern := range slices.Concat(command.Inputs, command.Outputs) {
			directory := pattern.Root
			for !fs.DirectoryExists(directory) && directory.AsPath().Directory() != directory {
				directory = directory.AsPath().Directory()
			}
			key := plan.caseSensitivity.PathKey(directory.AsPath())
			if !seen.Has(key) {
				seen.Add(key)
				directories = append(directories, directory)
			}
		}
	}
	return directories
}

func (plan *GenerationPlan) MatchesChange(fs vfs.FS, path tspath.RootedPath) bool {
	isFile := fs.FileExists(tspath.RootedFilePathFromPath(path))
	for _, command := range plan.Commands {
		for _, pattern := range slices.Concat(command.Inputs, command.Outputs) {
			if pattern.Matches(path) || !isFile &&
				(plan.caseSensitivity.ContainsPath(tspath.RootedDirectoryPathFromPath(path), pattern.Root.AsPath()) || plan.caseSensitivity.ContainsPath(pattern.Root, path)) {
				return true
			}
		}
	}
	return false
}

func (plan *GenerationPlan) OutputDiagnostics(fs vfs.FS) []*ast.Diagnostic {
	var errors []*ast.Diagnostic
	type ownedOutput struct {
		pattern GenerationPattern
		matcher *glob.Glob
	}
	var outputs []ownedOutput
	for _, command := range plan.Commands {
		var ownOutputs []ownedOutput
		for _, pattern := range command.Outputs {
			matcher := pattern.physicalMatcher(fs)
			for _, previous := range outputs {
				if matcher.Overlaps(previous.matcher) {
					errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Code_generation_outputs_0_and_1_overlap, previous.pattern.Text, pattern.Text))
				}
			}
			ownOutputs = append(ownOutputs, ownedOutput{pattern: pattern, matcher: matcher})
		}
		outputs = append(outputs, ownOutputs...)
	}
	return errors
}

func (plan *GenerationPlan) DependencyDiagnostics(fs vfs.FS) []*ast.Diagnostic {
	var errors []*ast.Diagnostic
	for producer, command := range plan.Commands {
		for _, output := range command.Outputs {
			matcher := output.physicalMatcher(fs)
			for consumer, other := range plan.Commands {
				if producer == consumer {
					continue
				}
				for _, input := range other.Inputs {
					if matcher.Overlaps(input.physicalMatcher(fs)) {
						errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Code_generation_commands_must_be_independent_Output_0_is_an_input_of_another_command, output.Text))
					}
				}
			}
		}
	}
	return errors
}
