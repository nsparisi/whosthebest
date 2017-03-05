module Whosthebest.Graphics
{
    var TILE_WIDTH: number;
    var TILE_HEIGHT: number;

    export class State_Game extends Phaser.State
    {
        fpsText: Phaser.Text;
        fpsTextPhaser: Phaser.Text;
        gameClock: Phaser.Text;
        gameSpeed: Phaser.Text;

        networkText1: Phaser.Text;
        networkText2: Phaser.Text;
        networkText3: Phaser.Text;
        networkText4: Phaser.Text;
        networkText5: Phaser.Text;
        networkText6: Phaser.Text;
        networkText7: Phaser.Text;
        networkText8: Phaser.Text;
        networkText9: Phaser.Text;
        networkText10: Phaser.Text;

        networkText1Label: Phaser.Text;
        networkText2Label: Phaser.Text;
        networkText3Label: Phaser.Text;
        networkText4Label: Phaser.Text;
        networkText5Label: Phaser.Text;
        networkText6Label: Phaser.Text;
        networkText7Label: Phaser.Text;
        networkText8Label: Phaser.Text;
        networkText9Label: Phaser.Text;
        networkText10Label: Phaser.Text;
        gameBoards: GameBoard[];

        spritesheets: Phaser.Sprite[];
        sfxChainIntenses: Phaser.Sound[];
        sfxChainMilds: Phaser.Sound[];
        
        buttonQuit: Phaser.Button;

        static NUMBER_OF_CHARACTERS = 8;
        static GAME_INSTANCE: GameEngine;

        characterIndexes: number[];

        static  TILE_SPRITE_KEYS = [
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

        init(randomSeed: number, isPracticeGame: boolean, characterIndexes: number[])
        {
            Debug.log("state_game init: " + randomSeed + ":" + isPracticeGame);
            InputEngine.Instance.initialize(bodyElement);    
            LOCAL_GAME_ENGINE.initialize(randomSeed);
            SERVER_GAME_ENGINE.initialize(randomSeed);
            GenerationEngine.Instance.initialize();
            GenerationEngine.Instance.setAsPracticeGame(isPracticeGame);
            Main.Instance.isRunning = true;
            this.characterIndexes = characterIndexes;
            State_Game.GAME_INSTANCE = GenerationEngine.Instance.isPracticeGame ? SERVER_GAME_ENGINE : LOCAL_GAME_ENGINE;
            Debug.log(characterIndexes[0] + ' : ' + characterIndexes[1]);
        }

        create()
        {
            TILE_WIDTH = 25;
            TILE_HEIGHT = 25;

            // TILE_WIDTH = Math.round(this.game.width * 0.05625);
            // TILE_HEIGHT = Math.round(this.game.height * 0.0667);

            // NETWORK_DEBUG
            /*
            // player 1
            var serverBoard1 = new GameBoard(this.game, null, "serverBoard1", true);
            serverBoard1.x = board2.x + boardWidth + 100;
            serverBoard1.y = this.game.height / 2;
            serverBoard1.y -= LOCAL_GAME_ENGINE.rowCountInBounds * TILE_HEIGHT / 2;
            serverBoard1.initialize(SERVER_GAME_ENGINE.boards[0], false);
            this.gameBoards.push(serverBoard1);
            this.add.existing(serverBoard1);

            // player 2
            if(SERVER_GAME_ENGINE.boards.length > 1)
            {
                var serverBoard2 = new GameBoard(this.game, null, "serverBoard2", true);
                serverBoard2.x = serverBoard1.x + boardWidth + 20;
                serverBoard2.y = this.game.height / 2
                serverBoard2.y -= LOCAL_GAME_ENGINE.rowCountInBounds * TILE_HEIGHT / 2;
                serverBoard2.initialize(SERVER_GAME_ENGINE.boards[1], false);
                this.gameBoards.push(serverBoard2);
                this.add.existing(serverBoard2);
            }
            */

            this.fpsText = this.add.text(
                this.game.width / 2, 
                5, 
                "FPS", 
                {font: "10pt Arial", fill: "#000"});
            this.fpsText.anchor.set(0.5, 0);

            this.fpsTextPhaser = this.add.text(
                this.game.width / 2, 
                20, 
                "FPS", 
                {font: "10pt Arial", fill: "#000"});
            this.fpsTextPhaser.anchor.set(0.5, 0);

            this.gameClock = this.add.text(
                this.game.width - 50, 
                this.game.height -50,
                "FPS", 
                {font: "20pt Arial", fill: "#fff"});
            this.gameClock.anchor.set(0.5, 0);

            this.gameSpeed = this.add.text(
                this.game.width - 10, 
                this.game.height - 80,
                "FPS", 
                {font: "20pt Arial", fill: "#000"});
            this.gameSpeed.anchor.set(1, 0);

            // spritesheets - for now order is important
            this.spritesheets = [];
            var sprite = this.add.sprite(40, 10, "images/sprites/ss_cloyster.png", 0);
            sprite.animations.add("idle",[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4], 10, true);
            this.spritesheets.push(sprite);

            sprite = this.add.sprite(120, 10, "images/sprites/ss_growlithe.png", 0);
            sprite.animations.add("idle",[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2], 10, true);
            this.spritesheets.push(sprite);

            sprite = this.add.sprite(40, 80, "images/sprites/ss_pikachu.png", 0);
            sprite.animations.add("idle",[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5], 10, true);
            this.spritesheets.push(sprite);

            sprite = this.add.sprite(120, 80, "images/sprites/ss_poliwhirl.png", 0);
            sprite.animations.add("idle",[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2], 10, true);
            this.spritesheets.push(sprite);

            sprite = this.add.sprite(40, 160, "images/sprites/ss_psyduck.png", 0);
            sprite.animations.add("idle",[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4], 10, true);
            this.spritesheets.push(sprite);

            sprite = this.add.sprite(120, 160, "images/sprites/ss_raichu.png", 0);
            sprite.animations.add("idle",[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2], 10, true);
            this.spritesheets.push(sprite);

            sprite = this.add.sprite(40, 240, "images/sprites/ss_squirtle.png", 0);
            sprite.animations.add("idle",[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2], 10, true);
            this.spritesheets.push(sprite);
            
            sprite = this.add.sprite(120, 240, "images/sprites/ss_weepinbell.png", 0);
            sprite.animations.add("idle",[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2], 10, true);
            this.spritesheets.push(sprite);

            this.spritesheets.forEach(s => 
            {
                s.animations.play("idle");
                s.exists = false;
                s.anchor.x = 0.5;
                s.anchor.y = 0.5;
            });

            // audios - for now ordering is important
            this.sfxChainIntenses = [];
            this.sfxChainIntenses.push(this.add.audio("audio/cloyster_intense.mp3"));
            this.sfxChainIntenses.push(this.add.audio("audio/growlithe_intense.mp3"));
            this.sfxChainIntenses.push(this.add.audio("audio/pikachu_intense.mp3"));
            this.sfxChainIntenses.push(this.add.audio("audio/poliwhirl_intense.mp3"));
            this.sfxChainIntenses.push(this.add.audio("audio/psyduck_intense.mp3"));
            this.sfxChainIntenses.push(this.add.audio("audio/raichu_intense.mp3"));
            this.sfxChainIntenses.push(this.add.audio("audio/squirtle_intense.mp3"));
            this.sfxChainIntenses.push(this.add.audio("audio/weepinbell_intense.mp3"));
            this.sfxChainMilds = [];
            this.sfxChainMilds.push(this.add.audio("audio/cloyster_mild.mp3"));
            this.sfxChainMilds.push(this.add.audio("audio/growlithe_mild.mp3"));
            this.sfxChainMilds.push(this.add.audio("audio/pikachu_mild.mp3"));
            this.sfxChainMilds.push(this.add.audio("audio/poliwhirl_mild.mp3"));
            this.sfxChainMilds.push(this.add.audio("audio/psyduck_mild.mp3"));
            this.sfxChainMilds.push(this.add.audio("audio/raichu_mild.mp3"));
            this.sfxChainMilds.push(this.add.audio("audio/squirtle_mild.mp3"));
            this.sfxChainMilds.push(this.add.audio("audio/weepinbell_mild.mp3"));

            this.gameBoards = [];
            var boardWidth = State_Game.GAME_INSTANCE.colCount * TILE_WIDTH;
            var xSpacing = 50;
            var x = (this.game.width / 2) - (this.characterIndexes.length * boardWidth / 2 ) - xSpacing / 2 ;
            for(var i = 0; i < this.characterIndexes.length; i++)
            {
                var board = new GameBoard(this.game, null, "board" + i, true);
                board.x = x;
                board.y = this.game.height / 2;
                board.y -= State_Game.GAME_INSTANCE.rowCountInBounds * TILE_HEIGHT / 2;
                board.initialize(
                    State_Game.GAME_INSTANCE.boards[i], 
                    this.characterIndexes[i], 
                    this, 
                    i != 0, 
                    true);
                this.gameBoards.push(board);
                this.add.existing(board);

                x += boardWidth + xSpacing;
            }

            var addText = (x, y, label, xAnchor) =>
            {
                var text = this.add.text(
                    x, 
                    y, 
                    label, 
                    {font: "10pt Arial", fill: "#000"});
                text.anchor.set(xAnchor, 0);
                return text;
            }

            this.networkText1 = addText(this.game.width - 43, 5, "0", 1);
            this.networkText2 = addText(this.game.width - 43, 20, "0", 1);
            this.networkText3 = addText(this.game.width - 43, 35, "0", 1);
            this.networkText4 = addText(this.game.width - 43, 50, "0", 1);
            this.networkText5 = addText(this.game.width - 43, 65, "0", 1);
            this.networkText6 = addText(this.game.width - 43, 100, "0", 1);
            this.networkText7 = addText(this.game.width - 43, 115, "0", 1);
            this.networkText8 = addText(this.game.width - 43, 130, "0", 1);
            this.networkText9 = addText(this.game.width - 43, 145, "0", 1);
            this.networkText10 = addText(this.game.width - 43, 160, "0", 1);
            this.networkText1Label = addText(this.game.width - 40, 5, "FRM", 0);
            this.networkText2Label = addText(this.game.width - 40, 20, "IN", 0);
            this.networkText3Label = addText(this.game.width - 40, 35, "OUT", 0);
            this.networkText4Label = addText(this.game.width - 40, 50, "REC", 0);
            this.networkText5Label = addText(this.game.width - 40, 65, "RTT", 0);
            this.networkText6Label = addText(this.game.width - 40, 100, "BUF", 0);
            this.networkText7Label = addText(this.game.width - 40, 115, "FOUT", 0);
            this.networkText8Label = addText(this.game.width - 40, 130, "FIN", 0);
            this.networkText9Label = addText(this.game.width - 40, 145, "GAME", 0);
            this.networkText10Label = addText(this.game.width - 40, 160, "N/A", 0);
            
            this.buttonQuit  = this.add.button(
                TILE_WIDTH, 
                TILE_WIDTH, 
                "images/menu/btn_quit.png", this.quit_pressed, this, 1, 0, 2);

            GAME_INSTANCE.playMusic("audio/music/bgm_game_1.mp3");
        }
        
        quit_pressed()
        {
            GAME_INSTANCE.switchToMenu();
        }

        shutdown()
        {
            // destroy all objects
            // game objects are destroyed as long as they belong to this state
            //this.gameBoards.forEach((gameBoard) => {gameBoard.destroy()});
            //this.fpsText.destroy();

            Main.Instance.isRunning = false;
            ServerTranslator.Instance.disconnectFromGame();
        }

        update()
        {
            this.fpsText.text = deltaTimeMs.toString(); 
            this.fpsTextPhaser.text = this.game.time.fps.toString();
            this.gameClock.text = this.clockToPrettyString();
            this.gameSpeed.text = State_Game.GAME_INSTANCE.boards[0].gameSpeed.toString();

            // NETWORK_DEBUG
            this.updateNetworkInfo();

            this.gameBoards.forEach(
                (gameBoard) =>
            {
                gameBoard.updateBoard();
            });
        }    

        clockToPrettyString = () =>
        {
            var minutes = Math.floor(State_Game.GAME_INSTANCE.boards[0].gameClockInSeconds / 60);
            var seconds = State_Game.GAME_INSTANCE.boards[0].gameClockInSeconds % 60;
            return ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
        }

        updateNetworkInfo()
        {
            var data: FrameTimeData = 
                GenerationEngine.Instance.frameTimings[
                    GenerationEngine.Instance.expectedFrame - 1];

            if(data)
            {
                this.networkText1.text = data.frame;
                this.networkText2.text = data.deltaServerIn;
                this.networkText3.text = data.deltaServerOut;
                this.networkText4.text = data.deltaReceive;
                this.networkText5.text = data.totalRoundTrip;
            }

            this.networkText6.text = GenerationEngine.Instance.receiveBuffer.length.toString();
            this.networkText7.text = GenerationEngine.Instance.frameCount.toString();
            this.networkText8.text = GenerationEngine.Instance.expectedFrame.toString();
            this.networkText9.text = GenerationEngine.Instance.currentFrameInGame.toString();
        }

        switchToGameOver = (winner: number) =>
        {
            for(var i = 0; i < this.gameBoards.length; i++)
            {
                this.gameBoards[i].switchToGameOver(i == winner)
            }

            if(GAME_INSTANCE.USER_INDEX == winner)
            {
            }
            else
            {
                GAME_INSTANCE.playMusic("audio/music/bgm_lose_match.mp3");
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
        winnerLabel: Phaser.Text;

        gameEngineBoard: Board;

        tilePools: Phaser.Group[];

        playSfx: boolean = true;
        characterIndex: number;
        gameState: State_Game;
        
        oldCursorX: number;
        oldCursorY: number;

        sfxBlockDrop: Phaser.Sound;
        sfxBlockPop: Phaser.Sound;
        sfxCursorMove: Phaser.Sound;

        isGameRunning: boolean;
        isWinner: boolean;

        empty = () =>
        {
        }

        initialize = (
            gameEngineBoard: Board, 
            characterIndex: number,
            gameState: State_Game, 
            invert: boolean, 
            playSfx: boolean) =>
        {
            this.characterIndex = characterIndex;
            this.playSfx = playSfx;
            this.gameEngineBoard = gameEngineBoard;
            this.gameState = gameState;

            this.isGameRunning = true;
            this.isWinner = false;

            this.boardWidth = State_Game.GAME_INSTANCE.colCount * TILE_WIDTH;
            this.boardHeight = State_Game.GAME_INSTANCE.rowCountInBounds * TILE_HEIGHT;
            this.yOffsetAsHeight = TILE_HEIGHT / gameEngineBoard.yOffsetMax;

            // use graphics tool to draw a border with a filled lightbox
             var graphics = this.game.add.graphics(0, 0);
            graphics.lineStyle(4, 0xffffff, 1);
            graphics.beginFill(0x000000, 0.3);
            graphics.drawRect(0, 0, this.boardWidth + 4, this.boardHeight);
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
            graphics.lineStyle(4, 0xffffff, 1);
            graphics.beginFill(0x000000, 0.3);
            graphics.drawRect(0, 0, this.boardWidth, this.boardHeight);
            graphics.endFill();
            this.spriteBottom = this.add(
                this.game.add.sprite(0, this.boardHeight, graphics.generateTexture()));
            graphics.destroy();

            // use graphics tool to draw the cursor
            // the cursor is two squares [][]
             var graphics = this.game.add.graphics(0, 0);
            graphics.lineStyle(2, 0xFFFFFF, 1);
            graphics.beginFill(0x000000, 0.0);
            graphics.drawRect(0, 0, TILE_WIDTH - 2, TILE_HEIGHT);
            graphics.endFill();
            graphics.beginFill(0x000000, 0.0);
            graphics.drawRect(TILE_WIDTH, 0, TILE_WIDTH - 2, TILE_HEIGHT);
            graphics.endFill();
            this.spriteCursor = this.add(
                this.game.add.sprite(0, 0, graphics.generateTexture()));
            graphics.destroy();

            // gameover counter at the top (for debugging)
            this.textGameOverCounter = this.add(
                this.game.add.text(
                    0, 0, "GameOver", 
                    {font: "10pt Arial", fill: "#fff"}));
            this.textGameOverCounter.anchor.set(1, 0);
            
            this.winnerLabel = this.add(
                this.game.add.text(
                    this.boardWidth * 0.5, -25, "???", 
                    {font: "20pt Arial", fill: "#fff"}));
            this.textGameOverCounter.anchor.set(0.5, 1);

            // put the character sprite in position
            var sprite = gameState.spritesheets[this.characterIndex];
            if(sprite)
            {
                sprite.exists = true;
                sprite.animations.play("idle");
                sprite.x = invert ? this.x + 40 + this.boardWidth : this.x - 40;
                sprite.y = this.boardHeight + this.y;
                sprite.scale.x = invert ? 1 : -1;
            }

            // each board will have it's own instance of these sfx
            this.sfxBlockDrop = this.game.add.audio("audio/game/sfx_block_drop.mp3");
            this.sfxBlockPop = this.game.add.audio("audio/game/sfx_block_pop.mp3");
            this.sfxCursorMove = this.game.add.audio("audio/game/sfx_cursor_move.mp3");
        }

        switchToGameOver = (isWinner: boolean) =>
        {
            this.winnerLabel.text = isWinner ? "WIN" : "LOSE";
            this.isGameRunning = false;
        }

        updateBoard = () =>
        {
            if(!this.isGameRunning)
            {
                return;
            }

            // soft-kill every single tile sprite each frame, returning it to the pool.
            // other solution is to maintain a map between board tiles and sprite tiles
            this.tilePools.forEach( 
                (pool) =>
            {
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

            var sfxLandedAlreadyPlayedThisFrame = false;
            this.gameEngineBoard.tiles.forEach( 
                (tile) => 
            {
                // during a combo, each tile will individually make a pop sound
                // and some tiles will also visually disappear when popping
                if(tile.popFrameCount <= 0 && tile.isComboing)
                {
                    if(!tile.sfxIsPopped)
                    {           
                        tile.sfxIsPopped = true;         
                        this.sfxBlockPop.play(null,null,1,false,true);
                        if(this.sfxBlockPop._sound != null)
                        {
                            this.sfxBlockPop._sound.playbackRate.value = tile.popPitch;
                        }
                    }

                    // these visually disappear when popped
                    if(!tile.persistAfterCombo)
                    {
                        return;
                    }
                }

                // play a thud sound when tiles land from a fall
                if(tile.sfxJustLanded)
                {
                    if(!sfxLandedAlreadyPlayedThisFrame)
                    {
                        sfxLandedAlreadyPlayedThisFrame = true;
                        this.sfxBlockDrop.play(null,null,1,false,true);
                    }

                    tile.sfxJustLanded = false;
                }

                // grab a sprite from the pool
                // the tile type index represents the color
                var tileTypeIndex = tile.type - State_Game.GAME_INSTANCE.basicTileTypeStartIndex;

                // if the tile is an attack tile still comboing, however, it should be garbage color
                if(tile.isComboing && tile.persistAfterCombo && tile.popFrameCount > 0)
                {
                    tileTypeIndex = State_Game.GAME_INSTANCE.attackBlockTypeStartIndex;
                }

                var tileSprite = this.getDeadOrNewTileSprite(tileTypeIndex);
                
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

            // set x,y for the cursor
            // play a sound if the cursor moved since last frame
            if(this.oldCursorX != this.gameEngineBoard.cursor.x || this.oldCursorY != this.gameEngineBoard.cursor.y)
            {
                this.sfxCursorMove.play(null,null,1,false,true);
            }

            this.spriteCursor.x = this.gameEngineBoard.cursor.x * TILE_WIDTH;
            this.spriteCursor.y = this.boardHeight - this.gameEngineBoard.cursor.y * TILE_HEIGHT - yOffsetCurrentHeight;
            this.oldCursorX = this.gameEngineBoard.cursor.x;
            this.oldCursorY = this.gameEngineBoard.cursor.y;

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
            for(var i = 0; i <= this.gameEngineBoard.boardSpaces.length -1; i++)
            {
                for(var j = 0; j < this.gameEngineBoard.boardSpaces[i].length; j++)
                {
                    var tile = this.gameEngineBoard.getTileAtSpace(j, i);

                    // check if the tile has just started comboing
                    if(tile && tile.isComboing && !this.isTileAlreadyInCombo(tile))
                    {
                        // for all tiles, make a "pop" sound with increasing pitch
                        // pitch is a lerp based on the popFrameCount
                        if(tile.popPitch == 0)
                        {
                            var t = Phaser.Math.clamp((tile.popFrameCount - this.gameEngineBoard.comboDelayReset) / (this.gameEngineBoard.comboDelayResetPerTile * 14), 0, 1);
                            tile.popPitch = Phaser.Math.linear(0.8, 2, t);
                        }

                        // only for non-attacks (non-garbage)
                        // count as a player-created combo (that we can mark with a popup like x5!)
                        if(!tile.isAttackBlock && !tile.persistAfterCombo)
                        {
                            this.newCombo.push(tile);
                        }
                    }

                    if(tile && !tile.isComboing)
                    {
                        tile.popPitch = 0;
                        tile.sfxIsPopped = false;
                    }
                }
            }

            // determine if combo is worthy of a popup.
            // combos are 4x tiles or more
            // chains are isChaining property
            if(this.newCombo.length > 0)
            {
                this.combos.push(this.newCombo);
                var last = this.newCombo.length - 1;

                if(this.newCombo.length > 3)
                {
                    // popup visually!
                    this.addComboPopup(
                        this.newCombo[last].x,
                        this.newCombo[last].y,
                        this.newCombo.length,
                        false);
                }

                if(this.newCombo[0].isChaining && this.gameEngineBoard.globalChainCounter > 1)
                {
                    // aif there is both a combo and chain,
                    // then make the chain appear above a "combo" popup
                    var tileY = this.newCombo.length > 3 ? this.newCombo[last].y + 1 : this.newCombo[last].y;

                    // popup visually!
                    this.addComboPopup(
                        this.newCombo[last].x,
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

        addComboPopup = (tileX: number, tileY: number, count: number, falseComboTrueChain: boolean) =>
        {
            var realX = tileX * TILE_WIDTH + TILE_WIDTH * 0.5;
            var realY = this.boardHeight - tileY * TILE_HEIGHT -
                this.yOffsetAsHeight * this.gameEngineBoard.yOffset - TILE_HEIGHT * 0.5;

            var popup = new ComboPopup(this.game, null, "popup:" + realX + ":" + realY, true);
                popup.initialize(count, falseComboTrueChain);
                popup.x = realX;
                popup.y = realY;
            this.add(popup);

            if(!this.playSfx)
            {
                return;
            }

            if(falseComboTrueChain && count <= 3)
            {
               this.gameState.sfxChainMilds[this.characterIndex].play();
            }
            else if(falseComboTrueChain && count > 3)
            {
               this.gameState.sfxChainIntenses[this.characterIndex].play();
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
    
    class ComboPopup extends Phaser.Group
    {
        square: Phaser.Sprite;
        value: Phaser.Text;
        xText: Phaser.Text;

        empty = () =>
        {

        }
        
        initialize = (count: number, falseComboTrueChain: boolean) =>
        {
            // chains are green, combos are red
            // chains are yellow text, combos white
            var bgFill = 0xCC4455;
            var textFill = "#FFFFFF";
            if(falseComboTrueChain)
            {
                var bgFill = 0x11CC22;
                var textFill = "#FFFF66";
            }

            var width = TILE_WIDTH * 0.85;
            var height = TILE_HEIGHT * 0.85;
            var alpha = 0.7;

            // fill a square for the visual
            var graphics = this.game.add.graphics(0,0);
            graphics.lineStyle(2, 0xFFFFFF, alpha);
            graphics.beginFill(bgFill, alpha);
            graphics.drawRoundedRect(0, 0, width, height, 6);
            graphics.endFill();
            this.square = this.add(this.game.add.sprite(5, 5, graphics.generateTexture()));
            graphics.destroy();

            // add the number value as text
            this.value = this.add(
                this.game.add.text(
                    0, 
                    0,
                    count.toString(), 
                    {font: "14pt Arial", fill: textFill}));
            this.value.alpha = alpha;
            this.value.anchor.set(1, 0);
            this.value.x = this.square.x + width;
            this.value.y = this.square.y;

            // center the text if it's a combo
            if(!falseComboTrueChain)
            {
                this.value.anchor.set(0.5, 0);
                this.value.x = this.square.x + width * 0.6;
            }

            // add a small 'x' to indicate 'times'
            if(falseComboTrueChain)
            {
                this.xText = this.add(
                    this.game.add.text(
                        0, 
                        0, 
                        "x", 
                        {font: "6pt Arial", fill: textFill}));
                this.xText.anchor.set(0, 0);
                this.xText.x = this.square.x + width * 0.2;
                this.xText.y = this.square.y + height * 0.5;
            }
        }

        duration = 1200;
        timeAlive = 0;
        speed = 30 / 1000;
        update()
        {
            this.y -= this.game.time.elapsedMS * this.speed;
            this.timeAlive += this.game.time.elapsedMS;
            if(this.timeAlive >= this.duration)
            {
                this.destroy(true);
            }
        }
    }
}