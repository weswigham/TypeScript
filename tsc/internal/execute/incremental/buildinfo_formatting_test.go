package incremental_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/execute/incremental"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

type formattingStateFS struct {
	vfs.FS
	writes int
}

func (fs *formattingStateFS) WriteFile(name tspath.RootedFilePath, text string) error {
	fs.writes++
	return fs.FS.WriteFile(name, text)
}

func TestFormattingState(t *testing.T) {
	t.Parallel()
	const fileName = "/project/state.tsbuildinfo"
	versions := &collections.OrderedMap[string, string]{}
	versions.Set("input.ts", "version")
	info := incremental.BuildInfo{
		Version:      core.Version(),
		CheckPending: true,
		Formatting:   &incremental.FormattingBuildInfo{Options: "options", Files: versions},
	}
	text, err := json.Marshal(&info)
	assert.NilError(t, err)
	for _, test := range []struct {
		name         string
		text         string
		options      string
		cached       bool
		checkPending bool
	}{
		{"unchanged", string(text), "options", true, true},
		{"changed options", string(text), "changed", false, true},
		{"malformed", "{invalid", "options", false, false},
		{"incompatible version", `{"version":"old","checkPending":true}`, "options", false, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			fs := &formattingStateFS{FS: vfstest.FromMap(map[string]any{fileName: test.text}, tspath.CaseSensitive)}
			state := incremental.ReadFormattingState(fs, fileName, test.options)
			assert.Equal(t, state.FileVersions().GetOrZero("input.ts") == "version", test.cached)
			if test.cached {
				assert.NilError(t, state.Save())
				assert.Equal(t, fs.writes, 0)
			}
			state.FileVersions().Set("input.ts", "updated")
			assert.NilError(t, state.Save())
			assert.Equal(t, fs.writes, 1)
			updated, ok := fs.ReadFile(fileName)
			assert.Assert(t, ok)
			var saved incremental.BuildInfo
			assert.NilError(t, json.Unmarshal([]byte(updated), &saved))
			assert.Equal(t, saved.Version, core.Version())
			assert.Equal(t, saved.CheckPending, test.checkPending)
			assert.Equal(t, saved.Formatting.Options, test.options)
			assert.Assert(t, saved.Formatting.CompilationPending)
			assert.Equal(t, saved.Formatting.Files.GetOrZero("input.ts"), "updated")
			assert.NilError(t, state.Save())
			assert.Equal(t, fs.writes, 1)
		})
	}
	t.Run("without persistence", func(t *testing.T) {
		t.Parallel()
		fs := &formattingStateFS{FS: vfstest.FromMap(map[string]any{}, tspath.CaseSensitive)}
		state := incremental.ReadFormattingState(fs, "", "options")
		state.FileVersions().Set("input.ts", "version")
		assert.NilError(t, state.Save())
		assert.Equal(t, fs.writes, 0)
	})
}
