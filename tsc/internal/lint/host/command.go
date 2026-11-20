package host

import (
	"context"
	"errors"

	"github.com/microsoft/TypeScript/tsc/internal/osutil"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/osvfs"
)

type commandKey struct{}

func WithCommand(ctx context.Context, command []string) context.Context {
	return context.WithValue(ctx, commandKey{}, append([]string(nil), command...))
}

func CommandFromContext(ctx context.Context) []string {
	command, _ := ctx.Value(commandKey{}).([]string)
	return append([]string(nil), command...)
}

func ResolveCommand() ([]string, error) {
	executable, err := osutil.Executable()
	if err != nil {
		return nil, err
	}
	directory := tspath.RootedFilePathFromAbsolute(executable).Directory()
	for _, candidate := range []tspath.RootedFilePath{
		directory.ResolveFile("../../packages/typescript/dist/lint/shim.js"),
		directory.ResolveFile("../../typescript/dist/lint/shim.js"),
		directory.ResolveFile("../../native-preview/dist/lint/shim.js"),
	} {
		if osvfs.FS().FileExists(candidate) {
			return []string{"node", candidate.AsString()}, nil
		}
	}
	return nil, errors.New("cannot locate the TypeScript lint shim; run the compiler through its matching TypeScript package")
}
