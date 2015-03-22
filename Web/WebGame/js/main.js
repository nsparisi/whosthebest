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
var serverTranslator = new ServerTranslator();
var mainControl = new MainControl();
mainControl.initialize();
var inputEngine = new InputEngine();
inputEngine.initialize();

//var generationEngine = new GenerationEngine();
//var gameEngine = new GameEngine();
//var graphicsEngine = new GraphicsEngine();
//gameEngine.initialize();
//graphicsEngine.initialize();

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
var deltaTimeMs = 0;
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

