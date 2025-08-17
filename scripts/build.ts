import { build, type BuildOptions } from 'esbuild';

const entryFile = 'src/index.ts';

const opts: BuildOptions = {
	bundle: true,
	sourcemap: true,
	sourcesContent: false,
	target: 'es2022',
	tsconfig: 'tsconfig.json',
	outdir: 'dist',

	// minifySyntax: true,
	// minifyIdentifiers: true,
};

const node: BuildOptions = {
	platform: 'node',
	minifySyntax: true,
	packages: 'external',
};

const browser: BuildOptions = {
	platform: 'browser',
	entryPoints: { 'kichat.js': entryFile },
};

const esm: BuildOptions = {
	format: 'esm',
	outExtension: { '.js': '.mjs' },
};

const esm_min: BuildOptions = {
	...esm,
	minify: true,
};

const cjs: BuildOptions = {
	format: 'cjs',
	outExtension: { '.js': '.cjs' },
};

const iife: BuildOptions = {
	format: 'iife',
	globalName: 'kichat',
	outExtension: { '.js': '.js' },
};

const iife_min: BuildOptions = {
	...iife,
	minify: true,
};

// Node - ESM & CJS
// kichat.js.node.mjs
build({ ...opts, ...node,    ...esm,      entryPoints: { 'kichat.js.node': entryFile } });
// kichat.js.node.cjs
build({ ...opts, ...node,    ...cjs,      entryPoints: { 'kichat.js.node': entryFile } });

// Browser - ESM & IIFE, with & without minification
// kichat.js.browser.mjs
build({ ...opts, ...browser, ...esm,      entryPoints: { 'kichat.js.browser': entryFile } });
// kichat.js.browser.min.mjs
build({ ...opts, ...browser, ...esm_min,  entryPoints: { 'kichat.js.browser.min': entryFile } });
// kichat.js.browser-global.js
build({ ...opts, ...browser, ...iife,     entryPoints: { 'kichat.js.browser-global': entryFile } });
// kichat.js.browser-global.min.js
build({ ...opts, ...browser, ...iife_min, entryPoints: { 'kichat.js.browser-global.min': entryFile } });