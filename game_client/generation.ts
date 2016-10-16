/// <reference path="references.ts" />

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

    frameRate = 30;
    frameLengthInMs = 1000 / this.frameRate;
    frameDelay = 30;

    elapsed = 0;
    frameCount = 0;
    expectedFrame = 0;
    currentFrameInGame = 0;
    currentInput = [];
    isPaused = false;
    frameAdvance = false;
    
    receiveBuffer:Array<FrameData> = [];
    
    // NETWORK_DEBUG
    frameTimings: { [key: string]: FrameTimeData; } = { };
    
    // practice AI
    intellegence: Array<IntelligenceEngine>;

    initialize = () =>
    {
        this.elapsed = 0;
        this.frameCount = 0;
        this.expectedFrame = 0;
        this.currentFrameInGame = 0;
        this.frameTimings = {};
        this.receiveBuffer = [];
        this.drainInput();
    }

    setAsPracticeGame = (isPracticeGame: boolean) =>
    {
        this.isPracticeGame = isPracticeGame;

        this.intellegence = [];

        // TODO hack, remove
        this.intellegence.push(new IntelligenceEngine("AILeft", SERVER_GAME_ENGINE.boards[0]));

        var aiIndex = (GAME_INSTANCE.USER_INDEX + 1) % SERVER_GAME_ENGINE.boards.length;
        this.intellegence.push(new IntelligenceEngine("AIRight" + aiIndex, SERVER_GAME_ENGINE.boards[aiIndex]));
    }

    update = () =>
    {
        // figure out button state
        this.updatePlayerInput();
    
        // pause
        if(this.isPaused && !this.frameAdvance)
        {
            return;
        }

        // send packets to game on an interval
        this.elapsed += deltaTimeMs;
        if(this.elapsed > this.frameLengthInMs || this.frameAdvance)
        {
            this.elapsed -= this.frameLengthInMs;
            this.frameAdvance = false;

            // if we haven't received any frames in the time window
            // show errors / warn users etc.
            // TODO need to reset or catch-up users here
            if(this.expectedFrame <= this.frameCount - this.frameDelay)
            {
                //Debug.log("[generation]Buffer is empty.");
                //Debug.log("[generation]    expectedFrame: " + this.expectedFrame);
                //Debug.log("[generation]    frameCount: " + this.frameCount);
                //Debug.log("[generation]    frameDelay: " + this.frameDelay);
                return;
            }

            if(this.isPracticeGame)
            {
                if( SERVER_GAME_ENGINE.currentGameState == 
                    SERVER_GAME_ENGINE.gameStateTypes.Ended)
                {
                    GAME_INSTANCE.switchToMenu();
                }

                this.sendFrameToServer();
                dequeuedFrame = this.receiveBuffer.shift();
                if(dequeuedFrame)
                {
                    SERVER_GAME_ENGINE.update(dequeuedFrame.inputs);
                }

                return;
            }

            // if we've buffered enough, dequeue a frame
            // simulate the frame in the game
            var dequeuedFrame: FrameData = null;
            if( this.receiveBuffer[0] != null && 
                this.currentFrameInGame <= this.frameCount - this.frameDelay)
            {
                dequeuedFrame = this.receiveBuffer.shift();
                SERVER_GAME_ENGINE.update(dequeuedFrame.inputs);
                this.currentFrameInGame++;
            }

            // client-side prediction for input
            // create the array of inputs for each player.
            // inject the local player's inputs with the latest set of input
            var allInputs: string[] = [];
            if(dequeuedFrame != null)
            {
                allInputs = dequeuedFrame.inputs;
            }
            else 
            {
                for(var i = 0; i < LOCAL_GAME_ENGINE.numberOfPlayers; i++)
                {
                    allInputs.push("SKIP");
                }
            }

            var localInput = ServerTranslator.Instance.inputsToString(this.currentInput);
            allInputs[GAME_INSTANCE.USER_INDEX] = localInput;
            LOCAL_GAME_ENGINE.update(allInputs);

            //Debug.log("local-" + allInputs[0] + "::::" + allInputs[1]);
            if(dequeuedFrame != null)
            {
                    //Debug.log("server-" + dequeuedFrame.inputs[0] + "::::" + dequeuedFrame.inputs[1]);
            }

            // send the frame out to the server
            this.sendFrameToServer();
        }
    }

    sendFrameToServer = () =>
    {
        // keep track of all network statistics on the frame
        this.frameTimings[this.frameCount] = new FrameTimeData(this.frameCount);
        this.frameTimings[this.frameCount].timeSent = new Date();

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
            this.generatePracticeData(
                this.frameCount, 
                this.currentInput);
            
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
        //inputs.push(playerInputAsString);

        // set CPU player input from AI engine
        for(var i = 0; i < this.intellegence.length; i++)
        {
            inputs.push(this.intellegence[i].next().toString());
        }

        //Debug.log("inputs " +  inputs[0]);

        // bypass server call, and send data back to client
        var data = new FrameData(
            new Date().getTime(), 
            new Date().getTime(),
            frame, 
            inputs);
        this.receiveFrameFromServer(data);
    }

    receiveFrameFromServer = (frameData: FrameData) =>
    {
        // FrameData object
        // time : Long
        // frame : Integer
        // inputs : Array
        if(frameData.frame == this.expectedFrame)
        {
            // NETWORK_DEBUG
            // finish up networking statistics
            // the graphics layer will consume this now.
            this.frameTimings[frameData.frame].timeReceive = new Date();
            this.frameTimings[frameData.frame].timeServerIn = frameData.serverTimeIn;
            this.frameTimings[frameData.frame].timeServerOut = frameData.serverTimeOut;
            this.frameTimings[frameData.frame].calculateDeltas();

            // add the frame to our local buffer
            this.receiveBuffer.push(frameData);
            this.expectedFrame++;
        }
        else 
        {
            // TODO handle out-of-order frames
            Debug.log("[generation]frame mismatch.");
            Debug.log("[generation]    Expected: " + this.expectedFrame);
            Debug.log("[generation]    Received: " + frameData.frame);
        }
    }
    
    updatePlayerInput = () =>
    {
        // ignore inputs for first couple frames
        if(this.frameCount < 5)
        {
            return;
        }

        if( InputEngine.Instance.justPressed("W") || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_DPAD_UP) || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_DPAD_UP))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Up);
        }
        
        if( InputEngine.Instance.justPressed("S") || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_DPAD_DOWN) || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_DPAD_DOWN))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Down);
        }
        
        if( InputEngine.Instance.justPressed("A") || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_DPAD_LEFT) || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_DPAD_LEFT))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Left);
        }
        
        if( InputEngine.Instance.justPressed("D") || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_DPAD_RIGHT) || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_DPAD_RIGHT))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Right);
        }
        
        if( InputEngine.Instance.justPressed("¿") || 
            InputEngine.Instance.justClicked() || 
            InputEngine.Instance.justPressed("\r") || 
            InputEngine.Instance.justPressed("\r\n") || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_A) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_B) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_X) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_Y) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_X) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_CIRCLE) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_SQUARE) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_TRIANGLE))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Swap);
        }

        if( InputEngine.Instance.justPressed("Q") || 
            InputEngine.Instance.justPressed("E") || 
            InputEngine.Instance.justPressed(" ") || 
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_RIGHT_BUMPER) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_LEFT_BUMPER) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.XBOX360_LEFT_TRIGGER) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_R1) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_R2) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_L1) ||
            InputEngine.Instance.justPressedButton(Phaser.Gamepad.PS3XC_L2))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Elevate);
        }

        // debugging frame control
        if(InputEngine.Instance.justPressed("P"))
        {
            this.isPaused = !this.isPaused;
        }
        if(InputEngine.Instance.justPressed("k")) // +
        {
            this.frameRate = Math.min(this.frameRate + 3, 60);
            this.frameLengthInMs = 1000 / this.frameRate;
        }
        if(InputEngine.Instance.justPressed("m")) // -
        {
            this.frameRate = Math.max(this.frameRate - 3, 1);
            this.frameLengthInMs = 1000 / this.frameRate;
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

class FrameTimeData
{
    public frame: string;
    public timeSent: Date = new Date();
    public timeServerIn: number;
    public timeServerOut: number;
    public timeReceive: Date = new Date();

    public deltaServerIn: string;
    public deltaServerOut: string;
    public deltaReceive: string;
    public totalRoundTrip: string;

    constructor(frame: number)
        {
            this.frame = frame.toString();
        }

    public calculateDeltas = () =>
    {
        this.deltaServerIn = (this.timeServerIn - this.timeSent.getTime()).toString();
        this.deltaServerOut = (this.timeServerOut - this.timeServerIn).toString();
        this.deltaReceive = (this.timeReceive.getTime() - this.timeServerOut).toString();
        this.totalRoundTrip = (this.timeReceive.getTime() - this.timeSent.getTime()).toString();
    }
}