
(function() {
	
	Mrmr.Button = function(app, id) {
		this._app = app;
		this._id = id;
	};
	
	Mrmr.Button.prototype = {
		
		_app					: null,
		_id						: null,
		_isPressed				: false,
		_isMouseDown            : false,

		registerEvents: function(button, enableDefaultAction) {
			var that = this;
			
			enableDefaultAction = typeof(enableDefaultAction) == 'undefined' ? false : enableDefaultAction;
			
			button.onmousedown = function() {
				that.press(true);
				that._isMouseDown = true;
				that._isPressed = true;
			};
			
			button.onmouseout = function() {
				if (that._isMouseDown) {
					that.press(false);
					that._isPressed = false;
				}
			};
			
			button.onmouseover = function() {
				if (that._isMouseDown) {
					that.press(true);
					that._isPressed = true;
				}
			};
			
			button.onmouseup = function() {
				if (that._isMouseDown) {
					that.press(false);
					that._isMouseDown = false;
					that._isPressed = false;
				}
			};
			
			button.onclick = function() {
				that.click();
				return enableDefaultAction;
			};
		},
		
		press: function(isPressed) {
			this._app.netChannel.addMessageToQueue(true, Mrmr.Constants.CMDS.BUTTON_PRESS, { id: this._id, value: isPressed });
		},
		
		click: function() {
			this._app.netChannel.addMessageToQueue(true, Mrmr.Constants.CMDS.BUTTON_CLICK, { id: this._id });
		}
		
	};
	
}());

(function() {
	
	Mrmr.TactileZone = function(app, id) {
		this._app = app;
		this._id = id;
	};
	
	Mrmr.TactileZone.prototype = {
			
		_app					: null,
		_id						: null,
		
		_isOver					: false,
		_isPressed				: false,
		_mousePosition			: {},		// Actual mouse position
		_mousePositionNormalized: {},		// Mouse position 0-1

		/**
		 * Initialize mouse/touch events
		 */
		registerEvents: function(div) {
			var that = this;
			
			div.onmousedown = function(e) {
				that.press(true);
				that._isMouseDown = true;
				that._isPressed = true;
			};
			
			div.onmouseout = function(e) {
				if (that._isMouseDown) {
					that.press(false);
					that._isPressed = false;
				}
				
				that.removeHover();
			};
			
			div.onmouseover = function(e) {
				if (that._isMouseDown) {
					that.press(true);
					that._isPressed = true;
				}
				
				that.addHover();
			};
			
			div.onmouseup = function(e) {
				if (that._isMouseDown) {
					that.press(false);
					that._isMouseDown = false;
					that._isPressed = false;
				}
				
				that.removeHover();
			};
			

			div.ontouchstart = function(e) {
				that.addHover();
				e.preventDefault();
			};
			
			div.ontouchend = function(e) {
				that.removeHover();
				e.preventDefault();
			};
			
			div.ontouchcancel = function(e) { 
				that.removeHover();
				e.preventDefault();
			};

			div.onmousemove = function(e) {
				var x, y;

				// Get the mouse position relative to the canvas element.
				if (e.layerX || e.layerX == 0) { // Firefox
					x = e.layerX;
					y = e.layerY;
				} else if (e.offsetX || e.offsetX == 0) { // Opera
					x = e.offsetX;
					y = e.offsetY;
				}
				
				that.move(x, y, this);
			};
			
			div.ontouchmove = function(e) {
				var x, y;

				var touches = event.changedTouches,
				      first = touches[0],
				          x = first.pageX;
				          y = first.pageY;
				
				that.move(x, y, this);
			};
		},
		
		addHover: function() {
			if (!this._isOver) {
				this._app.hoveredComponents[this._id] = this;
				this._isOver = true;
			}
		},
		
		removeHover: function() {
			if (this._isOver) {
				delete(this._app.hoveredComponents[this._id]);
				this._isOver = false;
			}
		},
		
		move: function(x, y, element) {
			var curLeft = curTop = 0;
			var obj = element;
			
			// Find absolute offset
			
			if (obj.offsetParent) {
				do {
					curLeft += obj.offsetLeft;
					curTop += obj.offsetTop;
				} while (obj = obj.offsetParent);
			}
			
			x -= curLeft;
			y -= curTop;
			
			this._mousePosition.x = x;
			this._mousePosition.y = y;
			
			var width = $(element).width();
			var height = $(element).height();
			
			// DEBUG
			document.getElementById('text').innerHTML = "coords " + x + " " + y; 
			
			// Clamp between 0-1 of window size
			this._mousePositionNormalized.x = Math.max(0.0, Math.min(1.0, x / width));
			this._mousePositionNormalized.y = Math.max(0.0, Math.min(1.0, y / height));
		},
		
		update: function() {
			this._app.netChannel.addMessageToQueue(false, Mrmr.Constants.CMDS.TACTILE_MOVE,
					{ id: this._id, x: (this._mousePositionNormalized.x*100) << 0, y: (this._mousePositionNormalized.y*100) << 0 });
		},
		
		press: function(isPressed) {
			this._app.netChannel.addMessageToQueue(true, Mrmr.Constants.CMDS.TACTILE_PRESS, { id: this._id, value: isPressed });
		}
	};
	
}());

