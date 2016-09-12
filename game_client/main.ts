/// <reference path="references.ts" />

/**
 * Main entry point for the game
 */
class Main {    
    input = () =>
    {
        InputEngine.Instance.update();
    }
    
    update = () =>
    {
        MainControl.Instance.update();
    }
    
    draw = () =>
    {
        MainControl.Instance.render();
    }
    
    begin = () =>
    {
        // Set up game loop.
        var lastUpdate = new Date().getTime();
        deltaTimeMs = 0;
        var nextFrame = () =>
        {
            var currentTime = new Date().getTime();
            deltaTimeMs = currentTime - lastUpdate;
            
            // UPDATE
            this.update();
            
            // INPUTS
            this.input();
            
            // RENDER
            this.draw();
            
            lastUpdate = currentTime;
        }
        
        setInterval(nextFrame, 1);
    }
}

