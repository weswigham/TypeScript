package api

import (
	"testing"

	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestLintPluginPackageRootsBeforeModuleLoading(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]string{
		"/workspace/package.json":                                     "{}",
		"/workspace/node_modules/@scope/plugin/package.json":          "invalid package metadata",
		"/workspace/node_modules/@scope/plugin/dist/nested/index.mjs": "invalid JavaScript",
		"/workspace/node_modules/standalone/dist/index.mjs":           "invalid JavaScript",
		"/workspace/local-plugin/package.json":                        "{}",
		"/workspace/local-plugin/dist/index.mjs":                      "invalid JavaScript",
	}, tspath.CaseSensitive)
	for _, test := range []struct {
		name      string
		specifier string
		expected  tspath.RootedDirectoryPath
	}{
		{"bare-package", "@scope/plugin/subpath", "/workspace/node_modules/@scope/plugin"},
		{"relative-entry", "../../local-plugin/dist/index.mjs", "/workspace/local-plugin"},
		{"absolute-entry", "/workspace/node_modules/@scope/plugin/dist/nested/index.mjs", "/workspace/node_modules/@scope/plugin"},
		{"no-manifest", "/workspace/node_modules/standalone/dist/index.mjs", "/workspace/node_modules/standalone"},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			roots := lintPluginPackageRoots(linthost.PluginOptions{
				CurrentDirectory: "/workspace/config/project",
				Plugins:          map[string]string{"local": test.specifier},
			}, fs)
			assert.DeepEqual(t, roots, []tspath.RootedDirectoryPath{test.expected})
		})
	}
}
