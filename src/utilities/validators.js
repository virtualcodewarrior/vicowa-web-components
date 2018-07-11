const defaultValidators = Object.freeze({
	notEmpty: (p_Value) => ((p_Value) ? { valid: true } : { valid: false, error: 'this field cannot be empty' }),
	postalCodeCA: (p_Value) => ((/^\s*[a-z]\d[a-z](?:\s*|-)\d[a-z]\d\s*$/i.test(p_Value)) ? { valid: true } : { valid: false, error: 'please make sure the postal code format is valid' }),
	postalCodeNL: (p_Value) => ((/^\s*\d\d\d\d\s*[a-z][a-z]\s*$/i.test(p_Value)) ? { valid: true } : { valid: false, error: 'please make sure the postal code format is valid' }),
	email: (p_Value) => ((/^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(p_Value)) ? { valid: true } : { valid: false, error: 'please make sure the EMail address is valid' }),
});

const validators = Object.keys(defaultValidators).reduce((p_Previous, p_Key) => { p_Previous[p_Key] = defaultValidators[p_Key]; return p_Previous; }, {});

export default validators;
