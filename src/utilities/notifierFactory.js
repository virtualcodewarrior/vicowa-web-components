function notifierFactory() {
	const handlers = {};
	return {
		addNotifier(p_Notification, p_Handler) {
			let wasAdded = false;
			handlers[p_Notification] = handlers[p_Notification] || [];
			if (handlers.indexOf(p_Handler) === -1) {
				handlers.push(p_Handler);
				wasAdded = true;
			}

			return wasAdded;
		},
		removeNotifier(p_Notification, p_Handler) {
			let wasRemoved = false;
			if (p_Notification) {
				const notification = handlers[p_Notification];
				if (notification) {
					if (p_Handler) {
						const handlerIndex = notification.indexOf(p_Handler);
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
					const handlerIndex = notification.indexOf(p_Handler);
					if (handlerIndex !== -1) {
						notification.splice(handlerIndex, 1);
						wasRemoved = true;
					}
					if (!notification.length)  {
						delete handlers[p_NotificationKey];
					}
				});
			} else {
				throw new Error('no notification or handler specified');
			}
		},
		notify(p_Notification, p_AdditionalInfo) {
			const notification = handlers[p_Notification];
			if (notification) {
				notification.slice().forEach((p_Handler) => p_Handler(p_AdditionalInfo)); // we first copy this array in case items get removed during processing
			}
		}
	}
}

export default notifierFactory;