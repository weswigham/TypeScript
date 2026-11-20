package api

import (
	"testing"

	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestLintLocalPluginWatchesDoNotExpandToProjectPackage(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]string{
		"/repo/package.json":                              "{}",
		"/repo/tools/lint/index.js":                       "invalid JavaScript",
		"/repo/.eslint-plugin-local/index.js":             "invalid JavaScript",
		"/repo/plugin.js":                                 "invalid JavaScript",
		"/repo/node_modules/declared-plugin/package.json": "{}",
		"/repo/node_modules/declared-plugin/lib/index.js": "invalid JavaScript",
	}, tspath.CaseSensitive)
	for _, test := range []struct {
		name      string
		specifier string
		expected  []tspath.RootedDirectoryPath
	}{
		{"nested-local", "./tools/lint/index.js", []tspath.RootedDirectoryPath{"/repo/tools/lint"}},
		{"local-eslint", "./.eslint-plugin-local/index.js", []tspath.RootedDirectoryPath{"/repo/.eslint-plugin-local"}},
		{"project-root-file", "./plugin.js", nil},
		{"bare-package", "declared-plugin", []tspath.RootedDirectoryPath{"/repo/node_modules/declared-plugin"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			roots := lintPluginPackageRoots(linthost.PluginOptions{
				CurrentDirectory: "/repo",
				Plugins:          map[string]string{"local": test.specifier},
			}, fs)
			assert.DeepEqual(t, roots, test.expected)
		})
	}
}
