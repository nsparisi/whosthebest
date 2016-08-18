/// <reference path="references.ts" />
Debug.log("graphics.ts");

/**
 * Handles all graphical related actions for a game.
 */
class GraphicsEngine
{
    // singleton implementation
    static Instance = new GraphicsEngine();
    constructor()
    {
        if(GraphicsEngine.Instance)
        {
            throw new Error("An instance of GraphicsEngine already exists.");
        }
        
        GraphicsEngine.Instance = this;
    }

    textures =
        {
            gameBackgound : "images/bg.jpg"
        }
    
    colors = ["#FFABAB", "#FFDAAB", "#DDFFAB", "#ABE4FF", "#D9ABFF"];
    comboFlashStyle = "#EEEEEE";
    sprites: any[];
    tileWidth: number;
    tileHeight: number;
    
    // fps
    fpsText: GraphicsText;
    frameCount = 0;
    lapsed = 0;

    // boards
    graphicsBoards: GraphicsBoard[];
    sfxVolume = 0.1;
    audios: SoundClip[];
    
    initialize = () =>
    {
        this.sprites = [];
        this.graphicsBoards = [];
        this.tileWidth = Math.round(canvasElement.width * 0.05625);
        this.tileHeight = Math.round(canvasElement.height * 0.0667);
        
        this.audios = [];
        this.audios["chain_intense"] = new SoundClip("audio/chain_intense.mp3" );
        this.audios["chain_mild"] = new SoundClip("audio/chain_mild.mp3");
        
        // border (not needed)
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

        // fps
        this.fpsText = new GraphicsText(
            5, 
            20, 
            "bold 16px Arial", 
            'limegreen'
            );
        this.fpsText.text = "Hello World";
        this.sprites.push(this.fpsText);

        // player 1
        var board = new GraphicsBoard(GameEngine.Instance.boards[0]);
        board.x = canvasElement.width / 4;
        board.y = canvasElement.height / 2;
        board.x -= GameEngine.Instance.colCount * this.tileWidth / 2;
        board.y -= GameEngine.Instance.rowCountInBounds * this.tileHeight / 2;
        this.sprites.push(board);
        this.graphicsBoards.push(board);

        // player 2
        if(GameEngine.Instance.boards.length > 1)
        {
            var board = new GraphicsBoard(GameEngine.Instance.boards[1]);
            board.x = canvasElement.width * 3 / 4;
            board.y = canvasElement.height / 2
            board.x -= GameEngine.Instance.colCount * this.tileWidth / 2;
            board.y -= GameEngine.Instance.rowCountInBounds * this.tileHeight / 2;
            this.sprites.push(board);
            this.graphicsBoards.push(board);
        }
    }
    
    update = () =>
    {
        // check game state
        if(GameEngine.Instance.currentGameState == GameEngine.Instance.gameStateTypes.Starting)
        {
            for(var i = 0; i < this.graphicsBoards.length; i++)
            {
                this.graphicsBoards[i].gameEngineBoard = GameEngine.Instance.boards[i];
            }
        }

        canvasContext.clearRect(0,0, canvasElement.width, canvasElement.height);
        this.sprites.forEach(
            (sprite) =>
            {
                canvasContext.save();
                sprite.render();
                canvasContext.restore();
            });
            
        // fps
        this.frameCount++;
        this.lapsed += deltaTimeMs;
        if(this.lapsed > 500)
        {
            this.fpsText.text = Math.round(this.frameCount * (1000 / this.lapsed)).toString();
            this.lapsed = 0;
            this.frameCount = 0
        }
    }
}
        
/**
 * Defines rendering for a visual representation of a game board.
 */
class GraphicsBoard
{
    x: number;
    y: number; 
    width: number;
    height: number;
    yOffsetAsHeight: number;

    comboPopups = [];
    
    border: Sprite;
    bottom: Sprite;
    lightbox: Sprite;
    
    // cursor looks like this [][]
    cursor1: Sprite;
    cursor2: Sprite;

    // gameover countdown
    gameOverCounter: GraphicsText;
    
