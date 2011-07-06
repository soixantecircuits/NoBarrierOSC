
(function(){
	
	Mrmr.Controller = function(anEntityId) {
		this.entityid = anEntityId;
		return this;
	};
	
	Mrmr.Controller.prototype = new RealtimeMultiplayerGame.model.GameEntity();
	Mrmr.Controller.prototype.constructor = Mrmr.Controller;
	
	Mrmr.Controller.prototype.entityid = "";
	Mrmr.Controller.prototype.backgroundColor = "";
	Mrmr.Controller.prototype.color = "";
	Mrmr.Controller.prototype.text = "";
	Mrmr.Controller.prototype.enabled = "";
	
	Mrmr.Controller.prototype._updated = true;
		
	Mrmr.Controller.prototype.update = function(key, value) {
		this[key] = value;
		this._updated = true;
	};
		
	/**
	 * Construct an entity description for this object, it is essentually a CSV so you have to know how to read it on the receiving end
	 * @param wantsFullUpdate	If true, certain things that are only sent when changed are always sent
	 */
	Mrmr.Controller.prototype.constructEntityDescription = function(gameTick, wantsFullUpdate) {
		var returnString = this.entityid;
			returnString += "," + this.backgroundColor;
			returnString += "," + this.color;
			returnString += "," + this.text;
			returnString += "," + this.enabled;

		return returnString;
	};
	
	Mrmr.Controller.prototype.isStale = function() {
		if (this._updated) {
			this._updated = false;
			console.log("fresh");
			return false;
		} else {
//			console.log("stale");
			return true;
		}
	};
	
})();