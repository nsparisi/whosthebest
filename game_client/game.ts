/// <reference path="references.ts" />

/**
 * GameEngine Object
 * This is a singleton class that handles the game state.
 * update is called to advance the game state by one frame.
 * 
 * @class GameEngine
 */
class GameEngine
{   
    // for client-side predictions
    isLocalGameInstance = false;

    //tile reference:
    // 0 = empty
    // 1 = metal
    // 2 = enemy metal
    // 3-10 basic types
    // 10+ = enemy dropped blocks
    basicTileTypeCount = 5; // normal 5, hard 6
    basicTileTypeStartIndex = 3;
    attackBlockTypeStartIndex = 10;

    rowCount = 30;
    colCount = 6;
    rowCountInBounds = 12;
    attackBlockAllowedHeight = 11;

    // Packet information
    gameId = 0;
    packetDelimiter = "|";
    inputDelimiter = ",";
    inputTypes =
    {
        None: 0,
        Up: 1,
        Down: 2,
        Left: 3,
        Right: 4,
        Swap: 5,
        Elevate: 6, // if this exceeds 9, might be an issue with string.indexOf
    }

    gameStateTypes =
    {
        Starting: 0,
        Playing: 1,
        Ended: 2,
    }
    currentGameState = this.gameStateTypes.Starting;

    // board references
    boards: Board[] = [];
    numberOfPlayers = 2;

    // need to start keeping global timing values here
    public static ATTACK_BLOCK_DELAY = 75 // about 150ish frames in 60fps
    
    // attack information
    // e.g. an 8-combo will attack with a 3-size and a 4-size block
    comboAttackPatterns = [[0], [0], [0], [0], [3], [4], [5], [6], [3, 4], [4, 4], [5, 5], [6, 6]];
    attackBlockQueue: AttackBlockData[] = [];

    // winner
    winnerIndex = 0;
    
    initialize = (randomSeed) =>
    {
        this.boards = [];
        this.currentGameState = this.gameStateTypes.Starting;

        // board to initialize 
        if(!randomSeed)
        {
            Debug.log("[game]WARNING: no seed specified");
            randomSeed = Math.random();
        }

        for(var i = 0; i < this.numberOfPlayers; i++)
        {
            var rng = new RandomNumberGenerator(randomSeed);
            this.boards.push(new Board(rng, i, this.attackBlockTypeStartIndex, this));
        }

        this.boards.forEach(
            (board) =>
            {
                board.initialize(0, 0);
            });
    }
    
    /**
     * Updates the game engine by one frame.
     * 
     * @memberOf GameEngine
     */
    update = (inputs) =>
    {
        if(this.currentGameState == this.gameStateTypes.Starting)
        {
            // start immediately, todo wait 3 seconds
            Debug.log("Starting new game!");
            this.currentGameState = this.gameStateTypes.Playing;
        }

        if(this.currentGameState == this.gameStateTypes.Playing)
        {
            // if any attacks are queued, send them out before processing next frame
            this.sendAllAttacks();

            // update each board, using it's specified inputs
            var numberOfPlayersAlive = this.boards.length;
            for(var i = 0; i < this.boards.length; i++)
            {
                if(!this.boards[i].isGameOver)
                {
                    this.boards[i].update(inputs[i]);
                }
                else
                {
                    numberOfPlayersAlive--;
                }
            }

            // the game has ended, this player has won
            if(numberOfPlayersAlive == 1)
            {
                for(var i = 0; i < this.boards.length; i++)
                {
                    if(!this.boards[i].isGameOver)
                    {
                        this.gameHasEnded(i);
                    }
                }
            }

            // the game has ended in a tie
            else if(numberOfPlayersAlive == 0)
            {
                this.gameHasEnded(-1);
            }
        }

        else if(this.currentGameState == this.gameStateTypes.Ended)
        {
        }
    }

    gameHasEnded = (winnerIndex) =>
    {
        // TODO, sorry, a tie means player 0 wins
        if(winnerIndex == -1)
        {
            winnerIndex = 0;
        }
        this.winnerIndex = winnerIndex;
        
        if(winnerIndex >= 0)
        {
            Debug.log("Congratulations player " + winnerIndex);

            // For now, the winner will tell the server they won.
            // server needs to control this in the distant future.
            if(!this.isLocalGameInstance && 
                GAME_INSTANCE.USER_INDEX == winnerIndex)
            {
                ServerTranslator.Instance.toServerGameEnd(
                    winnerIndex, 
                    this.boards[0].gameClockInSeconds);
            }
        }
        else if(winnerIndex == -1)
        {
            Debug.log("You both lose!");
        }

        this.currentGameState = this.gameStateTypes.Ended;
    }

