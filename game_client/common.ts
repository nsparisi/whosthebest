/// <reference path="references.ts" />

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 360;

var canvasElement = <HTMLCanvasElement> document.getElementById("gameCanvas");
canvasElement.width = CANVAS_WIDTH;
canvasElement.height = CANVAS_HEIGHT;
canvasElement.hidden = true;

var canvasContext = canvasElement.getContext("2d");
var bodyElement = document.getElementsByTagName("body")[0];
   
var deltaTimeMs = 0;

//********************
// Main engines
//********************
// MainControl.Instance.initialize();
// InputEngine.Instance.initialize(bodyElement);

// create the game engines
// handles Input, Game, Server logic
var main = new Main();
//main.begin();

// create the Phaser game instance
// handles Graphics logic
const GAME_INSTANCE = new Whosthebest.Graphics.Game_WhosTheBest();
