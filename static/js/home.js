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
    
	drawGui();

	on('click', '.timerStart', _element => {
		const id = _element.closest('.timer').getAttribute('data-id');
		window.Server.send({"module": "timer", "command": "start", "timer":id});
	})

	on('click', '.timerStop', _element => {
		const id = _element.closest('.timer').getAttribute('data-id');
		window.Server.send({"module": "timer", "command": "stop", "timer":id});
	})

	on('click', '.timerRestart', _element => {
		const id = _element.closest('.timer').getAttribute('data-id');
		window.Server.send({"module": "timer", "command": "restart", "timer":id});
	})

	on('click', '.timerSet', _element => {
		const id = _element.closest('.timer').getAttribute('data-id');
		const time = _element.closest('.timer').querySelector('.timerValue').value;
		window.Server.send({"module": "timer", "command": "set", "timer":id, "time": time});
	})

	on('click', '.safeLock', _element => {
		const id = _element.closest('.timer').getAttribute('data-id');
		window.Server.send({"module": "safe", "command": "lock", "safe":id});
	})

	on('click', '.safeUnlock', _element => {
		const id = _element.closest('.timer').getAttribute('data-id');
		window.Server.send({"module": "safe", "command": "unlock", "safe":id});
	})



	on('click', '.globalTimerStart', ()=>{
		const _starts = document.querySelectorAll('.timerStart')
		for (const _start of _starts) {
			_start.click()
		}
	})
	on('click', '.globalTimerStop', ()=>{
		const _stops = document.querySelectorAll('.timerStop')
		for (const _stop of _stops) {
			_stop.click()
		}
	})
	on('click', '.globalTimerRestart', ()=>{
		const _restarts = document.querySelectorAll('.timerRestart')
		for (const _restart of _restarts) {
			_restart.click()
		}
	})
	on('click', '.globalSafeLock', ()=>{
		const _locks = document.querySelectorAll('.safeLock')
		for (const _lock of _locks) {
			_lock.click()
		}
	})
	on('click', '.globalSafeUnlock', ()=>{
		const _unlocks = document.querySelectorAll('.safeUnlock')
		for (const _unlock of _unlocks) {
			_unlock.click()
		}
	})
});

function doTimer(payload) {
	switch (payload.command) {
		case 'remaining':
			payload.data.forEach((time, index) => {
				const _timer = document.querySelector(`[data-id="${index}"].timer .timerRemaining`)
				_timer.innerHTML = time;
			})
			break;
	
		default:
			break;
	}
}

function drawGui() {
	const _timers = document.getElementById('timers');
	for (let index = 0; index < 6; index++) {
		_timers.insertAdjacentHTML('beforeend',
			`<div>
			<header>Safe 0${index+1}</header>
			<section data-id="${index}" class="timer">
				<div class="timerRemaining"><span class="timeLeft">??:??:??</span><span class="timeSlash">/</span><span class="timeStart">??:??:??</span></div>
				<button class="timerStart">Start</button>
				<button class="timerStop">Stop</button>
				<button class="timerRestart">Reset</button>
				<input type="text" class="timerValue" placeholder="Time until lock">
				<button class="timerSet">Set</button>
				<button class="safeLock">Loch</button>
				<div class="safeStatus"></div>
				<button class="safeUnlock">Unloch</button>
			</section>`
		)
	}
}

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

function download(filename, url) {
	if (typeof url !== 'string') url = window.URL.createObjectURL(url);
	const _a = document.createElement('a');
	_a.setAttribute('href', url);
	_a.setAttribute('download', filename);
	_a.style.display = 'none';
	document.body.appendChild(_a);
	_a.click();
	document.body.removeChild(_a);
}

async function sleep(seconds) {
	return new Promise(resolve => {setTimeout(resolve, seconds*1000)})
}

function onVisible(_element, callback) {
	new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			callback(entry.intersectionRatio > 0);
		});
	}).observe(_element);
	if(!callback) return new Promise(r => callback=r);
}

function setCookie(name,value,days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}