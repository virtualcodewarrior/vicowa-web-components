import exports from '../utilities/amdToModule.js';
import '../third_party/jed/jed.js';
import debug from '../utilities/debug.js';
import observerFactory from './observerFactory.js';

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
	domain: 'strings',
	missing_key_callback: noTranslationMessage, // This callback is called when a translation cannot be found
	_is_default_content: true,
};

const notifiers = observerFactory();
const locations = [];
let jed = new exports.Jed(defaultTranslationInfo);
let language = '';
let translator = {};
const translationInfo = {
	locale_data: {
		strings: {
			'': {
				domain: 'strings',
				lang: 'en',
				plural_forms: 'nplurals=2; plural=(n != 1);',
				translations: [],
			},
		},
	},
	domain: 'strings',
	missing_key_callback: noTranslationMessage, // This callback is called when a translation cannot be found
	_is_default_content: true,
};

function loadTranslationFiles(p_Language) {
	locations.forEach((p_Location) => {
		p_Location.loaded = false;
		fetch(`${p_Location.url}/${p_Language}.json`).then((p_Response) => p_Response.json()).then((p_Translations) => {
			Object.keys(p_Translations.locale_data.strings).forEach((p_Key) => {
				if (p_Translations.locale_data.strings[p_Key].translations) {
					translationInfo.locale_data.strings[p_Key] = p_Translations.locale_data.strings[p_Key].translations;
				}
			});
			p_Location.loaded = true;

			if (locations.every((p_TestLocation) => p_TestLocation.loaded)) {
				jed = new exports.Jed(translationInfo);
				notifiers.notify('loaded', translator);
			}
		}).catch((p_Err) => {
			// failed to load ??
			debug.log(p_Err);
		});
	});
}

translator = {
	/**
	 * Get the translation handler for the specified string. This will return an object that can be used to further specify details about the translation that needs to be retrieved or to pass parameters for a printf like substitution
	 * usage:
	 * if there is a plural form of the string use:
	 * translate('string to translate %1s %2s').ifPlural(number).fetch(arguments|[argument1, argument2,...]);
	 * if there is only a singular form use:
	 * translate('string to translate %1s %2s').fetch(arguments|[argument1, argument2,...]);
	 * @param {string} p_String String we want to translate
	 * @returns {{ifPlural: ifPlural, fetch: fetch}} Object that allows you to specify further details about the kind of translation to get
	 */
	translate(p_String) {
		return p_String ? jed.translate(p_String) : p_String;
	},
	set language(p_Language) {
		if (language !== p_Language) {
			loadTranslationFiles(p_Language);
			language = p_Language;
		}
	},

	get language() { return language; },
	/**
	 * Add a location from where translations will be loaded
	 * @param {string} p_Location URL of the directory from where translation files can be loaded. This will be combined with a language code when loading translation files
	 */
	addTranslationLocation(p_Location) {
		if (locations.findIndex((p_LocationInfo) => p_LocationInfo.url === p_Location) === -1) {
			locations.push({ url: p_Location, loaded: false });
		}
	},
	/**
	 * Add a handler function that will be called when new translations are available
	 * @param {function} p_Handler Handler function that will be called when (new) translations are available
	 * @param {object} p_Owner Object that owns the handler, this can be used with removeTranslationUpdatedObserverOwner to remove all registered handlers for this owner
	 */
	addTranslationUpdatedObserver(p_Handler, p_Owner) {
		notifiers.addObserver('loaded', p_Handler, p_Owner);
		p_Handler(this);
	},
	/**
	 * remove the specified handler
	 * @param {function} p_Handler Remove the given handler function
	 */
	removeTranslationUpdatedObserver(p_Handler) {
		notifiers.removeObserver('loaded', p_Handler);
	},
	/**
	 * Remove all handlers for the given owner
	 * @param {object} p_Owner The owner for which we are removing the handler functions
	 */
	removeTranslationUpdatedObserverOwner(p_Owner) {
		notifiers.removeOwner(p_Owner);
	},
};

export default translator;
