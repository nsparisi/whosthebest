Debug.log("input.ts");

/**
 * InputEngine is responsible for maintaining keysCurrent and keysPrevious tables.
 * justPressed and justClicked can be used externally to check for key presses.
 */
class InputEngine
{
    // singleton implementation
    static Instance = new InputEngine();
    constructor()
    {
        if(InputEngine.Instance)
        {
            throw new Error("An instance of InputEngine already exists.");
        }
        
        InputEngine.Instance = this;
    }
    
    keysPrevious = {};
    keysCurrent = {};
    click = null;
    clickPrevious = null;

    initialize = (bodyElement: HTMLElement) =>
    {
        bodyElement.onkeydown = this.canvasKeyDown;
        bodyElement.onkeyup = this.canvasKeyUp;

        //$('#gameCanvas').click(canvasClick);
        bodyElement.onmousedown = this.canvasClick;
    }

    update = () =>
    {
        // store last frame
        for(var k in this.keysCurrent)
        {
            this.keysPrevious[k] = this.keysCurrent[k];
        }
        this.clickPrevious = this.click;
        this.click = null;
    }

    justPressed = (key) =>
    {
        return this.keysCurrent[key] && !this.keysPrevious[key];
    }

    justClicked = () =>
    {
        return this.click && !this.clickPrevious;
    }

    // Listen for key presses.
    private canvasKeyDown = (e) =>
    {
        this.keysCurrent[String.fromCharCode(e.which)] = true;
        //Debug.log(String.fromCharCode(e.which));
    }

    private canvasKeyUp = (e) =>
    {
        this.keysCurrent[String.fromCharCode(e.which)] = false;
    }

    // Listen for clicks.
    private canvasClick = (e) =>
    {
        this.click = { "x": e.offsetX, "y": e.offsetY };
    }
}