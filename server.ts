/* eslint-disable no-unused-vars */
import fs from 'fs';
import path from 'path';
// import express, { Request, Response } from 'express';
import express from 'express';
import {homedir} from 'os';
import {Logs as _Logs} from 'xeue-logs';
import {Config as _Config} from 'xeue-config';
import {Server as _Server} from 'xeue-webserver';
import Package from './package.json' with {type: "json"};
import {promises as Files} from 'fs';
import ejs from 'ejs';

const version = Package.version;
const __dirname = import.meta.dirname
const __data = path.join(homedir(), '.LochLock');
const __static = path.resolve(__dirname+"/static");

async function fileExists(path: string, makeIfNotPresent: boolean) {
	let found = true
	try {
		await Files.access(path)
	} catch (error) {
		found = false
		if (makeIfNotPresent) {
			Logs.log(`Folder: ${Logs.y}(${path})${Logs.reset} not found, creating it`, 'I')
			try {
				await Files.mkdir(path, {'recursive': true})
			} catch (error) {
				Logs.log(`Couldn't create folder: ${Logs.y}(${path})${Logs.reset}`, 'W')
				Logs.warn('Message', error)
			}
		} else {
			Logs.log(`Folder: ${Logs.y}(${path})${Logs.reset} not found`, 'I')
		}
	}
	return found
}

async function deleteFile(path: string) {
	if (await fileExists(path, false)) await Files.unlink(path);
};
async function deleteFolder(path: string) {
	if (await fileExists(path, false)) await Files.rmdir(path, {recursive: true});
}

declare type Timer = {
	cancel: ()=>void,
	pause: ()=>void,
	resume: ()=>void,
	remaining: ()=>string
} | undefined;

const Logs = new _Logs(
	false,
	'LochLock',
	__data,
	'D',
	false
)
const Config = new _Config(
	Logs
);
const Server = new _Server(
	expressRoutes,
	Logs,
	version,
	Config,
	doMessage,
	()=>{}
);

/* Start App */

const timers: Array<Timer> = new Array(8);
timers.fill(undefined)

process.stdin.resume();
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('SIGTERM', exitHandler);
process.on('uncaughtException', error => exitHandler(true, error));

{ /* Config */
	Logs.printHeader('LochLock');
	Config.require('port', [], 'What port shall the server use');
	Config.require('shellyIP', [], 'IP of Shelly');
	Config.require('systemName', [], 'What is the name of the system/job');
	Config.require('loggingLevel', {'A':'All', 'D':'Debug', 'W':'Warnings', 'E':'Errors'}, 'Set logging level:');
	Config.require('createLogFile', {true: 'Yes', false: 'No'}, 'Save Logs to local file');
	Config.require('advancedConfig', {true: 'Yes', false: 'No'}, 'Show advanced config settings');
	{
		Config.require('debugLineNum', {true: 'Yes', false: 'No'}, 'Print line numbers?', ['advancedConfig', true]);
		Config.require('printPings', {true: 'Yes', false: 'No'}, 'Print pings?', ['advancedConfig', true]);
		Config.require('devMode', {true: 'Yes', false: 'No'}, 'Dev mode - Disables connections to devices', ['advancedConfig', true]);
	}

	Config.default('port', 8080);
	Config.default('shellyIP', '0.0.0.0');
	Config.default('systemName', 'LochLock');
	Config.default('loggingLevel', 'W');
	Config.default('createLogFile', true);
	Config.default('debugLineNum', false);
	Config.default('printPings', false);
	Config.default('advancedConfig', false);
	Config.default('timer0', 40);
	Config.default('timer1', 40);
	Config.default('timer2', 40);
	Config.default('timer3', 40);
	Config.default('timer4', 40);
	Config.default('timer5', 40);
	Config.default('timer6', 40);
	Config.default('timer7', 40);

	if (!await Config.fromFile(path.join(__data, 'config.conf'))) {
		await Config.fromCLI(path.join(__data, 'config.conf'));
	}

	if (Config.get('loggingLevel') == 'D' || Config.get('loggingLevel') == 'A') {
		Config.set('debugLineNum', true);
	}
	
	Logs.setConf({
		createLogFile: Config.get('createLogFile'),
		logsFileName: 'LochLock',
		configLocation: __data,
		loggingLevel: Config.get('loggingLevel'),
		debugLineNum: Config.get('debugLineNum')
	})

	Logs.log('Running version: v'+version, ['H', 'SERVER', Logs.g]);
	Logs.info('Running EJS version: '+ejs.VERSION);
	Logs.log(`Logging to: ${path.join(__data, 'Logs')}`, ['H', 'SERVER', Logs.g]);
	Logs.log(`Config saved to: ${path.join(__data, 'config.conf')}`, ['H', 'SERVER', Logs.g]);
	Config.print();
	Config.userInput(async (command: string) => {
		switch (command) {
		case 'config':
			await Config.fromCLI(path.join(__data, 'config.conf'));
			if (Config.get('loggingLevel') == 'D' || Config.get('loggingLevel') == 'A') {
				Config.set('debugLineNum', true);
			}
			Logs.setConf({
				'createLogFile': Config.get('createLogFile'),
				'logsFileName': 'LochLock',
				'configLocation': __data,
				'loggingLevel': Config.get('loggingLevel'),
				'debugLineNum': Config.get('debugLineNum')
			});
			return true;
		case 'debug':
			Config.set('loggingLevel','D')
			Logs.setConf({
				'createLogFile': Config.get('createLogFile'),
				'logsFileName': 'LochLock',
				'configLocation': __data,
				'loggingLevel': Config.get('loggingLevel'),
				'debugLineNum': Config.get('debugLineNum')
			});
			return true
		case 'error':
			Config.set('loggingLevel','E')
			Logs.setConf({
				'createLogFile': Config.get('createLogFile'),
				'logsFileName': 'LochLock',
				'configLocation': __data,
				'loggingLevel': Config.get('loggingLevel'),
				'debugLineNum': Config.get('debugLineNum')
			});
			return true
		}
	});
}

