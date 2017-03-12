/// <reference path="references.ts" />

/**
 * Main entry point for the game
 */
class Main {   

    // singleton implementation
    static Instance = new Main();
    constructor()
    {
        if(Main.Instance)
        {
            throw new Error("An instance of Main already exists.");
        }
        
        Main.Instance = this;
    }

    public isRunning = false;
    private isInitialized = false;

    public begin = () =>
    {
        // only run once
        if(this.isInitialized)
        {
            return;
        }
        this.isInitialized = true;

        // setup time variables
        var currentTime = 0;
        var lastUpdate = new Date().getTime();
        deltaTimeMs = 0;

        // Set up game loop.
        var nextFrame = () =>
        {
            currentTime = new Date().getTime();
            deltaTimeMs = currentTime - lastUpdate;
            
            if(this.isRunning)
            {
                // UPDATE
                GenerationEngine.Instance.update();
                
                // INPUTS
                InputEngine.Instance.update();
            }
            
            // RENDER
            // rendering loop is handled by Phaser.
            
            lastUpdate = currentTime;
        }
        
        // tells the browser to call the nextFrame 
        // as fast as possible (1 ms interval)
        setInterval(nextFrame, 1);
    }
}

// global vars used in various classes
var bodyElement = document.getElementsByTagName("body")[0];
var deltaTimeMs = 0;

// create the sound manager
const SOUND_MANAGER = new Whosthebest.Graphics.SoundManager();

// create the Phaser game instance
const GAME_INSTANCE = new Whosthebest.Graphics.Game_WhosTheBest();

// create two game engines
// local: client-side prediction. we will render this one.
// server: accurate server game state.
const SERVER_GAME_ENGINE = new GameEngine(); 
const LOCAL_GAME_ENGINE = new GameEngine();
LOCAL_GAME_ENGINE.isLocalGameInstance = true;

// set up the generation and input engine loop.
// this is a separate loop running outside of Phaser,
// since we would like to see a framerate larger than 60fps if possible.
Main.Instance.begin();

