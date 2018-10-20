import { CAP_TYPES } from "./vicowa-webgl-definitions.js";
import { vectorLength, angleToPoint, pointToAngle, vectorSubtract, vectorAdd, toRadians } from "../utilities/mathHelpers.js";

const MANIPULATOR_GROUP_TYPES = Object.freeze({
	MOVE: "MOVE",
	SCALE: "SCALE",
	ROTATE: "ROTATE",
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

const privateData = Symbol("privateData");
const manipulation = Symbol("manipulation");
const manipulatorRenderingGroup = 1;

function createMoveObject(p_Name, p_ExtensionData) {
	const moveObject = p_ExtensionData.webglIF.createGroup(p_Name);
	moveObject.addChild(p_ExtensionData.webglIF.createSphere({ diameter: 0.2, rotation: { x: 90, y: 0, z: 0 }, material: "move-manipulator-unselected", renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: -0.2 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: -0.3 }, rotation: { x: 0, y: 0, z: 180 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: 0.2 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: 0.3 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.visible = false;

	return moveObject;
}

function createPlaneMoveObject(p_Name, p_ExtensionData) {
	const moveObject = p_ExtensionData.webglIF.createGroup(p_Name);
	moveObject.addChild(p_ExtensionData.webglIF.createSphere({ diameter: 0.2, rotation: { x: 90, y: 0, z: 0 }, material: "move-manipulator-unselected", renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: -0.2 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: -0.3 }, rotation: { z: 180 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: 0.2 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: 0.3 }, renderingGroupId: manipulatorRenderingGroup }));

	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { z: -0.2 }, rotation: { x: 90 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { z: -0.3 }, rotation: { x: 90, z: 180 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { z: 0.2 }, rotation: { x: -90 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { z: 0.3 }, rotation: { x: -90, z: 180 }, renderingGroupId: manipulatorRenderingGroup }));
	moveObject.visible = false;

	return moveObject;
}

function createScaleObject(p_Name, p_ExtensionData) {
	const scaleObject = p_ExtensionData.webglIF.createGroup(p_Name);
	scaleObject.addChild(p_ExtensionData.webglIF.createSphere({ diameter: 0.15, diameterZ: 0.3, rotation: { x: 90, y: 0, z: 0 }, material: "scale-manipulator-unselected", renderingGroupId: manipulatorRenderingGroup }));
	scaleObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: -0.3 }, rotation: { x: 0, y: 0, z: 180 }, renderingGroupId: manipulatorRenderingGroup }));
	scaleObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.6, renderingGroupId: manipulatorRenderingGroup }));
	scaleObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: 0.3 }, renderingGroupId: manipulatorRenderingGroup }));
	scaleObject.visible = false;

	return scaleObject;
}

function createRotateObject(p_Name, p_ExtensionData) {
	const rotateObject = p_ExtensionData.webglIF.createGroup(p_Name);
	rotateObject.addChild(p_ExtensionData.webglIF.createSphere({ diameter: 0.2, rotation: { x: 90, y: 0, z: 0 }, material: "rotate-manipulator-unselected", renderingGroupId: manipulatorRenderingGroup }));
	const path = [];
	const arc = toRadians(270);
	const startAngle = toRadians(0);
	const stepSize = arc / 16;
	const dist = 0.2;
	for (let rad = startAngle; rad < startAngle + arc; rad += stepSize) {
		path.push([Math.sin(rad) * dist, Math.cos(rad) * dist, 0]);
	}
	rotateObject.addChild(p_ExtensionData.webglIF.createTube({ radius: 0.025, cap: CAP_TYPES.CAP_ALL, path, renderingGroupId: manipulatorRenderingGroup }));
	rotateObject.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { x: -0.2 }, rotation: { x: 0, y: 0, z: 0 }, renderingGroupId: manipulatorRenderingGroup }));
	rotateObject.visible = false;

	return rotateObject;
}

