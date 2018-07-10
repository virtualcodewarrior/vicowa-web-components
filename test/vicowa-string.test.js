
describe('test vicowa-string creation', () => {
	const container = document.createElement('div');
	const elementContainer = document.createElement('div');
	const head = document.querySelector('head');
	container.appendChild(elementContainer);
	beforeAll((done) => {
		const link = document.createElement('link');
		link.rel = 'import';
		link.href = 'base/src/vicowa-string/vicowa-string.html';
		link.onload = done;

		document.body.appendChild(container);
		head.appendChild(link);
	});

	afterAll(() => {
		document.body.removeChild(container);
		Array.from(document.querySelectorAll('link[rel="import"]')).forEach((p_Element) => p_Element.parentNode.removeChild(p_Element));
	});

	afterEach(() => {
		elementContainer.innerHTML = '';
	});

	it('should create a proper web component', (done) => {
		const stringElement = document.createElement('vicowa-string');
		elementContainer.appendChild(stringElement);
		stringElement.onAttached = () => {
			stringElement.setAttribute('string', 'test string');
			expect(stringElement.displayString).toEqual('test string');
			expect(stringElement.$).toEqual(jasmine.any(Object));
			expect(stringElement.$$).toEqual(jasmine.any(Function));
			expect(stringElement.$$$).toEqual(jasmine.any(Function));
			done();
		};
	});
});

describe('test vicowa-string usage', () => {
	const container = document.createElement('div');
	const elementContainer = document.createElement('div');
	const head = document.querySelector('head');
	let stringElement = null;
	container.appendChild(elementContainer);
	beforeAll((done) => {
		const link = document.createElement('link');
		link.rel = 'import';
		link.href = 'base/src/vicowa-string/vicowa-string.html';
		link.onload = done;

		document.body.appendChild(container);
		head.appendChild(link);
	});

	afterAll(() => {
		document.body.removeChild(container);
		Array.from(document.querySelectorAll('link[rel="import"]')).forEach((p_Element) => p_Element.parentNode.removeChild(p_Element));
	});

	beforeEach((done) => {
		stringElement = document.createElement('vicowa-string');
		elementContainer.appendChild(stringElement);
		stringElement.onAttached = () => {
			done();
		};
	});

	afterEach(() => {
		elementContainer.innerHTML = '';
	});

	it('should be able to set the string in multiple ways', () => {
		stringElement.setAttribute('string', 'test string');
		expect(stringElement.displayString).toEqual('test string');
		stringElement.string = 'test another string';
		expect(stringElement.displayString).toEqual('test another string');
		expect(stringElement.getAttribute('string')).toEqual('test another string');
	});

	it('should be able to handle arguments through attribute and as a data member', () => {
		stringElement.setAttribute('string', 'argument string binary: %b, char: %c, integer: %d, scientific float: %e, unsigned integer: %u, floating point: %f, octal: %o, string: %s, lowercase hex: %x, uppercase hex: %X, truncated string: %.4s, precision 4 float: %.4f, padded number %10d, padded string %10s');
		expect(stringElement.displayString).toEqual('argument string binary: %b, char: %c, integer: %d, scientific float: %e, unsigned integer: %u, floating point: %f, octal: %o, string: %s, lowercase hex: %x, uppercase hex: %X, truncated string: %.4s, precision 4 float: %.4f, padded number %10d, padded string %10s');
		stringElement.setAttribute('arguments', '[3, 65, 123, 0.00001, -3, 1.234, 123, "test string", 3735928559, 3735928559, "cutoff", 1.23456789, 222, "padded"]');
		expect(stringElement.displayString).toEqual('argument string binary: 11, char: A, integer: 123, scientific float: 1e-5, unsigned integer: 3, floating point: 1.234, octal: 173, string: test string, lowercase hex: deadbeef, uppercase hex: DEADBEEF, truncated string: cuto, precision 4 float: 1.2346, padded number        222, padded string     padded');
	});

	/* it('should be able plurality', () => {
		stringElement.setAttribute('string', 'test string');
		expect(stringElement.displayString).toEqual('test string');
		stringElement.string = 'test another string';
		expect(stringElement.displayString).toEqual('test another string');
		expect(stringElement.getAttribute('string')).toEqual('test another string');
	});*/
});
