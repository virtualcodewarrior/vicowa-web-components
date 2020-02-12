const privateData = Symbol("privateData");

function createRoute(route, callbacks) {
	const pathParts = route.split("/");
	const destinations = pathParts.map((part) => {
		const props = {};
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
		} else if (/\*/.test(part)) {
			if (/^\*/.test(part)) {
				props.all = true;
			} else {
				props.wildcard = true;
				props.regExp = new RegExp(`^${part.replace(/\./g, "\\.").replace("*", ".*")}$`);
			}
		} else if (!part) {
			props.slash = true;
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
	const queryParts = url.split("?");
	const urlParts = queryParts[0].split("/");
	let query;
	const route = routes.find((testRoute) => testRoute.destinations.every((destination, index, destArray) => {
		let result = false;
		if (destination.slash) {
			result = urlParts[index] === "";
		} else if (destination.regExp) {
			result = destination.regExp.test(urlParts[index]);
		} else if (destination.optional) {
			result = urlParts.length === index || urlParts.length === index - 1;
		} else if (destination.all) {
			result = urlParts.length - 1 >= index;
		} else if (destination.name) {
			result = (index === destArray.length - 1 && urlParts.length === destArray.length) || (urlParts.length - 1 > index && destArray.length - 1 > index);
		} else {
			result = urlParts.length - 1 === index;
		}

		return result;
	}));

	if (queryParts.length > 1) {
		const parts = queryParts[1].split("&");
		query = parts.reduce((previous, current) => {
			const subParts = current.split("=").map((subPart) => subPart.trim());
			previous[subParts[0]] = subParts[1];
			return previous;
		}, {});
	}

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
		}, { params: {}, url, query });

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

		const handleChangeLocation = () => {
			const controlData = this[privateData];
			if (p_Control.location) {
				// make sure we didn't load this already
				if (controlData.currentElement !== element && controlData.currentLocation !== location) {
					// only push a new state if we are changing the location not if we are just initializing
					if (controlData.currentElement && controlData.currentLocation && controlData.currentTitle !== undefined && !p_Control.noPush) {
						if (!window.history.state) {
							window.history.replaceState({ location: controlData.currentLocation.replace(p_Control.contentBaseLocation, ""), id: p_Control.getAttribute("id"), title: controlData.currentTitle }, controlData.currentTitle, (p_Control.addLocationToUrl) ? `#${controlData.currentLocation.replace(p_Control.contentBaseLocation, "")}` : undefined);
						}
						window.history.pushState({ location: location.replace(p_Control.contentBaseLocation, ""), id: p_Control.getAttribute("id"), title: p_Control.getAttribute("page-title") }, p_Control.getAttribute("page-title"), (p_Control.addLocationToUrl) ? `#${location.replace(p_Control.contentBaseLocation, "")}` : undefined);
					}
					controlData.currentElement = element;
					controlData.elementInstance = null;
					controlData.currentLocation = location;
					controlData.currentTitle = p_Control.getAttribute("page-title");
					const createElement = () => {
						// test again because importing the document might be out of order
						if (!controlData.elementInstance || controlData.elementInstance.localName !== controlData.currentElement) {
							p_Control.$.container.innerHTML = "";
							controlData.elementInstance = document.createElement(controlData.currentElement);
							p_Control.$.container.appendChild(controlData.elementInstance);
							if (p_Control.pageTitle) {
								document.title = p_Control.pageTitle;
							}
							controlData.changeObserver.notify("change", { contentInstance: controlData.elementInstance, control: p_Control });
							if (controlData.onChange) {
								controlData.onChange(controlData.elementInstance);
							}
						}
					};
				}
			}
		}

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
		targetWindow.addEventListener("load", (event) => {
			console.log(event);
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
