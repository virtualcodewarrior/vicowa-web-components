/* eslint-env node */
// Karma configuration

const runSettings = process.argv.reduce((p_Previous, p_Arg, p_Index) => {
	if (p_Index > 3) {
		const parts = p_Arg.split("=");
		if (parts.length === 1) {
			p_Previous[parts[0]] = true;
		} else {
			const subParts = parts[1].split(",").map((subPart) => subPart.trim());
			p_Previous[parts[0]] = (subParts.length > 1) ? subParts : subParts[0];
			if (/^false$|^true$/i.test(p_Previous[parts[0]])) {
				p_Previous[parts[0]] = p_Previous[parts[0]] !== "false";
			}
		}
	}

	return p_Previous;
}, {});

const preprocessors = {};
const plugins = [
	"karma-jasmine-html-reporter",
	"karma-spec-reporter",
	"karma-jasmine-es6",
	"karma-jasmine",
	"karma-chrome-launcher",
	"karma-firefox-launcher",
];
const reporters = [
	"progress",
	"kjhtml",
	"spec",
];
let coverageReporter;

// note coverage doesn't work since it doesn't support es6 without a transpiler, will need to wait for a truly es6 compatible coverage tool
if (runSettings.coverage) {
	preprocessors["src/!third_party/**/*.js"] = ["coverage"];
	plugins.push("karma-coverage");
	reporters.push("coverage");
	coverageReporter = {
		type: "html",
		dir: "coverage/",
	};
}

module.exports = function(config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: "",


		// frameworks to use
		// first frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [
			"jasmine-es6",
			"jasmine",
		],


		// list of files / patterns to load in the browser
		files: [
			{ pattern: "src/**/*.+(js|map|html)", type: "module", watched: true, served: true, second: false, nocache: true },
			{ pattern: "test/**/*.html", type: "module", watched: true, served: true, second: false, nocache: true },
			{ pattern: "test/**/*.js", type: "module", watched: true, served: true, second: true, nocache: true },
		],

		// list of files / patterns to exclude
		exclude: [
			"src/third_party/**/*",
		],


		// preprocess matching files before serving them to the browser
		// first preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors,
		// test results reporter to use
		// possible values: 'dots', 'progress'
		// first reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters,
		coverageReporter,
		plugins,

		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,

		// start these browsers
		// first browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ["ChromeHeadless"/* , "Firefox" */],

		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity,
	});
};
