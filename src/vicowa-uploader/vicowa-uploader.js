import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';

class VicowaUploader extends WebComponentBaseClass {
	constructor() {
		super();
	}

	static get properties() {
		return {
			multiple: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: (control) => control.#multipleChanged(),
			},
			dropArea: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			accept: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#acceptChanged(),
			},
			manualUpload: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			target: {
				type: String,
				value: '',
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
		this.addAutoEventListener(this.$.file, 'change', () => {
			this.#handleFiles(Array.from(this.$.file.files));
		});

		const handleOver = (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.$.container.classList.add('drop-focus');
		};
		const handleOut = (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.$.container.classList.remove('drop-focus');
		};

		this.addAutoEventListener(this.$.container, 'dragover', handleOver);
		this.addAutoEventListener(this.$.container, 'dragenter', handleOver);
		this.addAutoEventListener(this.$.container, 'dragleave', handleOut);
		this.addAutoEventListener(this.$.container, 'dragend', handleOut);

		this.addAutoEventListener(this.$.container, 'drop', (event) => {
			handleOut(event);
			this.#handleFiles(Array.from(event.dataTransfer.files));
		});

		this.addAutoEventListener(this.$.upload, 'click', () => { this.#uploadFiles(this.files); });
		this.addAutoEventListener(this.$.more, 'click', () => { this.$.container.classList.remove('success'); });
		this.addAutoEventListener(this.$.retry, 'click', () => { this.$.container.classList.remove('error'); this.#uploadFiles(this.files); });
	}

	#multipleChanged() {
		if (this.multiple) {
			this.$.file.setAttribute('multiple', '');
		} else {
			this.$.file.removeAttribute('multiple');
		}
	}

	#acceptChanged() {
		if (this.accept) {
			this.$.file.setAttribute('accept', this.accept);
		} else {
			this.$.file.removeAttribute('accept');
		}
	}

	#previewFile(file) {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = () => {
			const img = document.createElement('img');
			img.src = reader.result;
			img.setAttribute('name', file.name);
			this.$.todo.appendChild(img);
		};
	}

