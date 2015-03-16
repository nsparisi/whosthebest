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

    // boards
    this.graphicsBoards = [];
    
    // canvasContext
    // canvasElement
    // gameEngine
    // deltaTimeMs

    var self = this;
    this.initialize = function()
    {
        self.sfxVolume = 0;
        self.audios =
            {
                chain_intense: new SoundClip("audio/chain_intense.mp3"),
                chain_mild: new SoundClip("audio/chain_mild.mp3")
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

        // fps
        self.fpsText = new Text(
            5, 
            20, 
            "bold 16px Arial", 
            'limegreen'
            );
        self.fpsText.text = "Hello World";
        self.sprites.push(self.fpsText);

        // player 1
        var board = new GraphicsBoard(gameEngine.boards[0]);
        board.x = canvasElement.width / 4;
        board.y = canvasElement.height / 2;
        board.x -= gameEngine.colCount * this.tileWidth / 2;
        board.y -= gameEngine.rowCountInBounds * this.tileHeight / 2;
        self.sprites.push(board);
        self.graphicsBoards.push(board);

        // player 2
        if(gameEngine.boards.length > 1)
        {
            var board = new GraphicsBoard(gameEngine.boards[1]);
            board.x = canvasElement.width * 3 / 4;
            board.y = canvasElement.height / 2
            board.x -= gameEngine.colCount * this.tileWidth / 2;
            board.y -= gameEngine.rowCountInBounds * this.tileHeight / 2;
            self.sprites.push(board);
            self.graphicsBoards.push(board);
        }
    }
    
    this.update = function()
    {
        // check game state
        if(gameEngine.currentGameState == gameEngine.gameStateTypes.Starting)
        {
            for(var i = 0; i < self.graphicsBoards.length; i++)
            {
                self.graphicsBoards[i].gameEngineBoard = gameEngine.boards[i];
            }
        }

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
        
    var GraphicsBoard = function(gameEngineBoard)
    {
        this.gameEngineBoard = gameEngineBoard;
        this.x = canvasElement.width / 2;
        this.y = canvasElement.height / 2 
        this.x -= gameEngine.colCount * graphicsEngine.tileWidth / 2;
        this.y -= gameEngine.rowCountInBounds * graphicsEngine.tileHeight / 2;
        this.width = gameEngine.colCount * graphicsEngine.tileWidth;
        this.height = gameEngine.rowCountInBounds * graphicsEngine.tileHeight;
        this.yOffsetAsHeight = graphicsEngine.tileHeight / gameEngineBoard.yOffsetMax;

        this.comboPopups = [];
                
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

        // gameover countdown
        this.gameOverCounter = new Text(
            0, 0, "14pt arial", "#000");
            
        var self = this;
        this.render = function() 
        {
            self.updateCombos();

            canvasContext.translate(self.x, self.y);
        
            // faded lightbox behind tiles
            self.lightbox.render();
            
            // tiles ticking upwards
            var yOffsetCurrentHeight = self.yOffsetAsHeight * self.gameEngineBoard.yOffset;
            
            canvasContext.lineWidth = 1;
            canvasContext.strokeStyle = "black";
            self.gameEngineBoard.tiles.forEach(
                function(tile)
                {
                    canvasContext.save();

                    // ==============
                    // fill color style
                    var fillStyle = "#FF00FF";

                    if(tile.type >= gameEngine.attackBlockTypeStartIndex)
                    {
                        var fillStyle = "#FF00FF";
                    }
                    else if(tile.type >= gameEngine.basicTileTypeStartIndex)
                    {
                        var fillStyle = graphicsEngine.colors[tile.type - gameEngine.basicTileTypeStartIndex];
                    }

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
            self.cursor1.x = self.gameEngineBoard.cursor.x * graphicsEngine.tileWidth;
            self.cursor1.y = self.height - self.gameEngineBoard.cursor.y * graphicsEngine.tileHeight - yOffsetCurrentHeight;
            self.cursor1.render();
            self.cursor2.x = self.cursor1.x + graphicsEngine.tileWidth;
            self.cursor2.y = self.cursor1.y;
            self.cursor2.render();
            
            // border around tiles
            self.border.render();
            self.bottom.render();
            
            // render popups
            self.comboPopups.forEach(
                function(popup)
                {
                    popup.render();
                });

            // gameover counter
            self.gameOverCounter.text = self.gameEngineBoard.gameOverLeewayCount;
            self.gameOverCounter.render();
        }

        this.combos = [];
        this.newCombo = [];
        this.updateCombos = function()
        {
            self.removeOldCombos();
            self.checkForNewCombos();
        }

        this.checkForNewCombos = function()
        {
            for(var i = self.gameEngineBoard.boardSpaces.length - 1; i >= 0 ; i--)
            {
                for(var j = 0; j < self.gameEngineBoard.boardSpaces[i].length; j++)
                {
                    var tile = self.gameEngineBoard.getTileAtSpace(j, i);

                    if(tile && !tile.isAttackBlock && tile.isComboing && !self.isTileAlreadyInCombo(tile) && !tile.persistAfterCombo)
                    {
                        self.newCombo.push(tile);
                    }
                }
            }

            // show combo popup
            if(self.newCombo.length > 0)
            {
                self.combos.push(self.newCombo);

                if(self.newCombo.length > 3)
                {
                    // popup visually!
                    self.addComboPopup(
                        self.newCombo[0].x,
                        self.newCombo[0].y,
                        self.newCombo.length,
                        false);
                }

                if(self.newCombo[0].isChaining && self.gameEngineBoard.globalChainCounter > 1)
                {
                    var tileY = self.newCombo.length > 3 ? self.newCombo[0].y + 1 : self.newCombo[0].y;

                    // popup visually!
                    self.addComboPopup(
                        self.newCombo[0].x,
                        tileY,
                        self.gameEngineBoard.globalChainCounter,
                        true);
                }

                self.newCombo = [];
            }
        }

        this.removeOldCombos = function()
        {
            for(var i = self.combos.length -1; i >= 0; i--)
            {
                for(var j = 0; j < self.combos[i].length; j++)
                {
                    if(!self.combos[i][j].isComboing)
                    {
                        self.combos.splice(i, 1);
                        break;
                    }
                }
            }
        }

        this.isTileAlreadyInCombo = function(tile)
        {
            for(var i = 0; i < self.combos.length; i++)
            {
                if(self.combos[i].indexOf(tile) != -1)
                {
                    return true;
                }
            }

            return false;
        }

        this.addComboPopup = function(tileX, tileY, number, falseComboTrueChain)
        {
            var realX = tileX * graphicsEngine.tileWidth;
            var realY = self.height - tileY * graphicsEngine.tileHeight -
                self.yOffsetAsHeight * self.gameEngineBoard.yOffset;

            self.comboPopups.push(
                new ComboPopup(realX, realY, number, self.removeComboPopup, falseComboTrueChain));

            if(falseComboTrueChain && number <= 3)
            {
                graphicsEngine.audios.chain_mild.play();
            }
            else if(falseComboTrueChain && number > 3)
            {
                graphicsEngine.audios.chain_intense.play();
            }
        }

        this.removeComboPopup = function(popup)
        {
            var index = self.comboPopups.indexOf(popup);
            if(index != -1)
            {
                self.comboPopups.splice(index, 1);
            }
        }
    }

    var ComboPopup = function(realX, realY, number, removeCallback, falseComboTrueChain)
    {
        var bgColor = "rgb(214,16,0)";
        var bgBorder = "rgb(255,255,255)";
        var textColor = "rgb(255, 240, 0)";

        if(falseComboTrueChain)
        {
            bgColor = "rgb(0,146,0)";

            this.text = new Text(
                graphicsEngine.tileWidth,
                graphicsEngine.tileHeight,
                'bold 15pt Arial',
                textColor);
            this.text.text = "x" + number;
            this.text.x = realX + graphicsEngine.tileWidth * 0.1;
            this.text.y = realY + graphicsEngine.tileHeight * 0.9;
        }
        else
        {
            this.text = new Text(
                graphicsEngine.tileWidth,
                graphicsEngine.tileHeight,
                'bold 22pt Arial',
                textColor);

            this.text.text = number;
            this.text.x = realX + graphicsEngine.tileWidth * 0.2;
            this.text.y = realY + graphicsEngine.tileHeight * 0.9;
        }


        this.background = new Sprite(
            graphicsEngine.tileWidth,
            graphicsEngine.tileHeight,
            bgColor,
            bgBorder,
            2);
        this.background.x = realX;
        this.background.y = realY;

        this.durationMs = 1000;
        this.ageMs = 0;
        var destinationY = graphicsEngine.tileHeight * -0.75;


        var self = this;
        this.render = function()
        {
            canvasContext.save();
            canvasContext.scale(0.95, 0.95);

            var t = self.ageMs / self.durationMs;
            canvasContext.translate(0, t * destinationY);

            self.background.render();
            self.text.render();
            canvasContext.restore();

            self.ageMs += deltaTimeMs;
            if(self.ageMs >= self.durationMs)
            {
                removeCallback(self);
            }
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
    
    var SoundClip = function(audioPath)
    {
        this.audioObj = new Audio();
        var self = this;

        this.audioObj.onloadeddata = function()
        {
            self.play = function()
            {
                self.audioObj.volume = graphicsEngine.sfxVolume;
                self.audioObj.play();
            }
        }

        // load the sound
        this.audioObj.src = audioPath;
        this.audioObj.load();

        // can't play sound unless loaded
        this.play = function(){}
    }

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
                canvasContext.save();
                canvasContext.translate(
                    self.x,
                    self.y
                );
                canvasContext.fillStyle = self.fillStyle;
                canvasContext.rect(0, 0, self.width, self.height);
                canvasContext.fill();
                canvasContext.restore();
            }
        };
        
        // load the image
        this.imageObj.src = imgPath;
        
        // don't do anything until loaded
        this.render = function(){}
    }
    
    var Text = function(x, y, font, fillStyle)
    {
        this.text = "";
        this.font = font;
        this.fillStyle = fillStyle;
        this.x = x;
        this.y = y;
        this.scaleX = 1;
        this.scaleY = 1;
        
        var self = this;
        this.render = function()
        {
            canvasContext.save();
            canvasContext.fillStyle = self.fillStyle;
            canvasContext.font = self.font;
            canvasContext.scale(self.scaleX, self.scaleY);
            canvasContext.fillText(self.text, self.x, self.y);
            canvasContext.restore();
        }
    }
}