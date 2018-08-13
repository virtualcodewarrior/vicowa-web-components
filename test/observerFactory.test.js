import observerFactory from '../src/utilities/observerFactory.js';

describe('test observerFactory', () => {
	it('should create a proper object', () => {
		const notifiers = observerFactory();

		expect(notifiers.addObserver).toEqual(jasmine.any(Function));
		expect(notifiers.removeObserver).toEqual(jasmine.any(Function));
		expect(notifiers.removeOwner).toEqual(jasmine.any(Function));
		expect(notifiers.notify).toEqual(jasmine.any(Function));
	});

	it('should add handlers properly', () => {
		const notifiers = observerFactory();
		const called = [];

		expect(notifiers.addObserver('test1', () => {
			called.push('test1');
		})).toBeTruthy();

		expect(notifiers.addObserver('test2', () => {
			called.push('test2');
		})).toBeTruthy();
		expect(notifiers.addObserver('test2', () => {
			called.push('test2');
		})).toBeTruthy();

		expect(notifiers.addObserver('test3', () => {
			called.push('test3');
		})).toBeTruthy();
		expect(notifiers.addObserver('test3', () => {
			called.push('test3');
		})).toBeTruthy();
		expect(notifiers.addObserver('test3', () => {
			called.push('test3');
		})).toBeTruthy();

		// not yet called, so no callers
		expect(called.length).toBe(0);

		notifiers.notify('test1');

		expect(called.length).toBe(1);

		notifiers.notify('test1');

		expect(called.length).toBe(2);

		notifiers.notify('test2');

		expect(called.length).toBe(4);
		expect(called.filter((p_Handler) => p_Handler === 'test1').length).toBe(2);
		expect(called.filter((p_Handler) => p_Handler === 'test2').length).toBe(2);

		notifiers.notify('test3');

		expect(called.length).toBe(7);
		expect(called.filter((p_Handler) => p_Handler === 'test1').length).toBe(2);
		expect(called.filter((p_Handler) => p_Handler === 'test2').length).toBe(2);
		expect(called.filter((p_Handler) => p_Handler === 'test3').length).toBe(3);

		// doesn't exist so expect nothing to change
		notifiers.notify('test4');

		expect(called.length).toBe(7);
		expect(called.filter((p_Handler) => p_Handler === 'test1').length).toBe(2);
		expect(called.filter((p_Handler) => p_Handler === 'test2').length).toBe(2);
		expect(called.filter((p_Handler) => p_Handler === 'test3').length).toBe(3);
	});

	it('should not add duplicate handlers', () => {
		const notifiers = observerFactory();
		const called = [];

		const testHandlers = [
			() => { called.push('test1'); },
			() => { called.push('test2'); },
			() => { called.push('test3'); },
			() => { called.push('test4'); },
		];

		expect(notifiers.addObserver('test1', testHandlers[0])).toBeTruthy();
		expect(notifiers.addObserver('test2', testHandlers[1])).toBeTruthy();
		expect(notifiers.addObserver('test2', testHandlers[1])).toBeFalsy();
		expect(notifiers.addObserver('test3', testHandlers[2])).toBeTruthy();
		expect(notifiers.addObserver('test3', testHandlers[2])).toBeFalsy();
		expect(notifiers.addObserver('test3', testHandlers[2])).toBeFalsy();
		expect(notifiers.addObserver('test4', testHandlers[3])).toBeTruthy();
		expect(notifiers.addObserver('test4', testHandlers[3])).toBeFalsy();
		expect(notifiers.addObserver('test4', testHandlers[3])).toBeFalsy();
		expect(notifiers.addObserver('test4', testHandlers[3])).toBeFalsy();

		notifiers.notify('test1');
		expect(called.length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2');
		expect(called.length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3');
		expect(called.length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(1);
	});

	it('should remove handlers properly', () => {
		const notifiers = observerFactory();
		let called = [];

		const testHandlers = [
			() => { called.push('test1'); },
			() => { called.push('test2'); },
			() => { called.push('test3'); },
			() => { called.push('test4'); },
		];

		expect(notifiers.addObserver('test1-1', testHandlers[0])).toBeTruthy();
		expect(notifiers.addObserver('test2-1', testHandlers[1])).toBeTruthy();
		expect(notifiers.addObserver('test2-2', testHandlers[1])).toBeTruthy();
		expect(notifiers.addObserver('test3-1', testHandlers[2])).toBeTruthy();
		expect(notifiers.addObserver('test3-2', testHandlers[2])).toBeTruthy();
		expect(notifiers.addObserver('test3-3', testHandlers[2])).toBeTruthy();
		expect(notifiers.addObserver('test4-1', testHandlers[3])).toBeTruthy();
		expect(notifiers.addObserver('test4-2', testHandlers[3])).toBeTruthy();
		expect(notifiers.addObserver('test4-3', testHandlers[3])).toBeTruthy();
		expect(notifiers.addObserver('test4-4', testHandlers[3])).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers[0])).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers[1])).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers[2])).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers[3])).toBeTruthy();

		notifiers.notify('test1-1');
		expect(called.length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-2');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-1');
		expect(called.length).toBe(5);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-2');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-3');
		expect(called.length).toBe(7);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-1');
		expect(called.length).toBe(8);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(1);
		notifiers.notify('test4-2');
		expect(called.length).toBe(9);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(2);
		notifiers.notify('test4-3');
		expect(called.length).toBe(10);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(3);
		notifiers.notify('test4-4');
		expect(called.length).toBe(11);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(4);
		notifiers.notify('test5');
		expect(called.length).toBe(15);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(5);

		// remove a specific notifier + handler
		expect(notifiers.removeObserver('test3-1', testHandlers[2].handler)).toBeTruthy();
		called = [];

		notifiers.notify('test1-1');
		expect(called.length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-2');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-1');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-2');
		expect(called.length).toBe(5);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-3');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-1');
		expect(called.length).toBe(7);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(1);
		notifiers.notify('test4-2');
		expect(called.length).toBe(8);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(2);
		notifiers.notify('test4-3');
		expect(called.length).toBe(9);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(3);
		notifiers.notify('test4-4');
		expect(called.length).toBe(10);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(4);
		notifiers.notify('test5');
		expect(called.length).toBe(14);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(5);

		// remove a specific notifier + handler again
		expect(notifiers.removeObserver('test3-1', testHandlers[2].handler)).toBeFalsy();
		called = [];

		notifiers.notify('test1-1');
		expect(called.length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-2');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-1');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-2');
		expect(called.length).toBe(5);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-3');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-1');
		expect(called.length).toBe(7);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(1);
		notifiers.notify('test4-2');
		expect(called.length).toBe(8);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(2);
		notifiers.notify('test4-3');
		expect(called.length).toBe(9);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(3);
		notifiers.notify('test4-4');
		expect(called.length).toBe(10);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(4);
		notifiers.notify('test5');
		expect(called.length).toBe(14);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(5);

		// remove a whole event
		notifiers.removeObserver('test5');
		called = [];

		notifiers.notify('test1-1');
		expect(called.length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-2');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-1');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-2');
		expect(called.length).toBe(5);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-3');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-1');
		expect(called.length).toBe(7);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(1);
		notifiers.notify('test4-2');
		expect(called.length).toBe(8);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(2);
		notifiers.notify('test4-3');
		expect(called.length).toBe(9);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(3);
		notifiers.notify('test4-4');
		expect(called.length).toBe(10);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(4);
		notifiers.notify('test5');
		expect(called.length).toBe(10);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(4);

		// remove a handler
		notifiers.removeObserver(null, testHandlers[3]);
		called = [];

		notifiers.notify('test1-1');
		expect(called.length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-2');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-1');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-2');
		expect(called.length).toBe(5);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-3');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-1');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-2');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-3');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-4');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test5');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
	});

	it('should remove all handlers for a specified owner', () => {
		const notifiers = observerFactory();
		let called = [];

		const testHandlers1 = [
			() => { called.push('test1'); },
			() => { called.push('test2'); },
			() => { called.push('test3'); },
			() => { called.push('test4'); },
		];

		const testHandlers2 = [
			() => { called.push('test1'); },
			() => { called.push('test2'); },
			() => { called.push('test3'); },
			() => { called.push('test4'); },
		];

		expect(notifiers.addObserver('test1-1', testHandlers1[0], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test2-1', testHandlers1[1], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test2-2', testHandlers1[1], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test3-1', testHandlers1[2], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test3-2', testHandlers1[2], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test3-3', testHandlers1[2], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test4-1', testHandlers1[3], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test4-2', testHandlers1[3], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test4-3', testHandlers1[3], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test4-4', testHandlers1[3], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers1[0], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers1[1], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers1[2], testHandlers1)).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers1[3], testHandlers1)).toBeTruthy();

		expect(notifiers.addObserver('test1-1', testHandlers2[0], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test2-1', testHandlers2[1], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test2-2', testHandlers2[1], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test3-1', testHandlers2[2], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test3-2', testHandlers2[2], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test3-3', testHandlers2[2], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test4-1', testHandlers2[3], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test4-2', testHandlers2[3], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test4-3', testHandlers2[3], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test4-4', testHandlers2[3], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers2[0], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers2[1], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers2[2], testHandlers2)).toBeTruthy();
		expect(notifiers.addObserver('test5', testHandlers2[3], testHandlers2)).toBeTruthy();

		notifiers.notify('test1-1');
		expect(called.length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-2');
		expect(called.length).toBe(8);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-1');
		expect(called.length).toBe(10);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-2');
		expect(called.length).toBe(12);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-3');
		expect(called.length).toBe(14);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-1');
		expect(called.length).toBe(16);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(2);
		notifiers.notify('test4-2');
		expect(called.length).toBe(18);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(4);
		notifiers.notify('test4-3');
		expect(called.length).toBe(20);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(6);
		notifiers.notify('test4-4');
		expect(called.length).toBe(22);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(8);
		notifiers.notify('test5');
		expect(called.length).toBe(30);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(8);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(8);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(10);

		notifiers.removeOwner(testHandlers2);
		called = [];

		notifiers.notify('test1-1');
		expect(called.length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-1');
		expect(called.length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test2-2');
		expect(called.length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(0);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-1');
		expect(called.length).toBe(5);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-2');
		expect(called.length).toBe(6);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test3-3');
		expect(called.length).toBe(7);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(0);
		notifiers.notify('test4-1');
		expect(called.length).toBe(8);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(1);
		notifiers.notify('test4-2');
		expect(called.length).toBe(9);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(2);
		notifiers.notify('test4-3');
		expect(called.length).toBe(10);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(3);
		notifiers.notify('test4-4');
		expect(called.length).toBe(11);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(1);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(3);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(4);
		notifiers.notify('test5');
		expect(called.length).toBe(15);
		expect(called.filter((p_Called) => p_Called === 'test1').length).toBe(2);
		expect(called.filter((p_Called) => p_Called === 'test2').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test3').length).toBe(4);
		expect(called.filter((p_Called) => p_Called === 'test4').length).toBe(5);
	});
});
