
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
    buttonsPrevious = {};
    buttonsCurrent = {};
    click = null;
    clickPrevious = null;
    gamePad1: Phaser.SinglePad = null;

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
        
        // store last frame of buttons
        for(var k in this.buttonsCurrent)
        {
            this.buttonsPrevious[k] = this.buttonsCurrent[k];
        }
        this.checkGamePad();
    }

    checkGamePad = () =>
    {
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_DPAD_UP] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_DPAD_UP).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_DPAD_UP] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_DPAD_UP).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_DPAD_DOWN] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_DPAD_DOWN).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_DPAD_DOWN] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_DPAD_DOWN).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_DPAD_LEFT] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_DPAD_LEFT).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_DPAD_LEFT] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_DPAD_LEFT).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_DPAD_RIGHT] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_DPAD_RIGHT).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_DPAD_RIGHT] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_DPAD_RIGHT).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_A] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_A).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_B] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_B).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_X] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_X).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_Y] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_Y).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_X] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_X).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_CIRCLE] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_CIRCLE).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_SQUARE] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_SQUARE).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_TRIANGLE] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_TRIANGLE).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_RIGHT_BUMPER] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_RIGHT_BUMPER).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_RIGHT_TRIGGER] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_LEFT_BUMPER] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_LEFT_BUMPER).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_LEFT_TRIGGER] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_LEFT_TRIGGER).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_R1] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_R1).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_R2] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_R2).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_L1] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_L1).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_L2] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_L2).isDown;
        this.buttonsCurrent[Phaser.Gamepad.PS3XC_START] = this.gamePad1.getButton(Phaser.Gamepad.PS3XC_START).isDown;
        this.buttonsCurrent[Phaser.Gamepad.XBOX360_START] = this.gamePad1.getButton(Phaser.Gamepad.XBOX360_START).isDown;
    }

    justPressed = (key) =>
    {
        return this.keysCurrent[key] && !this.keysPrevious[key];
    }

    justClicked = () =>
    {
        return this.click && !this.clickPrevious;
    }

    justPressedButton = (gamepadButton: number) =>
    {
        return this.buttonsCurrent[gamepadButton] && !this.buttonsPrevious[gamepadButton];
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