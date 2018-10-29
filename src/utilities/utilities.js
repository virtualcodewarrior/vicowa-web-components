export const uuidv4 = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (param) => (param ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (param / 4)))).toString(16));
