const MYID = 1;

Shelly.addEventHandler(
	function (event) {
		if (
			typeof event !== 'object' ||
			event.name !== 'lora' ||
			!event.info ||
			!event.info.data
		) {
			return;
		}
		const message = atob(event.info.data);
		const object = JSON.parse(message)
		console.log(message)
		switch (object.command) {
			case 'lock':
				if (object.target == MYID) {
					Shelly.call("Switch.set", { 'id': 0, 'on': !object.lock });
				}
				break;
			case 'state':
				if (object.target == MYID) {
					console.log(Shelly.call("Switch.GetStatus", { 'id': 0 }));
				}
				break;
		}
	}
);