import { getRouter, removeRouter } from "../src/utilities/route.js";

describe("test router routes match", () => {
	let frame;
	let router;
	beforeAll(() => {
		frame = document.createElement("iframe");
		document.body.appendChild(frame);
		router = getRouter(frame.contentWindow);
		router.clearRoutes();
	});

	afterAll(() => {
		router.clearRoutes();
		removeRouter(frame.contentWindow);
		frame.parentElement.removeChild(frame);
	});

	beforeEach(() => {
		router.clearRoutes();
	});

	it("should give all parameters for wildcard route", () => {
		let currentContext;
		const domain = document.location.hostname;
		router.addRoute("*", (context) => { currentContext = context; });

		currentContext = undefined;
		router.goTo("/base/test/router-test.html");
		expect(currentContext).toEqual({ params: { 0: "/base/test/router-test.html" } });

		currentContext = undefined;
		router.goTo("router-test.html");
		expect(currentContext).toEqual({ params: { 0: "router-test.html" } });

		currentContext = undefined;
		router.goTo("/base/test/");
		expect(currentContext).toEqual({ params: { 0: "/base/test/" } });

		router.clearRoutes();
		router.addRoute("/*", (context) => { currentContext = context; });

		// the params should not include the slash
		currentContext = undefined;
		router.goTo("/base/test/router-test.html");
		expect(currentContext).toEqual({ params: { 0: "base/test/router-test.html" } });

		currentContext = undefined;
		router.goTo("router-test.html");
		expect(currentContext).toEqual(undefined);

		currentContext = undefined;
		router.goTo("/base/test/");
		expect(currentContext).toEqual({ params: { 0: "base/test/" } });

		router.clearRoutes();
		router.addRoute("/base/test*", (context) => { currentContext = context; });

		currentContext = undefined;
		router.goTo("/base/test/router-test.html");
		expect(currentContext).toEqual({ params: { 0: "test/router-test.html" } });

		currentContext = undefined;
		router.goTo("router-test.html");
		expect(currentContext).toEqual(undefined);

		currentContext = undefined;
		router.goTo("/base/test/");
		expect(currentContext).toEqual({ params: { 0: "test/" } });

		currentContext = undefined;
		router.goTo("/base/test/1");
		expect(currentContext).toEqual({ params: { 0: "test/1" } });

		currentContext = undefined;
		router.goTo("/base/testing/bla/test.html");
		expect(currentContext).toEqual({ params: { 0: "testing/bla/test.html" } });
	});

	it("should handle named parameters", () => {
		let currentContext;
		router.addRoute("/base/:test", (context) => { currentContext = context; });

		currentContext = undefined;
		router.goTo("/base/cat");
		expect(currentContext).toEqual({ params: { test: "cat" } });

		currentContext = undefined;
		router.goTo("/base/dogs");
		expect(currentContext).toEqual({ params: { test: "dogs" } });

		currentContext = undefined;
		router.goTo("/base/cat/and/dogs");
		expect(currentContext).toEqual(undefined);

		router.clearRoutes();
		router.addRoute("/base/test*/bla/:name", (context) => { currentContext = context; });

		currentContext = undefined;
		router.goTo("/base/testing/bla/test.html");
		expect(currentContext).toEqual({ params: { name: "test.html" } });
	});

	it("should handle query strings", () => {});

	it("should call first matching route", () => {
		let currentContext;
		router.addRoute("/*", (context) => { currentContext = context; });
		router.addRoute("/path1/*", (context) => { currentContext = context; });
		router.addRoute("/path1/path2/*", (context) => { currentContext = context; });
		router.addRoute("/path1/path2/path3/*", (context) => { currentContext = context; });

	});

	it("should handle multipe callbacks", () => {

	});

	// it("should give all parameters for wildcard route", () => {
	// 	router.addRoute('\', () => {
	//
	// 	});
	// 	const stringElement = document.createElement("vicowa-string");
	// 	elementContainer.appendChild(stringElement);
	// 	stringElement.onAttached = () => {
	// 		stringElement.setAttribute("string", "test string");
	// 		expect(stringElement.displayString).toEqual("test string");
	// 		expect(stringElement.$).toEqual(jasmine.any(Object));
	// 		expect(stringElement.$$).toEqual(jasmine.any(Function));
	// 		expect(stringElement.$$$).toEqual(jasmine.any(Function));
	//      frame.src = "/base/test/router-test.html";
	// 		done();
	// 	};
	// });
});

