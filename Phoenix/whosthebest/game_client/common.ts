/// <reference path="references.ts" />
Debug.log("common.ts");

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 360;

var canvasElement = <HTMLCanvasElement> document.getElementById("gameCanvas");
canvasElement.width = CANVAS_WIDTH;
canvasElement.height = CANVAS_HEIGHT;

var canvasContext = canvasElement.getContext("2d");
var bodyElement = document.getElementsByTagName("body")[0];
   
var deltaTimeMs = 0;

//********************
// Main engines
//********************
// ServerTranslator.Instance;
// MainControl.Instance.initialize();
// InputEngine.Instance.initialize(bodyElement);

// // Run the game -- executed when the script is loaded
// var main = new Main();
// main.begin();

var bootstrapper = new Bootstrap.Bootstrapper();
bootstrapper.start();

PhaserTest.CreateTest();