const privateData = Symbol("privateData")

class Destination {
	constructor() {
		this[privateData] = {
			optional: false,
			variable: false,
			name: null,
		};
	}


}

function createRoute(route, callbacks) {
	const pathParts = route.split("/");
	const destinations = pathParts.map((part) => {
		let props = {};
		if (/^:/.test(part)) {

		} else if (/^\*/.test(part)) {

		} else {
		}
		return new Destination();
	});
}

class Router {
	constructor() {
		this[privateData] = {
			routes: [],

		};
	}

	addRoute(route, ...callbacks) {
		this[privateData].routes.push(createRoute(route, callbacks));
	}
}

let router;

export function getRouter() {
	if (!router) {
		router = new Router();
	}

	return router;
}
