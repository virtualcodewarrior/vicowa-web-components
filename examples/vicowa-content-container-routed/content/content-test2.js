import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";

// note that this is in a separate javascript file only because the polyfill doesn't support inline module scripts, so you could move it into the html if you no longer use the polyfill
const webComponentName = "content-test2";
window.customElements.define(webComponentName, class extends WebComponentBaseClass {
	static get is() { return webComponentName; }
	constructor() { super(); }
	static get template() {
		return `
			<template id="content-test2">
				<style>
					:host {
						display: block;
						padding: 10px;
					}
			
					p {
						font-style: italic;
					}
			
					.text-content {
						padding: 1em;
						background: red;
					}
				</style>
				<h2>Test content 2</h2>
				<div class="text-content">
					<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias asperiores aspernatur commodi delectus
					doloremque ducimus earum, enim eos expedita fuga inventore iure laudantium odit quia quod temporibus ut
					voluptatem, voluptatum.</p>
					<p>Accusamus aspernatur beatae cumque, deserunt doloremque doloribus error explicabo fugiat hic impedit
					laborum magnam minus molestiae nobis nostrum obcaecati quia rem rerum sed sequi similique sint soluta
					velit, voluptas voluptates.</p>
					<p>Architecto assumenda, consectetur error expedita libero, minus natus nulla, odio perspiciatis placeat
					possimus tempora? Culpa dolor eligendi harum iusto labore magnam maiores placeat possimus, quas quo,
						quos, sapiente tempore ullam.</p>
					<p>Accusamus aliquam, cupiditate, deserunt dignissimos dolorum error inventore, labore minima nostrum nulla
					numquam odio quod similique unde voluptatibus. At delectus dolorum harum nihil nulla optio, sunt.
						Dolores ea obcaecati sunt!</p>
			
					<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias asperiores aspernatur commodi delectus
					doloremque ducimus earum, enim eos expedita fuga inventore iure laudantium odit quia quod temporibus ut
					voluptatem, voluptatum.</p>
					<p>Accusamus aspernatur beatae cumque, deserunt doloremque doloribus error explicabo fugiat hic impedit
					laborum magnam minus molestiae nobis nostrum obcaecati quia rem rerum sed sequi similique sint soluta
					velit, voluptas voluptates.</p>
					<p>Architecto assumenda, consectetur error expedita libero, minus natus nulla, odio perspiciatis placeat
					possimus tempora? Culpa dolor eligendi harum iusto labore magnam maiores placeat possimus, quas quo,
						quos, sapiente tempore ullam.</p>
					<p>Accusamus aliquam, cupiditate, deserunt dignissimos dolorum error inventore, labore minima nostrum nulla
					numquam odio quod similique unde voluptatibus. At delectus dolorum harum nihil nulla optio, sunt.
						Dolores ea obcaecati sunt!</p>
				</div>
			</template>
		`;
	}
});
