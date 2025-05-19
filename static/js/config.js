import _ServerSocket from './modules/serverSocket.js';

let server = window.location.host + "/";

Object.forEach = function(object, callback) {for (const key in object) {
	if (Object.hasOwnProperty.call(object, key)) callback.call(object, key, object[key]);
}}

document.addEventListener('DOMContentLoaded', async () => {
	window.Server = new _ServerSocket([server], 'Browser', version, systemName, isSSL);
	window.Server.addEventListener('message', event => {
		const [header, payload] = event.detail;
		switch (payload.module) {
			case 'timer':
				doTimer(payload)
				break;
			default:
				break;
		}
	});
	window.Server.addEventListener('open', event => {
		let subscribe = ['safe', 'timer'];
		window.Server.send({
			'module': 'core',
			'command':'register',
			'data': subscribe
		});
	});

	window.Server.addEventListener('open', ()=>document.getElementById('disconnected').classList.add('hidden'));
	window.Server.addEventListener('close', ()=>document.getElementById('disconnected').classList.remove('hidden'));
    

	on('click', '#setShellyIP', _element => {
		const _ip = document.getElementById('shellyIP')
		window.Server.send({"module": "core", "command": "shellyIP", "data":_ip.value});
	})
});


/* Utility */

function on(eventNames, selectors, callback) {
	if (!Array.isArray(selectors)) selectors = [selectors];
	if (!Array.isArray(eventNames)) eventNames = [eventNames];
	selectors.forEach(selector => {
		eventNames.forEach(eventName => {
			if (selector.nodeType) {
				selector.addEventListener(eventName, event => {callback(event.target)});
			} else {
				document.addEventListener(eventName, event => {
					if (event.target.matches(selector)) callback(event.target);
				});
			};
		});
	});
};