    constructor(public gameEngineBoard: Board)
    {
        this.x = canvasElement.width / 2;
        this.y = canvasElement.height / 2 
        this.x -= GameEngine.Instance.colCount * GraphicsEngine.Instance.tileWidth / 2;
        this.y -= GameEngine.Instance.rowCountInBounds * GraphicsEngine.Instance.tileHeight / 2;
        this.width = GameEngine.Instance.colCount * GraphicsEngine.Instance.tileWidth;
        this.height = GameEngine.Instance.rowCountInBounds * GraphicsEngine.Instance.tileHeight;
        this.yOffsetAsHeight = GraphicsEngine.Instance.tileHeight / gameEngineBoard.yOffsetMax;
        
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
        this.cursor1 = new Sprite(
            GraphicsEngine.Instance.tileWidth,
            GraphicsEngine.Instance.tileHeight,
            'rgba(0,0,0,0.0)',
            'black', 
            3);  
        this.cursor2 = new Sprite(
            GraphicsEngine.Instance.tileWidth,
            GraphicsEngine.Instance.tileHeight,
            'rgba(0,0,0,0.0)',
            'black', 
            3);
        this.gameOverCounter = new GraphicsText(
            0, 0, "14pt arial", "#000");
    }
        
    render = () =>
    {
        this.updateCombos();

        canvasContext.translate(this.x, this.y);
    
        // faded lightbox behind tiles
        this.lightbox.render();
        
        // tiles ticking upwards
        var yOffsetCurrentHeight = this.yOffsetAsHeight * this.gameEngineBoard.yOffset;
        
        canvasContext.lineWidth = 1;
        canvasContext.strokeStyle = "black";
        this.gameEngineBoard.tiles.forEach(
            (tile) =>
            {
                canvasContext.save();

                // ==============
                // fill color style
                var fillStyle = "#FF00FF";

                if(tile.type >= GameEngine.Instance.attackBlockTypeStartIndex)
                {
                    var fillStyle = "#FF00FF";
                }
                else if(tile.type >= GameEngine.Instance.basicTileTypeStartIndex)
                {
                    var fillStyle = GraphicsEngine.Instance.colors[tile.type - GameEngine.Instance.basicTileTypeStartIndex];
                }

                // tile is being combo'd
                if(tile.comboFrameCount > 0 &&
                    tile.comboFrameCount % 2 == 0)
                {
                    fillStyle = GraphicsEngine.Instance.comboFlashStyle;
                }

                // debug, tile is chaining
                if(tile.isChaining)
                {
                    //fillStyle = "#AAAAAA"
                }

                canvasContext.fillStyle = fillStyle;

                // ===============
                // x, y position
                var x = tile.x * GraphicsEngine.Instance.tileWidth;
                if(tile.swappingFrameCount >= 0)
                {
                    var swapPercent = 1 - (tile.swappingFrameCount / tile.swappingFrameReset);
                    x += swapPercent * GraphicsEngine.Instance.tileWidth * tile.xShift;
                }
                canvasContext.translate(
                    x,
                    this.height - tile.y * GraphicsEngine.Instance.tileHeight - yOffsetCurrentHeight
                );
                canvasContext.beginPath();
                canvasContext.rect(0, 0, GraphicsEngine.Instance.tileWidth, GraphicsEngine.Instance.tileHeight);
                canvasContext.fill();

                // draw borders around the tile
                if(!tile.isConnectedUp)
                {
                    canvasContext.beginPath();
                    canvasContext.moveTo(0, 0);
                    canvasContext.lineTo(GraphicsEngine.Instance.tileWidth, 0);
                    canvasContext.stroke();
                }

                if(!tile.isConnectedRight)
                {
                    canvasContext.beginPath();
                    canvasContext.moveTo(GraphicsEngine.Instance.tileWidth, 0);
                    canvasContext.lineTo(GraphicsEngine.Instance.tileWidth, GraphicsEngine.Instance.tileHeight);
                    canvasContext.stroke();
                }

                if(!tile.isConnectedLeft)
                {
                    canvasContext.beginPath();
                    canvasContext.moveTo(0, 0);
                    canvasContext.lineTo(0, GraphicsEngine.Instance.tileHeight);
                    canvasContext.stroke();
                }

                if(!tile.isConnectedDown)
                {
                    canvasContext.beginPath();
                    canvasContext.moveTo(0, GraphicsEngine.Instance.tileHeight);
                    canvasContext.lineTo(GraphicsEngine.Instance.tileWidth, GraphicsEngine.Instance.tileHeight);
                    canvasContext.stroke();
                }
                canvasContext.restore();

            });
            
        // cursor overtop tiles
        this.cursor1.x = this.gameEngineBoard.cursor.x * GraphicsEngine.Instance.tileWidth;
        this.cursor1.y = this.height - this.gameEngineBoard.cursor.y * GraphicsEngine.Instance.tileHeight - yOffsetCurrentHeight;
        this.cursor1.render();
        this.cursor2.x = this.cursor1.x + GraphicsEngine.Instance.tileWidth;
        this.cursor2.y = this.cursor1.y;
        this.cursor2.render();
        
        // border around tiles
        this.border.render();
        this.bottom.render();
        
        // render popups
        this.comboPopups.forEach(
            (popup) =>
            {
                popup.render();
            });

        // gameover counter
        this.gameOverCounter.text = this.gameEngineBoard.gameOverLeewayCount.toString();
        this.gameOverCounter.render();
    }