    attackOtherPlayer = (fromBoardIndex: number, attackBlock: AttackBlock) =>
    {
        // client-side prediction changes
        if(this.isLocalGameInstance)
        {
            Debug.log("fromBoardIndex:" + fromBoardIndex);
            if(fromBoardIndex == GAME_INSTANCE.USER_INDEX)
            {
                attackBlock.framesLeftUntilDrop += GenerationEngine.Instance.frameDelay;

                if(GenerationEngine.Instance.frameCount < GenerationEngine.Instance.frameDelay)
                {
                    attackBlock.framesLeftUntilDrop -= 
                        GenerationEngine.Instance.frameDelay - GenerationEngine.Instance.frameCount - 1;
                    Debug.log("It's too early. subtracting " + 
                        (GenerationEngine.Instance.frameDelay - GenerationEngine.Instance.frameCount - 1));
                }
                
                Debug.log("I attacked them! " + attackBlock.framesLeftUntilDrop);
            } 
            else 
            {
                attackBlock.framesLeftUntilDrop -= GenerationEngine.Instance.frameDelay;
                Debug.log("They attacked me! " + attackBlock.framesLeftUntilDrop);
            }
        }

        // todo make round robin
        var targetBoardIndex = (fromBoardIndex + 1) % this.numberOfPlayers;
        var attackData : AttackBlockData = 
        {
            fromBoardIndex: fromBoardIndex, 
            attackBlock:attackBlock, 
            targetBoardIndex:targetBoardIndex
        };
        this.attackBlockQueue.push(attackData);
    }

    sendAllAttacks = () =>
    {
        for(var i = 0; i < this.attackBlockQueue.length; i++)
        {
            var attackData = this.attackBlockQueue[i];
            this.boards[attackData.targetBoardIndex].wasAttackedByOtherPlayer(attackData.attackBlock);
            //Debug.log("wasAttackedByOtherPlayer local? " + this.isLocalGameInstance);
        }
        this.attackBlockQueue = [];
    }
}

/**
 * AttackBlockData object.
 * Represents info about the type of attack that was made to a player
 * 
 * @interface AttackBlockData
 */
interface AttackBlockData
{
    fromBoardIndex: number;
    attackBlock: AttackBlock;
    targetBoardIndex: number;
}

/**
 * BoardSpace object
 * Represents a static coordinate on the board.
 * Keeps track of a contained tile.
 * 
 * @class BoardSpace
 */
class BoardSpace
{
    contents: Tile[] = [];
    
    addTile = (tile) =>
    {
        if(tile != null && this.contents.indexOf(tile) == -1)
        {
            this.contents.push(tile);
        }
    }
    
    removeTile = (tile) =>
    {
        var index = this.contents.indexOf(tile);
        if(index != -1)
        {
            this.contents.splice(index, 1);
        }
    }
    
    clear = () =>
    {
        this.contents = [];
    }

    getTile = () =>
    {
        return this.contents.length > 0 ? this.contents[0] : null;
    }
}

/**
 * Board object.
 * A player's board. Contains all board-related operations.
 * 
 * @class Board
 */
class Board 
{
    constructor(
        public randomNumberGenerator: RandomNumberGenerator, 
        public playerIndex: number, 
        public attackBlockType: number,
        public gameEngine: GameEngine)
    {
        
    }
    
    cursor =
    {
        x: 1,
        y: 1
    }

    tiles: Tile[] = [];
    boardSpaces: BoardSpace[][] = [];
    lastRowOfTileTypes = [];
    attackBlocksInWait = [];
    allAttackBlocksCombodThisFrame = [];
    lastTileId = 0;

    // game clock
    gameClockInSeconds = 0;
    totalFramesElapsed = 0;

    // difficulty
    // speed affects how fast game raises (yOffset)
    // difficulty affects # of tile types, and how fast tiles disappear
    gameSpeed = 0;
    gameDifficulty = 0;

