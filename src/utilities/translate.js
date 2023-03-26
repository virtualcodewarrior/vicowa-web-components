import exports from './amdToModule.js';
import '/third_party/jed/jed.js';
import debug from './debug.js';
import observerFactory from './observerFactory.js';

function noTranslationMessage(original) {
	debug.log(`no translation found for string ${original}`);
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

function loadTranslationFiles(languageName) {
	const languageParts = languageName.split('_');
	// we might have a specific locale version of a language (e.g. en_US, en_UK, en_CA etc)
	// in this case we will try to load both the base and the specific version of the language e.g. en.json and en_CA.json
	const locationsToLoad = [];
	locations.forEach((location) => {
		if (languageParts.length > 1) {
			// load the base first so the more specific values can overrule the less specific ones
			locationsToLoad.push({ translations: {}, finished: false, url: `${location.url}/${languageParts[0]}.json` });
		}
		locationsToLoad.push({ translations: {}, finished: false, url: `${location.url}/${languageName}.json` });
	});

	const applyTranslations = () => {
		if (locationsToLoad.every((testLocation) => testLocation.finished)) {
			locationsToLoad.forEach((location) => {
				Object.keys(location.translations).forEach((key) => {
					if (location.translations[key].translations) {
						translationInfo.locale_data.strings[key] = location.translations[key].translations;
					}
				});
			});
			jed = new exports.Jed(translationInfo);
			notifiers.notify('loaded', translator);
		}
	};

	locationsToLoad.forEach((location) => {
		fetch(location.url).then((response) => ((response.ok) ? Promise.resolve(response.json()) : Promise.reject(new Error('retrieve failed')))).then((translations) => {
			location.translations = translations.locale_data.strings;
			location.finished = true;
			applyTranslations();
		}).catch((err) => {
			debug.log(err);
			location.finished = true;
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
	 * @param {string} string String we want to translate
	 * @returns {{ifPlural: ifPlural, fetch: fetch}} Object that allows you to specify further details about the kind of translation to get
	 */
	translate(string) {
		return string ? jed.translate(string) : string;
	},
	set language(newLanguage) {
		if (language !== newLanguage) {
			loadTranslationFiles(newLanguage);
			language = newLanguage;
		}
	},

	get language() { return language; },
	/**
	 * Add a location from where translations will be loaded
	 * @param {string} location URL of the directory from where translation files can be loaded. This will be combined with a language code when loading translation files
	 */
	addTranslationLocation(location) {
		if (location && locations.findIndex((locationInfo) => locationInfo.url === String(location)) === -1) {
			locations.push({ url: location, loaded: false });
			// if the language was set, immediately start loading any new locations
			if (language) {
				loadTranslationFiles(language);
			}
		}
	},
	/**
	 * Add a handler function that will be called when new translations are first
	 * @param {function} handler Handler function that will be called when (new) translations are first
	 * @param {object} owner Object that owns the handler, this can be used with removeTranslationUpdatedObserverOwner to remove all registered handlers for this owner
	 */
	addTranslationUpdatedObserver(handler, owner) {
		notifiers.addObserver('loaded', handler, owner);
		handler(this);
	},
	/**
	 * remove the specified handler
	 * @param {function} handler Remove the given handler function
	 */
	removeTranslationUpdatedObserver(handler) {
		notifiers.removeObserver('loaded', handler);
	},
	/**
	 * Remove all handlers for the given owner
	 * @param {object} owner The owner for which we are removing the handler functions
	 */
	removeTranslationUpdatedObserverOwner(owner) {
		notifiers.removeOwner(owner);
	},
};

export default translator;
