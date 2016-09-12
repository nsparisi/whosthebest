module Whosthebest.Graphics
{
    var TILE_WIDTH: number;
    var TILE_HEIGHT: number;

    export class State_Game extends Phaser.State
    {
        fpsText: Phaser.Text;
        gameBoards: GameBoard[];

        static sfxChainMild: Phaser.Sound;
        static sfxChainIntense: Phaser.Sound;

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

            this.load.audio("audio/chain_intense.mp3","audio/chain_intense.mp3");
            this.load.audio("audio/chain_mild.mp3", "audio/chain_mild.mp3");
        }

        create()
        {
            TILE_WIDTH = Math.round(this.game.width * 0.05625);
            TILE_HEIGHT = Math.round(this.game.height * 0.0667);

            this.gameBoards = [];

            // player 1
            var board1 = new GameBoard(this.game, null, "board1", true);
            board1.x = this.game.width / 4;
            board1.y = this.game.height / 2;
            board1.x -= GameEngine.Instance.colCount * TILE_WIDTH / 2;
            board1.y -= GameEngine.Instance.rowCountInBounds * TILE_HEIGHT / 2;
            board1.initialize(GameEngine.Instance.boards[0]);
            this.gameBoards.push(board1);
            this.add.existing(board1);

            // player 2
            if(GameEngine.Instance.boards.length > 1)
            {
                var board2 = new GameBoard(this.game, null, "board2", true);
                board2.x = this.game.width * 3 / 4;
                board2.y = this.game.height / 2
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

            State_Game.sfxChainIntense = this.add.audio("audio/chain_intense.mp3");
            State_Game.sfxChainMild = this.add.audio("audio/chain_mild.mp3");
        }

        shutdown()
        {
            // destroy all objects
            // game objects are destroyed as long as they belong to this state
            //this.gameBoards.forEach((gameBoard) => {gameBoard.destroy()});
            //this.fpsText.destroy();

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

            // look for and update combo visuals
            this.updateCombos();

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

        combos = [];
        newCombo = [];
        updateCombos =  () =>
        {
            this.removeOldCombos();
            this.checkForNewCombos();
        }
        
        removeOldCombos = () =>
        {
            for(var i = this.combos.length - 1; i >= 0; i--)
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

        checkForNewCombos = () =>
        {
            // find all new combos occurring this frame
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

            // determine if combo is worthy of a popup.
            // combos are 4x tiles or more
            // chains are isChaining property
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

        addComboPopup = (tileX, tileY, count, falseComboTrueChain) =>
        {
            // todo logic for visuals
            var realX = tileX * GraphicsEngine.Instance.tileWidth;
            var realY = this.height - tileY * GraphicsEngine.Instance.tileHeight -
                this.yOffsetAsHeight * this.gameEngineBoard.yOffset;

            if(falseComboTrueChain && count <= 3)
            {
               State_Game.sfxChainMild.play();
            }
            else if(falseComboTrueChain && count > 3)
            {
               State_Game.sfxChainIntense.play();
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
}