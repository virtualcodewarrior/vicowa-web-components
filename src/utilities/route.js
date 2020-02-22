const privateData = Symbol("privateData");

function createRoute(route, callbacks) {
	route = route.replace(/[/]+/g, "/");
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

function handleChangeLocation(p_RouterData, p_TargetWindow) {
	if (p_RouterData.url && (!p_TargetWindow.history.state || p_RouterData.url !== p_TargetWindow.history.state.url)) {
		if (!p_TargetWindow.history.state) {
			p_TargetWindow.history.replaceState({ url: p_RouterData.url, customData: p_RouterData.customData }, p_RouterData.title, p_RouterData.url);
		}
		p_TargetWindow.history.pushState({ url: p_RouterData.url, customData: p_RouterData.customData }, p_RouterData.title, p_RouterData.url);
	}
}

function handleRoute(p_RouterData, url, customData) {
	const { routes, notFoundHandler, targetwindow } = p_RouterData;
	const regExp = new RegExp(`^${document.location.origin}`);
	url = url.replace(regExp, "").replace(/[/]+/g, "/");
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
		}, { params: {}, url, query, customData });

		const callbacks = [...route.callbacks];
		const doCallback = async(nextCallback) => {
			if (nextCallback) {
				if (nextCallback.length > 1) {
					await nextCallback(context, async() => {
						if (callbacks.length) {
							await doCallback(callbacks.shift());
							if (!callbacks.length) {
								handleChangeLocation(context, targetwindow);
							}
						}
					});
				} else {
					await nextCallback(context);
					handleChangeLocation(context, targetwindow);
				}
			}
		};

		doCallback(callbacks.shift());
	} else if (notFoundHandler) {
		// do 404 here
		notFoundHandler({
			url,
			query,
			customData,
		});
	}
}

class Router {
	constructor(p_TargetWindow = window) {
		this[privateData] = {
			routes: [],
			notFoundHandler: undefined,
			targetWindow: p_TargetWindow,
		};

		const handleLoadState = (p_State) => {
			const routerData = this[privateData];
			delete routerData.url;
			delete routerData.title;
			if (p_State && p_State.url) {
				routerData.title = p_State.title;
				routerData.url = p_State.url;
			} else if (routerData.targetWindow.history.state) {
				routerData.title = routerData.targetWindow.history.state.title;
				routerData.url = routerData.targetWindow.history.state.url;
			}
			if (routerData.url) {
				handleRoute(routerData, routerData.url, p_State.customData);
			} else if (document.location.href) {
				handleRoute(routerData, document.location.href, null);
			}
		};

		handleLoadState(p_TargetWindow.history.state);
		p_TargetWindow.addEventListener("popstate", (p_Event) => {
			handleLoadState(p_Event.state);
		});
		p_TargetWindow.addEventListener("load", () => {
			this.goTo(document.location.href);
		});
	}

	set onNotFound(handler) {
		this[privateData].notFoundHandler = handler;
	}

	get onNotFound() {
		return this[privateData].notFoundHandler;
	}

	addRoute(route, ...callbacks) {
		this[privateData].routes.push(createRoute(route, callbacks));
	}

	goTo(url, customData) {
		handleRoute(this[privateData], url, customData);
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
