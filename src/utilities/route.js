const privateData = Symbol("privateData");

function createRoute(p_Route, p_Callbacks) {
	p_Route = p_Route.replace(/[/]+/g, "/");
	const pathParts = p_Route.split("/");
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
		callbacks: p_Callbacks,
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

function handleRoute(p_RouterData, p_Url, p_CustomData) {
	const { routes, notFoundHandler, targetwindow } = p_RouterData;
	const regExp = new RegExp(`^${document.location.origin}`);
	p_Url = p_Url.replace(regExp, "").replace(/[/]+/g, "/");
	const queryParts = p_Url.split("?");
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
		}, { params: {}, url: p_Url, query, customData: p_CustomData });

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
			url: p_Url,
			query,
			customData: p_CustomData,
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

	set onNotFound(p_Handler) {
		this[privateData].notFoundHandler = p_Handler;
	}

	get onNotFound() {
		return this[privateData].notFoundHandler;
	}

	addRoute(p_Route, ...p_Callbacks) {
		this[privateData].routes.push(createRoute(p_Route, p_Callbacks));
	}

	goTo(p_Url, p_CustomData) {
		handleRoute(this[privateData], p_Url, p_CustomData);
	}

	clearRoutes() {
		this[privateData].routes = [];
	}
}

const routers = new Map();

export function getRouter(p_Window) {
	if (!routers.has(p_Window)) {
		routers.set(p_Window, new Router(p_Window));
	}
	return routers.get(p_Window);
}

export function removeRouter(p_Window) {
	routers.delete(p_Window);
}
