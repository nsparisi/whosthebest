function GraphicsEngine()
{
    var textures =
        {
            gameBackgound : "images/bg.jpg"
        }

    //tesing 123
    this.colors = ["#FFABAB", "#FFDAAB", "#DDFFAB", "#ABE4FF", "#D9ABFF"];
    this.comboFlashStyle = "#EEEEEE";
    this.sprites = [];
    this.tileWidth = Math.round(canvasElement.width * 0.05625);
    this.tileHeight = Math.round(canvasElement.height * 0.0667);
    
    // fps
    this.fpsText = null;
    this.frameCount = 0;
    this.lapsed = 0;
    
    // canvasContext
    // canvasElement
    // gameEngine
    // deltaTimeMs

    var self = this;
    this.initialize = function()
    {
        var random = function(min, max) 
        {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        // border (not needed)
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

        // game board 
        // todo add more boards
        var board = new Board(gameEngine.board);
        board.x = canvasElement.width / 2;
        board.y = canvasElement.height / 2 
        board.x -= gameEngine.colCount * this.tileWidth / 2;
        board.y -= gameEngine.rowCountInBounds * this.tileHeight / 2;
        self.sprites.push(board);    

        // fps
        self.fpsText = new Text(
            5, 
            20, 
            "bold 16px Arial", 
            'limegreen'
            );
        self.fpsText.text = "Hello World";
        self.sprites.push(self.fpsText);
    }
    
    this.update = function()
    {
        canvasContext.clearRect(0,0, canvasElement.width, canvasElement.height);
        self.sprites.forEach(
            function(sprite)
            {
                canvasContext.save();
                sprite.render();
                canvasContext.restore();
            });
            
        // fps
        self.frameCount++;
        self.lapsed += deltaTimeMs;
        if(self.lapsed > 500)
        {
            self.fpsText.text = Math.round(self.frameCount * (1000 / self.lapsed));
            self.lapsed = 0;
            self.frameCount = 0
        }
    }
        
    var Board = function(gameEngineBoard)
    {
        this.gameEngineBoard = gameEngineBoard;
        this.x = canvasElement.width / 2;
        this.y = canvasElement.height / 2 
        this.x -= gameEngine.colCount * graphicsEngine.tileWidth / 2;
        this.y -= gameEngine.rowCountInBounds * graphicsEngine.tileHeight / 2;
        this.width = gameEngine.colCount * graphicsEngine.tileWidth;
        this.height = gameEngine.rowCountInBounds * graphicsEngine.tileHeight;
        this.yOffsetAsHeight = graphicsEngine.tileHeight / gameEngineBoard.yOffsetMax;
        
        this.border = new Sprite(
            this.width + 4, 
            this.height + 4, 
            'rgba(0,0,0,0.0)',
            "blue", 
            2);
        this.border.x -= 2;
        this.border.y -= 2;
        
        this.bottom = new Sprite(
            this.border.width, 
            this.border.height, 
            'rgba(0,0,1,0.6)',
            "blue", 
            this.border.lineWidth);
        this.bottom.x = this.border.y;
        this.bottom.y = this.border.y + this.border.height;
        
        this.lightbox = new Sprite(
            this.width, 
            this.height, 
            'rgba(0,0,0,0.3)',
            'rgba(0,0,0,0)', 
            0);
        
        // cursor double-block
        this.cursor1 = new Sprite(
            graphicsEngine.tileWidth,
            graphicsEngine.tileHeight,
            'rgba(0,0,0,0.0)',
            'black', 
            3);  
        this.cursor2 = new Sprite(
            graphicsEngine.tileWidth,
            graphicsEngine.tileHeight,
            'rgba(0,0,0,0.0)',
            'black', 
            3);        
            
        var self = this;
        this.render = function() 
        {   
            canvasContext.translate(self.x, self.y);
        
            // faded lightbox behind tiles
            self.lightbox.render();
            
            // tiles ticking upwards
            var yOffsetCurrentHeight = self.yOffsetAsHeight * gameEngineBoard.yOffset;
            
            canvasContext.lineWidth = 1;
            canvasContext.strokeStyle = "black";
            gameEngineBoard.tiles.forEach(
                function(tile)
                {
                    canvasContext.save();

                    // ==============
                    // fill color style
                    var fillStyle = graphicsEngine.colors[tile.type - 3];

                    // tile is being combo'd
                    if(tile.comboFrameCount > 0 &&
                        tile.comboFrameCount % 2 == 0)
                    {
                        fillStyle = graphicsEngine.comboFlashStyle;
                    }

                    // debug, tile is chaining
                    if(tile.isChaining)
                    {
                        //fillStyle = "#AAAAAA"
                    }

                    canvasContext.fillStyle = fillStyle;

                    // ===============
                    // x, y position
                    var x = tile.x * graphicsEngine.tileWidth;
                    if(tile.swappingFrameCount >= 0)
                    {
                        var swapPercent = 1 - (tile.swappingFrameCount / tile.swappingFrameReset);
                        x += swapPercent * graphicsEngine.tileWidth * tile.xShift;
                    }
                    canvasContext.translate(
                        x,
                        self.height - tile.y * graphicsEngine.tileHeight - yOffsetCurrentHeight
                    );
                    canvasContext.beginPath();
                    canvasContext.rect(0, 0, graphicsEngine.tileWidth, graphicsEngine.tileHeight);
                    canvasContext.stroke();
                    canvasContext.fill();
                    canvasContext.restore();
                });
                
            // cursor overtop tiles
            self.cursor1.x = gameEngineBoard.cursor.x * graphicsEngine.tileWidth;
            self.cursor1.y = self.height - gameEngineBoard.cursor.y * graphicsEngine.tileHeight - yOffsetCurrentHeight;
            self.cursor1.render();
            self.cursor2.x = self.cursor1.x + graphicsEngine.tileWidth;
            self.cursor2.y = self.cursor1.y;
            self.cursor2.render();
            
            // border around tiles
            self.border.render();
            self.bottom.render();
        }
    }
    
    // Sprite object right now represents a square
    // with a width, height, stroke and fill style and rect line width
    var Sprite = function(width, height, fillStyle, strokeStyle, lineWidth) 
    {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.fillStyle = fillStyle;
        this.strokeStyle = strokeStyle;
        this.lineWidth = lineWidth;
        
        var self = this;
        this.render = function() 
        {
            //Render the sprite
            canvasContext.save();
            canvasContext.strokeStyle = self.strokeStyle;
            canvasContext.lineWidth = self.lineWidth;
            canvasContext.fillStyle = self.fillStyle;
            canvasContext.translate(
                self.x,
                self.y
            );
            canvasContext.beginPath();
            canvasContext.rect(0, 0, self.width, self.height);
            canvasContext.stroke();
            canvasContext.fill();
            canvasContext.restore();
        };
    };
    
    // a texture that loads an image safely and draws it at
    // x,y with width,height
    var Texture = function(width, height, imgPath)
    {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.fillStyle = null;
        this.imageObj = new Image();
        
        var self = this;
        this.imageObj.onload = function() {
            var pattern = canvasContext.createPattern(self.imageObj, 'repeat');
            self.fillStyle = pattern;
            self.render = function()
            {
                canvasContext.translate(
                    self.x,
                    self.y
                );
                canvasContext.fillStyle = self.fillStyle;
                canvasContext.rect(0, 0, self.width, self.height);
                canvasContext.fill();
            }
        };
        
        // load the image
        this.imageObj.src = imgPath;
        
        // don't do anything until loaded
        this.render = function(){}
    }
    
    var Text = function(width, height, font, fillStyle)
    {
        this.text = "";
        this.font = font;
        this.fillStyle = fillStyle;
        this.width = width;
        this.height = height;
        
        var self = this;
        this.render = function()
        {
            canvasContext.fillStyle = self.fillStyle;
            canvasContext.font = self.font;
            canvasContext.fillText(self.text, self.width, self.height);
        }
    }
}