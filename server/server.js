'use strict';

const UUID = "22002700-0551-3730-3234-393600000000",
HOST = "192.168.137.1",
APIKEY = "5b3317274f4981cf",
APISECRET = "jGCWQtzsGcIMTTsVY8SZxHl1PcqfgLYLIKdFOr3hi8A",
PORT = 3000;

const WEBSOCKET = require('ws'),
CRYPTO = require('crypto'),
FORMDATA = require('form-data'),
HTTP = require('http'),
FS = require('fs'),
OS = require('os'),

//stream = require('stream'),
UTIL = require('util');

const SERVER = HTTP.createServer(function(req, res) {

	FS.readFile('gui/index.html', function(err, data) {
		res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
		res.write(data);
		res.end();
	});
});

console.log(`Server running on "${getIPAddress()}:${PORT}"`);

SERVER.listen(PORT);

const WS = new WEBSOCKET.Server({ server: SERVER });

const CLIENTS = new Map();


const ADMINACTIONS = {
	selectClient(id) {
		chooseClient(id);
	}
};

let ADMIN, CURRCLIENT, CURRCONFIG, CURRDEVICECONFIG;
getSessionConfig().then(config => { CURRCONFIG = config }).catch(e => console.error(e));
getDeviceConfig().then(config => { CURRDEVICECONFIG = config }).catch(e => console.error(e));

const ACTIONS = {
	async capture(client, { dataURI, options }) {

		if (client !== CURRCLIENT)
			return;

		await Promise.all([setSessionConfig(options), setDeviceConfig(options)]).catch(e => console.error(e));

		sendImage(dataURI).then(_ => {

			if (client !== CURRCLIENT)
				return;

			sendMessage(client, 'resume');
			sendMessage(ADMIN, 'clientSending', client.id);
		}).catch(error => console.error(error));
	}
}

function mapSessionConfig(changes) {

	let lookupOpts = {
		"DefaultDithering": ["dither", { bayer: "bayer", none: "none", "floyd-steinberg": "floyd-steinberg" }],
		"DefaultEncoding": ["bit", { 1: "1", 4: "4" }],
		"RectangleFlags": ["invert", { false: "2", true: "0" }],
		"Beautify": ["optimize", { false: "gamma=1.1", true: "pretty,gamma=1.1" }],
		"ChangesAutodetect": ["partial", { false: "false,threshold=0", true: "true,threshold=0" }]
	}

	let opts = { dither: "bayer", bit: 1, invert: false, optimize: false, partial: false };

	Object.assign(opts, changes);

	let mappedOpts = {};

	for (let key in lookupOpts) {
		let currOpt = lookupOpts[key],
		value = currOpt[1][opts[currOpt[0]]];

		if (value !== undefined) {
			mappedOpts[key] = value;
		}
	}

	let data = [{ "Uuid": UUID, "Backend": { "Name": "HTTP", "Fields": {} }, "Options": mappedOpts }];

	return JSON.stringify(data);
}

function mapDeviceConfig(options) {

	let conf;

	try {
		conf = JSON.parse(CURRDEVICECONFIG);
	} catch (e) {
		return false;
	}

    // conf.Options.MergeRegions = conf.Options.MergeRegions.replace('false', 'true');
    //horizontal
    if (options.dimensions[0] > options.dimensions[1]) {

    	conf.Displays.forEach(d => {
    		d.Rotation = 1;
    		d.X = d.Height * d.ID;
    		d.Y = 0;
    	});

        //vertical
    } else {

    	conf.Displays.forEach(d => {
    		d.Rotation = 2;
    		d.X = 0;
    		d.Y = d.Height * (conf.Displays.length - 1 - d.ID);
    	});
    }

    return JSON.stringify(conf);
}

function getDeviceConfig() {
	return new Promise((resolve, reject) => {

		let form = new FORMDATA();

		let headers = { "content-type": 'application/json' },
		date = new Date().toUTCString(),
		path = '/api/device/' + UUID,
		verb = 'GET';

		let auth = CRYPTO.createHmac('sha256', APISECRET)
		.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
		.digest('base64');

		headers.Date = date;
		headers.Authorization = UTIL.format('%s:%s', APIKEY, auth);

		let request = HTTP.request({
			method: verb,
			host: HOST,
			port: 8081,
			path: path,
			headers: headers
		}, res => {
            // console.log(`statusCode: ${res.statusCode}`);

            res.on('data', d => {
            	resolve(d.toString());
            })
        });

		request.on('error', error => {
			reject(error);
		})

		request.end();
	});
}

function setDeviceConfig(options) {
	return new Promise((resolve, reject) => {

		let data = mapDeviceConfig(options);

		if (!CURRDEVICECONFIG || data === CURRDEVICECONFIG) {
            // console.log('fuck');
            return resolve();
        }

        CURRDEVICECONFIG = data;
        console.log('Device parameters updated.');

        let request = requestEncrypted('PUT', res => resolve());

        request.on('error', error => {
        	console.log(error);
            resolve(); //or reject maybeh
        });

        request.write(data);
        request.end();
    });
}

function requestEncrypted(method, data, callback) {

	let headers = { "content-type": 'application/json' },
	date = new Date().toUTCString(),
	path = '/api/device/' + UUID,
	verb = 'PUT';

	let auth = CRYPTO.createHmac('sha256', APISECRET)
	.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
	.digest('base64');

	headers.Date = date;
	headers.Authorization = UTIL.format('%s:%s', APIKEY, auth);

	let request = HTTP.request({

		method: verb,
		host: HOST,
		port: 8081,
		path: path,
		headers: headers

	}, callback);

	return request;


}

