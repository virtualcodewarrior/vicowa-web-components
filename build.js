/* eslint-env node */
const minify = require('babel-minify');
const fs = require('fs-extra');
const walk = require('walk');
const path = require('path');

const inputPath = 'src';
const examplePath = 'examples';
const outputPath = 'dist';

const npmBuild = process.argv.indexOf('--npm') !== -1;

fs.ensureDirSync(outputPath);
const walker = walk.walk(inputPath, { followLinks: false });
const exampleWalker = walk.walk(examplePath, { followLinks: false });
fs.emptyDirSync(outputPath);

const exclude = [
	/eslintrc.js/i,
	/karma.conf.js/i,
];

walker.on('file', (p_Root, p_Stat, p_Next) => {
	const target = p_Root.replace(/src/, outputPath);
	if (!/third_party/.test(p_Root)) {
		if (!exclude.find((p_RegExp) => p_RegExp.test(p_Stat.name))) {
			if (/\.jsm?$/.test(p_Stat.name)) {
				let fileContent = fs.readFileSync(path.resolve(p_Root, p_Stat.name), { encoding: 'utf8' });
				fileContent = fileContent.replace(/\/web-component-base-class\/src\//g, '/web-component-base-class/dist/');
				if (npmBuild) {
					fileContent = fileContent.replace(/\/third_party\//g, '/../../');
				}
				let info = null;
				try {
					info = minify(fileContent, { mangle: { keepClassName: true } }, {
						sourceType: 'module',
						sourceMaps: true,
					});
				} catch (p_Error) {
					console.log(p_Error);
				}
				if (!info) {
					fs.copySync(path.resolve(p_Root, p_Stat.name), path.resolve(target, p_Stat.name));
				} else {
					// for some reason babel doesn't add the source map line, so do it here manually
					fs.outputFileSync(path.resolve(target, p_Stat.name), `${info.code}\n//# sourceMappingURL=${p_Stat.name}.map`);
					// for some reason babel doesn't do this, even if I set the appropriate options so set the source here manually
					info.map.sources[0] = p_Stat.name;
					fs.outputFileSync(path.resolve(target, `${p_Stat.name}.map`), JSON.stringify(info.map));
				}
			} else {
				fs.copySync(path.resolve(p_Root, p_Stat.name), path.resolve(target, p_Stat.name));
			}
		}
	} else if (!npmBuild) {
		fs.copySync(path.resolve(p_Root, p_Stat.name), path.resolve(target, p_Stat.name));
	}

	p_Next();
});

exampleWalker.on('file', (p_Root, p_Stat, p_Next) => {
	const target = p_Root.replace(/examples/, `${outputPath}/examples`);
	const fileContent = fs.readFileSync(path.resolve(p_Root, p_Stat.name), { encoding: 'utf8' });
	fs.outputFileSync(path.resolve(target, p_Stat.name), fileContent
		.replace(/\.\.\/\.\.\/src\//g, '../../')
		.replace(/\.\.\/\.\.\/node_modules\//g, '../../../../')
		.replace(/\/third_party\//g, '/../../'));
	p_Next();
});