Logs.log(`${Config.get('systemName')} can be accessed at http://localhost:${Config.get('port')}`, ['H', 'SERVER', Logs.g]);

//Server.start(Config.get('port'), Config.get('portSSL'));
Server.start(Config.get('port'));

setInterval(()=>{
	const strings: Array<string> = [];
	timers.forEach((timer, index) => {
		const time = msToTime(Number(Config.get(`timer${index}`))*1000*60)
		if (timer == undefined) return strings[index] = `<span class="timeLeft">${time}</span><span class="timeSlash">/</span><span class="timeStart">${time}</span>`
		strings[index] = timer.remaining();
	})
	Server.sendToAll({"module":"timer", "command":"remaining", "data":strings})
}, 1000)








async function exitHandler(crash: boolean, error: Error) {
	Logs.log('Shutting down processes', ['C', 'EXIT', Logs.r]);
	if (crash) Logs.error('Uncaught error has caused a crash', error);
	process.exit();
}

/* Server functions */

function expressRoutes(expressApp: express.Application) {
	expressApp.set('views', path.join(__dirname, 'views'));
	expressApp.set('view engine', 'ejs');
	expressApp.use(express.json());
	expressApp.use(express.static(__static));

	function getHomeOptions() {return {
		systemName: Config.get('systemName'),
		version: version,
		host: Config.get('host'),
		reconnectTimeoutSeconds: Config.get('reconnectTimeoutSeconds'),
		config: true,
		inApp: true,
		isSSL: false,
		shellyIP: Config.get('shellyIP')
	}}

	expressApp.get('/',  (req, res) =>  {
		Logs.log('New client connected', 'A');
		res.header('Content-type', 'text/html');
		const homeOptions = getHomeOptions();
		homeOptions.config = false;
		homeOptions.inApp = false;
		res.render('home', homeOptions);
	});

	expressApp.get('/config',  (req, res) =>  {
		Logs.log('New client connected', 'A');
		res.header('Content-type', 'text/html');
		const homeOptions = getHomeOptions();
		homeOptions.config = false;
		homeOptions.inApp = false;
		res.render('config', homeOptions);
	});

	expressApp.post('/status', (req, res) => {
		Server.sendToAll({"module":"safe", "command":"status", "id":req.body.id, "status": req.body.status})
	})
}