function createManipulatorTemplates(p_Extension) {
	const extensionData = p_Extension[privateData];
	extensionData.manipulators[MANIPULATOR_TYPES.MOVE_X] = extensionData.manipulators[MANIPULATOR_TYPES.MOVE_Y] = extensionData.manipulators[MANIPULATOR_TYPES.MOVE_Z] = createMoveObject("move-manipulator", extensionData);
	extensionData.manipulators[MANIPULATOR_TYPES.MOVE_PLANE] = createPlaneMoveObject("move-manipulator", extensionData);
	extensionData.manipulators[MANIPULATOR_TYPES.SCALE_X] = extensionData.manipulators[MANIPULATOR_TYPES.SCALE_Y] = extensionData.manipulators[MANIPULATOR_TYPES.SCALE_Z] = extensionData.manipulators[MANIPULATOR_TYPES.SCALE] = createScaleObject("scale-manipulator", extensionData);
	extensionData.manipulators[MANIPULATOR_TYPES.ROTATE_X] = extensionData.manipulators[MANIPULATOR_TYPES.ROTATE_Y] = extensionData.manipulators[MANIPULATOR_TYPES.ROTATE_Z] = createRotateObject("rotate-manipulator", extensionData);
}

function createAndAttachManipulatorInstance(p_ManipulatorName, p_Extension, p_Object, p_Settings) {
	const extensionData = p_Extension[privateData];
	const name = `${p_ManipulatorName}-${p_Object.name}`;
	p_Object.getChildren((p_ChildObject) => p_ChildObject.name === name).forEach((p_ChildObject) => p_Object.removeChild(p_ChildObject));
	const clonedObject = extensionData.manipulators[p_ManipulatorName].clone(name);
	extensionData.webglIF.applySettings(Object.assign({ collisions: true, visible: true }, p_Settings), clonedObject);
	clonedObject.manipulatorType = p_ManipulatorName;
	p_Object.addChild(clonedObject);
}

function attachMoveXManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_X, p_Extension, p_Object, p_Settings);
}
function attachMoveYManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_Y, p_Extension, p_Object, p_Settings);
}
function attachMoveZManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_Z, p_Extension, p_Object, p_Settings);
}
function attachMovePlaneManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_PLANE, p_Extension, p_Object, p_Settings);
}
function attachScaleXManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_X, p_Extension, p_Object, p_Settings);
}
function attachScaleYManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_Y, p_Extension, p_Object, p_Settings);
}
function attachScaleZManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_Z, p_Extension, p_Object, p_Settings);
}
function attachScaleManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE, p_Extension, p_Object, p_Settings);
}
function attachRotateAroundXManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_X, p_Extension, p_Object, p_Settings);
}
function attachRotateAroundYManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_Y, p_Extension, p_Object, p_Settings);
}
function attachRotateAroundZManipulator(p_Extension, p_Object, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_Z, p_Extension, p_Object, p_Settings);
}

