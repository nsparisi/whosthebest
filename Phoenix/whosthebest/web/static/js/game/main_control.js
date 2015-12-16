import {GameEngine} from "web/static/js/game/game"
import {GenerationEngine} from "web/static/js/game/generation"
import {GraphicsEngine} from "web/static/js/game/graphics"
import {MainMenu} from "web/static/js/game/menu"

export function MainControl()
{
    // Match State
    this.generationEngine;
    this.gameEngine;
    this.graphicsEngine;

    // Menu State

    // States
    this.gameStateType =
        {
            MainMenu: 0,
            Match: 1
        }
    this.currentGameState = this.gameStateType.MainMenu;

    var self = this;
    this.initialize = function()
    {
        self.switchToMenu();
    }

    this.update = function()
    {
        if(self.currentGameState == self.gameStateType.MainMenu)
        {
            self.mainMenu.update();
        }
        else if(self.currentGameState == self.gameStateType.Match)
        {
            self.generationEngine.update();
        }
    }

    this.render = function()
    {
        if(self.currentGameState == self.gameStateType.MainMenu)
        {
            self.mainMenu.render();
        }
        else if(self.currentGameState == self.gameStateType.Match)
        {
            self.graphicsEngine.update();
        }
    }

    this.switchToGame = function(randomSeed)
    {
        self.currentGameState = self.gameStateType.Match;

        self.gameEngine = new GameEngine();
        self.generationEngine = new GenerationEngine();
        self.graphicsEngine = new GraphicsEngine();

        self.gameEngine.initialize(randomSeed);
        self.generationEngine.initialize(self.gameEngine);
        self.graphicsEngine.initialize(self.gameEngine);
    }

    this.switchToMenu = function()
    {
        self.currentGameState = self.gameStateType.MainMenu;

        self.mainMenu = new MainMenu();
        self.mainMenu.initialize();
    }
}