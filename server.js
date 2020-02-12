import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8989;

(async() => {
	const app = express();
	const websiteDirectory = "examples";

	app.use(express.json());

	app.get("/third_party/*", (req, res) => {
		res.sendFile(path.resolve(`${__dirname}/../node_modules/${req.params[0]}`));
	});

	// if the requested file actually exists, return it but if it does not exist, hand it over to the next route
	app.get('/:file(*)', (req, res, next) => {
		const file = req.params.file;
		const targetPath = file ? path.resolve(path.join(__dirname, websiteDirectory, file)) : undefined;
		return (targetPath && fs.existsSync(targetPath)) ? res.sendFile(targetPath) : next();
	});

	// if the requested file actually exists, return it but if it does not exist, hand it over to the next route
	app.get('/examples/vicowa-content-container-routed/:file(*)', (req, res, next) => {
		const file = req.params.file;
		const targetPath = file ? path.resolve(path.join(__dirname, websiteDirectory, 'vicowa-content-container-routed', file)) : undefined;
		return (targetPath && fs.existsSync(targetPath)) ? res.sendFile(targetPath) : next();
	});

	// if we get to here we will just return the route example (we will let the client side router in index.html handle the rest)
	app.get('/examples/vicowa-content-container-routed/*', (req, res) => {
		res.sendFile(path.resolve(`${__dirname}/${websiteDirectory}/vicowa-content-container-routed/index.html`));
	});

	// if we get to here we will just return the examples directory
	app.get('/examples/*', (req, res) => {

		res.sendFile(path.resolve(`${__dirname}/${websiteDirectory}/index.html`));
	});

	app.listen(port, () => {
		console.log(`Server listening on port ${port}`);
	});
})();
