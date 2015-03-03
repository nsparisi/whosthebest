//********************
// Page elements
//********************
var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 360;
var canvasElement = document.getElementById("gameCanvas");
canvasElement.width = CANVAS_WIDTH;
canvasElement.height = CANVAS_HEIGHT;
var canvasContext = canvasElement.getContext("2d");
var bodyElement = document.getElementsByTagName("body")[0];

//********************
// Main engines
//********************
var generationEngine = new GenerationEngine();
var gameEngine = new GameEngine();
var graphicsEngine = new GraphicsEngine();
gameEngine.initialize();
graphicsEngine.initialize();


/** THE GAME ITSELF **********************************************************/
// Game state:
function input() 
{
    // store last frame
    for(var k in keysCurrent) 
    { 
        keysPrevious[k] = keysCurrent[k];
    }
    clickPrevious = click;
}

function update() 
{
    // TODO
    generationEngine.update();
}

function draw() 
{
    graphicsEngine.update();
}

/** THE GAME "ENGINE" ********************************************************/
var keysPrevious = {};
var keysCurrent = {};
var click = null;
var clickPrevious = null;

// Listen for key presses.
function canvasKeyDown(e) 
{
    keysCurrent[String.fromCharCode(e.which)] = true;
    //console.log(String.fromCharCode(e.which));
}
function canvasKeyUp(e) 
{
    keysCurrent[String.fromCharCode(e.which)] = false;
}
bodyElement.onkeydown = canvasKeyDown;
bodyElement.onkeyup = canvasKeyUp;

// Listen for clicks.
function canvasClick(e) 
{
    click = { "x": e.offsetX, "y": e.offsetY };
}
//$('#gameCanvas').click(canvasClick);
bodyElement.onmousedown = canvasClick;


// Set up game loop.
var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var lastUpdate = new Date().getTime();
var deltaTimeMs = 0;
function nextFrame() 
{
    var currentTime = new Date().getTime();
    deltaTimeMs = currentTime - lastUpdate;
    
    // UPDATE
    update(deltaTimeMs);
    
    // INPUTS
    input(deltaTimeMs);
    click = null;
    
    // RENDER
    draw(deltaTimeMs);
    
    lastUpdate = currentTime;
    //requestAnimationFrame(nextFrame);
}
// Once everything is set up, start game loop.
//requestAnimationFrame(nextFrame);
setInterval(nextFrame, 1);

