/// <reference path="references.ts" />
Debug.log("common.ts");

const CANVAS_WIDTH = 0;
const CANVAS_HEIGHT = 0;

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

// Screen saver test
//PhaserTest.CreateTest();

// real deal
const GAME_INSTANCE = new Whosthebest.Graphics.Game_WhosTheBest();