    combos = [];
    newCombo = [];
    updateCombos =  () =>
    {
        this.removeOldCombos();
        this.checkForNewCombos();
    }

    checkForNewCombos = () =>
    {
        for(var i = this.gameEngineBoard.boardSpaces.length - 1; i >= 0 ; i--)
        {
            for(var j = 0; j < this.gameEngineBoard.boardSpaces[i].length; j++)
            {
                var tile = this.gameEngineBoard.getTileAtSpace(j, i);

                if(tile && !tile.isAttackBlock && tile.isComboing && !this.isTileAlreadyInCombo(tile) && !tile.persistAfterCombo)
                {
                    this.newCombo.push(tile);
                }
            }
        }

        // show combo popup
        if(this.newCombo.length > 0)
        {
            this.combos.push(this.newCombo);

            if(this.newCombo.length > 3)
            {
                // popup visually!
                this.addComboPopup(
                    this.newCombo[0].x,
                    this.newCombo[0].y,
                    this.newCombo.length,
                    false);
            }

            if(this.newCombo[0].isChaining && this.gameEngineBoard.globalChainCounter > 1)
            {
                var tileY = this.newCombo.length > 3 ? this.newCombo[0].y + 1 : this.newCombo[0].y;

                // popup visually!
                this.addComboPopup(
                    this.newCombo[0].x,
                    tileY,
                    this.gameEngineBoard.globalChainCounter,
                    true);
            }

            this.newCombo = [];
        }
    }

    removeOldCombos = () =>
    {
        for(var i = this.combos.length -1; i >= 0; i--)
        {
            for(var j = 0; j < this.combos[i].length; j++)
            {
                if(!this.combos[i][j].isComboing)
                {
                    this.combos.splice(i, 1);
                    break;
                }
            }
        }
    }

    isTileAlreadyInCombo = (tile) =>
    {
        for(var i = 0; i < this.combos.length; i++)
        {
            if(this.combos[i].indexOf(tile) != -1)
            {
                return true;
            }
        }

        return false;
    }

    addComboPopup = (tileX, tileY, number, falseComboTrueChain) =>
    {
        var realX = tileX * GraphicsEngine.Instance.tileWidth;
        var realY = this.height - tileY * GraphicsEngine.Instance.tileHeight -
            this.yOffsetAsHeight * this.gameEngineBoard.yOffset;

        this.comboPopups.push(
            new ComboPopup(realX, realY, number, this.removeComboPopup, falseComboTrueChain));

        if(falseComboTrueChain && number <= 3)
        {
            GraphicsEngine.Instance.audios["chain_mild"].play();
        }
        else if(falseComboTrueChain && number > 3)
        {
            GraphicsEngine.Instance.audios["chain_intense"].play();
        }
    }

    removeComboPopup = (popup) =>
    {
        var index = this.comboPopups.indexOf(popup);
        if(index != -1)
        {
            this.comboPopups.splice(index, 1);
        }
    }
}

/**
 * Defines rendering for a combo visual popup
 */
class ComboPopup
{
    text: GraphicsText;
    background: Sprite;
    durationMs = 1000;
    ageMs = 0;
    destinationY = GraphicsEngine.Instance.tileHeight * -0.75;
    removeCallback: Function;
    