(function() {
	
	Mrmr.Text = function(app, id) {
		this._app = app;
		this._id = id;
	};
	
	Mrmr.Text.prototype = {
		
		_app					: null,
		_id						: null,

		registerEvents: function(text) {
			var that = this;
			
			text.onkeyup = function(e) {
				// ascii 13 is carriage return
				if (e.which == 13) {
					that.enter(this.value);
					return false;
				}
			};
		},
		
		enter: function(string) {
			this._app.netChannel.addMessageToQueue(true, Mrmr.Constants.CMDS.TEXT_ENTER, { id: this._id, value: string });
		}
	};
	
}());

(function(){

	Mrmr.ClientApp = function() {
		this.gameClockReal = new Date().getTime();
		this.netChannel = new RealtimeMultiplayerGame.ClientNetChannel( this );
		
		this.registerElements();
	};

	Mrmr.ClientApp.prototype = {

		gameClockReal  			: 0,											// Actual time via "new Date().getTime();"
		gameClock				: 0,											// Seconds since start
		gameTick				: 0,											// Ticks/frames since start

		speedFactor				: 1,											// Used to create Framerate Independent Motion (FRIM) - 1.0 means running at exactly the correct speed, 0.5 means half-framerate. (otherwise faster machines which can update themselves more accurately will have an advantage)
		targetFramerate			: 60,											// Try to call our tick function this often, intervalFramerate, is used to determin how often to call settimeout - we can set to lower numbers for slower computers

		netChannel				: null,											// ClientNetChannel instance
		entityController		: null,											// entityController
		cmdMap					: {},											// Map some custom functions if wnated
		
		components				: {},
		hoveredComponents		: {},

		registerElements: function() {
			
			var that = this;
			
			// Buttons
			var doc = document.getElementsByTagName('button');
			
			for (var i = 0; i < doc.length; i++){
				var button = new Mrmr.Button(that, doc[i].id);
				button.registerEvents(doc[i], false);
			}
			
			// Divs
			var doc = document.getElementsByTagName('div');
			
			for (var i = 0; i < doc.length; i++){
				var div = new Mrmr.TactileZone(that, doc[i].id);
				div.registerEvents(doc[i]);
			}
			
			// Inputs
			var doc = document.getElementsByTagName('input');
			
			for (var i = 0; i < doc.length; i++){
				var type = doc[i].type;
				
				if (type == 'radio') {
					var radio = new Mrmr.Button(that, doc[i].id);
					radio.registerEvents(doc[i], true);
				} else if (type == 'text') {
					var text = new Mrmr.Text(that, doc[i].id);
					text.registerEvents(doc[i]);
				}
			}

		},

		update: function() {
			this.updateClock();
			
			for (var hc in this.hoveredComponents) {
				var div = this.hoveredComponents[hc];
				div.update();
			}
			
			this.netChannel.tick();
//			this.entityController.tick(this.speedFactor, this.gameClockReal, this.gameTick);
		},

		/**
		 * Updates the gameclock and sets the current
		 */
		updateClock: function() {
			//
			// Store previous time and update current
			var oldTime = this.gameClockReal;
			this.gameClockReal = new Date().getTime();

			// Our clock is zero based, so if for example it says 10,000 - that means the game started 10 seconds ago
			var delta = this.gameClockReal - oldTime;
			this.gameClock += delta;
			this.gameTick++;

			// Framerate Independent Motion -
			// 1.0 means running at exactly the correct speed, 0.5 means half-framerate. (otherwise faster machines which can update themselves more accurately will have an advantage)
			this.speedFactor = delta / ( 1000/this.targetFramerate );
			if (this.speedFactor <= 0) this.speedFactor = 1;
		},

		netChannelDidConnect: function() {
			this.joinGame( "user" + this.netChannel.getClientid() );
		},

		netChannelDidReceiveMessage: function( aMessage ) {
			this.log("RecievedMessage", aMessage);
		},
		netChannelDidDisconnect: function() {
			this.log("netChannelDidDisconnect", arguments);
		},

		/**
		 * Called by the ClientNetChannel, it sends us an array containing tightly packed values and expects us to return a meaningful object
		 * It is left up to each game to implement this function because only the game knows what it needs to send.
		 * However the 4 example projects in RealtimeMultiplayerNodeJS offer should be used ans examples
		 *
		 * @param {Array} entityDescAsArray An array of tightly packed values
		 * @return {Object} An object which will be returned to you later on tied to a specific entity
		 */
		parseEntityDescriptionArray: function(entityDescAsArray)
		{
			var entityDescription = {};

			// It is left upto each game to implement this function because only the game knows what it needs to send.
			// However the 4 example projects in RealtimeMultiplayerNodeJS offer this an example
			entityDescription.entityid = +entityDescAsArray[0];
			entityDescription.clientid = +entityDescAsArray[1];
			entityDescription.entityType = +entityDescAsArray[2];
			entityDescription.x = +entityDescAsArray[3];
			entityDescription.y = +entityDescAsArray[4];

			return entityDescription;
		},
		getGameClock: function() {
		   return this.gameClock;
		},

		/**
		 * Called when the user has entered a name, and wants to join the match
		 * @param aNickname
		 */
		joinGame: function(aNickname)
		{
			this.nickname = aNickname;
			// Create a 'join' message and queue it in ClientNetChannel
			this.netChannel.addMessageToQueue( true, RealtimeMultiplayerGame.Constants.CMDS.PLAYER_JOINED, { nickname: this.nickname } );
		},

		// Display messages some fancy way
		log: function() { console.log.apply(console, arguments); }

	};
}());