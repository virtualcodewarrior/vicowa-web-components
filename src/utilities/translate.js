import '../third_party/jed/jed.js';
import debug from '../utilities/debug.js';
import notifierFactory from '../utilities/notifierFactory.js';

function noTranslationMessage(p_Original) {
	debug.log(`no translation found for string ${p_Original}`);
}

const defaultTranslationInfo = {
	locale_data: {
		strings: {
			'': {
				domain: 'strings',
				lang: 'en',
				plural_forms: 'nplurals=2; plural=(n != 1);',
			},
		},
	},
	domain: 'messages',
	missing_key_callback: noTranslationMessage, // This callback is called when a translation cannot be found
	_is_default_content: true,
};

const notifiers = notifierFactory();
const locations = [];
const jed = new Jed(defaultTranslationInfo);
let language = 'en_US';
let loaded = false;
const translationInfo = {
	locale_data: {
		strings: {
			'': {
				domain: 'strings',
				lang: 'en',
				plural_forms: 'nplurals=2; plural=(n != 1);',
			},
		},
	},
	domain: 'messages',
	missing_key_callback: noTranslationMessage, // This callback is called when a translation cannot be found
	_is_default_content: true,
};

function loadTranslationFiles(p_Language) {
	locations.forEach((p_Location) => {
		fetch(`${p_Location}/${p_Language}.js`).then((p_Response) => p_Response.json()).then((p_Translations) => {
			Object.keys(p_Translations.locale_data.messages).forEach((p_Key) => {
				if (p_Translations.locale_data.messages[p_Key].translations) {
					translationInfo.locale_data.messages[p_Key] = p_Translations.locale_data.messages[p_Key].translations;
				}
			});
		});
	});
}

const translator = {
	constructor(p_Language) {
		if (p_Language) {
			this.constructor.setLanguage(p_Language);
		}
	},
	translate(p_String) {
		return jed.translate(p_String);
	},
	setLanguage(p_Language) {
		if (language !== p_Language) {
			loadTranslationFiles(p_Language);
			language = p_Language;
		}
	},
	addTranslationLocation(p_Location) {
		if (locations.indexOf(p_Location) === -1) {
			locations.push(p_Location);
		}
	},
	addTranslationAvailableHandler(p_Handler) {
		notifiers.addNotifier('loaded', p_Handler);
		// call immediately if already loaded
		if (loaded) {
			p_Handler(this);
		}
	}
};

export default translator;