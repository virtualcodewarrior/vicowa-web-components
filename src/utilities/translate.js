import exports from "../utilities/amdToModule.js";
import "../third_party/jed/jed.js";
import debug from "../utilities/debug.js";
import observerFactory from "./observerFactory.js";

function noTranslationMessage(p_Original) {
	debug.log(`no translation found for string ${p_Original}`);
}

const defaultTranslationInfo = {
	locale_data: {
		strings: {
			"": {
				domain: "strings",
				lang: "en",
				plural_forms: "nplurals=2; plural=(n != 1);",
			},
		},
	},
	domain: "strings",
	missing_key_callback: noTranslationMessage, // This callback is called when a translation cannot be found
	_is_default_content: true,
};

const notifiers = observerFactory();
const locations = [];
let jed = new exports.Jed(defaultTranslationInfo);
let language = "";
let translator = {};
const translationInfo = {
	locale_data: {
		strings: {
			"": {
				domain: "strings",
				lang: "en",
				plural_forms: "nplurals=2; plural=(n != 1);",
				translations: [],
			},
		},
	},
	domain: "strings",
	missing_key_callback: noTranslationMessage, // This callback is called when a translation cannot be found
	_is_default_content: true,
};

function loadTranslationFiles(p_Language) {
	const languageParts = p_Language.split("_");
	// we might have a specific locale version of a language (e.g. en_US, en_UK, en_CA etc)
	// in this case we will try to load both the base and the specific version of the language e.g. en.json and en_CA.json
	const locationsToLoad = [];
	locations.forEach((p_Location) => {
		if (languageParts.length > 1) {
			// load the base first so the more specific values can overrule the less specific ones
			locationsToLoad.push({ translations: {}, finished: false, url: `${p_Location.url}/${languageParts[0]}.json` });
		}
		locationsToLoad.push({ translations: {}, finished: false, url: `${p_Location.url}/${p_Language}.json` });
	});

	const applyTranslations = () => {
		if (locationsToLoad.every((p_TestLocation) => p_TestLocation.finished)) {
			locationsToLoad.forEach((p_Location) => {
				Object.keys(p_Location.translations).forEach((p_Key) => {
					if (p_Location.translations[p_Key].translations) {
						translationInfo.locale_data.strings[p_Key] = p_Location.translations[p_Key].translations;
					}
				});
			});
			jed = new exports.Jed(translationInfo);
			notifiers.notify("loaded", translator);
		}
	};

	locationsToLoad.forEach((p_Location) => {
		fetch(p_Location.url).then((p_Response) => ((p_Response.ok) ? Promise.resolve(p_Response.json()) : Promise.reject(new Error("retrieve failed")))).then((p_Translations) => {
			p_Location.translations = p_Translations.locale_data.strings;
			p_Location.finished = true;
			applyTranslations();
		}).catch((p_Err) => {
			debug.log(p_Err);
			p_Location.finished = true;
			applyTranslations();
		});
	});
}

translator = {
	/**
	 * Get the translation handler for the specified string. This will return an object that can be used to further specify details about the translation that needs to be retrieved or to pass parameters for a printf like substitution
	 * usage:
	 * if there is a plural form of the string use:
	 * translate('string to translate %1s %2s').ifPlural(number).fetch(parameters|[parameter1, parameter2,...]);
	 * if there is only a singular form use:
	 * translate('string to translate %1s %2s').fetch(parameters|[parameter1, parameter2,...]);
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
		if (p_Location && locations.findIndex((p_LocationInfo) => p_LocationInfo.url === String(p_Location)) === -1) {
			locations.push({ url: p_Location, loaded: false });
			// if the language was set, immediately start loading any new locations
			if (language) {
				loadTranslationFiles(language);
			}
		}
	},
	/**
	 * Add a handler function that will be called when new translations are available
	 * @param {function} p_Handler Handler function that will be called when (new) translations are available
	 * @param {object} p_Owner Object that owns the handler, this can be used with removeTranslationUpdatedObserverOwner to remove all registered handlers for this owner
	 */
	addTranslationUpdatedObserver(p_Handler, p_Owner) {
		notifiers.addObserver("loaded", p_Handler, p_Owner);
		p_Handler(this);
	},
	/**
	 * remove the specified handler
	 * @param {function} p_Handler Remove the given handler function
	 */
	removeTranslationUpdatedObserver(p_Handler) {
		notifiers.removeObserver("loaded", p_Handler);
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
