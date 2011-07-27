(function(){
	Mrmr.Constants = {
		OSC_CONFIG: {
			ADDRESS: "127.0.0.1"
		},
	
		OSC_CLIENT_CONFIG: {
			PORT: 8899
		},
	
		OSC_SERVER_CONFIG: {
			PORT: 8898
		},

		CMDS: {
			BUTTON_PRESS: 		0x00A1,
			BUTTON_CLICK:		0x00A2,
			TACTILE_MOVE:		0x00A3,
			TACTILE_PRESS:		0x00A4,
			TEXT_ENTER:			0x00A5
		}
	};
	
	for (var i = 2; i < process.argv.length; i++) {
		var arg = process.argv[i];
		if (arg.length > 2 && arg[0] == '-') {
			switch (arg[1]) {
			case 'c':
				Mrmr.Constants.OSC_CLIENT_CONFIG.PORT = parseInt(arg.substring(2));
				console.log("OSC client port:", Mrmr.Constants.OSC_CLIENT_CONFIG.PORT);
				break;
			case 's':
				Mrmr.Constants.OSC_SERVER_CONFIG.PORT = parseInt(arg.substring(2));
				console.log("OSC server port:", Mrmr.Constants.OSC_SERVER_CONFIG.PORT);
				break;
			}
		}
	}

	
})();