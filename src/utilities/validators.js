const postalCodes = [
	{ countries: ["AD"], regex: /^(?:AD)*(\d{3})$/i },
	{ countries: ["IS", "LS", "MG", "PG", "OM"], regex: /^(\d{3})$/i },
	{ countries: ["NZ", "NO", "PH", "PY", "TN", "VE", "ZA", "MK", "LR", "LI", "AL", "AT", "AU", "BD", "BE", "BG", "CH", "CV", "CX", "CY", "DK", "ET", "HU", "GW", "GL", "GE", "MZ", "NE", "NF"], regex: /^(\d{4})$/i },
	{ countries: ["MV", "MX", "MY", "NC", "BA", "BL", "CR", "DE", "DO", "DZ", "EE", "EG", "ES", "FM", "FR", "GR", "GT", "ID", "IL", "IT", "JO", "IQ", "LK", "KW", "KE", "KH", "LA", "ME", "MF", "MA", "MC", "MM", "VA", "YT", "ZM", "CS", "TR", "TW", "UA", "UY", "PK", "NP", "SA", "SD", "TH"], regex: /^(\d{5})$/i },
	{ countries: ["TJ", "TM", "SG", "RO", "RS", "RU", "VN", "NG", "UZ", "MN", "KG", "KP", "KZ", "IN", "AM", "CN", "CO", "BY"], regex: /^(\d{6})$/i },
	{ countries: ["CL", "NI"], regex: /^(\d{7})$/i },
	{ countries: ["IR"], regex: /^(\d{10})$/i },
	{ countries: ["AR"], regex: /^[A-Z]?\d{4}[A-Z]{0,3}$/i },
	{ countries: ["AX"], regex: /^(?:FI)*(\d{5})$/i },
	{ countries: ["AZ"], regex: /^(?:AZ)*(\d{4})$/i },
	{ countries: ["BB"], regex: /^(?:BB)*(\d{5})$/i },
	{ countries: ["BH"], regex: /^(\d{3}\d?)$/i },
	{ countries: ["BM"], regex: /^([A-Z]{2}\d{2})$/i },
	{ countries: ["BN"], regex: /^([A-Z]{2}\d{4})$/i },
	{ countries: ["BR"], regex: /^\d{5}-\d{3}$/i },
	{ countries: ["CA"], regex: /^([ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]) ?(\d[ABCEGHJKLMNPRSTVWXYZ]\d)$/i },
	{ countries: ["CU"], regex: /^(?:CP)*(\d{5})$/i },
	{ countries: ["EC"], regex: /^([a-zA-Z]\d{4}[a-zA-Z])$/i },
	{ countries: ["CZ"], regex: /^\d{3}\s?\d{2}$/i },
	{ countries: ["FI"], regex: /^(?:FI)*(\d{5})$/i },
	{ countries: ["FO"], regex: /^(?:FO)*(\d{3})$/i },
	{ countries: ["GB"], regex: /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/i },
	{ countries: ["GF"], regex: /^((97|98)3\d{2})$/i },
	{ countries: ["GP"], regex: /^((97|98)\d{3})$/i },
	{ countries: ["GU"], regex: /^(969\d{2})$/i },
	{ countries: ["HN"], regex: /^([A-Z]{2}\d{4})$/i },
	{ countries: ["HR"], regex: /^(?:HR)*(\d{5})$/i },
	{ countries: ["HT"], regex: /^(?:HT)*(\d{4})$/i },
	{ countries: ["IE"], regex: /^[A-Z]\d{2}$|^[A-Z]{3}[A-Z]{4}$/i },
	{ countries: ["GG", "IM", "JE"], regex: /^((?:(?:[A-PR-UWYZ][A-HK-Y]\d[ABEHMNPRV-Y0-9]|[A-PR-UWYZ]\d[A-HJKPS-UW0-9])\s\d[ABD-HJLNP-UW-Z]{2})|GIR\s?0AA)$/i },
	{ countries: ["JP"], regex: /^\d{3}-\d{4}$/i },
	{ countries: ["KR"], regex: /^(?:SEOUL)*(\d{6})$/i },
	{ countries: ["LB"], regex: /^(\d{4}(\d{4})?)$/i },
	{ countries: ["LT"], regex: /^(?:LT)*(\d{5})$/i },
	{ countries: ["LU"], regex: /^(?:L-)?\d{4}$/i },
	{ countries: ["LV"], regex: /^(?:LV)*(\d{4})$/i },
	{ countries: ["MD"], regex: /^MD-\d{4}$/i },
	{ countries: ["MH"], regex: /^969\d{2}(-\d{4})$/i },
	{ countries: ["MP"], regex: /^9695\d{1}$/i },
	{ countries: ["MQ"], regex: /^(\d{5})$/i },
	{ countries: ["MT"], regex: /^[A-Z]{3}\s?\d{4}$/i },
	{ countries: ["NL"], regex: /^(\d{4}[A-Z]{2})$/i },
	{ countries: ["PF"], regex: /^((97|98)7\d{2})$/i },
	{ countries: ["PL"], regex: /^\d{2}-\d{3}$/i },
	{ countries: ["PM"], regex: /^(97500)$/i },
	{ countries: ["PR"], regex: /^00[679]\d{2}(?:-\d{4})?$/i },
	{ countries: ["PT"], regex: /^\d{4}-\d{3}\s?[a-zA-Z]{0,25}$/i },
	{ countries: ["PW"], regex: /^(96940)$/i },
	{ countries: ["RE"], regex: /^((97|98)([478])\d{2})$/i },
	{ countries: ["SE"], regex: /^(?:SE)?\d{3}\s\d{2}$/i },
	{ countries: ["SH"], regex: /^(STHL1ZZ)$/i },
	{ countries: ["SI"], regex: /^(?:SI)*(\d{4})$/i },
	{ countries: ["SJ"], regex: /^(\d{4})$/i },
	{ countries: ["SK"], regex: /^\d{3}\s?\d{2}$/i },
	{ countries: ["SM"], regex: /^(4789\d)$/i },
	{ countries: ["SN"], regex: /^(\d{5})$/i },
	{ countries: ["SO"], regex: /^([A-Z]{2}\d{5})$/i },
	{ countries: ["SV"], regex: /^(?:CP)*(\d{4})$/i },
	{ countries: ["SZ"], regex: /^([A-Z]\d{3})$/i },
	{ countries: ["TC"], regex: /^(TKCA 1ZZ)$/i },
	{ countries: ["US"], regex: /^\d{5}(-\d{4})?$/i },
	{ countries: ["VI"], regex: /^008\d{2}(?:-\d{4})?$/i },
	{ countries: ["WF"], regex: /^(986\d{2})$/i },
];

const standardValidators = {
	notEmpty: (p_Value) => ((p_Value) ? { valid: true } : { valid: false, error: "This field cannot be empty" }),
	email: (p_Value) => ((/^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(p_Value)) ? { valid: true } : { valid: false, error: "Make sure the EMail address is valid" }),
};

const validators = Object.keys(standardValidators).reduce((p_Previous, p_Key) => { p_Previous[p_Key] = standardValidators[p_Key]; return p_Previous; }, {});

function addRegexValidator(p_Name, p_RegExp, p_Error) {
	validators[p_Name] = (p_Value) => ((p_RegExp.test(p_Value)) ? { valid: true } : { valid: false, error: p_Error });
}

postalCodes.forEach((p_Info) => {
	p_Info.countries.forEach((p_CountryCode) => {
		addRegexValidator(`postalCode${p_CountryCode}`, p_Info.regex, "Make sure the postal code format is valid");
	});
});

export default validators;