    // yOffset represents the tiles slowly ticking upward
    yOffset = 0; 
    yOffsetMax = 16;
    yOffsetFrameCount = 30;
    yOffsetFrameReset = 30;
    yOffsetFrameResetValues = [30, 25, 20, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    speedLengthInSeconds = 20;

    // how long the swap animation lasts
    // -1 means it's not swapping
    swapDelayReset = 3;
    swapDelayCount = -1;
    queuedUpSwapAction = false;

    // how long a combo lasts (44 + 25 - 9) / 60fps
    // a combo will be longer if more tiles are involved
    comboDelayReset = 30;
    comboDelayResetPerTile = 4;

    // how long to hang in the air before falling
    fallDelayReset = 6; // roughly 2x swap delay

    // the elevate command will advance the height until a new row is added
    fastElevateHeightPerFrame = 2;
    fastElevate = false;

    // some actions will stop the board from progressing
    stopBoardFromGrowing = false;

    // chains
    globalChainCounter = 1;

    // game over
    // although the tiles can reach the ceiling, 
    // the game doesn't end until this time has passed.
    isGameOver = false;
    gameOverLeewayReset = 60;
    gameOverLeewayCount = 60; // how long until we really die

    highestTileHeight = 0;

    initialize = (speed: number, difficulty: number) =>
    {
        this.isGameOver = false;
        this.totalFramesElapsed = 0;
        this.gameDifficulty = difficulty;
        this.setGameSpeed(speed);

        // make board spaces
        // these are static boxes at fixed coordinates
        for(var i = 0; i < this.gameEngine.rowCount; i++)
        {
            this.boardSpaces[i] = new Array();
        }
        for(var i = 0; i < this.gameEngine.rowCount; i++)
        {
            for(var j = 0; j < this.gameEngine.colCount; j++)
            {
                this.boardSpaces[i][j] = new BoardSpace();
            }
        }

        // make first set of tiles
        this.highestTileHeight = 5;
        for(var i = this.highestTileHeight; i >= 0; i--)
        {
            var newRow = this.generateRow(i);
            this.tiles = this.tiles.concat(newRow);

            for(var j = 0; j < newRow.length; j++)
            {
                this.getBoardSpace(j, i).addTile(newRow[j]);
            }
        }
    }

    update = (inputs) =>
    {
        // This is a special case, where we instruct one of the boards to wait.
        // This happens in our client-side prediction board.
        // And during the beginning of the game, we don't want to run any frames
        // for the opponent board.
        if(inputs == "SKIP")
        {
            return;
        }

        // count the frames, convert to seconds for convenience
        // slowly become faster as the game goes on
        this.updateClockAndGameSpeed();

        // tiles are moving upwards
        this.updateBoardHeight();

        // act on player inputs
        this.readInputs(inputs);

        // update every tile
        this.tiles.forEach((tile) =>
        {
            tile.update();
        });

        // see if any blocks should fall
        this.updateWaitingAttackBlocks();

        // run a pass through all tiles
        this.scanAllTilesForChanges();

        // update swap delay
        this.updateSwapDelay();

        // did we lose?
        this.checkGameOverConditions();
    }
    
    updateClockAndGameSpeed = () =>
    {
        // count up the total frames
        // each second that passes, check to see if the game is getting faster
        this.totalFramesElapsed ++;
        if(this.totalFramesElapsed % GenerationEngine.Instance.frameRate == 0)
        {
            this.gameClockInSeconds++;
            if(this.gameClockInSeconds % this.speedLengthInSeconds == 0)
            {
                this.setGameSpeed(this.gameSpeed + 1);
            }
        }
    }

    setGameSpeed = (speed: number) =>
    {
        // the game speed affects the yOffsetFrameReset value.
        // in other words the game will tick upwards at a quicker rate.
        this.gameSpeed = Math.min(
                speed, 
                this.yOffsetFrameResetValues.length - 1);
        this.yOffsetFrameReset = this.yOffsetFrameResetValues[this.gameSpeed];
    }

    checkGameOverConditions = () =>
    {
        // todo, use a different metric. 
        // Internal safety clock -- some leeway in vs mode.
        if(!this.stopBoardFromGrowing)
        {
            if(this.highestTileHeight >= this.gameEngine.rowCountInBounds)
            {
                this.gameOverLeewayCount--;

                if(this.gameOverLeewayCount == 0)
                {
                    this.isGameOver = true;
                }
            }
            else 
            {
                this.gameOverLeewayCount = this.gameOverLeewayReset;
            }
        }
    }

    scanAllTilesForChanges = () =>
    {
        var tileKillList = [];
        var tilesToEndChain = [];

        // update this value if anything exciting is happening
        this.stopBoardFromGrowing = false;

        // what's the highest tile?
        this.highestTileHeight = 0;

        // ---------------------------------
        // find dying tiles
        // ---------------------------------
        for(var i = 0; i < this.boardSpaces.length; i++)
        {
            for(var j = 0; j < this.boardSpaces[i].length; j++)
            {
                var tile = this.getTileAtSpace(j, i);

                if(!tile || tile.y == 0)
                {
                    continue;
                }

                // highest tile
                this.highestTileHeight = Math.max(this.highestTileHeight, tile.y);

                // these tiles finished comboing - but are part of an attack block combo, e.g.
                if(tile.persistAfterCombo && tile.isComboJustFinished)
                {
                    tile.hoverStart();
                    tile.isComboJustFinished = false;
                    tile.persistAfterCombo = false;
                }

                else if(tile.isComboJustFinished)
                {
                    // kill the tile later
                    tileKillList.push(tile);

                    // is there a tile resting on me?
                    var aboveTile = this.getTileAtSpace(tile.x, tile.y + 1);
                    if(aboveTile)
                    {
                        // this tile is now "chaining"
                        aboveTile.isChaining = true;
                    }
                }
            }
        }

        this.killTiles(tileKillList);

        // ---------------------------------
        // find falling tiles
        // ---------------------------------
        for(var i = 0; i < this.boardSpaces.length; i++)
        {
            for(var j = 0; j < this.boardSpaces[i].length; j++)
            {
                var tile = this.getTileAtSpace(j, i);

                // ignore these tiles
                if(!tile || tile.y == 0 || !tile.canMove())
                {
                    continue;
                }

                if(tile.isAttackBlock)
                {
                    var isBelowRowHovering = false;
                    var shouldRowBeFalling = true;
                    var hoverFrameCount = 0;
                    var totalTilesInRow = 1;

                    // scan to the right
                    var currentTile = tile;
                    while(currentTile)
                    {
                        var belowTile = this.getTileAtSpace(currentTile.x, currentTile.y - 1);

                        // todo test landing on an already hovering tile
                        isBelowRowHovering =
                            (isBelowRowHovering && !belowTile) ||
                            ((shouldRowBeFalling || isBelowRowHovering) && belowTile && belowTile.isHovering);
                        shouldRowBeFalling = shouldRowBeFalling && (!belowTile && currentTile.y > 1 && currentTile.canMove());

                        if(isBelowRowHovering && belowTile)
                        {
                            hoverFrameCount = Math.max(hoverFrameCount, belowTile.hoverFrameCount);
                        }

                        // this was the last tile
                        if(!currentTile.isConnectedRight)
                        {
                            break;
                        }

                        totalTilesInRow++;
                        currentTile = this.getTileAtSpace(currentTile.x + 1, currentTile.y);
                    }

                    var currentTile = tile;
                    while(currentTile)
                    {
                        // remember the right tile, we may shift down this frame
                        var nextTile = null;
                        if(currentTile.isConnectedRight)
                        {
                            nextTile = this.getTileAtSpace(currentTile.x + 1, currentTile.y);
                        }

                        if(isBelowRowHovering)
                        {
                            currentTile.hoverFrameCount = hoverFrameCount;
                            currentTile.isHovering = true;
                        }

                        // just landed
                        if(currentTile.isFalling && !shouldRowBeFalling)
                        {
                            currentTile.isFalling = false;
                        }

                        // continue to fall
                        else if(currentTile.isFalling && shouldRowBeFalling)
                        {
                            currentTile.isFalling = true;
                            var space = this.getBoardSpace(currentTile.x, currentTile.y);
                            space.removeTile(currentTile);

                            currentTile.y--;
                            space = this.getBoardSpace(currentTile.x, currentTile.y);
                            space.addTile(currentTile);
                        }

                        // just started to hover
                        else if(!currentTile.isFalling && shouldRowBeFalling)
                        {
                            currentTile.hoverStart();
                        }

                        currentTile = nextTile;
                    }

                    // already processed these tiles
                    j += totalTilesInRow - 1;
                }

                // basic blocks
                else
                {
                    // should be falling?
                    var belowTile = this.getTileAtSpace(tile.x, tile.y - 1);
                    var shouldBeFalling = !belowTile && tile.y > 1 && tile.canMove();

                    // if I'm resting on a hovering tile, copy the hover attribute
                    if(belowTile && belowTile.isHovering)
                    {
                        tile.isHovering = true;
                        tile.hoverFrameCount = belowTile.hoverFrameCount;

                        // hovering always maintains chaining
                        tile.isChaining = belowTile.isChaining || tile.isChaining;
                    }

                    // resting ontop a tile
                    // queue this tile to stop chaining, 
                    // but only if we're not swapping underneath
                    if((!shouldBeFalling && !tile.isHovering) &&
                        (tile.isChaining && !belowTile.isSwapping) &&
                        (!belowTile.isChaining || tilesToEndChain.indexOf(belowTile) != -1))
                    {
                        tilesToEndChain.push(tile);
                    }

                    // just landed
                    if(tile.isFalling && !shouldBeFalling)
                    {
                        tile.isFalling = false;
                    }

                    // continue to fall
                    else if(tile.isFalling && shouldBeFalling)
                    {
                        tile.isFalling = true;
                        var space = this.getBoardSpace(tile.x, tile.y);
                        space.removeTile(tile);

                        tile.y--;
                        space = this.getBoardSpace(tile.x, tile.y);
                        space.addTile(tile);
                    }

                    // just started to hover
                    else if(!tile.isFalling && shouldBeFalling)
                    {
                        tile.hoverStart();
                    }
                }
            }
        }

        var lastRow = [];
        var currentRow = [];
        var allComboTiles = [];

        // ---------------------------------
        // find comboing tiles
        // ---------------------------------
        for(var i = 0; i < this.boardSpaces.length; i++)
        {
            for(var j = 0; j < this.boardSpaces[i].length; j++)
            {
                var tile = this.getTileAtSpace(j, i);

                // any of these exciting things happening?
                this.stopBoardFromGrowing = this.stopBoardFromGrowing ||
                    (tile && (tile.isHovering || tile.isFalling || tile.isComboing))

                // ignore these tiles
                if(!tile || tile.y == 0 || !tile.canMove() || tile.isFalling)
                {
                    // mark this row as a 0
                    lastRow[j] = currentRow[j];
                    currentRow[j] = 0;
                }
                else if(tile.isAttackBlock)
                {
                    // don't combo
                    lastRow[j] = currentRow[j];
                    currentRow[j] = tile.type;
                }
                else
                {
                    // combo left and leftx2
                    if(j >= 2 && tile.type == currentRow[j - 1] && tile.type == currentRow[j - 2])
                    {
                        var left = this.getTileAtSpace(j - 1, i);
                        var leftleft = this.getTileAtSpace(j - 2, i);
                        allComboTiles[leftleft.id] = leftleft;
                        allComboTiles[left.id] = left;
                        allComboTiles[tile.id] = tile;
                    }

                    // combo down and downx2
                    if(i >= 3 && tile.type == currentRow[j] && tile.type == lastRow[j])
                    {
                        var down = this.getTileAtSpace(j, i - 1);
                        var downdown = this.getTileAtSpace(j, i - 2);
                        allComboTiles[downdown.id] = downdown;
                        allComboTiles[down.id] = down;
                        allComboTiles[tile.id] = tile;
                    }

                    // remember last 2 rows
                    lastRow[j] = currentRow[j];
                    currentRow[j] = tile.type;
                }
            }
        }

        // ---------------------------------
        // Resolve any Chains and Combos for this frame
        // ---------------------------------

        // Create a 'combo' of all of these tiles
        var wasChainFormedThisFrame = false;
        var keys = Object.keys(allComboTiles);

        // find comboing attack blocks
        this.allAttackBlocksCombodThisFrame = [];
        keys.forEach(
            (key) =>
            {
                this.checkForAdjacentAttackBlocks(allComboTiles[key]);
            });

        // total combo length of both (attack and non attack tiles) and (plain tiles)
        var totalComboDelay = (keys.length + this.allAttackBlocksCombodThisFrame.length) * this.comboDelayResetPerTile + this.comboDelayReset;
        var basicComboDelay = keys.length * this.comboDelayResetPerTile + this.comboDelayReset;
        var popIndex = 0;
        keys.forEach(
            (key) =>
            {
                var tile = allComboTiles[key];
                tile.comboStart(basicComboDelay, false, popIndex * this.comboDelayResetPerTile + this.comboDelayReset);
                wasChainFormedThisFrame = wasChainFormedThisFrame || tile.isChaining;

                // popindex is a visual helper to "pop" the tiles one at a time
                popIndex++;

                // hacky, stop growing for one frame
                this.stopBoardFromGrowing = true;
            });

        // go through the attack block and generate tiles for the bottom rows
        popIndex = keys.length + this.allAttackBlocksCombodThisFrame.length - 1;
        if(this.allAttackBlocksCombodThisFrame.length > 0)
        {
            for(var i = this.boardSpaces.length - 1; i >= 0; i--)
            {
                this.lastRowOfTileTypes = [];
                for(var j = 0; j < this.boardSpaces[i].length; j++)
                {
                    var tile = this.getTileAtSpace(j, i);

                    if(tile != null && tile.isComboJustStarted && tile.isAttackBlock)
                    {
                        // popindex is a visual helper to "pop" the tiles one at a time
                        var popDelay = popIndex * this.comboDelayResetPerTile + this.comboDelayReset;
                        popIndex--;
                        
                        if(tile.isConnectedDown)
                        {
                            tile.comboStart(totalComboDelay, true, popDelay);
                        }
                        else if(!tile.isConnectedDown)
                        {
                            if(tile.isConnectedUp)
                            {
                                this.getTileAtSpace(tile.x, tile.y + 1).isConnectedDown = false;
                            }
                            
                            // generate the tile type, cannot be 3 same in a row
                            var ignoreTypes = [];
                            if(this.lastRowOfTileTypes[j - 2] == this.lastRowOfTileTypes[j - 1])
                            {
                                ignoreTypes.push(this.lastRowOfTileTypes[j - 2]);
                            }
                            var newType = this.getNextRandomTile(ignoreTypes);

                            // remove attack tile
                            var boardSpace = this.getBoardSpace(tile.x, tile.y);
                            boardSpace.removeTile(tile);
                            this.tiles.splice(this.tiles.indexOf(tile), 1);

                            // replace with new basic tile
                            // todo some ignore generation logic
                            var newBasicTile = new Tile(tile.x, tile.y, newType, this);
                            newBasicTile.comboStart(totalComboDelay, true, popDelay);
                            newBasicTile.isChaining = true;
                            boardSpace.addTile(newBasicTile);
                            this.tiles.push(newBasicTile);

                            this.lastRowOfTileTypes[j] = newBasicTile.type;
                        }
                    }
                }
            }
        }

        // Tiles that just landed should not be chaining anymore, unless....
        tilesToEndChain.forEach(
            (tile) =>
            {
                tile.isChaining = false;
            });

        // If a chain was formed this frame, The whole combo is now 'chaining'
        // therefore tiles that just landed, can be chaining again!
        if(wasChainFormedThisFrame)
        {
            this.globalChainCounter++;
            keys.forEach(
                (key) =>
                {
                    allComboTiles[key].isChaining = true;
                });
        }

        // chain ends if no tiles are chaining
        if(this.globalChainCounter > 1)
        {
            var isStillChaining = false;
            this.tiles.forEach(
                (tile) =>
                {
                    isStillChaining = isStillChaining || tile.isChaining;
                });

            if(!isStillChaining)
            {
                // attack other player -- chains are strong!
                this.sendChainAttack(this.globalChainCounter);
                this.globalChainCounter = 1;
            }
        }

        // attack other player -- weak combos will be ignored
        this.sendComboAttack(keys.length);
    }

    hurtAttackBlock = (tile: Tile) =>
    {
        if(tile && tile.isAttackBlock)
        {
            if(this.allAttackBlocksCombodThisFrame.indexOf(tile) == -1)
            {
                this.allAttackBlocksCombodThisFrame.push(tile);
                this.hurtAttackBlock(this.getTileAtSpace(tile.x + 1, tile.y));
                this.hurtAttackBlock(this.getTileAtSpace(tile.x - 1, tile.y));
                this.hurtAttackBlock(this.getTileAtSpace(tile.x, tile.y + 1));
                this.hurtAttackBlock(this.getTileAtSpace(tile.x, tile.y - 1));
                tile.isComboJustStarted = true;
            }
        }
    }

    checkForAdjacentAttackBlocks = (tile: Tile) =>
    {
        this.hurtAttackBlock(this.getTileAtSpace(tile.x + 1, tile.y));
        this.hurtAttackBlock(this.getTileAtSpace(tile.x, tile.y + 1));
        this.hurtAttackBlock(this.getTileAtSpace(tile.x, tile.y - 1));
        this.hurtAttackBlock(this.getTileAtSpace(tile.x - 1, tile.y));
    }

    updateSwapDelay = () =>
    {
        this.swapDelayCount = Math.max(-1, this.swapDelayCount - 1);
    }

    killTiles = (tilesToKill: Array<Tile>) =>
    {
        if(!tilesToKill || tilesToKill.length == 0)
        {
            return;
        }
        
        // remove from board spaces
        tilesToKill.forEach(
            (tile) =>
            {
                var boardSpace = this.getBoardSpace(tile.x, tile.y);
                boardSpace.removeTile(tile);
            });

        // delete these tiles by constructing a new list
        var newListOfTiles = [];
        this.tiles.forEach(
            (tile) =>
            {
                // if we are not killing the tile
                // save in new list
                if(tilesToKill.indexOf(tile) == -1)
                {
                    newListOfTiles.push(tile);
                }
            });
        
        this.tiles = newListOfTiles;
    }

    getBoardSpace = (x: number, y: number) =>
    {
        if(y >= 0 && y < this.boardSpaces.length)
        {
            if(x >= 0 && x < this.boardSpaces[y].length)
            {
                return this.boardSpaces[y][x];
            }
        }

        return null;
    }

    getTileAtSpace = (x: number, y: number) =>
    {
        var space = this.getBoardSpace(x, y);
        if(space)
        {
            return space.getTile();
        }

        return null;
    }

    wasAttackedByOtherPlayer = (attackBlock: AttackBlock) =>
    {
        this.attackBlocksInWait.push(attackBlock);
    }

    releaseAttackBlockIntoBoard = (attackBlock: AttackBlock) =>
    {
        // todo handle... stacks too tall for the board
        // todo handle 2 blocks on the same frame
        for(var i = 0; i < attackBlock.tilesHigh; i++)
        {
            for(var j = 0; j < attackBlock.tilesWide; j++)
            {
                var tile = new Tile(j, this.gameEngine.attackBlockAllowedHeight + 1 + i, attackBlock.attackType, this);
                tile.isAttackBlock = true;
                tile.isConnectedRight = j < attackBlock.tilesWide - 1;
                tile.isConnectedLeft = j > 0;
                tile.isConnectedUp = i < attackBlock.tilesHigh - 1;
                tile.isConnectedDown = i > 0;
                tile.isFalling = true;

                var boardSpace = this.getBoardSpace(tile.x, tile.y);
                boardSpace.addTile(tile);
                this.tiles.push(tile);
            }
        }
    }

    updateWaitingAttackBlocks = () =>
    {
        for(var i = 0; i < this.attackBlocksInWait.length; i++)
        {
            var attackBlock = this.attackBlocksInWait[i];
            attackBlock.framesLeftUntilDrop--;

            // if the tile is ready to fall
            // remove it from queue and fall
            if(attackBlock.framesLeftUntilDrop <= 0 && !this.stopBoardFromGrowing &&
                this.highestTileHeight <= this.gameEngine.attackBlockAllowedHeight)
            {
                // only one attack per frame
                this.releaseAttackBlockIntoBoard(attackBlock);
                this.attackBlocksInWait.splice(i, 1);
                break;
            }
        }
    }

    // todo - see if combos are queued up alongside chains, and if they are all sent at once
    sendComboAttack = (comboSize: number) =>
    {
        if(comboSize >= 4)
        {
            // combo patterns are predetermined i.e:
            // an 8-combo will always generate a size-3 block and a size-4 block.
            var comboIndex = Math.min(comboSize, this.gameEngine.comboAttackPatterns.length - 1);
            var comboPattern = this.gameEngine.comboAttackPatterns[comboIndex];

            // multiple blocks can be generated from one combo.
            for(var i = 0; i < comboPattern.length; i++)
            {
                this.gameEngine.attackOtherPlayer(
                    this.playerIndex, 
                    new AttackBlock(comboPattern[i], 1, this.attackBlockType));
            }
        }
    }

    sendChainAttack = (chainSize: number) =>
    {
        // chain attacks are always the width of the board
        // the height grows as the chain grows
        this.gameEngine.attackOtherPlayer(
            this.playerIndex,
            new AttackBlock(this.gameEngine.colCount, chainSize - 1, this.attackBlockType));
    }

    getNextRandomTile = (ignoreList: Array<number>) =>
    {
        while(true)
        {
            var type = this.gameEngine.basicTileTypeStartIndex +
                Math.floor(this.randomNumberGenerator.next() * this.gameEngine.basicTileTypeCount);
            if(!ignoreList || ignoreList.indexOf(type) == -1)
            {
                return type;
            }
        }
    }

    generateRow = (rowNum) =>
    {
        var row = new Array();
        for(var i = 0; i < this.gameEngine.colCount; i++)
        {
            // no type can repeat in adjacent rows
            var ignoreTypes = [this.lastRowOfTileTypes[i]];

            // no type can repeat 3x in a row
            if(i >= 2)
            {
                if(this.lastRowOfTileTypes[i - 2] == this.lastRowOfTileTypes[i - 1])
                {
                    ignoreTypes.push(this.lastRowOfTileTypes[i - 2]);
                }
            }

            // get next tile, following rules
            var type = this.getNextRandomTile(ignoreTypes);
            row[i] = new Tile(i, rowNum, type, this);
            this.lastRowOfTileTypes[i] = type;
        }
        return row;
    }


    updateBoardHeight = () =>
    {
        if(this.stopBoardFromGrowing)
        {
            return;
        }

        if(this.fastElevate)
        {
            // reset the frame count
            this.yOffsetFrameCount = this.yOffsetFrameReset;

            // move up a notch
            this.yOffset += this.fastElevateHeightPerFrame;

            // a new row has formed, cancel elevate
            if(this.yOffset >= this.yOffsetMax)
            {
                this.yOffset = 0;
                this.fastElevate = false;
                this.updateBoardNewHeight();
            }
        }
        else
        {
            // if so many frames pass
            // shift all tiles up a bit
            this.yOffsetFrameCount--;
            if(this.yOffsetFrameCount <= 0)
            {
                this.yOffsetFrameCount = this.yOffsetFrameReset;
                this.yOffset++;

                // a new row has formed
                if(this.yOffset >= this.yOffsetMax)
                {
                    this.yOffset = 0;
                    this.updateBoardNewHeight();
                }
            }
        }
    }

    updateBoardNewHeight = () =>
    {
        //copy the contents of the space below
        for(var i = this.gameEngine.rowCount - 1; i > 0; i--)
        {
            for(var j = 0; j < this.gameEngine.colCount; j++)
            {
                this.boardSpaces[i][j].contents = this.boardSpaces[i-1][j].contents;
            }
        }

        // send all tiles up a notch
        for(var i = 0; i < this.tiles.length; i++)
        {
            this.tiles[i].y++;
        }
        
        // clear previous row and add a new bottom row
        var newRow = this.generateRow(0);
        this.tiles = this.tiles.concat(newRow);
        for(var i = 0; i < newRow.length; i++)
        {
            var tile = newRow[i];
            var boardSpace = this.getBoardSpace(tile.x, tile.y)
            boardSpace.clear();
            boardSpace.addTile(tile);
        }

        this.cursor.y++;
    }

    swapAction = () =>
    {
        // can't swap too quickly
        if(this.swapDelayCount >= 0)
        {
            this.queuedUpSwapAction = true;
            return;
        }
        this.queuedUpSwapAction = false;

        // get tile at cursor x,y and x+1,y
        var leftSpace = this.getBoardSpace(this.cursor.x, this.cursor.y);
        var rightSpace = this.getBoardSpace(this.cursor.x + 1, this.cursor.y);
        var leftTile = leftSpace.getTile();
        var rightTile = rightSpace.getTile();
        
        var leftUpTile = this.getTileAtSpace(this.cursor.x, this.cursor.y + 1);
        var rightUpTile = this.getTileAtSpace(this.cursor.x + 1, this.cursor.y + 1);

        // can't swap unmovable tiles
        // ignore input
        if(leftTile != null && (!leftTile.canMove() || leftTile.isAttackBlock))
        {
            return;
        }
        if(rightTile != null && (!rightTile.canMove() || rightTile.isAttackBlock))
        {
            return;
        }

        // can't swap when a tile is hovering right above you!
        // ignore input
        if(leftUpTile != null && leftUpTile.isHovering)
        {
            return;
        }
        if(rightUpTile != null && rightUpTile.isHovering)
        {
            return;
        }

        // physically move left tile
        if(leftTile != null)
        {
            // will occupy both adjacent spaces for now
            rightSpace.addTile(leftTile);
            leftTile.swapStart(1);
            this.swapDelayCount = this.swapDelayReset;
        }

        // physically move right tile
        if(rightTile != null)
        {
            // will occupy both adjacent spaces for now
            leftSpace.addTile(rightTile);
            rightTile.swapStart(-1);
            this.swapDelayCount = this.swapDelayReset;
        }
    }

    readInputs = (inputs) =>
    {
        if(inputs != null)
        {
            if(inputs.indexOf(this.gameEngine.inputTypes.Up) != -1)
            {
                this.cursor.y = Math.min(this.cursor.y + 1, this.gameEngine.rowCountInBounds);
            }
            if(inputs.indexOf(this.gameEngine.inputTypes.Down) != -1)
            {
                this.cursor.y = Math.max(this.cursor.y - 1, 1);
            }
            if(inputs.indexOf(this.gameEngine.inputTypes.Left) != -1)
            {
                this.cursor.x = Math.max(this.cursor.x - 1, 0);
            }
            if(inputs.indexOf(this.gameEngine.inputTypes.Right) != -1)
            {
                this.cursor.x = Math.min(this.cursor.x + 1, this.gameEngine.colCount - 2);
            }
            if(inputs.indexOf(this.gameEngine.inputTypes.Swap) != -1 ||
                this.queuedUpSwapAction)
            {
                this.swapAction();
            }
            if(inputs.indexOf(this.gameEngine.inputTypes.Elevate) != -1)
            {
                this.fastElevate = true;
            }
        }
    }
    
    incrementTileId = () =>
    {
        this.lastTileId++;
        return "id:" + this.lastTileId;
    }
}

/**
 * AttackBlock object.
 * presents an attack block that is waiting to fall
 * 
 * @class AttackBlock
 */
class AttackBlock
{
    framesLeftUntilDrop : number;
    
