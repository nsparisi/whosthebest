/// <reference path="references.ts" />

// global vars used in various classes
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
main.begin();
MainControl.Instance.switchToMenu();

// create the Phaser game instance
// handles Graphics logic
const GAME_INSTANCE = new Whosthebest.Graphics.Game_WhosTheBest();
