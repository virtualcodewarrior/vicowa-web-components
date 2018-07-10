/* eslint-env node */
// this post install script for npm places all third_party libraries that will actually be hosted on the website
// within the third_party sub directory of the project. This
// makes it easier to create the build steps for the production version and to see which libraries need to be audited
const fs = require('fs-extra');

const walkDependencyTree = (pkg) => {
	if (pkg.dependencies) {
		Object.keys(pkg.dependencies).forEach((p_Dependency) => {
			p_Dependency = p_Dependency.replace(/\/[^/]+$/, '');
			// cleanup before copying new stuff
			fs.removeSync(`./src/third_party/${p_Dependency}`);
			fs.copySync(`./node_modules/${p_Dependency}`, `./src/third_party/${p_Dependency}`, { overwrite: true });

			for (const file of fs.readdirSync(`./node_modules/${p_Dependency}`)) {
				if (file.endsWith('package.json')) {
					const ipkg = JSON.parse(fs.readFileSync(`./node_modules/${p_Dependency}/package.json`, 'utf8'));
					if (ipkg.dependencies) {
						walkDependencyTree(ipkg);
					}
				}
			}
		});
	}
};

const packageJson = JSON.parse(fs.readFileSync('./package.json'));
walkDependencyTree(packageJson);
