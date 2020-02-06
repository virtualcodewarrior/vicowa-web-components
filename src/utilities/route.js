const privateData = Symbol("privateData");

function createRoute(route, callbacks) {
	const pathParts = route.split("/");
	const destinations = pathParts.map((part) => {
		const props = {
		};
		if (/^:/.test(part)) {
			if (/\(\.\*\)$/.test(part)) {
				props.name = part.substring(1, part.length - 4);
				props.all = true;
			} else if (/\?$/.test(part)) {
				props.name = part.substring(1, part.length - 1);
				props.optional = true;
			} else {
				props.name = part.substring(1);
			}
		} else if (/^\*/.test(part)) {
			props.all = true;
		} else {
			props.regExp = new RegExp(`^${part}$`);
		}
		return props;
	});

	return {
		destinations,
		callbacks,
	};
}

function handleRoute(url, routes, notFoundHandler) {
	const urlParts = url.split("/");
	const route = routes.find((testRoute) => testRoute.destinations.every((destination, index) => {
		let result = false;
		if (destination.regExp) {
			result = destination.regExp.test(urlParts[index]);
		} else if (destination.optional) {
			result = urlParts.length === index || urlParts.length === index - 1;
		} else if (destination.all) {
			result = true;
		}

		return result;
	}));

	if (route) {
		const context = route.destinations.reduce((previous, routePart, index) => {
			if (urlParts.length) {
				if (index < route.destinations.length - 1) {
					const value = urlParts.shift();
					if (routePart.name) {
						previous.params[routePart.name] = value;
					}
				} else {
					previous.params[routePart.name || 0] = urlParts.join("/");
				}
			}

			return previous;
		}, { params: {} });

		const callbacks = [...route.callbacks];
		const doCallback = (nextCallback) => {
			if (nextCallback) {
				nextCallback(context, () => {
					if (callbacks.length) {
						doCallback(callbacks.shift());
					}
				});
			}
		};

		doCallback(callbacks.shift());
	} else if (notFoundHandler) {
		// do 404 here
		notFoundHandler();
	}
}

class Router {
	constructor(targetWindow = window) {
		this[privateData] = {
			routes: [],

		};

		const handleLoadState = (p_State) => {
			const controlData = this[privateData];
			if (p_State && p_State.location) {
				controlData.noPush = true;
				controlData.pageTitle = targetWindow.history.state.title;
				controlData.location = targetWindow.history.state.location;
				controlData.noPush = false;
			} else {
				controlData.noPush = true;
				// controlData.pageTitle = targetWindow.history.state.title;
				controlData.location = window.document.location.href;
				controlData.noPush = false;
			}
			if (controlData.location) {
				handleRoute(controlData.location, controlData.routes);
			}
		};

		handleLoadState(targetWindow.history.state);

		targetWindow.addEventListener("popstate", (p_Event) => {
			handleLoadState(p_Event.state);
		});
	}

	addRoute(route, ...callbacks) {
		this[privateData].routes.push(createRoute(route, callbacks));
	}

	goTo(url) {
		handleRoute(url, this[privateData].routes);
	}

	clearRoutes() {
		this[privateData].routes = [];
	}
}

const routers = new Map();

export function getRouter(window) {
	if (!routers.has(window)) {
		routers.set(window, new Router(window));
	}
	return routers.get(window);
}

export function removeRouter(window) {
	routers.delete(window);
}