function attachManipulators(p_Extension, p_Object, p_ClickPoint) {
	const extensionData = p_Extension[privateData];
	const allowed = p_Object[manipulation].allowed;
	const activeGroup = p_Object[manipulation].activeGroup;
	const manipulatorPlane = p_Object[manipulation].manipulatorPlane;
	p_Extension.removeManipulators(p_Object.name);

	if (allowed && Object.keys(allowed).find((p_Key) => MANIPULATOR_TYPES[p_Key] && allowed[p_Key])) {
		const center = p_Object.center;
		const boundingVectors = p_Object.boundingVectors;

		const manipulatorObject = extensionData.webglIF.createGroup(`manipulator-for-${p_Object.name}`);
		extensionData.activeManipulationObjects[manipulatorObject.name] = manipulatorObject;
		manipulatorObject.manipulatedObject = p_Object;
		manipulatorObject.manipulatedObject.onRemove = (p_RemovingObject) => {
			p_Extension.removeManipulators(p_RemovingObject.name);
		};

		const getPosition = (p_TargetOffsetX, p_TargetOffsetY) => {
			const screenPoint = extensionData.webglIF.pointToScreenPoint(p_ClickPoint || center);
			const planePointPair = extensionData.webglIF.screenPointToBoundingProjection(screenPoint, p_Object);
			const distance = vectorLength(vectorSubtract(planePointPair.intersection, planePointPair.start));
			const factor = 1 / distance;
			const position = {
				x: planePointPair.intersection.x - ((planePointPair.intersection.x - planePointPair.start.x) * factor),
				y: planePointPair.intersection.y - ((planePointPair.intersection.y - planePointPair.start.y) * factor),
				z: planePointPair.intersection.z - ((planePointPair.intersection.z - planePointPair.start.z) * factor),
			};
			const vector = vectorSubtract(planePointPair.intersection, planePointPair.start);
			const zAngle = 0;
			const yAngle = 90 - pointToAngle({ x: vector.x, y: vector.z });
			const xAngle = (vector.z > 0) ? -pointToAngle({ x: vector.z, y: vector.y }) : pointToAngle({ x: vector.z, y: vector.y });

			const tempPlane = extensionData.webglIF.createPlane({
				width: 10000 / extensionData.webgl.unitMultiplier,
				height: 10000 / extensionData.webgl.unitMultiplier,
				position,
				rotation: { x: xAngle, y: yAngle, z: zAngle },
				collisions: true,
				sideOrientation: 2,
				visible: true,
			});
			tempPlane.updateCoordinates();
			const planePos = extensionData.webglIF.screenToObjectPoint({ x: screenPoint.x + p_TargetOffsetX, y: screenPoint.y + p_TargetOffsetY }, tempPlane);
			tempPlane.remove();

			return {
				position: planePos,
				scale: {
					x: distance / 5,
					y: distance / 5,
					z: distance / 5,
				},
			};
		};

		if (activeGroup === MANIPULATOR_GROUP_TYPES.MOVE) {
			if (allowed[MANIPULATOR_TYPES.MOVE_PLANE]) {
				if (manipulatorPlane) {
					const pos = getPosition(0, 0);
					attachMovePlaneManipulator(p_Extension, manipulatorObject, { position: pos.position, scale: pos.scale, rotation: { x: 0, y: manipulatorPlane.rotation.y + 90, z: manipulatorPlane.rotation.x } });
					manipulatorObject.getChildren()[0].manipulatorPlane = manipulatorPlane;
				}
			} else {
				if (allowed[MANIPULATOR_TYPES.MOVE_X]) {
					const pos = getPosition(60, 60);
					attachMoveXManipulator(p_Extension, manipulatorObject, { position: pos.position, scale: pos.scale, rotation: { x: 0, y: 0, z: 90 } });
				}
				if (allowed[MANIPULATOR_TYPES.MOVE_Y]) {
					const pos = getPosition(-60, -60);
					attachMoveYManipulator(p_Extension, manipulatorObject, { position: pos.position, scale: pos.scale, rotation: { x: 0, y: 0, z: 0 } });
				}
				if (allowed[MANIPULATOR_TYPES.MOVE_Z]) {
					const pos = getPosition(-60, 60);
					attachMoveZManipulator(p_Extension, manipulatorObject, { position: pos.position, scale: pos.scale, rotation: { x: 90, y: 0, z: 0 } });
				}
			}
		} else if (activeGroup === MANIPULATOR_GROUP_TYPES.SCALE) {
			if (allowed[MANIPULATOR_TYPES.SCALE]) {
				const pos = getPosition(60, -60);
				attachScaleManipulator(p_Extension, manipulatorObject, { position: pos.position, scale: pos.scale, rotation: { x: -45, y: -45, z: 0 } });
			} else {
				if (allowed[MANIPULATOR_TYPES.SCALE_X]) {
					const pos = getPosition(60, 60);
					attachScaleXManipulator(p_Extension, manipulatorObject, { position: boundingVectors[0], scale: pos.scale, rotation: { x: 0, y: 0, z: 90 } });
				}
				if (allowed[MANIPULATOR_TYPES.SCALE_Y]) {
					const pos = getPosition(-60, -60);
					attachScaleYManipulator(p_Extension, manipulatorObject, { position: boundingVectors[1], scale: pos.scale, rotation: { x: 0, y: 0, z: 0 } });
				}
				if (allowed[MANIPULATOR_TYPES.SCALE_Z]) {
					const pos = getPosition(-60, 60);
					attachScaleZManipulator(p_Extension, manipulatorObject, { position: boundingVectors[2], scale: pos.scale, rotation: { x: 90, y: 0, z: 0 } });
				}
			}
		} else if (activeGroup === MANIPULATOR_GROUP_TYPES.ROTATE) {
			if (allowed[MANIPULATOR_TYPES.ROTATE_X]) {
				const pos = getPosition(60, 60);
				attachRotateAroundXManipulator(p_Extension, manipulatorObject, { position: boundingVectors[0], scale: pos.scale, rotation: { x: 180, y: 270, z: -90 } });
			}
			if (allowed[MANIPULATOR_TYPES.ROTATE_Y]) {
				const pos = getPosition(-60, -60);
				attachRotateAroundYManipulator(p_Extension, manipulatorObject, { position: boundingVectors[1], scale: pos.scale, rotation: { x: 90, y: 270, z: 0 } });
			}
			if (allowed[MANIPULATOR_TYPES.ROTATE_Z]) {
				const pos = getPosition(-60, 60);
				attachRotateAroundZManipulator(p_Extension, manipulatorObject, { position: boundingVectors[2], scale: pos.scale, rotation: { x: 0, y: 0, z: 90 } });
			}
		}
	}
}

