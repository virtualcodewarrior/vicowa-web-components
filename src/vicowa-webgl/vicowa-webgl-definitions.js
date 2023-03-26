/**
 * @enum {Readonly<{ORBITAL: string, FREE: string, FOLLOW: string}>}
 */
export const CAMERA_TYPES = Object.freeze({
	ORBITAL: 'ORBITAL', // camera points at a fixed point in the scene and can move around it, zoom in or out, but cannot look at a different object
	FREE: 'FREE',		// camera can move in all directions and can look in any direction
	FOLLOW: 'FOLLOW',	// camera follows a specific object around. The camera can be moved but will keep looking at the object it is following
});

export const CAP_TYPES = Object.freeze({
	NO_CAP: 'NO_CAP',
	CAP_START: 'CAP_START',
	CAP_END: 'CAP_END',
	CAP_ALL: 'CAP_ALL',
});
