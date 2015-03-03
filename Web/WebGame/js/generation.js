function GenerationEngine()
{
    this.frameRate = 15;
    this.elapsed = 0;
    this.threshold = 1000 / this.frameRate;
    this.frameCount = 0;
    this.currentInput = "";
    this.isPaused = false;
    
    var self = this;
    this.update = function()
    {
        // figure out button state
        this.updatePlayerInput();
    
        // pause
        if (self.isPaused)
            return;

        // send packets to game on an interval
        self.elapsed += deltaTimeMs;
        while(self.elapsed > self.threshold)
        {
            self.elapsed -= self.threshold;
            self.frameCount++;
            
            var input = Math.floor( Math.random() * 4 + 1 );
                        
            var packet = self.makePacket(
                self.frameCount, 
                [
                    self.currentInput,
                    [gameEngine.inputTypes.None]
                ]);
            
            // console.log("sending packet: " + packet);
            gameEngine.update(packet);
            
            // drains input buffer
            self.drainInput();
        }
    }
    
    this.makePacket = function(frame, inputs)
    {
        var packet = 
            gameEngine.gameId + gameEngine.packetDelimiter +  // game ID
            frame + gameEngine.packetDelimiter +  // frame
            "0";  // time
            
        for(var i = 0; i < inputs.length; i++)
        {
            packet += gameEngine.packetDelimiter + inputs[i];
        }
            
        return packet;
    }
    
    this.makeInputString = function()
    {
        var inputs = "";
        for(var i = 0; i < self.currentInput.length; i++)
        {
             inputs += self.currentInput[i] == 1 ? gameEngine.inputDelimiter + i : "";
        }
        
        // remove leading comma
        inputs = inputs.substring(1);
        return inputs;
    }
    
    this.updatePlayerInput = function()
    {
        if(self.justPressed("W"))
        {
            self.currentInput += gameEngine.inputDelimiter + gameEngine.inputTypes.Up;
        }
        
        if(self.justPressed("S"))
        {
            self.currentInput += gameEngine.inputDelimiter + gameEngine.inputTypes.Down;
        }
        
        if(self.justPressed("A"))
        {
            self.currentInput += gameEngine.inputDelimiter + gameEngine.inputTypes.Left;
        }
        
        if(self.justPressed("D"))
        {
            self.currentInput += gameEngine.inputDelimiter + gameEngine.inputTypes.Right;
        }
        
        if(self.justPressed(" ") || self.justPressed("¿") || self.justClicked())
        {
            self.currentInput += gameEngine.inputDelimiter + gameEngine.inputTypes.Swap;
        }

        if (self.justPressed("P"))
        {
            self.isPaused = !self.isPaused;
        }
    }
    
    this.justPressed = function(key)
    {
        return keysCurrent[key] && !keysPrevious[key];
    }
    
    this.justClicked = function()
    {
        return click && !clickPrevious; 
    }
    
    this.drainInput = function()
    {
        self.currentInput = ""
    }
}