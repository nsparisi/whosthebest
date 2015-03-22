function GenerationEngine()
{
    this.frameRate = 20;
    this.elapsed = 0;
    this.threshold = 1000 / this.frameRate;
    this.frameCount = 0;
    this.currentInput = "";
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
                self.sendUpdate();
            }

            return;
        }

        // send packets to game on an interval
        self.elapsed += deltaTimeMs;
        while(self.elapsed > self.threshold)
        {
            self.elapsed -= self.threshold;
            self.sendUpdate();
        }
    }

    this.sendUpdate = function()
    {
        self.frameCount++;

        var packet = self.makePacket(
            self.frameCount,
            [
                self.currentInput,
                Math.max(0, Math.floor(Math.random() * (6 + 15)) - 15) // does nothing x15 chance
                //[gameEngine.inputTypes.None] or self.currentInput or  Math.floor(Math.random() * 6),
            ]);

        // console.log("sending packet: " + packet);
        GameEngine.prototype.instance.update(packet);

        // drains input buffer
        self.drainInput();
    }
    
    this.makePacket = function(frame, inputs)
    {
        var packet = 
            GameEngine.prototype.instance.gameId + GameEngine.prototype.instance.packetDelimiter +  // game ID
            frame + GameEngine.prototype.instance.packetDelimiter +  // frame
            "0";  // time
            
        for(var i = 0; i < inputs.length; i++)
        {
            packet += GameEngine.prototype.instance.packetDelimiter + inputs[i];
        }
            
        return packet;
    }
    
    this.updatePlayerInput = function()
    {
        var inputDelimiter = GameEngine.prototype.instance.inputDelimiter;
        var inputTypes = GameEngine.prototype.instance.inputTypes;

        if(inputEngine.justPressed("W"))
        {
            self.currentInput += inputDelimiter + inputTypes.Up;
        }
        
        if(inputEngine.justPressed("S"))
        {
            self.currentInput += inputDelimiter + inputTypes.Down;
        }
        
        if(inputEngine.justPressed("A"))
        {
            self.currentInput += inputDelimiter + inputTypes.Left;
        }
        
        if(inputEngine.justPressed("D"))
        {
            self.currentInput += inputDelimiter + inputTypes.Right;
        }
        
        if(inputEngine.justPressed("¿") || inputEngine.justClicked())
        {
            self.currentInput += inputDelimiter + inputTypes.Swap;
        }

        if(inputEngine.justPressed("Q") || inputEngine.justPressed("E") || inputEngine.justPressed(" "))
        {
            self.currentInput += inputDelimiter + inputTypes.Elevate;
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
        self.currentInput = ""
    }
}