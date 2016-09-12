module Whosthebest.Graphics
{
    var TILE_WIDTH: number;
    var TILE_HEIGHT: number;

    export class State_Game extends Phaser.State
    {
        fpsText: Phaser.Text;
        gameBoards: GameBoard[];

        static TILE_SPRITE_KEYS = [
            "images/game/tile_0.png",
            "images/game/tile_1.png",
            "images/game/tile_2.png",
            "images/game/tile_3.png",
            "images/game/tile_4.png",
            "images/game/tile_5.png",
            "images/game/tile_6.png",
            "images/game/tile_6.png",
            "images/game/tile_6.png",
            "images/game/tile_6.png",
            "images/game/tile_6.png", // 10 = attackBlockTypeStartIndex
            "images/game/tile_6.png",
            "images/game/tile_6.png",
            "images/game/tile_6.png",
            "images/game/tile_6.png",
            "images/game/tile_6.png"
            ];

        empty = () => 
        {

        }

        preload()
        {
            // load all TILE assets
            for(var i = 0; i < State_Game.TILE_SPRITE_KEYS.length; i++)
            {
                this.load.spritesheet(
                    State_Game.TILE_SPRITE_KEYS[i], 
                    State_Game.TILE_SPRITE_KEYS[i], 
                    15, 15);
            }
        }

        create()
        {
            TILE_WIDTH = Math.round(this.game.width * 0.05625);
            TILE_HEIGHT = Math.round(this.game.height * 0.0667);

            this.gameBoards = [];

            // player 1
            var board1 = new GameBoard(this.game, null, "board1", true);
            board1.x = canvasElement.width / 4;
            board1.y = canvasElement.height / 2;
            board1.x -= GameEngine.Instance.colCount * TILE_WIDTH / 2;
            board1.y -= GameEngine.Instance.rowCountInBounds * TILE_HEIGHT / 2;
            board1.initialize(GameEngine.Instance.boards[0]);
            this.gameBoards.push(board1);
            this.add.existing(board1);

            // player 2
            if(GameEngine.Instance.boards.length > 1)
            {
                var board2 = new GameBoard(this.game, null, "board2", true);
                board2.x = canvasElement.width * 3 / 4;
                board2.y = canvasElement.height / 2
                board2.x -= GameEngine.Instance.colCount * TILE_WIDTH / 2;
                board2.y -= GameEngine.Instance.rowCountInBounds * TILE_HEIGHT / 2;
                board2.initialize(GameEngine.Instance.boards[1]);
                this.gameBoards.push(board2);
                this.add.existing(board2);
            }

            this.fpsText = this.add.text(
                this.game.width / 2, 
                5, 
                "FPS", 
                {font: "10pt Arial", fill: "#000"});
            this.fpsText.anchor.set(0.5, 0);
            
            // show legacy graphics canvas
            canvasElement.hidden = false;
        }

        shutdown()
        {
            // destroy all objects
            //this.gameBoards.forEach((gameBoard) => {gameBoard.destroy()});
            //this.fpsText.destroy();

            // hide legacy graphics canvas
            canvasElement.hidden = true;

            ServerTranslator.Instance.disconnectFromGame();
        }

        frameCount = 0;
        update()
        {
            this.fpsText.text = this.game.time.fps.toString();

            this.gameBoards.forEach(
                (gameBoard) =>
            {
                gameBoard.updateBoard();
            });

            this.frameCount++;
            if(this.frameCount > 100)
            {
                //throw "123";
            }
        }    
    }
    
    class GameBoard extends Phaser.Group
    {
        boardWidth: number;
        boardHeight: number;
        yOffsetAsHeight: number;

        comboPopups = [];

        spriteBorder: Phaser.Sprite;
        spriteBottom: Phaser.Sprite;
        spriteCursor: Phaser.Sprite;
        
        textGameOverCounter: Phaser.Text;

        gameEngineBoard: Board;

        tilePools: Phaser.Group[];

        empty = () =>
        {
        }

        initialize = (gameEngineBoard: Board) =>
        {
            this.gameEngineBoard = gameEngineBoard;

            this.boardWidth = GameEngine.Instance.colCount * TILE_WIDTH;
            this.boardHeight = GameEngine.Instance.rowCountInBounds * TILE_HEIGHT;
            this.yOffsetAsHeight = TILE_HEIGHT / gameEngineBoard.yOffsetMax;

            // use graphics tool to draw a border with a filled lightbox
             var graphics = this.game.add.graphics(0, 0);
            graphics.lineStyle(2, 0x0000FF, 1);
            graphics.beginFill(0x000000, 0.3);
            graphics.drawRect(0, 0, this.boardWidth, this.boardHeight);
            graphics.endFill();
            this.spriteBorder = this.add(
                this.game.add.sprite(0, 0, graphics.generateTexture()));
            graphics.destroy();

            // create pools for each of the tile types
            // appends each pool as a child so tiles will have appropriate x/y etc,
            // relative to this game board
            this.tilePools = [];
            for(var i = 0; i < State_Game.TILE_SPRITE_KEYS.length; i++)
            {
                var pool = this.game.add.group();
                this.tilePools.push(pool);
                this.add(pool);
            }

            // use graphics tool to draw the bottom border
             var graphics = this.game.add.graphics(0, 0);
            graphics.lineStyle(2, 0x0000FF, 1);
            graphics.beginFill(0x000000, 0.3);
            graphics.drawRect(0, 0, this.boardWidth, this.boardHeight);
            graphics.endFill();
            this.spriteBottom = this.add(
                this.game.add.sprite(0, this.boardHeight, graphics.generateTexture()));
            graphics.destroy();

            // use graphics tool to draw the cursor
            // the cursor is two squares [][]
             var graphics = this.game.add.graphics(0, 0);
            graphics.lineStyle(3, 0x000000, 1);
            graphics.beginFill(0x000000, 0.0);
            graphics.drawRect(0, 0, TILE_WIDTH - 3, TILE_HEIGHT);
            graphics.endFill();
            graphics.beginFill(0x000000, 0.0);
            graphics.drawRect(TILE_WIDTH, 0, TILE_WIDTH - 3, TILE_HEIGHT);
            graphics.endFill();
            this.spriteCursor = this.add(
                this.game.add.sprite(0, 0, graphics.generateTexture()));
            graphics.destroy();

            // gameover counter at the top (for debugging)
            this.textGameOverCounter = this.add(
                this.game.add.text(
                    0, 0, "GameOver", 
                    {font: "10pt Arial", fill: "#000"}));
            this.textGameOverCounter.anchor.set(0.5, 0);
        }

        updateBoard = () =>
        {
            // soft-kill every single tile sprite each frame, returning it to the pool.
            // other solution is to maintain a map between board tiles and sprite tiles
            this.tilePools.forEach( 
                (pool) =>
            {
                pool.children
                pool.children.forEach(
                    (tileSprite) =>
                {
                    (<Phaser.Sprite>tileSprite).kill();
                })
            });

            // tiles ticking upwards
            var yOffsetCurrentHeight = this.yOffsetAsHeight * this.gameEngineBoard.yOffset;

            this.gameEngineBoard.tiles.forEach( 
                (tile) => 
            {
                // grab a sprite from the pool, with the tile type index
                var tileSprite = this.getDeadOrNewTileSprite(
                    tile.type - GameEngine.Instance.basicTileTypeStartIndex);
                
                // wake the tile from "dead" state and set x,y
                var tileX = tile.x * TILE_WIDTH;
                if(tile.swappingFrameCount >= 0)
                {
                    var swapPercent = 1 - (tile.swappingFrameCount / tile.swappingFrameReset);
                    tileX += swapPercent * TILE_WIDTH * tile.xShift;
                }

                tileSprite.reset(
                    tileX, 
                    this.boardHeight - tile.y * TILE_HEIGHT - yOffsetCurrentHeight);

                // handle flashing animation 
                if( tile.comboFrameCount > 0 &&
                    tile.comboFrameCount % 2 == 0)
                {
                    tileSprite.frame = 1;
                }
                else 
                {
                    tileSprite.frame = 0;
                }
            });

            // x,y for the cursor
            this.spriteCursor.x = this.gameEngineBoard.cursor.x * TILE_WIDTH;
            this.spriteCursor.y = this.boardHeight - this.gameEngineBoard.cursor.y * TILE_HEIGHT - yOffsetCurrentHeight;

            // debug text for the gameover count
            this.textGameOverCounter.text = this.gameEngineBoard.gameOverLeewayCount.toString();
        }
        
        getDeadOrNewTileSprite = (index: number) =>
        {
            if(index < 0 || index > this.tilePools.length)
            {
                Debug.log("[error] TILE index out of bounds " + index);
                return null;
            }

            // var countDead = State_Game.tilePools[index].countDead();
            // var countLiving = State_Game.tilePools[index].countLiving();

            var tile: Phaser.Sprite = this.tilePools[index].getFirstDead(
                true,
                -1000, 
                -1000, 
                State_Game.TILE_SPRITE_KEYS[index]);
            tile.width = TILE_WIDTH;
            tile.height = TILE_HEIGHT;
            this.tilePools[index].add(tile);

            // var countDAfter = State_Game.tilePools[index].countDead();
            // var countLAfter = State_Game.tilePools[index].countLiving();

            // Debug.log(`${index}: dead(${countDead}) living(${countLiving}) afterD(${countDAfter}) afterL(${countLAfter})`);

            return tile;
        }
    }
}