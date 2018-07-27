/* eslint-env node */
const childProcess = require('child_process');

function runScript(scriptPath, callback) {
	// keep track of whether callback has been invoked to prevent multiple invocations
	let invoked = false;

	const process = childProcess.fork(scriptPath);

	// listen for errors as they may prevent the exit event from firing
	process.on('error', (err) => {
		if (!invoked) {
			invoked = true;
			callback(err);
		}
	});

	// execute the callback once the process has finished running
	process.on('exit', (code) => {
		if (!invoked) {
			invoked = true;
			const err = code === 0 ? null : new Error(`exit code ${code}`);
			callback(err);
		}
	});
}

if (process.env.NODE_ENV === 'development') {
	runScript('./node_modules/dependency-relocator/dependency-relocator.js ./src/third_party', (err) => {
		if (err) {
			throw err;
		}
		console.log('finished running relocator');
	});
}