function setNextGroup(p_Extension, p_Object) {
	if (p_Object[manipulation].activeGroup) {
		if (p_Object[manipulation].activeGroup === MANIPULATOR_GROUP_TYPES.ROTATE) {
			if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_Z] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_PLANE]) {
				p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.MOVE;
			} else if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_Z] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE]) {
				p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.SCALE;
			}
		} else if (p_Object[manipulation].activeGroup === MANIPULATOR_GROUP_TYPES.MOVE) {
			if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_Z] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE]) {
				p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.SCALE;
			} else if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_Z]) {
				p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.ROTATE;
			}
		} else if (p_Object[manipulation].activeGroup === MANIPULATOR_GROUP_TYPES.SCALE) {
			if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_Z]) {
				p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.ROTATE;
			} else if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_Z] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_PLANE]) {
				p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.MOVE;
			}
		}
	} else {
		if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_Z] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.MOVE_PLANE]) {
			p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.MOVE;
		} else if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE_Z] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.SCALE]) {
			p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.SCALE;
		} else if (p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_X] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_Y] || p_Object[manipulation].allowed[MANIPULATOR_TYPES.ROTATE_Z]) {
			p_Object[manipulation].activeGroup = MANIPULATOR_GROUP_TYPES.ROTATE;
		}
	}
}

export default class VicowaWebGLManipulationExtension {
	static getAllManipulatorsAllowed() {
		return Object.keys(MANIPULATOR_TYPES).reduce((p_Previous, p_Option) => { p_Previous[p_Option] = true; return p_Previous; }, {});
	}

	constructor() {
		this[privateData] = {
			webgl: null,
			webglIF: null,
			manipulators: {},
			activeManipulationObjects: {},
			draggingManipulator: null,
		};
	}

