import * as translate from "../src/utilities/translate.js";

describe("test vicowa-string creation", () => {
	const container = document.createElement("div");
	const elementContainer = document.createElement("div");
	const head = document.querySelector("head");
	container.appendChild(elementContainer);
	beforeAll((done) => {
		const link = document.createElement("link");
		link.rel = "import";
		link.href = "base/src/vicowa-string/vicowa-string.html";
		link.onload = done;

		document.body.appendChild(container);
		head.appendChild(link);
	});

	afterAll(() => {
		document.body.removeChild(container);
		Array.from(document.querySelectorAll('link[rel="import"]')).forEach((p_Element) => p_Element.parentNode.removeChild(p_Element));
	});

	afterEach(() => {
		elementContainer.innerHTML = "";
	});

	it("should create a proper web component", (done) => {
		const stringElement = document.createElement("vicowa-string");
		elementContainer.appendChild(stringElement);
		stringElement.onAttached = () => {
			stringElement.setAttribute("string", "test string");
			expect(stringElement.displayString).toEqual("test string");
			expect(stringElement.$).toEqual(jasmine.any(Object));
			expect(stringElement.$$).toEqual(jasmine.any(Function));
			expect(stringElement.$$$).toEqual(jasmine.any(Function));
			done();
		};
	});
});

describe("test vicowa-string usage", () => {
	const container = document.createElement("div");
	const elementContainer = document.createElement("div");
	const head = document.querySelector("head");
	let stringElement = null;
	container.appendChild(elementContainer);
	beforeAll((done) => {
		const link = document.createElement("link");
		link.rel = "import";
		link.href = "base/src/vicowa-string/vicowa-string.html";
		link.onload = done;

		document.body.appendChild(container);
		head.appendChild(link);
	});

	afterAll(() => {
		document.body.removeChild(container);
		Array.from(document.querySelectorAll('link[rel="import"]')).forEach((p_Element) => p_Element.parentNode.removeChild(p_Element));
	});

	beforeEach((done) => {
		stringElement = document.createElement("vicowa-string");
		elementContainer.appendChild(stringElement);
		stringElement.onAttached = () => {
			done();
		};
	});

	afterEach(() => {
		elementContainer.innerHTML = "";
	});

	it("should be able to set the string in multiple ways", () => {
		stringElement.setAttribute("string", "test string");
		expect(stringElement.displayString).toEqual("test string");
		stringElement.string = "test another string";
		expect(stringElement.displayString).toEqual("test another string");
		expect(stringElement.getAttribute("string")).toEqual("test another string");
	});

	it("should be able to handle arguments through attribute and as a data member", () => {
		stringElement.setAttribute("string", "argument string binary: %b, char: %c, integer: %d, scientific float: %e, unsigned integer: %u, floating point: %f, octal: %o, string: %s, lowercase hex: %x, uppercase hex: %X, truncated string: %.4s, precision 4 float: %.4f, padded number %10d, padded string %10s");
		expect(stringElement.displayString).toEqual("argument string binary: %b, char: %c, integer: %d, scientific float: %e, unsigned integer: %u, floating point: %f, octal: %o, string: %s, lowercase hex: %x, uppercase hex: %X, truncated string: %.4s, precision 4 float: %.4f, padded number %10d, padded string %10s");
		stringElement.setAttribute("parameters", '[3, 65, 123, 0.00001, -3, 1.234, 123, "test string", 3735928559, 3735928559, "cutoff", 1.23456789, 222, "padded"]');
		expect(stringElement.displayString).toEqual("argument string binary: 11, char: A, integer: 123, scientific float: 1e-5, unsigned integer: 3, floating point: 1.234, octal: 173, string: test string, lowercase hex: deadbeef, uppercase hex: DEADBEEF, truncated string: cuto, precision 4 float: 1.2346, padded number        222, padded string     padded");
		stringElement.parameters = [5, 66, 321, 0.0002, -5, 4.321, 124, "another test string", 4277075694, 4277075694, "truncated", 9.87654321, 444, "pad"];
		expect(stringElement.displayString).toEqual("argument string binary: 101, char: B, integer: 321, scientific float: 2e-4, unsigned integer: 5, floating point: 4.321, octal: 174, string: another test string, lowercase hex: feeefeee, uppercase hex: FEEEFEEE, truncated string: trun, precision 4 float: 9.8765, padded number        444, padded string        pad");
	});

	it("should allow for positional and repeated string arguments", () => {
		stringElement.setAttribute("string", "argument string binary: %1$b, integer: %1$d, scientific float: %1$e, unsigned integer: %1$u, floating point: %1$f, octal: %1$o, string: %2$s, lowercase hex: %1$x, uppercase hex: %1$X, truncated string: %2$.4s, precision 4 float: %1$.4f, padded number %1$10d, padded string %2$10s");
		expect(stringElement.displayString).toEqual("argument string binary: %1$b, integer: %1$d, scientific float: %1$e, unsigned integer: %1$u, floating point: %1$f, octal: %1$o, string: %2$s, lowercase hex: %1$x, uppercase hex: %1$X, truncated string: %2$.4s, precision 4 float: %1$.4f, padded number %1$10d, padded string %2$10s");
		stringElement.setAttribute("parameters", '[200, "test string"]');
		expect(stringElement.displayString).toEqual("argument string binary: 11001000, integer: 200, scientific float: 2e+2, unsigned integer: 200, floating point: 200, octal: 310, string: test string, lowercase hex: c8, uppercase hex: C8, truncated string: test, precision 4 float: 200.0000, padded number        200, padded string test string");
		stringElement.string = "%1$s %2$s %3$s %4$s";
		stringElement.parameters = ["a", "woodchuck", "chucks", "wood", "chucked", "gets", "by"];
		expect(stringElement.displayString).toEqual("a woodchuck chucks wood");
		stringElement.string = "%4$s %6$s %5$s %7$s %1$s %2$s";
		expect(stringElement.displayString).toEqual("wood gets chucked by a woodchuck");
	});

	it("should be able to handle plurality", () => {
		const mockTranslate = (p_Value) => ({
			ifPlural(p_Number) {
				if (p_Number > 1) {
					p_Value = `${p_Value} plural`;
				}
				return this;
			},
			fetch() {
				return p_Value;
			},
		});
		spyOn(translate.default, "translate").and.callFake((p_Value) => mockTranslate(p_Value));

		stringElement.setAttribute("string", "test string");
		expect(stringElement.displayString).toEqual("test string");
		stringElement.setAttribute("plural-number", "1");
		expect(stringElement.displayString).toEqual("test string");
		stringElement.setAttribute("plural-number", "2");
		expect(stringElement.displayString).toEqual("test string plural");
		stringElement.pluralNumber = 1;
		expect(stringElement.displayString).toEqual("test string");
		stringElement.pluralNumber = 2;
		expect(stringElement.displayString).toEqual("test string plural");
	});
});