    constructor(
        public tilesWide: number,
        public tilesHigh: number,
        public attackType: number)
    {
        this.framesLeftUntilDrop = GameEngine.ATTACK_BLOCK_DELAY;
    }
}

/**
 * Tile object.
 * Represents a tile on the board.
 * 
 * @class Tile
 */
class Tile
{
    constructor(
        public x: number,
        public y: number,
        public type: number,
        public board: Board)
    {
        this.id = board.incrementTileId();
        this.swappingFrameReset = board.swapDelayReset;
        this.hoverFrameReset = board.fallDelayReset;
    }
    
    id: string;
    xShift = 0;

    isSwapping = false;
    swappingFrameCount = 0;
    swappingFrameReset: number;

    isComboing = false;
    isComboJustFinished = false;
    isChaining = false;
    comboFrameCount = 0;
    persistAfterCombo = false;

    // visual helpers (is this really that bad?)
    popFrameCount = 0;
    sfxIsPopped = false;
    popPitch = 0;
    sfxJustLanded = false;
    previousFalling = false;

    isFalling = false;
    isHovering = false;
    hoverFrameCount = 0;
    hoverFrameReset: number;

    isAttackBlock = false;
    isConnectedRight = false;
    isConnectedLeft = false;
    isConnectedUp = false;
    isConnectedDown = false;
    isComboJustStarted = false;
    
