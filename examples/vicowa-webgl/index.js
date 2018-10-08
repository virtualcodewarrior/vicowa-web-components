import { createQuickAccess } from "../../src/third_party/web-component-base-class/src/tools.js";

const controls = createQuickAccess(document, "id");

const meshResources = [
	{ name: "birchTree", path: "../resources/3d/babylon/birch_tree.babylon", meshGroup: [], addControl: "tree", removeControl: "del_tree" },
	{ name: "house1", path: "../resources/3d/babylon/3D_house10.babylon", meshGroup: [], addControl: "house1", removeControl: "del_house1" },
	{ name: "house2", path: "../resources/3d/obj/house_10.obj", meshGroup: [], addControl: "house2", removeControl: "del_house2" },
	{ name: "house3", path: "../resources/3d/obj/Bambo_House.obj", meshGroup: [], addControl: "house3", removeControl: "del_house3" },
	{ name: "house4", path: "../resources/3d/obj/house_10.obj", meshGroup: [], addControl: "house4", removeControl: "del_house4" },
];

meshResources.forEach((p_Resource) => {
	controls[p_Resource.addControl].addEventListener("click", async() => {
		try {
			p_Resource.meshGroup = await controls.gl1.addObjectResource(p_Resource.name, "", p_Resource.path);
			controls[p_Resource.removeControl].disabled = false;
			controls[p_Resource.addControl].disabled = true;
		} catch (p_Error) {
			console.log(p_Error);
		}
	});
	controls[p_Resource.removeControl].addEventListener("click", () => {
		p_Resource.meshGroup.forEach((p_Mesh) => { p_Mesh.dispose(); });
		controls[p_Resource.removeControl].disabled = true;
		controls[p_Resource.addControl].disabled = false;
	});
});

