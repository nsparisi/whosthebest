/// <reference path="references.ts" />

class MainMenu
{
    // singleton implementation
    static Instance = new MainMenu();
    constructor()
    {
        if(MainMenu.Instance)
        {
            throw new Error("An instance of MainMenu already exists.");
        }
        
        MainMenu.Instance = this;
    }
    
    textures =
        {
            gameBackgound: "images/bg.jpg"
        }
    sprites = [];
    menuText1: GraphicsText;
    menuText2: GraphicsText;
    menuText3: GraphicsText;

    initialize = () =>
    {
        var gameBorder = new Sprite(
            canvasElement.width,
            canvasElement.height,
            'rgba(0,0,0,0.0)',
            "black",
            1);
        this.sprites.push(gameBorder);

        // background
        var gameBackground = new GraphicsTexture(
            canvasElement.width,
            canvasElement.height,
            this.textures.gameBackgound)
        this.sprites.push(gameBackground);

        // Debug text 1
        this.menuText1 = new GraphicsText(
            100,
            100,
            "bold 14px Arial",
            'black'
            );
        this.menuText1.text = "Press '1' to Ready for game!.";
        //this.sprites.push(this.menuText1);

        // Debug text 1
        this.menuText2 = new GraphicsText(
            160,
            160,
            "bold 20px Arial",
            'black'
            );
        this.menuText2.text = "Press '1' to Start.";
        this.sprites.push(this.menuText2);

        // Debug text 1
        this.menuText3 = new GraphicsText(
            320,
            350,
            "bold 20px Arial",
            'black'
            );
        this.menuText3.text = "Press Start 3";
        this.sprites.push(this.menuText3);
    }

    update = () =>
    {
        this.listenForInput();

        this.menuText3.text = "Server: " + this.getWebSocketText();
    }

    render = () =>
    {
        canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
        this.sprites.forEach(
            (sprite) =>
            {
                canvasContext.save();
                sprite.render();
                canvasContext.restore();
            });
    }

    listenForInput = () =>
    {
        if(InputEngine.Instance.justPressed("1"))
        {
            this.debug1();
        }
        if(InputEngine.Instance.justPressed("2"))
        {
            this.debug2();
        }
        if(InputEngine.Instance.justPressed("3"))
        {
            this.debug3();
        }
        if(InputEngine.Instance.justPressed("4"))
        {
            this.debug4();
        }
        if(InputEngine.Instance.justPressed("5"))
        {
            this.debug5();
        }
    }
    
    debug1 = () =>
    {
        Debug.log("[menu]queue");
        ServerTranslator.Instance.toServerGameReady();
        this.menuText2.text = "Waiting for players..."
    }
    
    debug2 = () =>
    {
    }

    debug3 = () =>
    {
    }

    debug4 = () =>
    {
    }

    debugcount = 1;
    debug5 = () =>
    {
        Debug.log("[menu]debug message");
        var message = "sending debug message " + this.debugcount;
        ServerTranslator.Instance.toServerDebug(message);
        this.debugcount++;
    }

    getWebSocketText = () =>
    {
        if(!ServerTranslator.Instance.connectionToGameServer)
        {
            return;
        }

        return ServerTranslator.Instance.connectionToGameServer.getChannelState();
    }
}