    canMove = () =>
    {
        return !(this.isComboing || this.isSwapping || this.isHovering);
    }

    swapStart = (xShift: number) =>
    {
        // some frames to wait
        this.xShift = xShift;
        this.swappingFrameCount = this.swappingFrameReset;
        this.isSwapping = true;
    }

    comboStart = (totalDelay: number, persistAfterCombo: boolean, popDelay: number = -1) =>
    {
        this.comboFrameCount = totalDelay;
        this.isComboing = true;
        this.persistAfterCombo = persistAfterCombo;
        this.popFrameCount = popDelay;
    }

    hoverStart = () =>
    {
        this.hoverFrameCount = this.hoverFrameReset;
        this.isHovering = true;
    }

    update = () =>
    {
        // swap --
        this.swappingFrameCount = Math.max(-1, this.swappingFrameCount - 1);

        // just finished swapping, check for combos
        if(this.swappingFrameCount == 0)
        {
            // used to be occupying two spaces, now remove old occupancy
            var oldSpace = this.board.getBoardSpace(this.x, this.y);
            oldSpace.removeTile(this);

            this.x += this.xShift;
            this.xShift = 0;
            this.isSwapping = false;
        }

        // combo --
        this.comboFrameCount = Math.max(-1, this.comboFrameCount - 1);

        // just finished comboing, time to die
        if(this.comboFrameCount == 0)
        {
            this.isComboJustFinished = true;
            this.isComboing = false;
        }

        // hover --
        this.hoverFrameCount = Math.max(-1, this.hoverFrameCount - 1);

        // just finished hovering, time to fall
        if(this.hoverFrameCount == 0)
        {
            this.isFalling = true;
            this.isHovering = false;
        }

        // these values are used by the graphics renderer
        // pop --
        this.popFrameCount = Math.max(-1, this.popFrameCount - 1);

        // keep track of falling
        if(this.previousFalling && !this.isFalling)
        {
            this.sfxJustLanded = true;
        }
        this.previousFalling = this.isFalling;
    }
}
