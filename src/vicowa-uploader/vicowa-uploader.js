import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

function multipleChanged(p_Control) {
	if (p_Control.multiple) {
		p_Control.$.file.setAttribute("multiple", "");
	} else {
		p_Control.$.file.removeAttribute("multiple");
	}
}

function acceptChanged(p_Control) {
	if (p_Control.accept) {
		p_Control.$.file.setAttribute("accept", p_Control.accept);
	} else {
		p_Control.$.file.removeAttribute("accept");
	}
}

function previewFile(p_Control, p_File) {
	const reader = new FileReader();
	reader.readAsDataURL(p_File);
	reader.onloadend = () => {
		const img = document.createElement("img");
		img.src = reader.result;
		img.setAttribute("name", p_File.name);
		p_Control.$.todo.appendChild(img);
	};
}

function handleDone(p_Control, p_File) {
	const preview = p_Control.$.todo.querySelector(`[name=${p_File.name}]`);
	p_Control.$.done.appendChild(preview);
}

async function uploadFiles(p_Control, p_Files) {
	p_Control.$.container.classList.add("upload-active");
	if (p_Control.imagePreview) {
		p_Files.forEach((p_File) => { previewFile(p_Control, p_File); });
	}
	const successFullFiles = [];
	try {
		p_Control.$.progress.max = p_Files.length;
		p_Control.$.progress.value = 0;
		await Promise.all(p_Files.map((p_File, p_FileIndex) => {
			const formData = new FormData();
			formData.append("file", p_File);
			return new Promise((resolve, reject) => {
				if (p_Control.uploadHandler) {
					p_Control.uploadHandler(p_File, (p_Response) => {
						if (p_Control.imagePreview) {
							handleDone(p_Control, p_File);
						}
						p_Control.$.progress.value++;
						successFullFiles.push(p_File);
						resolve(p_Response);
					}, (p_Reason) => {
						reject(p_Reason);
					}, p_Files.length, p_FileIndex);
				} else {
					fetch(p_Control.target, { method: "POST", body: formData }).then((response) => {
						if (!response.ok) {
							throw response;
						}
						if (p_Control.imagePreview) {
							handleDone(p_Control, p_File);
						}
						p_Control.$.progress.value++;
						successFullFiles.push(p_File);
						resolve(response);
					}).catch(reject);
				}
			});
		}));
		p_Control.$.container.classList.remove("has-files");
		p_Control.$.container.classList.remove("upload-active");
		p_Control.$.container.classList.add("success");
	} catch (p_Error) {
		successFullFiles.forEach((p_File) => {
			const foundIndex = p_Files.indexOf(p_File);
			if (foundIndex !== -1) {
				p_Files.splice(foundIndex, 1);
			}
		});

		p_Control.$.container.classList.remove("has-files");
		p_Control.$.container.classList.remove("upload-active");
		p_Control.$.container.classList.add("error");
	}
}

function handleFiles(p_Control, p_Files) {
	if (p_Files.length) {
		p_Control.$.container.classList.add("has-files");
		p_Control.files = p_Files;

		if (p_Control.manualUpload) {
			if (p_Files.length === 1) {
				p_Control.$.uploadText.string = "Upload %1s";
				p_Control.$.uploadText.parameters = [p_Files[0].name];
			} else {
				p_Control.$.uploadText.string = "Upload %1d files";
				p_Control.$.uploadText.parameters = [p_Files.length];
			}
		} else {
			uploadFiles(p_Control, p_Files);
		}
	}
}

const componentName = "vicowa-uploader";

class VicowaUploader extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			multiple: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: multipleChanged,
			},
			dropArea: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			accept: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: acceptChanged,
			},
			manualUpload: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			target: {
				type: String,
				value: "",
				reflectToAttribute: true,
			},
			imagePreview: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			progress: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
		};
	}

	attached() {
		this.addAutoEventListener(this.$.file, "change", () => {
			handleFiles(this, Array.from(this.$.file.files));
		});

		const handleOver = (p_Event) => {
			p_Event.preventDefault();
			p_Event.stopPropagation();
			this.$.container.classList.add("drop-focus");
		};
		const handleOut = (p_Event) => {
			p_Event.preventDefault();
			p_Event.stopPropagation();
			this.$.container.classList.remove("drop-focus");
		};

		this.addAutoEventListener(this.$.container, "dragover", handleOver);
		this.addAutoEventListener(this.$.container, "dragenter", handleOver);
		this.addAutoEventListener(this.$.container, "dragleave", handleOut);
		this.addAutoEventListener(this.$.container, "dragend", handleOut);

		this.addAutoEventListener(this.$.container, "drop", (p_Event) => {
			handleOut(p_Event);
			handleFiles(this, Array.from(p_Event.dataTransfer.files));
		});

		this.addAutoEventListener(this.$.upload, "click", () => { uploadFiles(this, this.files); });
		this.addAutoEventListener(this.$.more, "click", () => { this.$.container.classList.remove("success"); });
		this.addAutoEventListener(this.$.retry, "click", () => { this.$.container.classList.remove("error"); uploadFiles(this, this.files); });
	}
}

window.customElements.define(componentName, VicowaUploader);
