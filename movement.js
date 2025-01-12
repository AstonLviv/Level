import * as pc from 'playcanvas';

function initButton(button) {
    button.pressed = false, 
    button.on("pressedstart", (function (t) { button.pressed = true;  }), this);
    button.on("pressedend",   (function (t) { button.pressed = false; }), this);
}
// var ButtonClick = pc.createScript("ButtonClick");
// ButtonClick.prototype.initialize = function () { 
//     this.entity.pressed = false, 
//     this.entity.button.on("pressedstart",   (function (t) { this.entity.pressed = true;  }), this);
//     this.entity.button.on("pressedend",     (function (t) { this.entity.pressed = false; }), this);
//     console.log("ButtonClick.prototype.initialize");
// }, 
    
// ButtonClick.prototype.update = function (t) { };