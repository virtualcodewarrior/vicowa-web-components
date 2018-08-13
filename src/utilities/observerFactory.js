function observerFactory() {
	const handlers = {};
	return {
		/**
		 * Add a handler for a notification
		 * @param {string} p_Notification The name of the notification
		 * @param {function} p_Handler The handler callback function
		 * @param {object} [p_Owner] Optional the owner of the handler, this can be used to remove all handlers for a specific owner (for instance when the object gets destroyed)
		 * @returns {boolean} true when the handler was added, false if the handler already existed
		 */
		addObserver(p_Notification, p_Handler, p_Owner) {
			let wasAdded = false;
			handlers[p_Notification] = handlers[p_Notification] || [];
			const notification = handlers[p_Notification];
			if (!notification.find((p_HandlerInfo) => p_HandlerInfo.owner === p_Owner && p_HandlerInfo.handler === p_Handler)) {
				notification.push({
					owner: p_Owner,
					handler: p_Handler,
				});
				wasAdded = true;
			}

			return wasAdded;
		},
		/**
		 * Remove all handlers that belong to the given owner
		 * @param {object} p_Owner The owner for which we want to remove all handlers
		 */
		removeOwner(p_Owner) {
			// this will not remove un-owned handlers
			if (p_Owner) {
				Object.keys(handlers).forEach((p_Key) => {
					handlers[p_Key] = handlers[p_Key].filter((p_HandlerInfo) => p_HandlerInfo.owner !== p_Owner);
					if (!handlers[p_Key].length) {
						delete handlers[p_Key];
					}
				});
			}
		},
		/**
		 * Remove the handler for the specified notification
		 * @param {string|null} p_Notification The notification for which we are removing the handler, if null will remove the given handler for all notifications
		 * @param {function|undefined|null} [p_Handler] The handler we are removing, if not specified or null, will remove all handlers for the given notification
		 * @returns {boolean} true when items were removed or false otherwise
		 */
		removeObserver(p_Notification, p_Handler) {
			let wasRemoved = false;
			if (p_Notification) {
				const notification = handlers[p_Notification];
				if (notification) {
					if (p_Handler) {
						const handlerIndex = notification.findIndex((p_HandlerInfo) => p_HandlerInfo.handler === p_Handler);
						if (handlerIndex !== -1) {
							notification.splice(handlerIndex, 1);
							wasRemoved = true;
						}
						if (!notification.length) {
							delete handlers[p_Notification];
						}
					} else {
						// no specific handler given so remove all handlers for this type
						delete handlers[p_Notification];
						wasRemoved = true;
					}
				}
			} else if (p_Handler) { // if we hit this there was only a handler specified and no notification, remove the given handler from all notifications
				Object.keys(handlers).forEach((p_NotificationKey) => {
					const notification = handlers[p_NotificationKey];
					const handlerIndex = notification.findIndex((p_HandlerInfo) => p_HandlerInfo.handler === p_Handler);
					if (handlerIndex !== -1) {
						notification.splice(handlerIndex, 1);
						wasRemoved = true;
					}
					if (!notification.length) {
						delete handlers[p_NotificationKey];
					}
				});
			} else {
				throw new Error('no notification or handler specified');
			}
			return wasRemoved;
		},
		/**
		 * Notify all handlers for the given notification type
		 * @param {string} p_Notification The notification we are sending out
		 * @param {any} [p_AdditionalInfo] An optional variable that will be passed to the handler
		 */
		notify(p_Notification, p_AdditionalInfo) {
			const notification = handlers[p_Notification];
			if (notification) {
				notification.slice().forEach((p_HandlerInfo) => p_HandlerInfo.handler(p_AdditionalInfo)); // we first copy this array in case items get removed during processing
			}
		},
	};
}

export default observerFactory;
