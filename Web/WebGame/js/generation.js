function GenerationEngine()
{
    GenerationEngine.prototype.instance = this;

    this.frameRate = 20;
    this.elapsed = 0;
    this.threshold = 1000 / this.frameRate;
    this.frameCount = 0;
    this.expectedFrame = 0;
    this.currentInput = [];
    this.isPaused = false;
    this.frameAdvance = false;
    
    var self = this;
    this.initialize = function()
    {

    }

    this.update = function()
    {
        // figure out button state
        this.updatePlayerInput();
    
        // pause
        if(self.isPaused)
        {
            if(this.frameAdvance)
            {
                this.frameAdvance = false;
                self.sendFrameToServer();
            }

            return;
        }

        // send packets to game on an interval
        self.elapsed += deltaTimeMs;
        if(self.elapsed > self.threshold)
        {
            // If the opponent is slow, we'll send frames out too fast.
            // instead wait for the server to sync us up, then send out next frame
            if(self.frameCount < self.expectedFrame + 2)
            {
                // set to 0, purposefully avoid queueing up many frames at once
                self.elapsed = 0;
                self.sendFrameToServer();
            }
        }
    }

    this.sendFrameToServer = function()
    {
        // send frame data to server
        ServerTranslator.prototype.instance.toServerFrame(
            self.frameCount, 
            self.currentInput);

        // drains input buffer
        self.drainInput();

        // update frame count
        // todo wrap around
        self.frameCount++;
    }

    this.receiveFrameFromServer = function(frameData)
    {
        // FrameData object
        // time : Long
        // frame : Integer
        // inputs : Array

        if(frameData.frame == self.expectedFrame)
        {
            GameEngine.prototype.instance.update(frameData.inputs);
            self.expectedFrame++;
        }
        else 
        {
            console.log("[generation]frame mismatch.");
            console.log("[generation]    Expected: " + self.expectedFrame);
            console.log("[generation]    Received: " + frameData.frame);
        }
    }
    
    this.updatePlayerInput = function()
    {
        var inputDelimiter = GameEngine.prototype.instance.inputDelimiter;
        var inputTypes = GameEngine.prototype.instance.inputTypes;

        if(inputEngine.justPressed("W"))
        {
            self.currentInput.push(inputTypes.Up);
        }
        
        if(inputEngine.justPressed("S"))
        {
            self.currentInput.push(inputTypes.Down);
        }
        
        if(inputEngine.justPressed("A"))
        {
            self.currentInput.push(inputTypes.Left);
        }
        
        if(inputEngine.justPressed("D"))
        {
            self.currentInput.push(inputTypes.Right);
        }
        
        if(inputEngine.justPressed("¿") || inputEngine.justClicked())
        {
            self.currentInput.push(inputTypes.Swap);
        }

        if(inputEngine.justPressed("Q") || inputEngine.justPressed("E") || inputEngine.justPressed(" "))
        {
            self.currentInput.push(inputTypes.Elevate);
        }

        // debugging frame control
        if(inputEngine.justPressed("P"))
        {
            self.isPaused = !self.isPaused;
        }
        if(inputEngine.justPressed("k")) // +
        {
            self.frameRate = Math.min(self.frameRate + 3, 60);
            self.threshold = 1000 / self.frameRate;
        }
        if(inputEngine.justPressed("m")) // -
        {
            self.frameRate = Math.max(self.frameRate - 3, 1);
            self.threshold = 1000 / self.frameRate;
        }
        if(inputEngine.justPressed("Ü")) // \
        {
            self.isPaused = true;
            self.frameAdvance = true;
        }
    }
    
    this.drainInput = function()
    {
        self.currentInput = []
    }
}