	#handleDone(file) {
		const preview = this.$.todo.querySelector(`[name=${file.name}]`);
		this.$.done.appendChild(preview);
	}

	async #uploadFiles(files) {
		this.$.container.classList.add('upload-active');
		if (this.imagePreview) {
			files.forEach((file) => { this.#previewFile(file); });
		}
		const successFullFiles = [];
		try {
			this.$.progress.max = files.length;
			this.$.progress.value = 0;
			await Promise.all(files.map((file, fileIndex) => {
				const formData = new FormData();
				formData.append('file', file);
				return new Promise((resolve, reject) => {
					if (this.uploadHandler) {
						this.uploadHandler(file, (response) => {
							if (this.imagePreview) {
								this.#handleDone(file);
							}
							this.$.progress.value++;
							successFullFiles.push(file);
							resolve(response);
						}, (reason) => {
							reject(reason);
						}, files.length, fileIndex);
					} else {
						fetch(this.target, { method: 'POST', body: formData }).then((response) => {
							if (!response.ok) {
								throw response;
							}
							if (this.imagePreview) {
								this.#handleDone(file);
							}
							this.$.progress.value++;
							successFullFiles.push(file);
							resolve(response);
						}).catch(reject);
					}
				});
			}));
			this.$.container.classList.remove('has-files');
			this.$.container.classList.remove('upload-active');
			this.$.container.classList.add('success');
			if (this.onSuccess) {
				this.onSuccess(successFullFiles.map((file) => file.name));
			}
		} catch (error) {
			successFullFiles.forEach((file) => {
				const foundIndex = files.indexOf(file);
				if (foundIndex !== -1) {
					files.splice(foundIndex, 1);
				}
			});

			this.$.container.classList.remove('has-files');
			this.$.container.classList.remove('upload-active');
			this.$.container.classList.add('error');
			if (this.onError) {
				this.onError(error, successFullFiles.map((file) => file.name));
			}
		}
	}

	#handleFiles(files) {
		if (files.length) {
			this.$.container.classList.add('has-files');
			this.files = files;

			if (this.manualUpload) {
				if (files.length === 1) {
					this.$.uploadText.string = 'Upload %1s';
					this.$.uploadText.parameters = [files[0].name];
				} else {
					this.$.uploadText.string = 'Upload %1d files';
					this.$.uploadText.parameters = [files.length];
				}
			} else {
				this.#uploadFiles(files);
			}
		}
	}

	static get template() {
		return `
			<style>
				:host {
					display: block;
					position: relative;
				}
		
				#container {
					overflow: hidden;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
				}
		
				#container,
				.styled-area {
					width: 100%;
					height: 100%;
					position: relative;
					box-sizing: border-box;
				}
		
				#file {
					opacity: 0;
					position: absolute;
					pointer-events: none;
					width: 1px;
					height: 1px;
				}
		
				#file:focus + .choose {
		
				}
		
				label {
					height: 100%;
					width: 100%;
				}
		
				.choose {
					cursor: pointer;
					font-weight: bold;
				}
		
				.uploading,
				.success,
				.error {
					display: none;
					padding: 10px;
				}
		
				slot[name="drop-area"] {
				}
		
				.drop-text {
					display: none;
				}
		
				.styled-area vicowa-icon {
					display: none;
					width: 30%;
					height: 30%;
					max-height: 48px;
				}
		
				:host([drop-area]) .drop-text {
					display: inline;
				}
				:host([drop-area]) vicowa-icon {
					display: block;
				}
		
				#upload {
					display: none;
				}
		
				.has-files label,
				.error label,
				.success label {
					display: none;
				}
		
				:host([manual-upload]) .has-files #upload {
					display: block;
				}
		
				#upload {
					margin: 1em;
					white-space: nowrap;
					width: calc(100% - 2em);
				}
		
				#upload vicowa-string {
					overflow: hidden;
					text-overflow: ellipsis;
				}
		
				#upload vicowa-icon {
					width: 30px;
					height: 30px;
					margin-right: 1em;
				}
		
				.styled-area {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					height: 100%;
					color: var(--vicowa-uploader-color, #aaf);
					--vicowa-icon-line-color: var(--vicowa-uploader-color, #aaf);
					padding: 10px;
				}
		
				:host([drop-area]) .styled-area {
					outline: var(--vicowa-uploader-drop-outline, 2px dashed #aaf);
					outline-offset: -10px;
				}
				:host([drop-area]) .drop-focus .styled-area {
					outline-offset: -5px;
				}
		
				.gallery img {
					max-width: 50%;
					max-height: 50%;
				}
		
				.upload-active .uploading {
					display: block;
				}
		
				#container.error .error {
					display: block;
				}
		
				#container.success .success {
					display: block;
				}
		
				progress {
					display: none;
				}
		
				:host([progress]) progress {
					display: block;
				}
			</style>
		<vicowa-web-components-icons></vicowa-web-components-icons>
		<div id="container">
			<input type="file" id="file">
			<label for="file">
				<slot name="drop-area">
					<div class="styled-area">
						<vicowa-icon icon="vicowa:drop"></vicowa-icon>
						<vicowa-string class="choose">Select a file...</vicowa-string><vicowa-string class="drop-text"> or drop files here</vicowa-string>
					</div>
				</slot>
			</label>
			<vicowa-button id="upload"><vicowa-icon icon="vicowa:upload" slot="custom-content"></vicowa-icon><vicowa-string id="upload-text" slot="custom-content">Upload</vicowa-string><slot name="upload-button"></slot></vicowa-button>
			<div class="gallery"><div id="done"></div><div id="todo"></div></div>
				<div class="uploading">
					<vicowa-string>Uploading...</vicowa-string>
					<progress id="progress"></progress>
				</div>
				<div class="success"><vicowa-string>Upload successful</vicowa-string><vicowa-string id="more" class="choose">Upload more</vicowa-string></div>
				<div class="error"><vicowa-string>Upload failed</vicowa-string><vicowa-string id="retry" class="choose">Retry</vicowa-string></div>
			</div>
		`;
	}
}

window.customElements.define('vicowa-uploader', VicowaUploader);
