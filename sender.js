function sendMessage(message) {
	Call(
		'Lora.SendBytes',
		{ id: 100, data: btoa(message) },
		function (_, err_code, err_msg) {
			if (err_code !== 0) {
				console.log('Sent: ', message);
			}
		}
	);
};

function httpServerHandler(request, response) {
	let params = parseQS(request.query);

	console.log(JSON.stringify(params));

	if (
		typeof params.target === "undefined" ||
		typeof params.lock === "undefined"
	) {
		response.code = 400;
		response.body =
			"No target or lock state parameter in query string";
		response.send();
	} else {
		sendMessage(JSON.stringify({
			command: 'lock',
			target: Number(params.target),
			lock: params.lock == 'true'
		}))
		response.code = 200;
		response.body =
			"Done";
		response.send();
	}
}

function parseQS(qs) {
	let params = {};
	if (qs.length === 0) return params;
	let paramsArray = qs.split("&");
	for (let idx in paramsArray) {
		let kv = paramsArray[idx].split("=");
		params[kv[0]] = kv[1] || null;
	}
	return params;
}


HTTPServer.registerEndpoint('api', httpServerHandler);

function Str(d) { //Upgrade JSON.stringify
	try {
		if (d === null || d === undefined) return null; if (typeof d === 'string') return d;
		return JSON.stringify(d);
	} catch (e) {
		ErrorMsg(e, 'Str()');
	}
}
function Cut(f, k, o, i) { //Upgrade slice f=fullData, k=key-> where to cut, o=offset->offset behind key, i=invertCut
	try {
		let s = f.indexOf(k); if (s === -1) return; if (o) s = s + o.length || s + o; if (i) return f.slice(0, s);
		return f.slice(s);
	} catch (e) { ErrorMsg(e, 'Cut()'); }
}

function ErrorChk(r, e, m, d) { //Shelly.call error check
	try {
		aC--; if (aC < 0) aC = 0;
		if (d.CB && d.uD) d.CB(r, d.uD); if (d.CB && !d.uD) d.CB(r);
		if (!d.CB && d.uD) print('Debug: ', d.uD); if (e) throw new Error(Str(m));
		if (Str(r) && Str(r.code) && r.code !== 200) throw new Error(Str(r));
	} catch (e) { ErrorMsg(e, 'ErrorChk(), call Answer'); }
}
function Cqueue() { //Shelly.call queue
	try {
		if (!cCache[0] && !nCall[0]) return; if (!nCall[0]) { nCall = cCache[0]; cCache.splice(0, 1); }
		if (nCall[0] && aC < callLimit) { Call(nCall[0], nCall[1], nCall[2], nCall[3], nCall[4]); nCall = []; }
		if ((nCall[0] || cCache[0]) && !tH7) tH7 = Timer.set(1000 * cSp, 0, function () { tH7 = 0; Cqueue(); });
	} catch (e) { ErrorMsg(e, 'Cqueue()'); }
}
function Call(m, p, CB, uD, deBug) { //Upgrade Shelly.call 
	try {
		let d = {};
		if (deBug) print('Debug: calling:', m, p); if (CB) d.CB = CB; if (Str(uD)) d.uD = uD; if (!m && CB) { CB(uD); return; }
		if (aC < callLimit) { aC++; Shelly.call(m, p, ErrorChk, d); } else if (cCache.length < cacheLimit) {
			cCache.push([m, p, CB, uD, deBug]); if (deBug) print('Debug: save call:', m, p, ', call queue now:', cCache.length); Cqueue();
		} else { throw new Error('to many Calls in use, droping call: ' + Str(m) + ', ' + Str(p)); }
	} catch (e) { ErrorMsg(e, 'Call()'); }
}

function ErrorMsg(e, s) { //Toolbox formatted Error Msg
	try {
		let i = 0; if (Cut(e.message, '-104: Timed out')) i = 'wrong URL or device may be offline';
		if (s === 'Main()') i = e.stack; if (Cut(e.message, '"Main" is not')) i = 'define a Main() function before using Setup()';
		print('Error:', s || "", '---> ', e.type, e.message); if (i) print('Info: maybe -->', i);
	} catch (e) { print('Error: ErrorMsg() --->', e); }
}
var tH7 = 0, aC = 0, cCache = [], nCall = [], callLimit = 5, cacheLimit = 40, cSp = 0.2; //Toolbox global variable