package api

import (
	"strings"

	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/osvfs"
)

func lintPluginPackageRoots(options linthost.PluginOptions, fs vfs.FS) []tspath.RootedDirectoryPath {
	var roots []tspath.RootedDirectoryPath
	for namespace, specifier := range options.Plugins {
		origin := options.PluginResolveFrom[namespace]
		if origin == "" {
			origin = options.CurrentDirectory
		}
		if !tspath.IsRootedDiskPath(origin) {
			continue
		}
		directory := tspath.RootedDirectoryPathFromAbsolute(origin)
		if tspath.IsRootedDiskPath(specifier) || strings.HasPrefix(specifier, ".") {
			projectRoot := lintPluginPackageRoot(directory, fs)
			module := directory.ResolveFile(specifier)
			start := module.Directory()
			if fs.DirectoryExists(tspath.RootedDirectoryPathFromPath(module.AsPath())) {
				start = tspath.RootedDirectoryPathFromPath(module.AsPath())
			}
			if root := lintLocalPluginPackageRoot(start, projectRoot, fs); root != "" {
				roots = append(roots, root)
			}
			if fs.FileExists(module) || fs.DirectoryExists(tspath.RootedDirectoryPathFromPath(module.AsPath())) {
				realPath := fs.Realpath(module.AsPath())
				if realPath != module.AsPath() {
					realDirectory := realPath.Directory()
					if fs.DirectoryExists(tspath.RootedDirectoryPathFromPath(realPath)) {
						realDirectory = tspath.RootedDirectoryPathFromPath(realPath)
					}
					realProjectRoot := tspath.RootedDirectoryPathFromPath(fs.Realpath(projectRoot.AsPath()))
					if root := lintLocalPluginPackageRoot(realDirectory, realProjectRoot, fs); root != "" {
						roots = append(roots, root)
					}
				}
			}
			continue
		}
		parts := strings.Split(specifier, "/")
		length := 1
		if strings.HasPrefix(specifier, "@") {
			length = 2
		}
		if len(parts) < length || parts[length-1] == "" || strings.ContainsAny(parts[0], ":#\\") {
			continue
		}
		packageName := strings.Join(parts[:length], "/")
		root := directory.ResolveDirectory("node_modules/" + packageName)
		for current := directory; ; {
			candidate := current.ResolveDirectory("node_modules/" + packageName)
			if fs.DirectoryExists(candidate) {
				root = candidate
				break
			}
			parent := current.AsPath().Directory()
			if parent == current {
				break
			}
			current = parent
		}
		roots = append(roots, root)
		if fs.DirectoryExists(root) {
			realPath := tspath.RootedDirectoryPathFromPath(fs.Realpath(root.AsPath()))
			if realPath != root {
				roots = append(roots, realPath)
			}
		}
	}
	return roots
}

func lintLocalPluginPackageRoot(start, projectRoot tspath.RootedDirectoryPath, fs vfs.FS) tspath.RootedDirectoryPath {
	root := lintPluginPackageRoot(start, fs)
	if fs.CaseSensitivity().PathKey(root.AsPath()) == fs.CaseSensitivity().PathKey(projectRoot.AsPath()) {
		if fs.CaseSensitivity().PathKey(start.AsPath()) == fs.CaseSensitivity().PathKey(projectRoot.AsPath()) {
			return ""
		}
		return start
	}
	return root
}

func lintPluginPackageRoot(start tspath.RootedDirectoryPath, fs vfs.FS) tspath.RootedDirectoryPath {
	for directory := start; ; {
		if directory.BaseName() == "node_modules" {
			return start
		}
		if fs.FileExists(directory.ResolveFile("package.json")) {
			return directory
		}
		parent := directory.AsPath().Directory()
		if parent == directory {
			return start
		}
		if parent.BaseName() == "node_modules" || strings.HasPrefix(parent.BaseName(), "@") && parent.AsPath().Directory().BaseName() == "node_modules" {
			return directory
		}
		directory = parent
	}
}

func (h *lintHost) watchPluginPackages(options linthost.PluginOptions) {
	roots := lintPluginPackageRoots(options, osvfs.FS())
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.watchedDirectories == nil {
		h.watchedDirectories = make(map[string]struct{})
	}
	for _, root := range roots {
		h.watchedDirectories[root.AsString()] = struct{}{}
	}
}

func (h *lintHost) WatchedDirectories() []string {
	h.mu.Lock()
	defer h.mu.Unlock()
	directories := make([]string, 0, len(h.watchedDirectories))
	for directory := range h.watchedDirectories {
		directories = append(directories, directory)
	}
	return directories
}
