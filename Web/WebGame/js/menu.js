function MainMenu()
{
    var textures =
        {
            gameBackgound: "images/bg.jpg"
        }
    this.sprites = [];

    var self = this;
    this.initialize = function()
    {
        var gameBorder = new Sprite(
            canvasElement.width,
            canvasElement.height,
            'rgba(0,0,0,0.0)',
            "black",
            1);
        self.sprites.push(gameBorder);

        // background
        var gameBackground = new Texture(
            canvasElement.width,
            canvasElement.height,
            textures.gameBackgound)
        self.sprites.push(gameBackground);

        // Debug text 1
        self.menuText1 = new Text(
            100,
            100,
            "bold 14px Arial",
            'black'
            );
        self.menuText1.text = "1: New Game. 2: New Connection. 3: Queue. 4: Cancel.";
        self.sprites.push(self.menuText1);

        // Debug text 1
        self.menuText2 = new Text(
            120,
            150,
            "bold 20px Arial",
            'black'
            );
        self.menuText2.text = "Press Start 2";
        self.sprites.push(self.menuText2);

        // Debug text 1
        self.menuText3 = new Text(
            150,
            200,
            "bold 20px Arial",
            'black'
            );
        self.menuText3.text = "Press Start 3";
        self.sprites.push(self.menuText3);
    }

    this.update = function()
    {
        self.listenForInput();

        self.menuText3.text = "socket: " + self.getWebSocketText();
    }

    this.render = function()
    {
        canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
        self.sprites.forEach(
            function(sprite)
            {
                canvasContext.save();
                sprite.render();
                canvasContext.restore();
            });
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
        console.log("switch to game");
        mainControl.switchToGame();
    }
    
    this.debug2 = function()
    {
        console.log("[menu]new connection");
        ServerTranslator.prototype.instance.initialize();
    }

    this.debug3 = function()
    {
        console.log("[menu]queue");
        ServerTranslator.prototype.instance.toServerQueueForMatch();
    }

    this.debug4 = function()
    {
        console.log("[menu]cancel");
        ServerTranslator.prototype.instance.toServerCancelQueueForMatch();
    }

    self.debugcount = 1;
    this.debug5 = function()
    {
        console.log("[menu]debug message");
        var message = "sending debug message " + self.debugcount;
        ServerTranslator.prototype.instance.toServerDebug(message);
        self.debugcount++;
    }

    this.getWebSocketText = function()
    {
        if(!ServerTranslator.prototype.instance.serverConnection)
        {
            return;
        }

        var readyState = ServerTranslator.prototype.instance.serverConnection.webSocket.readyState;
        if(readyState == WebSocket.CLOSED)
        {
            return "CLOSED";
        }
        else if(readyState == WebSocket.CLOSING)
        {
            return "CLOSING";
        }
        else if(readyState == WebSocket.CONNECTING)
        {
            return "CONNECTING";
        }
        else if(readyState == WebSocket.OPEN)
        {
            return "OPEN";
        }
    }
}