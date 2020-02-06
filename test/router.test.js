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

	it("should give all parameters for wildcard route", () => {
		let currentContext;
		router.addRoute("*", (context) => {
			currentContext = context;
		});

		router.goTo("/base/test/router-test.html");
		expect(currentContext).toEqual({
			params: {
				0: "/base/test/router-test.html",
			},
		});

		frame.src = "/base/test/router-test.html";
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
	// 		done();
	// 	};
	// });
});

