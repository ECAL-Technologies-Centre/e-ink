'use strict';

const WEBSOCKET = require('ws');
const CRYPTO = require('crypto');
const FORMDATA = require('form-data');
const HTTP = require('http');
const FS = require('fs');
const OS = require('os');
const UTIL = require('util');

let SERVER;
let WS;

//Default values are overwritten if config.json file exists.
//As an example, use the command "node server.js -port 3333 -host localhost" to set new values.

const CONF = {
	port: 3000,
	uuid: '22002700-0551-3730-3234-393600000000',
	host: '192.168.137.1',
	key: '0dcdf81e05377c83',
	secret: 'AANIWzpQiGXmSjhfN8u2lCpGTLWiwcirC5PAP7flVyY',
	comparedelay: 100,
}

const ADMIN = {

	//variables
	connected: false,
	socket: undefined,

	//do calls
	actions: {
		"selectClient": function(id) {
			console.log('client selected: ' + id);
			CLIENTS.select(id);
		}
	},

	//methods
	getSimplifiedClientList() {
		let clientArray = Array.from(CLIENTS.list.values());//send to admin which clients are online
		let simplifiedArray = clientArray.map(client => UTILS.ignoreKeys(client, ["socket"]));

		return simplifiedArray;
	},

	setup(socket, req) {

		CLIENTS.pauseClient(CLIENTS.currClient);

		if (this.connected)
			return socket.close();

		console.log('Admin UI connected.');

		this.socket = socket;
		this.connected = true;

		UTILS.sendMessage(this, 'clientsList', this.getSimplifiedClientList());

		socket.on('message', rawData => {
			let msg = JSON.parse(rawData);
			this.do(msg.type, msg.data);
		});

		socket.on('close', rawData => {
			console.log('Admin UI disconnected.');
			this.connected = false;

			CLIENTS.disconnectAll();
			
			//disconnect all clients

		});
	},

	do(action, data) {
		if(action in this.actions) {
			this.actions[action].call(this, data);
		} else {
			console.log(`ADMIN.actions ["${action}] is not defined"`);
		}
	},
}

const ENCRYPT = {
	header(verb, path, headers) {
		let date = new Date().toUTCString();

		let auth = CRYPTO.createHmac('sha256', CONF.secret)
		.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
		.digest('base64');

		headers.Date = date;
		headers.Authorization = UTIL.format('%s:%s', CONF.key, auth);

		return headers;


	},

	request(method, callback) {
		let headers = { "content-type": 'application/json' },
		date = new Date().toUTCString(),
		path = '/api/device/' + CONF.uuid,
		verb = 'PUT';

		let auth = CRYPTO.createHmac('sha256', CONF.secret)
		.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
		.digest('base64');

		headers.Date = date;
		headers.Authorization = UTIL.format('%s:%s', CONF.key, auth);

		let request = HTTP.request({

			method: verb,
			host: CONF.host,
			port: 8081,
			path: path,
			headers: headers

		}, callback);

		return request;

	}

}