async function doMessage(message, socket) {
	const {header, payload} = message;
	switch (payload.module) {
	case 'core':
		switch (payload.command) {
			case 'register':
				doRegisterWS(header, payload, socket)
				break;
			case 'shellyIP':
				Config.set('shellyIP', payload.data);
				Logs.debug('Setting shelly IP');
				break;
			default:
				break;
		}
		break;
	case 'safe':
		const safeID = Number(payload.safe)+1;
		switch (payload.command) {
			case 'lock':
				sendLoRa(safeID, true);
				break;
			case 'unlock':
				sendLoRa(safeID, false);
				break;
			case 'status':
				// sendLoRa(safeID, `{"id":${safeID},"command":"status"}`);
				break;
			default:
				break;
		}
		break;
	case 'timer':
		const ID = Number(payload.timer);
		const thisTimer = timers[ID];
		switch (payload.command) {
			case 'start':
				if (thisTimer !== undefined) {
					thisTimer.resume();
				} else {
					timers[ID] = timer(()=>{
						sendLoRa(ID+1, true);
					}, Number(Config.get(`timer${ID}`))*60*1000);
				}
				break;
			case 'stop':
				timers[ID]?.pause();
				break;
			case 'restart':
				timers[ID]?.cancel();
				timers[ID] = timer(()=>{
					sendLoRa(ID+1, true);
				}, Number(Config.get(`timer${ID}`))*60*1000);
				break;
			case 'set':
				Config.set(`timer${ID}`, payload.time);
				break;
			default:
				break;
		}

		break;
	default:
		Logs.warn('Unknown module', message);
	}
}

function sendLoRa(id: number, lock: boolean) {
	const cmd = `http://${Config.get('shellyIP')}/script/1/api?target=${id}&lock=${lock}`;
	Logs.debug('Sending LoRa', cmd);
	fetch(cmd).then(res=>{
		console.dir(res)
	}).catch(error=>{
		Logs.warn('Endpoint missing')
	});
}

async function doRegisterWS(header, payload, socket) {
	socket.flows = false;
	socket.preHears = false;
	socket.users = false;
	socket.system = false;
	socket.type = header.type ?? "Client";
	payload.data.forEach((module: string) => {
		socket[module] = true;
	})
}

/* Utility */

function loadData(file: string) {
	try {
		const dataRaw = fs.readFileSync(`${__data}/data/${file}.json`, { encoding: 'utf8'});
		try {
			return JSON.parse(dataRaw);
		} catch (error) {
			Logs.error(`There is an error with the syntax of the JSON in ${file}.json file`, error);
			return [];
		}
	} catch (error) {
		Logs.warn(`Cloud not read the file ${file}.json, loading default file`);
		Logs.debug('File error:', error);

		if (!fs.existsSync(`${__data}/data/`)){
			fs.mkdirSync(`${__data}/data/`);
		}
		fs.writeFileSync(`${__data}/data/${file}.json`, JSON.stringify({}, null, 4));
		return {};
	}
}

function writeData(file: string, data: any) {
	try {
		fs.writeFileSync(`${__data}/data/${file}.json`, JSON.stringify(data, undefined, 2));
	} catch (error) {
		Logs.error(`Cloud not write the file ${file}.json, do we have permission to access the file?`, error);
	}
}

async function sleep(seconds: number) {
	await new Promise (resolve => setTimeout(resolve, 1000*seconds));
}

function msToTime(s: number):string {
	const ms = s % 1000;
	s = (s - ms) / 1000;
	const secs = s % 60;
	s = (s - secs) / 60;
	const mins = s % 60;
	const hrs = (s - mins) / 60;
	return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function timer(callback: ()=>void, countdown: number) :Timer {
    let ident: NodeJS.Timeout;
	let self:Timer;
	let paused = false;
	let start_time = new Date().getTime();
	const origionalCountdown = countdown;

    function _time_diff(date1: number) {
        return new Date().getTime() - date1;
    }

    function cancel() {
        clearTimeout(ident);
		self = undefined;
    }

    function pause() {
		paused = true;
        clearTimeout(ident);
		countdown = countdown - _time_diff(start_time);
    }

    function resume() {
		paused = false;
		start_time = new Date().getTime();
		ident = setTimeout(()=>{
			self = undefined;
			callback();
		}, countdown);
    }

	function remaining() {
		let time = '00:00:00';
		const remaining = msToTime(origionalCountdown);
		if (paused) {
			if (countdown > 0) {
				time = msToTime(countdown);
			}
		} else {
			if (countdown - _time_diff(start_time) > 0) {
				time = msToTime(countdown - _time_diff(start_time));
			}
		}
		return `<span class="timeLeft">${time}</span><span class="timeSlash">/</span><span class="timeStart">${remaining}</span>`;
	}

    ident = setTimeout(()=>{
		self = undefined;
		callback();
	}, countdown);

	self = { cancel: cancel, pause: pause, resume: resume, remaining: remaining };
    return self;
}