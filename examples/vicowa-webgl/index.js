import { createQuickAccess } from "../../src/third_party/web-component-base-class/src/tools.js";
import { CAMERA_TYPES } from "../../src/vicowa-webgl/vicowa-webgl-definitions.js";
import VicowaWebGLManipulationExtension from "../../src/vicowa-webgl/manipulation-extension.js";

const controls = createQuickAccess(document, "id");

function setupCamera(p_Type) {
	switch (p_Type) {
		case "orbital": controls.gl1.setCamera(CAMERA_TYPES.ORBITAL, { minLatitude: 10, maxLatitude: 85, position: { longitude: -90, latitude: 65 }, minDistance: 3, maxDistance: 30 }); break;
		case "first-person": controls.gl1.setCamera(CAMERA_TYPES.FREE, { position: { x: 0, y: 1.8, z: -10.0 }, target: { x: 0, y: 0, z: 0 } }); break;
		case "vr": controls.gl1.setCamera(CAMERA_TYPES.FREE, { position: { x: 0, y: 1.8, z: -10.0 }, target: { x: 0, y: 0, z: 0 }, vrEnabled: true, mobile: true }); break;
	}
	controls.gl1.setVirtualBody({ bodySize: { x: 0.3, y: 0.9, z: 0.2 }, eyeOffset: { y: 0.16 } });
	controls.gl1.cameraCollisions = true;
	controls.gl1.cameraGravity = true;
}
controls.orbital.addEventListener("click", () => { setupCamera("orbital"); });
controls.firstPerson.addEventListener("click", () => { setupCamera("first-person"); });
controls.vr.addEventListener("click", () => { setupCamera("vr"); });

controls.gl1.onAttached = () => {
	const webglManipulationExtension = new VicowaWebGLManipulationExtension();
	controls.gl1.addExtension(webglManipulationExtension);
	controls.gl1.createSkyBox("../resources/3d/skybox/skybox");
	controls.gl1.addEnviromentalLight("env", { x: 0, y: 1, z: 0 });
	controls.gl1.setLightColors("env", { diffuse: { r: 0.1, g: 0.15, b: 0.1 }, specular: { r: 0, g: 0, b: 0 } });
	controls.gl1.setGroundLightColor("env", { r: 0.9, g: 1, b: 0.9 });
	controls.gl1.addDirectionalLight("sunLight", { x: 4, y: -10, z: 10, generateShadows: true });
	controls.gl1.setLightColors("subLight", { diffuse: { r: 1, g: 1, b: 0.9 }, specular: { r: 1, g: 1, b: 0.9 } });
	// controls.gl1.addPlane("ground", { width: 100.0, height: 100.0, rotation: { x: 90, y: 0, z: 0 }, material: { name: "ground", diffuse: { r: 0, g: 0.3, b: 0 }, specular: { r: 0, g: 0.01, b: 0 } } });

	setupCamera("orbital");
	controls.gl1.startRendering();

	controls.gl1.onObjectClicked = (p_Info) => {
		if (controls.gl1.isObjectSelected(p_Info.path)) {
			controls.gl1.unselectObject(p_Info.path);
			webglManipulationExtension.removeManipulators(p_Info.path);
		} else {
			controls.gl1.selectObject(p_Info.path);
			webglManipulationExtension.attachManipulators(p_Info.path);
		}
	};

	let objectID = 0;

	controls.add.addEventListener("click", () => {
		objectID++;
		const allowAllManipulators = webglManipulationExtension.constructor.getAllManipulatorsAllowed();

		switch (controls.object.value) {
			case "sphere": controls.gl1.addSphere({ diameter: 1, position: { y: 1 } }, `sphere${objectID}`); webglManipulationExtension.setAllowedManipulators(`sphere${objectID}`, allowAllManipulators); break;
			case "box": controls.gl1.addBox({ width: 1, height: 2, depth: 3 }, `box${objectID}`); webglManipulationExtension.setAllowedManipulators(`box${objectID}`, allowAllManipulators); break;
			case "plane": controls.gl1.addPlane({ width: 1, height: 2 }, `plane${objectID}`); webglManipulationExtension.setAllowedManipulators(`plane${objectID}`, allowAllManipulators); break;
			case "extrudedPolygon": controls.gl1.addExtrudedPolygon({
				outline: [[-5, 0, 0], [-0.4, 0, 0], [-0.4, 0, 2], [0.4, 0, 2], [0.4, 0, 0], [5, 0, 0], [5, 0, 6], [-5, 0, 6]],
				holes: [
					[[1, 0, 0.5], [4, 0, 0.5], [4, 0, 2], [1, 0, 2]],
					[[-1, 0, 0.5], [-1, 0, 2], [-4, 0, 2], [-4, 0, 0.5]],
					[[1, 0, 3.5], [2, 0, 3.5], [2, 0, 5], [1, 0, 5]],
					[[3, 0, 3.5], [4, 0, 3.5], [4, 0, 5], [3, 0, 5]],
					[[-1, 0, 3.5], [-1, 0, 5], [-2, 0, 5], [-2, 0, 3.5]],
					[[-3, 0, 3.5], [-3, 0, 5], [-4, 0, 5], [-4, 0, 3.5]],
				],
				depth: 0.1,
				// rotation: { x: -90, y: 0, z: 0 },
				material: { name: "brick", specular: { r: 0, g: 0, b: 0 }, texture: { src: "../resources/3d/textures/BrickSmallNew.jpg", xScale: 8, yScale: 5.1 } },
			}, `extrudedPolygon${objectID}`); webglManipulationExtension.setAllowedManipulators(`extrudedPolygon${objectID}`, allowAllManipulators); break;
		}
	});

	controls.delete.addEventListener("click", () => {
		controls.gl1.getSelectedObjects().forEach((p_Name) => {
			controls.gl1.removeObject(p_Name);
		});
	});
};

