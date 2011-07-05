
(function(){
	Mrmr.Controller = function(anEntityId) {
		this.entityid = anEntityId;
		return this;
	};
	
	Mrmr.Controller.prototype = new RealtimeMultiplayerGame.model.GameEntity();
	Mrmr.Controller.prototype.constructor = Mrmr.Controller;
	
	Mrmr.Controller.prototype = {
		// Connection info
		entityid			: "",
		backgroundColour	: "#000000",
		colour				: "#FFFFFF",
		text				: "",
		display				: "default",
		
		update: function(key, value) {
			this[key] = value;
		},
		
		/**
		 * Construct an entity description for this object, it is essentually a CSV so you have to know how to read it on the receiving end
		 * @param wantsFullUpdate	If true, certain things that are only sent when changed are always sent
		 */
		constructEntityDescription: function(gameTick, wantsFullUpdate) {
			var returnString = this.entityid;
				returnString += "," + this.backgroundColour;
				returnString += "," + this.colour;
				returnString += "," + this.text;
				returnString += "," + this.display;

			return returnString;
		}
	};
})();