describe("test vicowa-string translation updates", () => {
	const container = document.createElement("div");
	const elementContainer = document.createElement("div");
	const head = document.querySelector("head");
	let translationObservers = [];
	let stringElement = null;
	container.appendChild(elementContainer);
	beforeAll((done) => {
		const link = document.createElement("link");
		link.rel = "import";
		link.href = "base/src/vicowa-string/vicowa-string.html";
		link.onload = done;

		document.body.appendChild(container);
		head.appendChild(link);
	});

	afterAll(() => {
		document.body.removeChild(container);
		Array.from(document.querySelectorAll('link[rel="import"]')).forEach((p_Element) => p_Element.parentNode.removeChild(p_Element));
	});

	beforeEach((done) => {
		spyOn(translate.default, "addTranslationUpdatedObserver").and.callFake((p_Handler, p_Owner) => translationObservers.push({ handler: p_Handler, owner: p_Owner }));
		stringElement = document.createElement("vicowa-string");
		elementContainer.appendChild(stringElement);
		stringElement.onAttached = () => {
			translationObservers.forEach((p_Observer) => { p_Observer.handler(translate.default); });
			done();
		};
	});

	afterEach(() => {
		translationObservers = [];
		elementContainer.innerHTML = "";
	});

	it("should update the string if new translations are available", () => {
		let translatedValue = "translation";
		const mockTranslate = () => ({
			ifPlural() {
				return this;
			},
			fetch() {
				return translatedValue;
			},
		});
		spyOn(translate.default, "translate").and.callFake((p_Value) => mockTranslate(p_Value));

		stringElement.setAttribute("string", "test string");
		expect(stringElement.displayString).toEqual("translation");
		translationObservers.forEach((p_Observer) => { p_Observer.handler(translate.default); });

		translatedValue = "changed translation";
		expect(stringElement.displayString).toEqual("translation");
		translationObservers.forEach((p_Observer) => { p_Observer.handler(translate.default); });
		expect(stringElement.displayString).toEqual("changed translation");
	});
});