    constructor(
        realX: number, 
        realY: number, 
        comboNumber: number, 
        removeCallback: Function, 
        falseComboTrueChain: boolean)
    {
        this.removeCallback = removeCallback;
        var bgColor = "rgb(214,16,0)";
        var bgBorder = "rgb(255,255,255)";
        var textColor = "rgb(255, 240, 0)";

        if(falseComboTrueChain)
        {
            bgColor = "rgb(0,146,0)";

            this.text = new GraphicsText(
                GraphicsEngine.Instance.tileWidth,
                GraphicsEngine.Instance.tileHeight,
                'bold 15pt Arial',
                textColor);
            this.text.text = "x" + comboNumber;
            this.text.x = realX + GraphicsEngine.Instance.tileWidth * 0.1;
            this.text.y = realY + GraphicsEngine.Instance.tileHeight * 0.9;
        }
        else
        {
            this.text = new GraphicsText(
                GraphicsEngine.Instance.tileWidth,
                GraphicsEngine.Instance.tileHeight,
                'bold 22pt Arial',
                textColor);

            this.text.text = comboNumber.toString();
            this.text.x = realX + GraphicsEngine.Instance.tileWidth * 0.2;
            this.text.y = realY + GraphicsEngine.Instance.tileHeight * 0.9;
        }
        
        this.background = new Sprite(
            GraphicsEngine.Instance.tileWidth,
            GraphicsEngine.Instance.tileHeight,
            bgColor,
            bgBorder,
            2);
        this.background.x = realX;
        this.background.y = realY;
    }
    
    render = () =>
    {
        canvasContext.save();
        canvasContext.scale(0.95, 0.95);

        var t = this.ageMs / this.durationMs;
        canvasContext.translate(0, t * this.destinationY);

        this.background.render();
        this.text.render();
        canvasContext.restore();

        this.ageMs += deltaTimeMs;
        if(this.ageMs >= this.durationMs)
        {
            this.removeCallback(this);
        }
    }
}

/**
* Sprite object right now represents a square
* with a width, height, stroke and fill style and rect line width
*/
class Sprite
{
    x = 0;
    y = 0;
    
    constructor(
        public width: number, 
        public height: number, 
        public fillStyle: string, 
        public strokeStyle: string, 
        public lineWidth: number)
    {
        
    }

    render = () =>
    {
        //Render the sprite
        canvasContext.save();
        canvasContext.strokeStyle = this.strokeStyle;
        canvasContext.lineWidth = this.lineWidth;
        canvasContext.fillStyle = this.fillStyle;
        canvasContext.translate(
            this.x,
            this.y
        );
        canvasContext.beginPath();
        canvasContext.rect(0, 0, this.width, this.height);
        canvasContext.stroke();
        canvasContext.fill();
        canvasContext.restore();
    };
};

class SoundClip
{
    audioObj: HTMLAudioElement;
    constructor(audioPath)
    {
        // load the sound
        this.audioObj = new Audio();
        this.audioObj.src = audioPath;
        this.audioObj.load();
        this.audioObj.onloadeddata = () =>
        {
            this.play = () =>
            {
                this.audioObj.volume = GraphicsEngine.Instance.sfxVolume;
                this.audioObj.play();
            }
        }
    }

    // can't play sound unless loaded
    play = () => { }
}

/**
* A texture that loads an image safely and draws it at
* x,y with width,height
*/
class GraphicsTexture
{
    x = 0;
    y = 0;
    fillStyle = null;
    imageObj: HTMLImageElement;
    
    constructor(
        public width: number, 
        public height: number, 
        public imgPath: string)
    {
        // load the image
        this.imageObj = new Image();
        this.imageObj.src = imgPath;
        this.imageObj.onload = () =>
        {
            var pattern = canvasContext.createPattern(this.imageObj, 'repeat');
            this.fillStyle = pattern;
            this.render = () =>
            {
                canvasContext.save();
                canvasContext.translate(
                    this.x,
                    this.y
                );
                canvasContext.fillStyle = this.fillStyle;
                canvasContext.rect(0, 0, this.width, this.height);
                canvasContext.fill();
                canvasContext.restore();
            }
        };
    }

    // don't do anything until loaded
    render =  () => { }
}

class GraphicsText
{
    constructor(
        public x: number, 
        public y: number, 
        public font: string, 
        public fillStyle: string)
    {
        
    }
    
    text = "";
    scaleX = 1;
    scaleY = 1;

    render = () =>
    {
        canvasContext.save();
        canvasContext.fillStyle = this.fillStyle;
        canvasContext.font = this.font;
        canvasContext.scale(this.scaleX, this.scaleY);
        canvasContext.fillText(this.text, this.x, this.y);
        canvasContext.restore();
    }
}