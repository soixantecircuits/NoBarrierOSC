
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
		
		lastWorldGameTick		: -1,

		registerElements: function() {
			
			var that = this;
			
			// Buttons
			var doc = document.getElementsByTagName('button');
			
			for (var i = 0; i < doc.length; i++){
				var button = new Mrmr.Button(that, doc[i].id);
				button.registerEvents(doc[i], false);
				this.components[doc[i].id] = button;
			}
			
			// Divs
			var doc = document.getElementsByTagName('div');
			
			for (var i = 0; i < doc.length; i++){
				var div = new Mrmr.TactileZone(that, doc[i].id);
				div.registerEvents(doc[i]);
				this.components[doc[i].id] = div;
			}
			
			// Inputs
			var doc = document.getElementsByTagName('input');
			
			for (var i = 0; i < doc.length; i++){
				var type = doc[i].type;
				
				if (type == 'radio') {
					var radio = new Mrmr.Button(that, doc[i].id);
					radio.registerEvents(doc[i], true);
					this.components[doc[i].id] = radio;
				} else if (type == 'text') {
					var text = new Mrmr.Text(that, doc[i].id);
					text.registerEvents(doc[i]);
					this.components[doc[i].id] = text;
				}
			}
		},

		update: function() {
			this.updateClock();
			
			// Tactile zones
			
			for (var hc in this.hoveredComponents) {
				var div = this.hoveredComponents[hc];
				div.update();
			}
			
			// From the received messages, update the DOM objects
			
			var worldDescriptionBuffer = this.netChannel.getIncomingWorldUpdateBuffer();
			var worldDescription = worldDescriptionBuffer[worldDescriptionBuffer.length-1];
			
			if (worldDescription != null) {
				if (worldDescription.gameTick != this.lastWorldGameTick) {
					// We have seen a new world description
					this.lastWorldGameTick = worldDescription.gameTick;
					
					var that = this;
					
					worldDescription.forEach(function(entityid, entity) {
						var component = that.components[entityid];
						component.setText(entity.text);
						component.setBackgroundColor(entity.backgroundColor);
						component.setColor(entity.color);
						component.setEnabled(entity.enabled);
					}, this);
				}
			}
			
			this.netChannel.tick();
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
			entityDescription.entityid = entityDescAsArray[0];
			entityDescription.backgroundColor = entityDescAsArray[1];
			entityDescription.color = entityDescAsArray[2];
			entityDescription.text = entityDescAsArray[3];
			entityDescription.enabled = entityDescAsArray[4];
			
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
	
	/**
	 * Required methods for the Mrmr ClientApp field
	 */
	Mrmr.ClientAppField = {
		setText: function(text) {},
		setBackgroundColor: function(color) {},
		setColor: function(color) {},
		setEnabled: function(enabled) {}
	};

}());