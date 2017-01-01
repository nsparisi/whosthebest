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
    adjustedFrameLengthInMs = this.frameLengthInMs;
    frameDelay = 30;

    // delay in ms for holding wasd to move quick
    moveQuickHoldLengthMs = 250;

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

        // there is always an AI for each slot, though they may not be used
        for(var i = 0; i < SERVER_GAME_ENGINE.boards.length; i++)
        {
            this.intellegence.push(new IntelligenceEngine("AI_" + i, SERVER_GAME_ENGINE.boards[i]));
        }
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

        // if one player is "lagging" behind, i.e. they can't build their buffer.
        // then this player will need to slow the framerate down a bit to catch up.
        // typically this can happen at the start of a match. p1 buffer = 0, p2 buffer = 30.
        if(!this.isPracticeGame && 
            this.receiveBuffer.length < this.frameDelay * 0.8)
        {
            // t is a value from [0-1].
            // modifier is just a linear fn from [2-1] (i.e., twice as slow)
            var t = 1 - ((this.frameDelay - this.receiveBuffer.length) / this.frameDelay);
            var modifier = 2 - t;
            this.adjustedFrameLengthInMs = this.frameLengthInMs * modifier;
        }
        else 
        {
            this.adjustedFrameLengthInMs = this.frameLengthInMs;
        }

        // send packets to game on an interval
        this.elapsed += deltaTimeMs;
        if(this.elapsed > this.adjustedFrameLengthInMs || this.frameAdvance)
        {
            this.elapsed -= this.adjustedFrameLengthInMs;
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

        for(var boardIndex = 0; boardIndex < SERVER_GAME_ENGINE.boards.length; boardIndex++)
        {
            // this player is our self
            if(GAME_INSTANCE.USER_INDEX == boardIndex)
            {
                var playerInputAsString = "";
                for(var i = 0; i < playerInputs.length; i++)
                {
                    playerInputAsString += ServerTranslator.Instance.PLAYERINPUT_DELIMETER;
                    playerInputAsString += playerInputs[i];
                }
                inputs.push(playerInputAsString);
            }

            // these are the AIs
            else 
            {
                //var shiftIndex = GAME_INSTANCE.USER_INDEX < boardIndex ? 1 : 0;
                var ai = this.intellegence[boardIndex];
                inputs.push(ai.next().toString());
            }
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

        if( this.checkJustPressedOrHoldLength("W", this.moveQuickHoldLengthMs) || 
            this.checkJustPressedButtonOrHoldLength(Phaser.Gamepad.XBOX360_DPAD_UP, this.moveQuickHoldLengthMs) || 
            this.checkJustPressedButtonOrHoldLength(Phaser.Gamepad.PS3XC_DPAD_UP, this.moveQuickHoldLengthMs))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Up);
        }
        
        if( this.checkJustPressedOrHoldLength("S", this.moveQuickHoldLengthMs) || 
            this.checkJustPressedButtonOrHoldLength(Phaser.Gamepad.XBOX360_DPAD_DOWN, this.moveQuickHoldLengthMs) || 
            this.checkJustPressedButtonOrHoldLength(Phaser.Gamepad.PS3XC_DPAD_DOWN, this.moveQuickHoldLengthMs))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Down);
        }
        
        if( this.checkJustPressedOrHoldLength("A", this.moveQuickHoldLengthMs) || 
            this.checkJustPressedButtonOrHoldLength(Phaser.Gamepad.XBOX360_DPAD_LEFT, this.moveQuickHoldLengthMs) || 
            this.checkJustPressedButtonOrHoldLength(Phaser.Gamepad.PS3XC_DPAD_LEFT, this.moveQuickHoldLengthMs))
        {
            this.currentInput.push(SERVER_GAME_ENGINE.inputTypes.Left);
        }
        
        if( this.checkJustPressedOrHoldLength("D", this.moveQuickHoldLengthMs) || 
            this.checkJustPressedButtonOrHoldLength(Phaser.Gamepad.XBOX360_DPAD_RIGHT, this.moveQuickHoldLengthMs) || 
            this.checkJustPressedButtonOrHoldLength(Phaser.Gamepad.PS3XC_DPAD_RIGHT, this.moveQuickHoldLengthMs))
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
    
    checkJustPressedOrHoldLength = (key: any, minHoldDuration: number) => 
    {
        return InputEngine.Instance.justPressed(key) || 
            InputEngine.Instance.holdDuration(key) >= minHoldDuration;
    }
    
    checkJustPressedButtonOrHoldLength = (key: any, minHoldDuration: number) => 
    {
        return InputEngine.Instance.justPressedButton(key) || 
            InputEngine.Instance.holdDuration(key) >= minHoldDuration;
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