/**
 * @enum {Readonly<{ORBITAL: string, FREE: string, FOLLOW: string}>}
 */
export const CAMERA_TYPES = Object.freeze({
	ORBITAL: "ORBITAL", // camera points at a fixed point in the scene and can move around it, zoom in or out, but cannot look at a different object
	FREE: "FREE",		// camera can move in all directions and can look in any direction
	FOLLOW: "FOLLOW",	// camera follows a specific object around. The camera can be moved but will keep looking at the object it is following
});

export const MANIPULATOR_TYPES = Object.freeze({
	MOVE_X: "MOVE_X",
	MOVE_Y: "MOVE_Y",
	MOVE_Z: "MOVE_Z",
	MOVE_PLANE: "MOVE_PLANE",
	SCALE: "SCALE",
	SCALE_X: "SCALE_X",
	SCALE_Y: "SCALE_Y",
	SCALE_Z: "SCALE_Z",
	ROTATE_X: "ROTATE_X",
	ROTATE_Y: "ROTATE_Y",
	ROTATE_Z: "ROTATE_Z",
});