function setSessionConfig(options) {
	return new Promise((resolve, reject) => {

		let data = mapSessionConfig(options);

		if (!CURRCONFIG || data === CURRCONFIG) {
			return resolve();
		}

		CURRCONFIG = data;
		console.log('Session parameters updated.');

		let headers = { "content-type": 'application/json' },
		date = new Date().toUTCString(),
		path = '/api/session',
		verb = 'PUT';

		let auth = CRYPTO.createHmac('sha256', APISECRET)
		.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
		.digest('base64');



		headers.Date = date;
		headers.Authorization = UTIL.format('%s:%s', APIKEY, auth);

		let request = HTTP.request({
			method: verb,
			host: HOST,
			port: 8081,
			path: path,
			headers: headers
		}, res => {
            // console.log(`statusCode: ${res.statusCode}`);
            resolve();
            // getSessionConfig();
        });

		request.on('error', error => {
			console.log(error);
            resolve(); //or reject maybeh
        });

		request.write(data);
		request.end();
	});
}

function encryptHeaders(verb, path, headers) {

	let date = new Date().toUTCString();

	let auth = CRYPTO.createHmac('sha256', APISECRET)
	.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
	.digest('base64');

	headers.Date = date;
	headers.Authorization = UTIL.format('%s:%s', APIKEY, auth);

	return headers;
};

function getSessionConfig() {
	return new Promise((resolve, reject) => {

		let form = new FORMDATA();

		let headers = { "content-type": 'application/json' };
		let path = '/api/session';
		let verb = 'GET';

		headers = encryptHeaders(verb, path, headers);

		let request = HTTP.request({
			method: verb,
			host: HOST,
			port: 8081,
			path: path,
			headers: headers
		}, res => {
            // console.log(`statusCode: ${res.statusCode}`);
            res.on('data', d => {
                // console.log(d.toString());
                resolve(d.toString());
            })
        });

		request.on('error', error => {
			reject(error);
		});

		request.end();
	});
}

function sendImage(dataURI) {
	return new Promise((resolve, reject) => {

		let form = new FORMDATA();

		form.append('image', Buffer.from(dataURI.split(',')[1], 'base64'), { filename: 'image.png' });

		let headers = form.getHeaders();
		let path = UTIL.format('/backend/%s', UUID);
		let verb = 'PUT';

		headers = encryptHeaders(verb, path, headers);

		let request = HTTP.request({
			method: verb,
			host: HOST,
			port: 8081,
			path: path,
			headers: headers
		});

		request.on('response', function(res) {

			if (res.statusCode != 200)
				reject(res);

			res.on('data', function(chunk) {
				resolve(chunk);
			});

		});

		form.pipe(request);

	});
}

function setupSimpleClient(socket, req) {
	const client = {
		id: Date.now() + '',
		socket: socket,
	};

	let stringParams = Buffer.from(req.url.replace('/?', ''), 'base64').toString('ascii');
	Object.assign(client, JSON.parse(stringParams));

    //prevent clients with same id
    let currId = client.id,
    i = 2;

    while (CLIENTS.has(currId)) {
    	currId = client.id + ' ' + i;
    	i++;
    }

    client.id = currId;

    CLIENTS.set(client.id, client);
    sendMessage(ADMIN, 'clientConnected', { id: client.id });

    console.log(client.id + ' is now connected.');

    if (!CURRCLIENT)
    	chooseClient();


    socket.on('message', string => {
    	let msg = JSON.parse(string);

    	if (msg.type in ACTIONS)
    		ACTIONS[msg.type](client, msg.data);
    });

    socket.on('close', msg => {
    	console.log(client.id + ' got disconnected.');
    	CLIENTS.delete(client.id);

    	sendMessage(ADMIN, 'removeClient', client.id);

    	if (client.id === CURRCLIENT.id)
    		chooseClient();
    });
}

function setupUIServer(socket, req) {

	if (ADMIN)
		return socket.close();

	console.log('Admin UI now connected.');

	ADMIN = { socket: socket };

	let currClients = [];

	for (let [id, client] of CLIENTS) {

		let args = { id: id };

		if (CURRCLIENT === client)
			args.selected = true;

		currClients.push(args);
	}

	sendMessage(ADMIN, 'clientsOnline', currClients);

	socket.on('message', string => {
		let msg = JSON.parse(string);

		if (msg.type in ADMINACTIONS)
			ADMINACTIONS[msg.type](msg.data);
	});

	socket.on('close', string => {
		console.log('Admin UI is now disconnected.');
		ADMIN = undefined;
	});
}

WS.on('connection', (socket, req) => {
	if (req.url.endsWith("/server/?admin"))
		setupUIServer(socket, req);
	else
		setupSimpleClient(socket, req);
});

function chooseClient(id) {

	if (id && CLIENTS.has(id)) {

		sendMessage(CURRCLIENT, 'pause');
		CURRCLIENT = CLIENTS.get(id);

	} else {

		CURRCLIENT = CLIENTS.values().next().value;
	}

	if (!CURRCLIENT)
		return;

	console.log('New client:' + CURRCLIENT.id);
	configureInk(CURRCLIENT);

	if (!id)
		sendMessage(ADMIN, 'highLightClient', CURRCLIENT.id);

	sendMessage(CURRCLIENT, 'resume');
}

function configureInk(client) {
    // console.log(client);
}

function sendMessage(ws, type, data = null) {

	if (!ws)
		return;

	ws.socket.send(JSON.stringify({ type: type, data: data }));
}

function getIPAddress() {
	var interfaces = OS.networkInterfaces();
	for (var devName in interfaces) {
		var iface = interfaces[devName];

		for (var i = 0; i < iface.length; i++) {
			var alias = iface[i];
			if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
				return alias.address;
		}
	}

	return '0.0.0.0';
}