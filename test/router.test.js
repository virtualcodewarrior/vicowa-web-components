import { getRouter, removeRouter } from "../src/utilities/route.js";

describe("test router routes match", () => {
	let frame;
	let router;
	let testWindow;
	let windowDone;
	const handleLoad = () => {
		testWindow = frame.contentWindow;
		windowDone();
	};

	beforeAll((done) => {
		frame = document.createElement("iframe");

		windowDone = done;
		frame.addEventListener('load', handleLoad);
		frame.src = "/base/test/router-test.html";
		document.body.appendChild(frame);
		router = getRouter(frame.contentWindow);
		router.clearRoutes();
	});

	afterAll(() => {
		router.clearRoutes();
		removeRouter(frame.contentWindow);
		frame.parentElement.removeChild(frame);
		frame.removeEventListener('load', handleLoad);
	});

	beforeEach(() => {
		router.clearRoutes();
	});

	it("should give all parameters for wildcard route", () => {
		let currentContext;
		router.addRoute("*", (context) => { currentContext = context; });

		currentContext = undefined;
		let testUrl = "/base/test/router-test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "/base/test/router-test.html" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "router-test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "router-test.html" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/test/";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "/base/test/" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/*", (context) => { currentContext = context; });

		// the params should not include the slash
		currentContext = undefined;
		testUrl = "/base/test/router-test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "base/test/router-test.html" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "router-test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual(undefined);

		currentContext = undefined;
		testUrl = "/base/test/";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "base/test/" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/base/test*", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/base/test/router-test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "test/router-test.html" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "router-test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual(undefined);

		currentContext = undefined;
		testUrl = "/base/test/";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "test/" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/test/1";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "test/1" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/testing/bla/test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "testing/bla/test.html" }, url: testUrl, query: undefined });
	});

	it("should handle named parameters", () => {
		let currentContext;
		router.addRoute("/base/:test", (context) => { currentContext = context; });

		currentContext = undefined;
		let testUrl = "/base/cat";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { test: "cat" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/dogs";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { test: "dogs" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/cat/and/dogs";
		router.goTo(testUrl);
		expect(currentContext).toEqual(undefined);

		router.clearRoutes();
		router.addRoute("/base/test*/bla/:name", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/base/testing/bla/test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { name: "test.html" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/test+inging/bla/test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { name: "test.html" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/test/bla/test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { name: "test.html" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/base/test*/bla/host*/:name", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/base/testing/bla/hosting/test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { name: "test.html" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/test+inging/bla/hostinginging/test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { name: "test.html" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/test/bla/host/test.html";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { name: "test.html" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/base/:cats/:dogs/:birds/:fish/:humans", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/base/waffles/oli/tweety/tuna/me";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { cats: "waffles", dogs: "oli", birds: "tweety", fish: "tuna", humans: "me" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/waffles/oli/tweety/tuna";
		router.goTo(testUrl);
		expect(currentContext).toEqual(undefined);

		currentContext = undefined;
		testUrl = "/base/waffles/oli/tweety/tuna/me/you";
		router.goTo(testUrl);
		expect(currentContext).toEqual(undefined);

		router.clearRoutes();
		router.addRoute("/base/:cats/dog*/bird*/:fish/:humans", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/base/waffles/doggies/birdies/tuna/me";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { cats: "waffles", fish: "tuna", humans: "me" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/waffles/dog/bird/tuna/me";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { cats: "waffles", fish: "tuna", humans: "me" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/base/waffles/dog/bir/tuna/me";
		router.goTo(testUrl);
		expect(currentContext).toEqual(undefined);
	});

	it("should handle query strings", () => {
		let currentContext;
		router.addRoute("/base/:test", (context) => { currentContext = context; });

		const testUrl = "/base/number?bla=5&foo=bar";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { test: "number" }, url: testUrl, query: { bla: "5", foo: "bar" } });
	});

	it("should call first matching route", () => {
		let currentContext;
		router.addRoute("/*", (context) => { currentContext = context; });
		router.addRoute("/path1/*", (context) => { currentContext = context; });
		router.addRoute("/path1/path2/*", (context) => { currentContext = context; });
		router.addRoute("/path1/path2/path3/*", (context) => { currentContext = context; });

		currentContext = undefined;
		let testUrl = "/path1/path2/path3";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "path1/path2/path3" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/path1/*", (context) => { currentContext = context; });
		router.addRoute("/*", (context) => { currentContext = context; });
		router.addRoute("/path1/path2/*", (context) => { currentContext = context; });
		router.addRoute("/path1/path2/path3/*", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/path1/path2/path3";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "path2/path3" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/path1/path2/*", (context) => { currentContext = context; });
		router.addRoute("/path1/*", (context) => { currentContext = context; });
		router.addRoute("/*", (context) => { currentContext = context; });
		router.addRoute("/path1/path2/path3/*", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/path1/path2/path3";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "path3" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/path1/path2/path3/*", (context) => { currentContext = context; });
		router.addRoute("/path1/path2/*", (context) => { currentContext = context; });
		router.addRoute("/path1/*", (context) => { currentContext = context; });
		router.addRoute("/*", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/path1/path2/path3";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "path3" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/path1/path2/path3/bla";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "bla" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/path1/path2/bla";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "bla" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/path1/bla";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "bla" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/bla";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "bla" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/:birds/:dogs/:cats/*", (context) => { currentContext = context; });
		router.addRoute("/:birds/:dogs/*", (context) => { currentContext = context; });
		router.addRoute("/:birds/*", (context) => { currentContext = context; });
		router.addRoute("/*", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/tweety/oli/waffles/test";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", dogs: "oli", cats: "waffles", 0: "test" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/tweety/oli/waffles";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", dogs: "oli", 0: "waffles" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/tweety/oli";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", 0: "oli" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/tweety/";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", 0: "" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/tweety";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { 0: "tweety" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "tweety";
		router.goTo(testUrl);
		expect(currentContext).toEqual(undefined);

		router.clearRoutes();
		router.addRoute("/:birds/:dogs/:cats", (context) => { currentContext = context; });

		currentContext = undefined;
		testUrl = "/tweety/oli/waffles";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", dogs: "oli", cats: "waffles" }, url: testUrl, query: undefined });

		currentContext = undefined;
		testUrl = "/tweety/oli/waffles/test";
		router.goTo(testUrl);
		expect(currentContext).toEqual(undefined);
	});

	it("should handle multiple callbacks", () => {
		let currentContext;
		router.addRoute("/:cats/:dogs/:birds", (context) => { currentContext = context; });

		currentContext = undefined;
		let testUrl = "/waffles/oli/tweety";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", dogs: "oli", cats: "waffles" }, url: testUrl, query: undefined });

		router.clearRoutes();
		router.addRoute("/:cats/:dogs/:birds", (context) => { currentContext = context; }, () => { currentContext = null; });

		testUrl = "/waffles/oli/tweety";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", dogs: "oli", cats: "waffles" }, url: testUrl, query: undefined });

		router.addRoute("/:cats/:dogs/:birds/:fish", (context, next) => { currentContext = context; next(); }, () => { currentContext = null; });

		testUrl = "/waffles/oli/tweety/tuna";
		router.goTo(testUrl);
		expect(currentContext).toEqual(null);

		router.clearRoutes();
		router.addRoute("/:cats/:dogs/:birds/:fish", (context, next) => { currentContext = context; next(); }, (context, next) => { currentContext = { data: "newdata", ...context}; next(); });

		testUrl = "/waffles/oli/tweety/tuna";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", dogs: "oli", cats: "waffles", fish: "tuna" }, url: testUrl, query: undefined, data: "newdata" });

		router.clearRoutes();
		router.addRoute("/:cats/:dogs/:birds/:fish", (context, next) => { next(); }, (context, next) => { context.data = "newdata"; next(); }, (context) => currentContext = context);

		testUrl = "/waffles/oli/tweety/tuna";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", dogs: "oli", cats: "waffles", fish: "tuna" }, url: testUrl, query: undefined, data: "newdata" });

		router.clearRoutes();
		router.addRoute("/:cats/:dogs/:birds/:fish", (context, next) => { next(); }, (context, next) => { context.data = "newdata"; next(); }, (context, next) => { context.foo = "bar"; next(); }, (context) => { currentContext = context; });

		testUrl = "/waffles/oli/tweety/tuna";
		router.goTo(testUrl);
		expect(currentContext).toEqual({ params: { birds: "tweety", dogs: "oli", cats: "waffles", fish: "tuna" }, url: testUrl, query: undefined, data: "newdata", foo: "bar" });
	});

	it("should be called on load", (done) => {
		let currentContext;
		router.addRoute("/test/route/:cats", (context) => {
			currentContext = context;
			done();
		});

		testWindow.document.location.href = "/test/route/waffles";
	})
});

