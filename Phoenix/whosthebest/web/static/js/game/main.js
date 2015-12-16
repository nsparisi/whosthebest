import {mainControl} from "web/static/js/game/common"
import {inputEngine} from "web/static/js/game/common"

/** THE GAME ITSELF **********************************************************/
function input() 
{
    inputEngine.update();
}

function update() 
{
    mainControl.update();
}

function draw() 
{
    mainControl.render();
}

// Set up game loop.
var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var lastUpdate = new Date().getTime();
export var deltaTimeMs = 0;
function nextFrame() 
{
    var currentTime = new Date().getTime();
    deltaTimeMs = currentTime - lastUpdate;
    
    // UPDATE
    update();
    
    // INPUTS
    input();
    
    // RENDER
    draw();
    
    lastUpdate = currentTime;
    //requestAnimationFrame(nextFrame);
}
// Once everything is set up, start game loop.
//requestAnimationFrame(nextFrame);
setInterval(nextFrame, 1);

