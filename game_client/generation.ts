/// <reference path="references.ts" />
Debug.log("generation.ts");

/**
 * Generation Engine is responsible for handling frame advancement for the game engine.
 * User input is captured into framedata.
 * Frames are sent and received from the server translator and passed to the game.
 */
class GenerationEngine
{
    // singleton implementation
    static Instance = new GenerationEngine();
    constructor()
    {
        if(GenerationEngine.Instance)
        {
            throw new Error("An instance of GenerationEngine already exists.");
        }
        
        GenerationEngine.Instance = this;
    }

    isPracticeGame = false;

    frameRate = 20;
    elapsed = 0;
    threshold = 1000 / this.frameRate;
    frameCount = 0;
    expectedFrame = 0;
    currentInput = [];
    isPaused = false;
    frameAdvance = false;
    
    initialize = () =>
    {
        this.frameCount = 0;
        this.expectedFrame = 0;
    }

    setAsPracticeGame = (isPracticeGame: boolean) =>
    {
        this.isPracticeGame = isPracticeGame;
    }

    update = () =>
    {
        // figure out button state
        this.updatePlayerInput();
    
        // pause
        if(this.isPaused)
        {
            if(this.frameAdvance)
            {
                this.frameAdvance = false;
                this.sendFrameToServer();
            }

            return;
        }

        // send packets to game on an interval
        this.elapsed += deltaTimeMs;
        if(this.elapsed > this.threshold)
        {
            // If the opponent is slow, we'll send frames out too fast.
            // instead wait for the server to sync us up, then send out next frame
            if(this.frameCount < this.expectedFrame + 2)
            {
                // set to 0, purposefully avoid queueing up many frames at once
                this.elapsed = 0;
                this.sendFrameToServer();
            }
        }
    }

    sendFrameToServer = () =>
    {
        if(!this.isPracticeGame)
        {
            // send frame data to server
            ServerTranslator.Instance.toServerFrame(
                this.frameCount, 
                this.currentInput);
        }
        else 
        {
            // bypass server entirely for practice
            if( GameEngine.Instance.currentGameState == 
                GameEngine.Instance.gameStateTypes.Ended)
            {
                GAME_INSTANCE.switchToMenu();
            }
            else 
            {
                this.generatePracticeData(
                    this.frameCount, 
                    this.currentInput);
            }
        }

        // drains input buffer
        this.drainInput();

        // update frame count
        // todo wrap around
        this.frameCount++;
    }

    generatePracticeData = (frame: number, playerInputs: any[]) =>
    {
        var inputs = [];

        // set player 0 as our own input
        var playerInputAsString = "";
        for(var i = 0; i < playerInputs.length; i++)
        {
            playerInputAsString += ServerTranslator.Instance.PLAYERINPUT_DELIMETER;
            playerInputAsString += playerInputs[i];
        }
        inputs.push(playerInputAsString);

        // TODO set player 1 with random inputs
        inputs.push("");

        // bypass server call, and send data back to client
        var data = new FrameData("test", frame.toString(), inputs);
        this.receiveFrameFromServer(data);
    }

    receiveFrameFromServer = (frameData) =>
    {
        // FrameData object
        // time : Long
        // frame : Integer
        // inputs : Array

        if(frameData.frame == this.expectedFrame)
        {
            GameEngine.Instance.update(frameData.inputs);
            this.expectedFrame++;
        }
        else 
        {
            Debug.log("[generation]frame mismatch.");
            Debug.log("[generation]    Expected: " + this.expectedFrame);
            Debug.log("[generation]    Received: " + frameData.frame);
        }
    }
    
    updatePlayerInput = () =>
    {
        var inputDelimiter = GameEngine.Instance.inputDelimiter;
        var inputTypes = GameEngine.Instance.inputTypes;

        if(InputEngine.Instance.justPressed("W"))
        {
            this.currentInput.push(inputTypes.Up);
        }
        
        if(InputEngine.Instance.justPressed("S"))
        {
            this.currentInput.push(inputTypes.Down);
        }
        
        if(InputEngine.Instance.justPressed("A"))
        {
            this.currentInput.push(inputTypes.Left);
        }
        
        if(InputEngine.Instance.justPressed("D"))
        {
            this.currentInput.push(inputTypes.Right);
        }
        
        if(InputEngine.Instance.justPressed("¿") || InputEngine.Instance.justClicked())
        {
            this.currentInput.push(inputTypes.Swap);
        }

        if( InputEngine.Instance.justPressed("Q") || 
            InputEngine.Instance.justPressed("E") || 
            InputEngine.Instance.justPressed(" "))
        {
            this.currentInput.push(inputTypes.Elevate);
        }

        // debugging frame control
        if(InputEngine.Instance.justPressed("P"))
        {
            this.isPaused = !this.isPaused;
        }
        if(InputEngine.Instance.justPressed("k")) // +
        {
            this.frameRate = Math.min(this.frameRate + 3, 60);
            this.threshold = 1000 / this.frameRate;
        }
        if(InputEngine.Instance.justPressed("m")) // -
        {
            this.frameRate = Math.max(this.frameRate - 3, 1);
            this.threshold = 1000 / this.frameRate;
        }
        if(InputEngine.Instance.justPressed("Ü")) // '\'
        {
            this.isPaused = true;
            this.frameAdvance = true;
        }
    }
    
    drainInput = () =>
    {
        this.currentInput = []
    }
}