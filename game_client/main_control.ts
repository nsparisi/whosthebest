/// <reference path="references.ts" />

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
        // deprecated
    }

    switchToGame =  (randomSeed: number, isPracticeGame: boolean) =>
    {
        GameEngine.Instance.initialize(randomSeed);
        GenerationEngine.Instance.initialize();

        GenerationEngine.Instance.setAsPracticeGame(isPracticeGame);

        this.currentGameState = GameStateType.Match;
    }

    switchToMenu = () =>
    {
        // REMOVED
        this.currentGameState = GameStateType.MainMenu;
        // MainMenu.Instance.initialize();
    }
}