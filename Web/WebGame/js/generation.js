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

        var input = Math.floor(Math.random() * 4 + 1);

        var packet = self.makePacket(
            self.frameCount,
            [
                self.currentInput,
                Math.max(0, Math.floor(Math.random() * (6 + 20)) - 20) // does nothing x20 chance
                //[gameEngine.inputTypes.None] or self.currentInput or  Math.floor(Math.random() * 6),
            ]);

        // console.log("sending packet: " + packet);
        gameEngine.update(packet);

        // drains input buffer
        self.drainInput();
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
        
        if(self.justPressed("¿") || self.justClicked())
        {
            self.currentInput += gameEngine.inputDelimiter + gameEngine.inputTypes.Swap;
        }

        if(self.justPressed("Q") || self.justPressed("E") || self.justPressed(" ") )
        {
            self.currentInput += gameEngine.inputDelimiter + gameEngine.inputTypes.Elevate;
        }

        // debugging frame control
        if(self.justPressed("P"))
        {
            self.isPaused = !self.isPaused;
        }
        if(self.justPressed("k")) // +
        {
            self.frameRate = Math.min(self.frameRate + 3, 60);
            self.threshold = 1000 / self.frameRate;
        }
        if(self.justPressed("m")) // -
        {
            self.frameRate = Math.max(self.frameRate - 3, 1);
            self.threshold = 1000 / self.frameRate;
        }
        if(self.justPressed("Ü")) // \
        {
            self.isPaused = true;
            self.frameAdvance = true;
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