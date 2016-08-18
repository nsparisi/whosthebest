/// <reference path="references.ts" />
Debug.log("main_control.ts");

enum GameStateType
    {
        MainMenu,
        Match
    }

/**
 * Pipes updates to either the main menu or the game in progress.
 */
class MainControl
{
    // singleton implementation
    static Instance = new MainControl();
    constructor()
    {
        if(MainControl.Instance)
        {
            throw new Error("An instance of MainControl already exists.");
        }
        
        MainControl.Instance = this;
    }

    // States
    currentGameState = GameStateType.MainMenu;

    initialize = () =>
    {
        ServerTranslator.Instance.initialize();
        this.switchToMenu();
    }

    update = () =>
    {
        if(this.currentGameState == GameStateType.MainMenu)
        {
            //MainMenu.Instance.update();
        }
        else if(this.currentGameState == GameStateType.Match)
        {
            GenerationEngine.Instance.update();
        }
    }

    render = () =>
    {
        if(this.currentGameState == GameStateType.MainMenu)
        {
            //MainMenu.Instance.render();
        }
        else if(this.currentGameState == GameStateType.Match)
        {
            GraphicsEngine.Instance.update();
        }
    }

    switchToGame =  (randomSeed: number) =>
    {
        this.currentGameState = GameStateType.Match;

        GameEngine.Instance.initialize(randomSeed);
        GenerationEngine.Instance.initialize();
        GraphicsEngine.Instance.initialize();
    }

    switchToMenu = () =>
    {
        // REMOVED
        this.currentGameState = GameStateType.MainMenu;
        // MainMenu.Instance.initialize();
    }
}