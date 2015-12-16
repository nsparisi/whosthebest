//********************
// Page elements
//********************
export var CANVAS_WIDTH = 480;
export var CANVAS_HEIGHT = 360;
export var canvasElement = document.getElementById("gameCanvas");
canvasElement.width = CANVAS_WIDTH;
canvasElement.height = CANVAS_HEIGHT;
export var canvasContext = canvasElement.getContext("2d");
export var bodyElement = document.getElementsByTagName("body")[0];

import {InputEngine} from "web/static/js/game/input"
import {MainControl} from "web/static/js/game/main_control"
import {ServerTranslator} from "web/static/js/game/server_translator"

//********************
// Main engines
//********************
export var serverTranslator = new ServerTranslator();
export var mainControl = new MainControl();
mainControl.initialize();
export var inputEngine = new InputEngine();
inputEngine.initialize();