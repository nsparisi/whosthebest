function InputEngine()
{
    this.keysPrevious = {};
    this.keysCurrent = {};
    this.click = null;
    this.clickPrevious = null;

    var self = this;
    this.initialize = function()
    {
        bodyElement.onkeydown = this.canvasKeyDown;
        bodyElement.onkeyup = this.canvasKeyUp;

        //$('#gameCanvas').click(canvasClick);
        bodyElement.onmousedown = this.canvasClick;
    }

    this.update = function()
    {
        // store last frame
        for(var k in self.keysCurrent)
        {
            self.keysPrevious[k] = self.keysCurrent[k];
        }
        self.clickPrevious = self.click;
        self.click = null;
    }

    // Listen for key presses.
    this.canvasKeyDown = function(e)
    {
        self.keysCurrent[String.fromCharCode(e.which)] = true;
        //console.log(String.fromCharCode(e.which));
    }

    this.canvasKeyUp = function(e)
    {
        self.keysCurrent[String.fromCharCode(e.which)] = false;
    }

    // Listen for clicks.
    this.canvasClick = function(e)
    {
        self.click = { "x": e.offsetX, "y": e.offsetY };
    }

    this.justPressed = function(key)
    {
        return self.keysCurrent[key] && !self.keysPrevious[key];
    }

    this.justClicked = function()
    {
        return self.click && !self.clickPrevious;
    }
}