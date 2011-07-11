
(function() {

	Mrmr.Interface = function(app, id) {
		this._app = app;
		this._id = id;
		return this;
	};
	
	Mrmr.Interface.prototype = {
		_app			: null,
		_id				: null,
		_widget			: null,
		
		setWidget: function(widget) {
			this._widget = widget;
		},
		
		setText: function(text) {
			if (text != null && text.length > 0 && this._widget.innerHTML != text) {
				this._widget.innerHTML = text;
			}
		},
		
		setBackgroundColor: function(color) {
			if (color != null && color.length > 0 && this._widget.style.backgroundColor != color) {
				this._widget.style.backgroundColor = color;
			}
		},
		
		setColor: function(color) {
			if (color != null && color.length > 0 && this._widget.style.color != color) {
				this._widget.style.color = color;
			}
		},
		
		setEnabled: function(enabled) {
			if (enabled != null && enabled.length > 0) {
				var disabledBool = enabled != "true";
				if (this._widget.disabled != disabledBool) {
					this._widget.disabled = disabledBool;
				}
			}
		}
	};
	
	
	
	/// BUTTON
	

	Mrmr.Button = function(app, id) {
		this._app = app;
		this._id = id;
		return this;
	};
	
	Mrmr.Button.prototype = new Mrmr.Interface();
	Mrmr.Button.prototype.constructor = Mrmr.Button;
	
	Mrmr.Button.prototype._isPressed = false;
	Mrmr.Button.prototype._isMouseDown = false;
		
	Mrmr.Button.prototype.registerEvents = function(button, enableDefaultAction) {
		this.setWidget(button);
		
		enableDefaultAction = typeof(enableDefaultAction) == 'undefined' ? false : enableDefaultAction;
		
		var that = this;
		
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
	};
	
	Mrmr.Button.prototype.press = function(isPressed) {
		this._app.netChannel.addMessageToQueue(true, Mrmr.Constants.CMDS.BUTTON_PRESS, { id: this._id, value: isPressed });
	};
		
	Mrmr.Button.prototype.click = function() {
		this._app.netChannel.addMessageToQueue(true, Mrmr.Constants.CMDS.BUTTON_CLICK, { id: this._id });
	};
	
	
	
	/// TACTILE ZONE
	
	
	Mrmr.TactileZone = function(app, id) {
		this._app = app;
		this._id = id;
		return this;
	};
	
	Mrmr.TactileZone.prototype = new Mrmr.Interface();
	Mrmr.TactileZone.prototype.constructor = Mrmr.TactileZone;
	
	Mrmr.TactileZone.prototype._isOver = false;
	Mrmr.TactileZone.prototype._isPressed = false;
	Mrmr.TactileZone.prototype._mousePosition = {};
	Mrmr.TactileZone.prototype._mousePositionNormalized = {};
			
	Mrmr.TactileZone.prototype.registerEvents = function(div) {
		this.setWidget(div);
		
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
	};
		
	Mrmr.TactileZone.prototype.addHover = function() {
		if (!this._isOver) {
			this._app.hoveredComponents[this._id] = this;
			this._isOver = true;
		}
	};
		
	Mrmr.TactileZone.prototype.removeHover = function() {
		if (this._isOver) {
			delete(this._app.hoveredComponents[this._id]);
			this._isOver = false;
		}
	};
		
	Mrmr.TactileZone.prototype.move = function(x, y, element) {
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
//		document.getElementById('text').innerHTML = "coords " + x + " " + y; 
		
		// Clamp between 0-1 of window size
		this._mousePositionNormalized.x = Math.max(0.0, Math.min(1.0, x / width));
		this._mousePositionNormalized.y = Math.max(0.0, Math.min(1.0, y / height));
	};
	
	Mrmr.TactileZone.prototype.update = function() {
		this._app.netChannel.addMessageToQueue(false, Mrmr.Constants.CMDS.TACTILE_MOVE,
				{ id: this._id, x: (this._mousePositionNormalized.x*100) << 0, y: (this._mousePositionNormalized.y*100) << 0 });
	};
	
	Mrmr.TactileZone.prototype.press = function(isPressed) {
		this._app.netChannel.addMessageToQueue(true, Mrmr.Constants.CMDS.TACTILE_PRESS, { id: this._id, value: isPressed });
	};
	
	
	
	/// TEXT
	
	
	Mrmr.Text = function(app, id) {
		this._app = app;
		this._id = id;
		return this;
	};
	
	Mrmr.Text.prototype = new Mrmr.Interface();
	Mrmr.Text.prototype.constructor = Mrmr.Text;
	
	Mrmr.Text.prototype._isOver = false;
	Mrmr.Text.prototype._isPressed = false;
	Mrmr.Text.prototype._mousePosition = {};
	Mrmr.Text.prototype._mousePositionNormalized = {};
	
	Mrmr.Text.prototype.registerEvents = function(text) {
		this.setWidget(text);
		
		var that = this;
		
		text.onkeyup = function(e) {
			// ascii 13 is carriage return
			if (e.which == 13) {
				that.enter(this.value);
				return false;
			}
		};
	};
	
	Mrmr.Text.prototype.enter = function(string) {
		this._app.netChannel.addMessageToQueue(true, Mrmr.Constants.CMDS.TEXT_ENTER, { id: this._id, value: string });
	};
	
	Mrmr.Text.prototype.setText = function(text) {
		this._widget.value = text;
	};
	
}());
