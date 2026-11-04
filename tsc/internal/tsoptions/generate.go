package tsoptions

import (
	"fmt"
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/glob"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

type GenerateCommand struct {
	Inputs    []string                   `json:"inputs"`
	Outputs   []string                   `json:"outputs"`
	Command   []string                   `json:"command"`
	Directory tspath.RootedDirectoryPath `json:"-"`
}

func (command GenerateCommand) Equals(other GenerateCommand) bool {
	return command.Directory == other.Directory &&
		(command.Inputs == nil) == (other.Inputs == nil) && slices.Equal(command.Inputs, other.Inputs) &&
		(command.Outputs == nil) == (other.Outputs == nil) && slices.Equal(command.Outputs, other.Outputs) &&
		(command.Command == nil) == (other.Command == nil) && slices.Equal(command.Command, other.Command)
}

func parseGenerateCommands(value any, directory tspath.RootedDirectoryPath) ([]GenerateCommand, []*ast.Diagnostic) {
	if value == nil {
		return nil, nil
	}
	var errors []*ast.Diagnostic
	invalid := func(name, expected string) {
		errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Argument_for_0_option_must_be_Colon_1, name, expected))
	}
	entries, ok := value.([]any)
	if !ok {
		invalid("generate", "an array of command objects")
		return nil, errors
	}
	commands := make([]GenerateCommand, 0, len(entries))
	for index, entry := range entries {
		name := fmt.Sprintf("generate[%d]", index)
		object, ok := entry.(*collections.OrderedMap[string, any])
		if !ok {
			invalid(name, "an object")
			continue
		}
		startErrors := len(errors)
		readStrings := func(property string) []string {
			values, isArray := object.GetOrZero(property).([]any)
			if !isArray || len(values) == 0 {
				invalid(name+"."+property, "a non-empty array of strings")
				return nil
			}
			var result []string
			for _, value := range values {
				text, isString := value.(string)
				if !isString || text == "" {
					invalid(name+"."+property, "non-empty strings")
					continue
				}
				if property != "command" {
					if _, err := glob.Parse(tspath.NormalizeSlashes(text)); err != nil {
						invalid(name+"."+property, err.Error())
					}
				} else if strings.Contains(text, "${inputs}") && text != "${inputs}" {
					invalid(name+".command", "'${inputs}' as a whole argument")
				}
				result = append(result, text)
			}
			return result
		}
		command := GenerateCommand{Directory: directory, Inputs: readStrings("inputs"), Outputs: readStrings("outputs"), Command: readStrings("command")}
		if value, present := object.Get("cwd"); present {
			cwd, isString := value.(string)
			if !isString {
				invalid(name+".cwd", "string")
			} else if cwd == "" {
				errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Compiler_option_0_cannot_be_given_an_empty_string, name+".cwd"))
			} else if isNetworkPathValue(cwd, directory) {
				errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Network_path_0_is_not_supported, cwd))
			} else {
				command.Directory = tspath.ToRootedDirectoryPath(cwd, directory)
			}
		}
		for property := range object.Keys() {
			if property != "inputs" && property != "outputs" && property != "command" && property != "cwd" {
				invalid(name+"."+property, "'inputs', 'outputs', 'command', or 'cwd'")
			}
		}
		if len(command.Command) > 0 && command.Command[0] == "${inputs}" {
			invalid(name+".command", "an executable as the first argument")
		}
		if len(errors) == startErrors {
			commands = append(commands, command)
		}
	}
	return commands, errors
}