const DEVICE = {

	config: undefined,

	liveView: undefined,
	
	async retrieveConfig() {
		this.config = await this.getConfig().catch(e => console.error(e));
		console.log('Device config retrieved!');
	},

	sendImage(dataURI) {
		return new Promise((resolve, reject) => {

			let form = new FORMDATA();

			form.append('image', Buffer.from(dataURI.split(',')[1], 'base64'), { filename: 'image.png' });

			let headers = form.getHeaders();
			let path = UTIL.format('/backend/%s', CONF.uuid);
			let verb = 'PUT';

			headers = ENCRYPT.header(verb, path, headers);

			let request = HTTP.request({
				method: verb,
				host: CONF.host,
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
	},

	getConfig() {

		return new Promise((resolve, reject) => {

			let form = new FORMDATA();

			let response = '';

			let headers = { "content-type": 'application/json' },
			date = new Date().toUTCString(),
			path = '/api/device/' + CONF.uuid,
			verb = 'GET';

			let auth = CRYPTO.createHmac('sha256', CONF.secret)
			.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
			.digest('base64');

			headers.Date = date;
			headers.Authorization = UTIL.format('%s:%s', CONF.key, auth);

			let request = HTTP.request({
				method: verb,
				host: CONF.host,
				port: 8081,
				path: path,
				headers: headers
			}, res => {
				// console.log(`statusCode: ${res.statusCode}`);

				res.on('data', d => {
					response += d.toString();
				})

				res.on('end', _ => {
					resolve(response);
				})
			});

			request.on('error', error => {
				reject(error);
			})

			request.end();
		});
	},

	async retrieveLiveView() {

		this.liveView = await DEVICE.getLiveView().catch(e => console.log('Error getting the liveView'));
		console.log('Live view initiated!');

	},

	getLiveView() {

		return new Promise((resolve, reject) => {

			let responses = '';

			let form = new FORMDATA();

			let headers = { "content-type": 'application/octet-stream' },
			date = new Date().toUTCString(),
			path = '/api/live/device/' + CONF.uuid + '/image',
			verb = 'GET';

			let auth = CRYPTO.createHmac('sha256', CONF.secret)
			.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
			.digest('base64');

			headers.Date = date;
			headers.Authorization = UTIL.format('%s:%s', CONF.key, auth);

			let request = HTTP.request({
				method: verb,
				gzip: true,
				host: CONF.host,
				port: 8081,
				path: path,
				headers: headers
			}, res => {
				// console.log(`statusCode: ${res.statusCode}`);

				res.on('data', d => {
					responses += d.toString('hex');
				});

				res.on('end', d => {
					// console.log(responses);
					resolve(responses);
				});
			});

			// request.setEncoding('binary');

			request.on('error', error => {
				reject(error);
			})

			request.end();
		});
	},

	async liveViewUpdated() {

		let oldView = DEVICE.liveView,
			newView,
			interval = CONF.comparedelay;

		while(true) {
			
			newView = await DEVICE.getLiveView();

			if(oldView !== newView)
				break;

			await UTILS.delay(interval);

			console.log('Same image...');

		}

		console.log('Image updated!!');
		this.liveView = newView;
		
	},

	mapConfig(options) {

		let conf;

		try {
			conf = JSON.parse(this.config);
		} catch (e) {
			console.log('Failed to map config!!!');
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
    },

    setConfig(options) {
    	return new Promise((resolve, reject) => {



    		let data = this.mapConfig(options);

    		if (!this.config || data === this.config) {
    			return resolve();
    		}

    		this.config = data;
    		console.log('Device parameters updated.');

    		let request = ENCRYPT.request('PUT', res => resolve());

    		request.on('error', error => {
    			console.log('error');
    			console.log(error);
            	resolve(); //or reject maybeh
            });

    		request.write(data);
    		request.end();
    	});
    }
}

const SESSION = {

	config: undefined,

	async retrieveConfig() {
		this.config = await this.getConfig().catch(e => console.error("Get session config failed."));
		console.log('Session config retrieved!');

	},

	setConfig(options) {
		return new Promise((resolve, reject) => {

			let data = this.mapConfig(options);

			if (!this.config || data === this.config) {
				return resolve();
			}

			this.config = data;
			console.log('Session parameters updated.');

			let headers = { "content-type": 'application/json' },
			date = new Date().toUTCString(),
			path = '/api/session',
			verb = 'PUT';

			let auth = CRYPTO.createHmac('sha256', CONF.secret)
			.update(UTIL.format('%s\n%s\n%s\n%s\n%s', verb, '', headers['content-type'], date, path))
			.digest('base64');

			headers.Date = date;
			headers.Authorization = UTIL.format('%s:%s', CONF.key, auth);

			let request = HTTP.request({
				method: verb,
				host: CONF.host,
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
	},

	getConfig() {
		return new Promise((resolve, reject) => {

			let form = new FORMDATA();
			let headers = { "content-type": 'application/json' };
			let path = '/api/session';
			let verb = 'GET';
			let responses = '';

			headers = ENCRYPT.header(verb, path, headers);

			let request = HTTP.request({
				method: verb,
				host: CONF.host,
				port: 8081,
				path: path,
				headers: headers
			}, res => {
	            // console.log(`statusCode: ${res.statusCode}`);
	            res.on('data', d => {
	                // console.log(d.toString());
	                responses += d.toString();
	            })

	            res.on('end', d => {
					// console.log(responses);
					resolve(responses);
				})
	        });

			request.on('error', error => {
				reject(error);
			});

			request.end();
		});
	},

	mapConfig(changes) {

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

		let data = [{ "Uuid": CONF.uuid, "Backend": { "Name": "HTTP", "Fields": {} }, "Options": mappedOpts }];

		return JSON.stringify(data);
	}



}

const CLIENTS = {
	//variables
	list: new Map(),
	currClient: undefined,

	
	//do calls
	actions: {
		"capture": async function(client, { dataURI, options }) {

			if (!this.isCurrClient(client))
				return;

			console.log(`Capture from "${client.id}" received.`);

			await SESSION.setConfig(options).catch(e => console.error("Set session config failed."));
			await DEVICE.setConfig(options).catch(e => console.error(e));
			await DEVICE.sendImage(dataURI).catch(error => console.error("SendImage failed."));

			console.log('Image sent.');

			await DEVICE.liveViewUpdated();

			if (!this.isCurrClient(client))
				return;

			UTILS.sendMessage(client, 'resume');
			UTILS.sendMessage(ADMIN, 'clientSending', client.id);

		},
	},

	//methods

	disconnectAll() {
		for (let [id, client] of this.list) {
			client.socket.close();
		}

		this.currClient = undefined;
		this.list.clear();

		console.log('All clients disconnected.');
	},

	select(id) {

		if (id && this.list.has(id)) {

			let oldClient = this.currClient;

			this.currClient = this.list.get(id);

			if(oldClient && oldClient === id)
				return;

			if(!this.currClient) {
				this.currClient = oldClient;
				return;
			}

			if(!this.currClient === undefined)
				return;

			console.log(`Client "${id} selected."`);

			if(oldClient) {
				UTILS.sendMessage(oldClient, 'pause');
			}

			UTILS.sendMessage(ADMIN, 'confirmSelection', id);
			UTILS.sendMessage(this.currClient, 'start');

			// configureInk(CURRCLIENT);
		}
	},

	pauseClient(client) {

		if(client) {
			UTILS.sendMessage(client, 'pause');
			this.resetIfCurr(client);
		}

	},

	isCurrClient(client) {
		if (this.currClient===undefined || client.id !== this.currClient.id) {
			return false;
		} else {
			return true;
		}
	},

	resetIfCurr(client) {
		if(this.currClient === client)
			this.currClient = undefined;
	},

	generateId(receivedName) {

		let i = 1;
		let currId = receivedName || Date.now().toString();

		while (this.list.has(currId)) {
			i++;
			currId = receivedName + ' ' + i;
		}

		return currId;

	},

	do(action, client, data) {
		if(action in this.actions) {
			this.actions[action].call(this, client, data);
		} else {

			console.log(action);

			console.log(`CLIENTS.actions ["${action}] is not defined"`);
		}
	},

	addClient(socket, req) {

		const client = {
			id: undefined,
			socket: socket,
		};

		let rawParams = Buffer.from(req.url.replace('/?', ''), 'base64').toString('ascii'); //decode base64 to JSON
		Object.assign(client, JSON.parse(rawParams));

		client.id = this.generateId(client.id);

		this.list.set(client.id, client);

		UTILS.sendMessage(ADMIN, 'clientConnected', client);

		console.log(client.id + ' connected.');

		socket.on('message', string => {
			let msg = JSON.parse(string);
			this.do(msg.type, client, msg.data);
		});

		socket.on('close', msg => {

			console.log(client.id + ' disconnected.');
			this.list.delete(client.id);

			this.resetIfCurr(client);

			UTILS.sendMessage(ADMIN, 'clientDisconnected', client.id);
		});
	},
}

const UTILS = {

	parseString(str = "") {

		let parsed;

		str = str.toString();

		try {
			parsed = JSON.parse(str);	
		} catch(e) {
			parsed = str;
		}

		return parsed;
	},

	isSameObject(a, b) {
		return (JSON.stringify(a) === JSON.stringify(b)) ? true : false;
	},

	getOrSetJSON(path, defaultObj) {
		let created = false;
		let same = false;
		let file;
		let strObj = JSON.stringify(defaultObj);

		try {

			file = FS.readFileSync(path, 'utf8');

		} catch(e) {

			FS.writeFileSync(path, strObj);
			created = true;
			file = strObj;

		}

		if(file === strObj) {
			same = true;
			file = defaultObj;
		} else {
			file = JSON.parse(file);
		}
		
		return {data: file, created: created, same: same};
	},

	ignoreKeys(obj, keys) {
		let newObj = {};

		for (let key in obj) {
			if ( keys.indexOf(key) === -1 ) newObj[key] = obj[key];
		}

		return newObj;
	},

	sendMessage(receiver, type, data = null) {

		if (!receiver.socket)
			return;

		receiver.socket.send(JSON.stringify({ type: type, data: data }));
	},

	delay(millis = 0) {
		return new Promise(res => {
			setTimeout(res, millis);
		});
	},
}

function createServer() {

	const guiPath = 'gui/index.html';

	SERVER = HTTP.createServer(function(req, res) {
		FS.readFile(guiPath, function(err, data) {
			res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
			res.write(data);
			res.end();
		});
	});

	SERVER.listen(CONF.port);

	console.log(`Server running on "${getIPAddress()}:${CONF.port}"`);

	
}

function createSocket() {
	WS = new WEBSOCKET.Server({ server: SERVER, keepAlive: true });

	WS.on('connection', (socket, req) => {
		if (req.url.endsWith("/server/?admin")) {
			ADMIN.setup(socket, req);
		} else {
			CLIENTS.addClient(socket, req);
		}
	});
}

function getIPAddress() {

	const interfaces = OS.networkInterfaces();

	for (const devName in interfaces) {

		const iface = interfaces[devName];

		for (let i = 0; i < iface.length; i++) {
			const alias = iface[i];
			if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
				return alias.address;
		}
	}

	return '0.0.0.0';
}

function getProcessArguments() {

	const opts = {};
	let register = null;

	for (let j = 0; j < process.argv.length; j++) {

		let currArg = process.argv[j];

		if(register !== null) {

			opts[register] = UTILS.parseString(currArg);
			register = null;

		} else {

			if( currArg.charAt( 0 ) === '-' )
				register = currArg.slice( 1 );
		}
	}

	return Object.entries(opts).length > 0 ? opts: null;
}

function getConfig() {

	let newArgs = getProcessArguments();

	let pathConfig = 'config.json';

	let {data: savedOpts} = UTILS.getOrSetJSON(pathConfig, CONF);

	let mergedArgs = Object.assign({}, savedOpts, newArgs);

	if(!UTILS.isSameObject(mergedArgs, savedOpts)) {
		
		FS.writeFileSync(pathConfig, JSON.stringify(mergedArgs));
		console.log(`"${pathConfig}" rewritten.`);
		
	}

	Object.assign(CONF, mergedArgs);

}

async function init() {

	await SESSION.retrieveConfig();
	await DEVICE.retrieveConfig();

	await DEVICE.retrieveLiveView();

	//DEVICE.liveView = await DEVICE.getLiveView();
	//await loopLiveView();
	

	//let image2 = await DEVICE.getLiveView();

	// let strRes = responses.map(raw => raw.toString('binary'));
	// console.log(strRes.join(''));
	
	// FS.writeFile('test.jpg', buffer, 'binary');
	//console.log(SESSION.config);
	//console.log(DEVICE.config);

	getConfig();
	console.log('Current server configuration: ');
	console.log(CONF);
	createServer();
	createSocket();
}

init();