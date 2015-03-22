function MainControl()
{
    // Match State
    this.generationEngine;
    this.gameEngine;
    this.graphicsEngine;

    // Menu State

    // States
    this.gameStateType =
        {
            MainMenu: 0,
            Match: 1
        }
    this.currentGameState = this.gameStateType.MainMenu;

    var self = this;
    this.initialize = function()
    {
        self.switchToMenu();
    }

    this.update = function()
    {
        if(self.currentGameState == self.gameStateType.MainMenu)
        {
            self.listenForInput();
        }
        else if(self.currentGameState == self.gameStateType.Match)
        {
            self.generationEngine.update();
        }
    }

    this.render = function()
    {
        if(self.currentGameState == self.gameStateType.MainMenu)
        {
            self.mainMenu.update();
        }
        else if(self.currentGameState == self.gameStateType.Match)
        {
            self.graphicsEngine.update();
        }
    }

    this.switchToGame = function()
    {
        self.currentGameState = self.gameStateType.Match;

        self.gameEngine = new GameEngine();
        self.generationEngine = new GenerationEngine();
        self.graphicsEngine = new GraphicsEngine();

        self.gameEngine.initialize();
        self.generationEngine.initialize(self.gameEngine);
        self.graphicsEngine.initialize(self.gameEngine);
    }

    this.switchToMenu = function()
    {
        self.currentGameState = self.gameStateType.MainMenu;

        self.mainMenu = new MainMenu();
        self.mainMenu.initialize();
    }

    this.listenForInput = function()
    {
        if(inputEngine.justPressed("1"))
        {
            self.debug1();
        }
        if(inputEngine.justPressed("2"))
        {
            self.debug2();
        }
        if(inputEngine.justPressed("3"))
        {
            self.debug3();
        }
        if(inputEngine.justPressed("4"))
        {
            self.debug4();
        }
        if(inputEngine.justPressed("5"))
        {
            self.debug5();
        }
    }

    this.debug1 = function()
    {
        console.log("debug1");
        self.switchToGame();
    }
    this.debug2 = function()
    {

    }
    this.debug3 = function()
    {

    }
    this.debug4 = function()
    {

    }
    this.debug5 = function()
    {

    }
}