	attach(p_WebGL, p_WebglInterface) {
		const extensionData = this[privateData];

		extensionData.webgl = p_WebGL;
		extensionData.webglIF = p_WebglInterface;

		extensionData.webgl.addMaterial("move-manipulator-unselected", { diffuse: { r: 0.6, g: 0.6, b: 1 } });
		extensionData.webgl.addMaterial("move-manipulator-selected", { diffuse: { r: 0, g: 0, b: 1 } });
		extensionData.webgl.addMaterial("scale-manipulator-unselected", { diffuse: { r: 0.6, g: 1, b: 1 } });
		extensionData.webgl.addMaterial("scale-manipulator-selected", { diffuse: { r: 0, g: 1, b: 1 } });
		extensionData.webgl.addMaterial("rotate-manipulator-unselected", { diffuse: { r: 1, g: 0.6, b: 1 } });
		extensionData.webgl.addMaterial("rotate-manipulator-selected", { diffuse: { r: 1, g: 0, b: 1 } });

		const getPlanePosition = () => ((extensionData.draggingManipulator && extensionData.draggingManipulator.manipulatorPlane) ? extensionData.webglIF.screenToObjectPoint(extensionData.webglIF.pointerPos, extensionData.draggingManipulator.manipulatorPlane) : null);

		extensionData.webglIF.addPointerClickListener((p_Event) => {
			let hitObject = p_Event.hitObject;
			while (hitObject && !MANIPULATOR_TYPES[hitObject.manipulatorType]) {
				hitObject = hitObject.parent;
			}
			if (hitObject && (!extensionData.draggingManipulator || !extensionData.draggingManipulator.hasMoved)) {
				let objectManipulator = hitObject;
				while (objectManipulator && !objectManipulator.manipulatedObject) {
					objectManipulator = objectManipulator.parent;
				}
				if (objectManipulator) {
					setNextGroup(this, objectManipulator.manipulatedObject);
					attachManipulators(this, objectManipulator.manipulatedObject);
				}
			}
		});

		extensionData.webglIF.addPointerDownListener((p_Event) => {
			let hitObject = p_Event.hitObject;
			while (hitObject && !MANIPULATOR_TYPES[hitObject.manipulatorType]) {
				hitObject = hitObject.parent;
			}
			if (hitObject) {
				extensionData.draggingManipulator = { manipulatorType: hitObject.manipulatorType, activeManipulator: hitObject };
				extensionData.draggingManipulator.hasMoved = false;
				let objectManipulator = hitObject;
				while (objectManipulator && !objectManipulator.manipulatedObject) {
					objectManipulator = objectManipulator.parent;
				}
				if (objectManipulator) {
					extensionData.draggingManipulator.activeManipulator.activeGroup = objectManipulator.manipulatedObject[manipulation].activeGroup;
					switch (hitObject.manipulatorType) {
						case MANIPULATOR_TYPES.MOVE_X:
						case MANIPULATOR_TYPES.SCALE_X:
						case MANIPULATOR_TYPES.ROTATE_Z:
							extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
								width: 10000 / extensionData.webgl.unitMultiplier,
								height: 10000 / extensionData.webgl.unitMultiplier,
								position: hitObject.center,
								collisions: true,
								visible: false,
							});
							extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
							extensionData.draggingManipulator.startPoint = getPlanePosition();
							extensionData.draggingManipulator.startHandlerRotation = pointToAngle(vectorSubtract(extensionData.draggingManipulator.startPoint, objectManipulator.manipulatedObject.center));
							break;
						case MANIPULATOR_TYPES.SCALE:
							extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
								width: 10000 / extensionData.webgl.unitMultiplier,
								height: 10000 / extensionData.webgl.unitMultiplier,
								position: hitObject.center,
								collisions: true,
								visible: false,
							});
							extensionData.draggingManipulator.manipulatorPlane.applySettings({ rotation: { x: 0, y: 45, z: 0 } });
							extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
							extensionData.draggingManipulator.startPoint = getPlanePosition();
							break;
						case MANIPULATOR_TYPES.MOVE_Y:
						case MANIPULATOR_TYPES.SCALE_Y:
							extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
								width: 10000 / extensionData.webgl.unitMultiplier,
								height: 10000 / extensionData.webgl.unitMultiplier,
								position: hitObject.center,
								collisions: true,
								visible: false,
							});
							extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
							extensionData.draggingManipulator.startPoint = getPlanePosition();
							break;
						case MANIPULATOR_TYPES.ROTATE_X:
							extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
								width: 10000 / extensionData.webgl.unitMultiplier,
								height: 10000 / extensionData.webgl.unitMultiplier,
								position: hitObject.center,
								collisions: true,
								visible: false,
								rotation: { x: 0, y: 90, z: 0 },
							});
							extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
							extensionData.draggingManipulator.startPoint = getPlanePosition();
							extensionData.draggingManipulator.startHandlerRotation = pointToAngle(vectorSubtract({ x: extensionData.draggingManipulator.startPoint.z, y: extensionData.draggingManipulator.startPoint.y }, { x: objectManipulator.manipulatedObject.center.z, y: objectManipulator.manipulatedObject.center.y }));
							break;
						case MANIPULATOR_TYPES.MOVE_Z:
						case MANIPULATOR_TYPES.SCALE_Z:
						case MANIPULATOR_TYPES.ROTATE_Y:
							extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
								width: 10000 / extensionData.webgl.unitMultiplier,
								height: 10000 / extensionData.webgl.unitMultiplier,
								position: hitObject.center,
								collisions: true,
								visible: false,
								rotation: { x: 90, y: 0, z: 0 },
							});
							extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
							extensionData.draggingManipulator.startPoint = getPlanePosition();
							extensionData.draggingManipulator.startHandlerRotation = pointToAngle(vectorSubtract({ x: extensionData.draggingManipulator.startPoint.x, y: extensionData.draggingManipulator.startPoint.z }, { x: objectManipulator.manipulatedObject.center.x, y: objectManipulator.manipulatedObject.center.z }));
							break;
						case MANIPULATOR_TYPES.MOVE_PLANE:
							extensionData.draggingManipulator.manipulatorPlane = hitObject.manipulatorPlane;
							extensionData.draggingManipulator.startPoint = getPlanePosition();
							break;
					}

					extensionData.draggingManipulator.startPosition = extensionData.draggingManipulator.activeManipulator.position;
					extensionData.draggingManipulator.startScale = objectManipulator.manipulatedObject.scale;
					extensionData.draggingManipulator.startRotation = objectManipulator.manipulatedObject.rotation;
					if (extensionData.draggingManipulator.startPoint) {
						extensionData.draggingManipulator.manipulatorsObject = objectManipulator;
						extensionData.draggingManipulator.activeManipulator.getChildren()[0].applySettings({ material: (extensionData.draggingManipulator.activeManipulator.activeGroup === MANIPULATOR_GROUP_TYPES.SCALE) ? "scale-manipulator-selected" : (extensionData.draggingManipulator.activeManipulator.activeGroup === MANIPULATOR_GROUP_TYPES.ROTATE) ? "rotate-manipulator-selected" : "move-manipulator-selected" });
						extensionData.webglIF.detachCameraControl();
					} else {
						if (extensionData.draggingManipulator.manipulatorType !== MANIPULATOR_TYPES.MOVE_PLANE) {
							extensionData.draggingManipulator.manipulatorPlane.remove();
						}
						extensionData.draggingManipulator = null;
					}
				} else {
					extensionData.draggingManipulator.manipulatorPlane.remove();
					extensionData.draggingManipulator = null;
				}
			}
		});

		extensionData.webglIF.addPointerUpListener(() => {
			if (extensionData.draggingManipulator) {
				if (extensionData.draggingManipulator.manipulatorType !== MANIPULATOR_TYPES.MOVE_PLANE) {
					extensionData.draggingManipulator.manipulatorPlane.remove();
				}
				if (!extensionData.draggingManipulator.activeManipulator.isRemoved()) {
					extensionData.draggingManipulator.activeManipulator.getChildren()[0].applySettings({ material: (extensionData.draggingManipulator.activeManipulator.activeGroup === MANIPULATOR_GROUP_TYPES.SCALE) ? "scale-manipulator-unselected" : (extensionData.draggingManipulator.activeManipulator.activeGroup === MANIPULATOR_GROUP_TYPES.ROTATE) ? "rotate-manipulator-unselected" : "move-manipulator-unselected" });
				}
			}
			extensionData.draggingManipulator = null;
			extensionData.webglIF.attachCameraControl();
		});

		extensionData.webglIF.addPointerMoveListener(() => {
			if (extensionData.draggingManipulator && extensionData.draggingManipulator.startPoint) {
				const currentPoint = getPlanePosition();
				if (currentPoint) {
					extensionData.draggingManipulator.hasMoved = true;
					const targetObjectCenter = extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.center;
					const diff = { x: Math.round((currentPoint.x - extensionData.draggingManipulator.startPoint.x) * 1000) / 1000, y: Math.round((currentPoint.y - extensionData.draggingManipulator.startPoint.y) * 1000) / 1000, z: Math.round((currentPoint.z - extensionData.draggingManipulator.startPoint.z) * 1000) / 1000 };
					switch (extensionData.draggingManipulator.manipulatorType) {
						case MANIPULATOR_TYPES.MOVE_X:
							diff.y = 0;
							diff.z = 0;
							extensionData.draggingManipulator.manipulatorsObject.offset(diff);
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.offset(diff);
							extensionData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_Y:
							diff.x = 0;
							diff.z = 0;
							extensionData.draggingManipulator.manipulatorsObject.offset(diff);
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.offset(diff);
							extensionData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_Z:
							diff.x = 0;
							diff.y = 0;
							extensionData.draggingManipulator.manipulatorsObject.offset(diff);
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.offset(diff);
							extensionData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_PLANE:
							extensionData.draggingManipulator.manipulatorsObject.offset(diff);
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.offset(diff);
							extensionData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.SCALE: {
							const oldRelativePoint = { x: extensionData.draggingManipulator.startPoint.x - targetObjectCenter.x, y: extensionData.draggingManipulator.startPoint.y - targetObjectCenter.y, z: extensionData.draggingManipulator.startPoint.z - targetObjectCenter.z };
							const oldDistance = Math.sqrt((oldRelativePoint.x * oldRelativePoint.x) + (oldRelativePoint.y * oldRelativePoint.y) + (oldRelativePoint.z * oldRelativePoint.z));
							const newRelativePoint = { x: currentPoint.x - targetObjectCenter.x, y: currentPoint.y - targetObjectCenter.y, z: currentPoint.z - targetObjectCenter.z };
							const newDistance = Math.sqrt((newRelativePoint.x * newRelativePoint.x) + (newRelativePoint.y * newRelativePoint.y) + (newRelativePoint.z * newRelativePoint.z));

							extensionData.draggingManipulator.activeManipulator.position = { x: extensionData.draggingManipulator.startPosition.x + currentPoint.x - extensionData.draggingManipulator.startPoint.x, y: extensionData.draggingManipulator.startPosition.y + currentPoint.y - extensionData.draggingManipulator.startPoint.y, z: extensionData.draggingManipulator.startPosition.z + currentPoint.z - extensionData.draggingManipulator.startPoint.z };
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.scale = {
								x: extensionData.draggingManipulator.startScale.x * newDistance / oldDistance,
								y: extensionData.draggingManipulator.startScale.y * newDistance / oldDistance,
								z: extensionData.draggingManipulator.startScale.z * newDistance / oldDistance,
							};
						}
							break;
						case MANIPULATOR_TYPES.SCALE_X: {
							const oldDistance = extensionData.draggingManipulator.startPoint.x - targetObjectCenter.x;
							const newDistance = currentPoint.x - targetObjectCenter.x;
							extensionData.draggingManipulator.activeManipulator.position = { x: extensionData.draggingManipulator.startPosition.x + currentPoint.x - extensionData.draggingManipulator.startPoint.x };
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.scale = { x: extensionData.draggingManipulator.startScale.x * newDistance / oldDistance };
						}
							break;
						case MANIPULATOR_TYPES.SCALE_Y: {
							const oldDistance = extensionData.draggingManipulator.startPoint.y - targetObjectCenter.y;
							const newDistance = currentPoint.y - targetObjectCenter.y;
							extensionData.draggingManipulator.activeManipulator.position = { y: extensionData.draggingManipulator.startPosition.y + currentPoint.y - extensionData.draggingManipulator.startPoint.y };
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.scale = { y: extensionData.draggingManipulator.startScale.y * newDistance / oldDistance };
						}
							break;
						case MANIPULATOR_TYPES.SCALE_Z: {
							const oldDistance = extensionData.draggingManipulator.startPoint.z - targetObjectCenter.z;
							const newDistance = currentPoint.z - targetObjectCenter.z;
							extensionData.draggingManipulator.activeManipulator.position = { z: extensionData.draggingManipulator.startPosition.z + currentPoint.z - extensionData.draggingManipulator.startPoint.z };
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.scale = { z: extensionData.draggingManipulator.startScale.z * newDistance / oldDistance };
						}
							break;
						case MANIPULATOR_TYPES.ROTATE_X: {
							const relevantCenter = { x: extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.center.z, y: extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.center.y };
							const relevantStart = { x: extensionData.draggingManipulator.startPoint.z, y: extensionData.draggingManipulator.startPoint.y };
							const newHandlerRotation = pointToAngle(vectorSubtract({ x: currentPoint.z, y: currentPoint.y }, relevantCenter));
							const newPos = angleToPoint(newHandlerRotation, vectorLength(vectorSubtract(relevantStart, relevantCenter)));
							const manipulatePos = vectorAdd({ x: newPos.x, y: newPos.y }, relevantCenter);
							extensionData.draggingManipulator.activeManipulator.position = { z: manipulatePos.x, y: manipulatePos.y };
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.rotation = { x: extensionData.draggingManipulator.startRotation.x - (newHandlerRotation - extensionData.draggingManipulator.startHandlerRotation) };
						}
							break;
						case MANIPULATOR_TYPES.ROTATE_Y: {
							const relevantCenter = { x: extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.center.x, y: extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.center.z };
							const relevantStart = { x: extensionData.draggingManipulator.startPoint.x, y: extensionData.draggingManipulator.startPoint.z };
							const newHandlerRotation = pointToAngle(vectorSubtract({ x: currentPoint.x, y: currentPoint.z }, relevantCenter));
							const newPos = angleToPoint(newHandlerRotation, vectorLength(vectorSubtract(relevantStart, relevantCenter)));
							const manipulatePos = vectorAdd({ x: newPos.x, y: newPos.y }, relevantCenter);
							extensionData.draggingManipulator.activeManipulator.position = { x: manipulatePos.x, z: manipulatePos.y };
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.rotation = { y: extensionData.draggingManipulator.startRotation.y - (newHandlerRotation - extensionData.draggingManipulator.startHandlerRotation) };
						}
							break;
						case MANIPULATOR_TYPES.ROTATE_Z: {
							const relevantCenter = { x: extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.center.x, y: extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.center.y };
							const relevantStart = { x: extensionData.draggingManipulator.startPoint.x, y: extensionData.draggingManipulator.startPoint.y };
							const newHandlerRotation = pointToAngle(vectorSubtract(currentPoint, relevantCenter));
							const newPos = angleToPoint(newHandlerRotation, vectorLength(vectorSubtract(relevantStart, relevantCenter)));
							const manipulatePos = vectorAdd({ x: newPos.x, y: newPos.y }, relevantCenter);
							extensionData.draggingManipulator.activeManipulator.position = { x: manipulatePos.x, y: manipulatePos.y };
							extensionData.draggingManipulator.manipulatorsObject.manipulatedObject.rotation = { z: extensionData.draggingManipulator.startRotation.z + (newHandlerRotation - extensionData.draggingManipulator.startHandlerRotation) };
						}
							break;
					}
				}
			}
		});
		createManipulatorTemplates(this);
	}

	setAllowedManipulators(p_Object, p_Settings) {
		const extensionData = this[privateData];
		const targetObject = extensionData.webglIF.getObject(p_Object);
		targetObject[manipulation] = targetObject[manipulation] || { allowed: {}, manipulatorPlane: null };
		Object.keys(p_Settings).forEach((p_Key) => {
			if (MANIPULATOR_TYPES[p_Key]) {
				targetObject[manipulation].allowed[p_Key] = p_Settings[p_Key];
				if (p_Key === MANIPULATOR_TYPES.MOVE_PLANE) {
					targetObject[manipulation].manipulatorPlane = p_Settings.movePlane;
				}
			}
		});
	}

	removeManipulators(p_Object) {
		const extensionData = this[privateData];
		const targetObject = extensionData.webglIF.getObject(p_Object);
		const manipulatorName = `manipulator-for-${targetObject.name}`;
		if (extensionData.activeManipulationObjects[manipulatorName]) {
			extensionData.activeManipulationObjects[manipulatorName].remove();
			delete extensionData.activeManipulationObjects[manipulatorName];
		}
	}

	attachManipulators(p_Object, p_ClickPoint) {
		const extensionData = this[privateData];
		const targetObject = extensionData.webglIF.getObject(p_Object);
		if (targetObject && targetObject[manipulation]) {
			if (!targetObject[manipulation].activeGroup) {
				setNextGroup(this, targetObject);
			}
			attachManipulators(this, targetObject, p_ClickPoint);
		}
	}
}
