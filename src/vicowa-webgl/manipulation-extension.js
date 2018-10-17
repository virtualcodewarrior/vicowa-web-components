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

function getMeshObject(p_ExtensionData, p_Mesh) {
	return (typeof p_Mesh === "string" || Array.isArray(p_Mesh)) ? p_ExtensionData.webglIF.getMeshObject(p_Mesh) : p_Mesh;
}

function createMoveMesh(p_Name, p_ExtensionData) {
	const mesh = p_ExtensionData.webglIF.createMeshGroup(p_Name);
	mesh.addChild(p_ExtensionData.webglIF.createSphere({ diameter: 0.2, rotation: { x: 90, y: 0, z: 0 }, material: "manipulator-unselected" }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: -0.2 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: -0.3 }, rotation: { x: 0, y: 0, z: 180 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: 0.2 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: 0.3 } }));
	mesh.visible = false;

	return mesh;
}

function createScaleMesh(p_Name, p_ExtensionData) {
	const mesh = p_ExtensionData.webglIF.createMeshGroup(p_Name);
	mesh.addChild(p_ExtensionData.webglIF.createSphere({ diameter: 0.2, rotation: { x: 90, y: 0, z: 0 }, material: "manipulator-unselected" }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: -0.2 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: -0.3 }, rotation: { x: 0, y: 0, z: 180 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: 0.2 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: 0.3 } }));
	mesh.visible = false;

	return mesh;
}

function createRotateMesh(p_Name, p_ExtensionData) {
	const mesh = p_ExtensionData.webglIF.createMeshGroup(p_Name);
	mesh.addChild(p_ExtensionData.webglIF.createSphere({ diameter: 0.2, rotation: { x: 90, y: 0, z: 0 }, material: "manipulator-unselected" }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: -0.2 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: -0.3 }, rotation: { x: 0, y: 0, z: 180 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameter: 0.05, height: 0.15, position: { y: 0.2 } }));
	mesh.addChild(p_ExtensionData.webglIF.createCylinder({ diameterTop: 0, diameterBottom: 0.1, height: 0.1, position: { y: 0.3 } }));
	mesh.visible = false;

	return mesh;
}

function createManipulatorTemplates(p_Extension) {
	const extensionData = p_Extension[privateData];
	extensionData.manipulators[MANIPULATOR_TYPES.MOVE_X] = extensionData.manipulators[MANIPULATOR_TYPES.MOVE_Y] = extensionData.manipulators[MANIPULATOR_TYPES.MOVE_Z] = createMoveMesh("move-manipulator", extensionData);
	extensionData.manipulators[MANIPULATOR_TYPES.SCALE_X] = extensionData.manipulators[MANIPULATOR_TYPES.SCALE_Y] = extensionData.manipulators[MANIPULATOR_TYPES.SCALE_Z] = extensionData.manipulators[MANIPULATOR_TYPES.SCALE] = createScaleMesh("scale-manipulator", extensionData);
	extensionData.manipulators[MANIPULATOR_TYPES.ROTATE_X] = extensionData.manipulators[MANIPULATOR_TYPES.ROTATE_Y] = extensionData.manipulators[MANIPULATOR_TYPES.ROTATE_Z] = createRotateMesh("rotate-manipulator", extensionData);
}

function createAndAttachManipulatorInstance(p_ManipulatorName, p_Extension, p_Mesh, p_Settings) {
	const extensionData = p_Extension[privateData];
	const name = `${p_ManipulatorName}-${p_Mesh.name}`;
	p_Mesh.getChildren((p_ChildMesh) => p_ChildMesh.name === name).forEach((p_ChildMesh) => p_Mesh.removeChild(p_ChildMesh));
	const clonedMesh = extensionData.manipulators[p_ManipulatorName].clone(name);
	extensionData.webglIF.applySettings(Object.assign({ collisions: true, visible: true }, p_Settings), clonedMesh);
	clonedMesh.manipulatorType = p_ManipulatorName;
	p_Mesh.addChild(clonedMesh);
}

function attachMoveXManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_X, p_Extension, p_Mesh, p_Settings);
}
function attachMoveYManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_Y, p_Extension, p_Mesh, p_Settings);
}
function attachMoveZManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_Z, p_Extension, p_Mesh, p_Settings);
}
function attachScaleXManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_X, p_Extension, p_Mesh, p_Settings);
}
function attachScaleYManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_Y, p_Extension, p_Mesh, p_Settings);
}
function attachScaleZManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_Z, p_Extension, p_Mesh, p_Settings);
}
function attachScaleManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE, p_Extension, p_Mesh, p_Settings);
}
function attachRotateAroundXManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_X, p_Extension, p_Mesh, p_Settings);
}
function attachRotateAroundYManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_Y, p_Extension, p_Mesh, p_Settings);
}
function attachRotateAroundZManipulator(p_Extension, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_Z, p_Extension, p_Mesh, p_Settings);
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

		extensionData.webgl.addMaterial("manipulator-unselected", { diffuse: { r: 0.6, g: 0.6, b: 1 } });
		extensionData.webgl.addMaterial("manipulator-selected", { diffuse: { r: 0, g: 0, b: 1 } });

		const getPlanePosition = () => ((extensionData.draggingManipulator && extensionData.draggingManipulator.manipulatorPlane) ? extensionData.webglIF.screenToObjectPoint(extensionData.webglIF.pointerPos, extensionData.draggingManipulator.manipulatorPlane) : null);

		extensionData.webglIF.addPointerDownListener((p_Event) => {
			let mesh = p_Event.hitMesh;
			if (mesh) {
				while (mesh && !MANIPULATOR_TYPES[mesh.manipulatorType]) {
					mesh = mesh.parent;
				}
				if (mesh) {
					extensionData.draggingManipulator = { manipulatorType: mesh.manipulatorType, activeManipulator: mesh };
					let meshManipulator = mesh;
					while (meshManipulator && !meshManipulator.manipulatedMesh) {
						meshManipulator = meshManipulator.parent;
					}
					if (meshManipulator) {
						switch (mesh.manipulatorType) {
							case MANIPULATOR_TYPES.MOVE_X:
							case MANIPULATOR_TYPES.SCALE_X:
							case MANIPULATOR_TYPES.ROTATE_Z:
								extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
									width: 10000 / extensionData.webgl.unitMultiplier,
									height: 10000 / extensionData.webgl.unitMultiplier,
									position: mesh.center,
									collisions: true,
									visible: false,
								});
								extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
								break;
							case MANIPULATOR_TYPES.SCALE:
								extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
									width: 10000 / extensionData.webgl.unitMultiplier,
									height: 10000 / extensionData.webgl.unitMultiplier,
									position: mesh.center,
									collisions: true,
									visible: false,
								});
								extensionData.draggingManipulator.manipulatorPlane.applySettings({ rotation: { x: 0, y: 45, z: 0 } });
								extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
								break;
							case MANIPULATOR_TYPES.MOVE_Y:
							case MANIPULATOR_TYPES.SCALE_Y:
								extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
									width: 10000 / extensionData.webgl.unitMultiplier,
									height: 10000 / extensionData.webgl.unitMultiplier,
									position: mesh.center,
									collisions: true,
									visible: false,
								});
								extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
								break;
							case MANIPULATOR_TYPES.ROTATE_X:
								extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
									width: 10000 / extensionData.webgl.unitMultiplier,
									height: 10000 / extensionData.webgl.unitMultiplier,
									position: mesh.center,
									collisions: true,
									visible: false,
									rotation: { x: 0, y: 90, z: 0 },
								});
								extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
								break;
							case MANIPULATOR_TYPES.MOVE_Z:
							case MANIPULATOR_TYPES.SCALE_Z:
							case MANIPULATOR_TYPES.ROTATE_Y:
								extensionData.draggingManipulator.manipulatorPlane = extensionData.webglIF.createPlane({
									width: 10000 / extensionData.webgl.unitMultiplier,
									height: 10000 / extensionData.webgl.unitMultiplier,
									position: mesh.center,
									collisions: true,
									visible: false,
									rotation: { x: 90, y: 0, z: 0 },
								});
								extensionData.draggingManipulator.manipulatorPlane.updateCoordinates();
								break;
							case MANIPULATOR_TYPES.MOVE_PLANE:
								extensionData.draggingManipulator.manipulatorPlane = mesh.manipulatorPlane;
								break;
						}

						extensionData.draggingManipulator.startPoint = getPlanePosition();
						if (extensionData.draggingManipulator.startPoint) {
							extensionData.draggingManipulator.manipulatorsMesh = meshManipulator;
							extensionData.draggingManipulator.activeManipulator.getChildren()[0].applySettings({ material: "manipulator-selected" });
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
			}
		});

		extensionData.webglIF.addPointerUpListener(() => {
			if (extensionData.draggingManipulator) {
				if (extensionData.draggingManipulator.manipulatorType !== MANIPULATOR_TYPES.MOVE_PLANE) {
					extensionData.draggingManipulator.manipulatorPlane.remove();
				}
				extensionData.draggingManipulator.activeManipulator.getChildren()[0].applySettings({ material: "manipulator-unselected" });
				extensionData.draggingManipulator = null;
			}
			extensionData.webglIF.attachCameraControl();
		});

		extensionData.webglIF.addPointerMoveListener(() => {
			if (extensionData.draggingManipulator && extensionData.draggingManipulator.startPoint) {
				const currentPoint = getPlanePosition();
				if (currentPoint) {
					const targetObjectCenter = extensionData.draggingManipulator.manipulatorsMesh.manipulatedMesh.center;
					const diff = { x: Math.round((currentPoint.x - extensionData.draggingManipulator.startPoint.x) * 1000) / 1000, y: Math.round((currentPoint.y - extensionData.draggingManipulator.startPoint.y) * 1000) / 1000, z: Math.round((currentPoint.z - extensionData.draggingManipulator.startPoint.z) * 1000) / 1000 };
					switch (extensionData.draggingManipulator.manipulatorType) {
						case MANIPULATOR_TYPES.MOVE_X:
							diff.y = 0;
							diff.z = 0;
							extensionData.draggingManipulator.manipulatorsMesh.offset(diff);
							extensionData.draggingManipulator.manipulatorsMesh.manipulatedMesh.offset(diff);
							extensionData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_Y:
							diff.x = 0;
							diff.z = 0;
							extensionData.draggingManipulator.manipulatorsMesh.offset(diff);
							extensionData.draggingManipulator.manipulatorsMesh.manipulatedMesh.offset(diff);
							extensionData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_Z:
							diff.x = 0;
							diff.y = 0;
							extensionData.draggingManipulator.manipulatorsMesh.offset(diff);
							extensionData.draggingManipulator.manipulatorsMesh.manipulatedMesh.offset(diff);
							extensionData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_PLANE:
							extensionData.draggingManipulator.manipulatorsMesh.offset(diff);
							extensionData.draggingManipulator.manipulatorsMesh.manipulatedMesh.offset(diff);
							extensionData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.SCALE: {
							const oldRelativePoint = { x: extensionData.draggingManipulator.startPoint.x - targetObjectCenter.x, y: extensionData.draggingManipulator.startPoint.y - targetObjectCenter.y, z: extensionData.draggingManipulator.startPoint.z - targetObjectCenter.z };
							const oldDistance = Math.sqrt((oldRelativePoint.x * oldRelativePoint.x) + (oldRelativePoint.y * oldRelativePoint.y) + (oldRelativePoint.z * oldRelativePoint.z));
							const newRelativePoint = { x: currentPoint.x - targetObjectCenter.x, y: currentPoint.y - targetObjectCenter.y, z: currentPoint.z - targetObjectCenter.z };
							const newDistance = Math.sqrt((newRelativePoint.x * newRelativePoint.x) + (newRelativePoint.y * newRelativePoint.y) + (newRelativePoint.z * newRelativePoint.z));
							extensionData.draggingManipulator.manipulatorsMesh.scale(newDistance / oldDistance);
							extensionData.draggingManipulator.manipulatorsMesh.manipulatedMesh.scale(newDistance / oldDistance);
						}
							break;
						case MANIPULATOR_TYPES.SCALE_X:
							break;
						case MANIPULATOR_TYPES.SCALE_Y:
							break;
						case MANIPULATOR_TYPES.SCALE_Z:
							break;
						case MANIPULATOR_TYPES.ROTATE_X:
							break;
						case MANIPULATOR_TYPES.ROTATE_Y:
							break;
						case MANIPULATOR_TYPES.ROTATE_Z:
							break;
					}
				}
			}
		});
		createManipulatorTemplates(this);
	}

	setAllowedManipulators(p_Mesh, p_Settings) {
		const extensionData = this[privateData];
		const mesh = getMeshObject(extensionData, p_Mesh);
		mesh[manipulation] = mesh[manipulation] || {};
		Object.keys(p_Settings).forEach((p_Key) => {
			if (MANIPULATOR_TYPES[p_Key]) {
				mesh[manipulation][p_Key] = p_Settings[p_Key];
			}
		});
	}

	removeManipulators(p_Mesh) {
		const extensionData = this[privateData];
		const mesh = getMeshObject(extensionData, p_Mesh);
		const manipulatorName = `manipulator-for-${mesh.name}`;
		if (extensionData.activeManipulationObjects[manipulatorName]) {
			extensionData.activeManipulationObjects[manipulatorName].remove();
			delete extensionData.activeManipulationObjects[manipulatorName];
		}
	}

	attachManipulators(p_Mesh) {
		const extensionData = this[privateData];
		const mesh = getMeshObject(extensionData, p_Mesh);
		if (mesh) {
			const allowed = mesh[manipulation];
			if (allowed && Object.keys(allowed).find((p_Key) => MANIPULATOR_TYPES[p_Key] && allowed[p_Key])) {
				const max = mesh.maximum;
				const min = mesh.minimum;
				const manipulatorMesh = extensionData.webglIF.createMeshGroup(`manipulator-for-${mesh.name}`);
				extensionData.activeManipulationObjects[manipulatorMesh.name] = manipulatorMesh;
				manipulatorMesh.manipulatedMesh = mesh;
				if (allowed[MANIPULATOR_TYPES.MOVE_X]) {
					attachMoveXManipulator(this, manipulatorMesh, { position: { x: max.x + 0.4, y: min.y - 0.1, z: min.z - 0.1 }, rotation: { x: 0, y: 0, z: 90 } });
				}
				if (allowed[MANIPULATOR_TYPES.MOVE_Y]) {
					attachMoveYManipulator(this, manipulatorMesh, { position: { x: min.x - 0.1, y: max.y + 0.4, z: min.z - 0.1 }, rotation: { x: 0, y: 0, z: 0 } });
				}
				if (allowed[MANIPULATOR_TYPES.MOVE_Z]) {
					attachMoveZManipulator(this, manipulatorMesh, { position: { x: min.x - 0.1, y: min.y + 0.1, z: min.z - 0.4 }, rotation: { x: 90, y: 0, z: 0 } });
				}
				if (allowed[MANIPULATOR_TYPES.SCALE]) {
					attachScaleManipulator(this, manipulatorMesh, { position: { x: max.x + 0.4, y: max.y + 0.4, z: min.z - 0.4 }, rotation: { x: -45, y: -45, z: 0 } });
				} else {
					if (allowed[MANIPULATOR_TYPES.SCALE_X]) {
						attachScaleXManipulator(this, manipulatorMesh, { position: { x: max.x + 0.4, y: min.y - 0.1, z: min.z - 0.1 }, rotation: { x: 0, y: 0, z: 90 } });
					}
					if (allowed[MANIPULATOR_TYPES.SCALE_Y]) {
						attachScaleYManipulator(this, manipulatorMesh, { position: { x: min.x - 0.1, y: max.y + 0.4, z: min.z - 0.1 }, rotation: { x: 0, y: 0, z: 0 } });
					}
					if (allowed[MANIPULATOR_TYPES.SCALE_Z]) {
						attachScaleZManipulator(this, manipulatorMesh, { position: { x: min.x - 0.1, y: min.y + 0.1, z: min.z - 0.4 }, rotation: { x: 90, y: 0, z: 0 } });
					}
				}
				if (allowed[MANIPULATOR_TYPES.ROTATE_X]) {
					attachRotateAroundXManipulator(this, manipulatorMesh, { position: { x: min.x - 0.1, y: min.y + 0.1, z: min.z - 0.4 }, rotation: { x: 90, y: 0, z: 0 } });
				}
				if (allowed[MANIPULATOR_TYPES.ROTATE_Y]) {
					attachRotateAroundYManipulator(this, manipulatorMesh, { position: { x: min.x - 0.1, y: min.y + 0.1, z: min.z - 0.4 }, rotation: { x: 90, y: 0, z: 0 } });
				}
				if (allowed[MANIPULATOR_TYPES.ROTATE_Z]) {
					attachRotateAroundZManipulator(this, manipulatorMesh, { position: { x: max.x + 0.4, y: min.y - 0.1, z: min.z - 0.1 }, rotation: { x: 0, y: 0, z: 90 } });
				}
			}
		}
	}
}
