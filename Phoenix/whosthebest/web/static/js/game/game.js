import {mainControl} from "web/static/js/game/common"
import {ServerTranslator} from "web/static/js/game/server_translator"

export function GameEngine()
{
    GameEngine.prototype.instance = this;

    //tile reference:
    // 0 = empty
    // 1 = metal
    // 2 = enemy metal
    // 3-10 basic types
    // 10+ = enemy dropped blocks
    this.basicTileTypeCount = 5; // normal 5, hard 6
    this.basicTileTypeStartIndex = 3;
    this.attackBlockTypeStartIndex = 10;

    this.rowCount = 20;
    this.colCount = 6;
    this.rowCountInBounds = 12;
    this.attackBlockAllowedHeight = 11;

    // Packet information
    this.gameId = 0;
    this.packetDelimiter = "|";
    this.inputDelimiter = ",";
    this.inputTypes =
    {
        None: 0,
        Up: 1,
        Down: 2,
        Left: 3,
        Right: 4,
        Swap: 5,
        Elevate: 6, // if this exceeds 9, might be an issue with string.indexOf
    }

    this.gameStateTypes =
    {
        Starting: 0,
        Playing: 1,
        Ended: 2,
    }
    this.currentGameState = this.gameStateTypes.Starting;

    // board references
    this.boards = [];
    this.numberOfPlayers = 2;

    // need to start keeping global timing values here
    this.attackBlockDelay = 24 // about 70ish frames in 60fps
    this.comboAttackPatterns = [[0], [0], [0], [0], [3], [4], [5], [6], [3, 4], [4, 4], [5, 5], [6, 6]];
    this.attackBlockQueue = [];
    
    // a reference to itself
    var self = this;
    this.initialize = function(randomSeed)
    {
        self.boards = [];
        self.currentGameState = self.gameStateTypes.Starting;

        // board to initialize 
        if(!randomSeed)
        {
            console.log("[game]WARNING: no seed specified");
            randomSeed = Math.random();
        }

        for(var i = 0; i < self.numberOfPlayers; i++)
        {
            var rng = new Math.seedrandom(randomSeed);
            self.boards.push(new Board(rng, i, GameEngine.prototype.instance.attackBlockTypeStartIndex));
        }

        self.boards.forEach(
            function(board)
            {
                board.initialize();
            });
    }
    
    // updates the engine by one frame
    this.update = function(inputs)
    {
        if(self.currentGameState == self.gameStateTypes.Starting)
        {
            // start immediately, todo wait 3 seconds
            console.log("Starting new game!");
            self.currentGameState = self.gameStateTypes.Playing;
        }

        else if(self.currentGameState == self.gameStateTypes.Playing)
        {
            // if any attacks are queued, send them out before processing next frame
            self.sendAllAttacks();

            // update each board, using it's specified inputs
            var numberOfPlayersAlive = self.boards.length;
            for(var i = 0; i < self.boards.length; i++)
            {
                if(!self.boards[i].isGameOver)
                {
                    self.boards[i].update(inputs[i]);
                }
                else
                {
                    numberOfPlayersAlive--;
                }
            }

            // the game has ended, this player has won
            if(numberOfPlayersAlive == 1)
            {
                for(var i = 0; i < self.boards.length; i++)
                {
                    if(!self.boards[i].isGameOver)
                    {
                        self.gameHasEnded(i);
                    }
                }
            }

            // the game has ended in a tie
            else if(numberOfPlayersAlive == 0)
            {
                self.gameHasEnded(-1);
            }
        }

        else if(self.currentGameState == self.gameStateTypes.Ended)
        {
            // wait for "play again" option
            if(self.pressedRestartButton(inputs[0]))
            {
                // self.initialize();
                mainControl.switchToMenu();
                ServerTranslator.prototype.instance.toServerGameEnd();
            }
        }
    }

    this.gameHasEnded = function(winnerIndex)
    {
        if(winnerIndex >= 0)
        {
            console.log("Congratulations player " + winnerIndex);
        }
        else if(winnerIndex == -1)
        {
            console.log("You both lose!");
        }

        self.currentGameState = self.gameStateTypes.Ended;
    }

    this.pressedRestartButton = function(inputs)
    {
        return inputs && inputs.indexOf(GameEngine.prototype.instance.inputTypes.Swap) != -1;
    }

    this.attackOtherPlayer = function(fromBoardIndex, attackBlock)
    {
        // todo make round robin
        var targetBoardIndex = (fromBoardIndex + 1) % GameEngine.prototype.instance.numberOfPlayers;
        var attackData = new AttackBlockData(fromBoardIndex, attackBlock, targetBoardIndex);
        self.attackBlockQueue.push(attackData);
    }

    this.sendAllAttacks = function()
    {
        for(var i = 0; i < self.attackBlockQueue.length; i++)
        {
            var attackData = self.attackBlockQueue[i];
            GameEngine.prototype.instance.boards[attackData.targetBoardIndex].wasAttackedByOtherPlayer(attackData.attackBlock);
        }
        self.attackBlockQueue = [];
    }

    // ************************************************
    // AttackBlockData object.
    // Representsinfo about the type of attack that was made to a player
    // ************************************************
    var AttackBlockData = function(fromBoadIndex, attackBlock, targetBoardIndex)
    {
        this.fromBoadIndex = fromBoadIndex;
        this.attackBlock = attackBlock;
        this.targetBoardIndex = targetBoardIndex;
    }

    // ************************************************
    // BoardSpace object.
    // Represents a static coordinate on the board.
    // Keeps track of a contained tile.
    // ************************************************
    var BoardSpace = function()
    {
        this.contents = [];
        
        var self = this;
        this.addTile = function(tile)
        {
            if(tile != null && self.contents.indexOf(tile) == -1)
            {
                self.contents.push(tile);
            }
        }
        
        this.removeTile = function(tile)
        {
            var index = self.contents.indexOf(tile);
            if(index != -1)
            {
                self.contents.splice(index, 1);
            }
        }
        
        this.clear = function()
        {
            this.contents = [];
        }

        this.getTile = function()
        {
            return self.contents.length > 0 ? self.contents[0] : null;
        }
    }

    // ************************************************
    // Board object.
    // A player's board. Contains all board-related operations.
    // ************************************************
    var Board = function(randomNumberGenerator, playerIndex, attackBlockType)
    {
        this.cursor =
        {
            x: 1,
            y: 1
        }

        this.playerIndex = playerIndex;
        this.randomNumberGenerator = randomNumberGenerator;
        this.attackBlockType = attackBlockType;

        this.tiles = [];
        this.boardSpaces = [];
        this.lastRowOfTileTypes = [];
        this.attackBlocksInWait = [];
        this.allAttackBlocksCombodThisFrame = [];
        
        this.lastTileId = 0;

        this.yOffset = 0; 
        this.yOffsetMax = 16;
        this.yOffsetFrameCount = 20; //todo frames
        this.yOffsetFrameReset = 20;

        this.swapDelayReset = 2; //todo frames
        this.swapDelayCount = -1;
        this.queuedUpSwapAction = false;

        // how long a combo lasts (44 + 25 - 9) / 60fps
        this.comboDelayReset = 20;
        this.comboDelayResetPerTile = 3;

        // how long to hang in the air before falling
        this.fallDelayReset = 4; // roughly 2x swap delay

        // the elevate command will advance the height until a new row is added
        this.fastElevateHeightPerFrame = 3;
        this.fastElevate = false;

        // some actions will stop the board from progressing
        this.stopBoardFromGrowing = false;

        // chains
        this.globalChainCounter = 1;

        // game over
        this.isGameOver = false;
        this.gameOverLeewayReset = 40; // todo frames
        this.gameOverLeewayCount = 40; // how long until we really die

        this.highestTileHeight = 0;

        var self = this;

        this.initialize = function()
        {
            self.isGameOver = false;

            // make board spaces
            // these are static boxes at fixed coordinates
            for(var i = 0; i < GameEngine.prototype.instance.rowCount; i++)
            {
                self.boardSpaces[i] = new Array();
            }
            for(var i = 0; i < GameEngine.prototype.instance.rowCount; i++)
            {
                for(var j = 0; j < GameEngine.prototype.instance.colCount; j++)
                {
                    self.boardSpaces[i][j] = new BoardSpace();
                }
            }

            // make first set of tiles
            for(var i = 8; i >= 0; i--)
            {
                var newRow = self.generateRow(i);
                self.tiles = self.tiles.concat(newRow);

                for(var j = 0; j < newRow.length; j++)
                {
                    self.getBoardSpace(j, i).addTile(newRow[j]);
                }
            }
        }

        this.update = function(inputs)
        {
            // tiles are moving upwards
            self.updateBoardHeight();

            // act on player inputs
            self.readInputs(inputs);

            // update every tile
            self.tiles.forEach(function(tile)
            {
                tile.update();
            });

            // see if any blocks should fall
            self.updateWaitingAttackBlocks();

            // run a pass through all tiles
            self.scanAllTilesForChanges();

            // update swap delay
            self.updateSwapDelay();

            // did we lose?
            self.checkGameOverConditions();
        }

        this.checkGameOverConditions = function()
        {
            // todo, use a different metric. 
            // Internal safety clock -- some leeway in vs mode.
            if(!self.stopBoardFromGrowing)
            {
                if(self.highestTileHeight >= GameEngine.prototype.instance.rowCountInBounds)
                {
                    self.gameOverLeewayCount--;

                    if(self.gameOverLeewayCount == 0)
                    {
                        self.isGameOver = true;
                    }
                }
                else 
                {
                    self.gameOverLeewayCount = self.gameOverLeewayReset;
                }
            }
        }

        this.scanAllTilesForChanges = function()
        {
            var tileKillList = [];
            var tilesToEndChain = [];

            // update this value if anything exciting is happening
            self.stopBoardFromGrowing = false;

            // what's the highest tile?
            self.highestTileHeight = 0;

            // ---------------------------------
            // find dying tiles
            // ---------------------------------
            for(var i = 0; i < self.boardSpaces.length; i++)
            {
                for(var j = 0; j < self.boardSpaces[i].length; j++)
                {
                    var tile = self.getTileAtSpace(j, i);

                    if(!tile || tile.y == 0)
                    {
                        continue;
                    }

                    // highest tile
                    self.highestTileHeight = Math.max(self.highestTileHeight, tile.y);

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
                        var aboveTile = self.getTileAtSpace(tile.x, tile.y + 1);
                        if(aboveTile)
                        {
                            // this tile is now "chaining"
                            aboveTile.isChaining = true;
                        }
                    }
                }
            }

            self.killTiles(tileKillList);

            // ---------------------------------
            // find falling tiles
            // ---------------------------------
            for(var i = 0; i < self.boardSpaces.length; i++)
            {
                for(var j = 0; j < self.boardSpaces[i].length; j++)
                {
                    var tile = self.getTileAtSpace(j, i);

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
                            var belowTile = self.getTileAtSpace(currentTile.x, currentTile.y - 1);

                            // todo test landing on an already hovering tile
                            isBelowRowHovering =
                                (isBelowRowHovering && !belowTile) ||
                                ((shouldRowBeFalling || isBelowRowHovering) && belowTile && belowTile.isHovering);
                            shouldRowBeFalling &= !belowTile && currentTile.y > 1 && currentTile.canMove();

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
                            currentTile = self.getTileAtSpace(currentTile.x + 1, currentTile.y);
                        }

                        var currentTile = tile;
                        while(currentTile)
                        {
                            // remember the right tile, we may shift down this frame
                            var nextTile = null;
                            if(currentTile.isConnectedRight)
                            {
                                nextTile = self.getTileAtSpace(currentTile.x + 1, currentTile.y);
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
                                var space = self.getBoardSpace(currentTile.x, currentTile.y);
                                space.removeTile(currentTile);

                                currentTile.y--;
                                space = self.getBoardSpace(currentTile.x, currentTile.y);
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
                        var belowTile = self.getTileAtSpace(tile.x, tile.y - 1);
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
                            var space = self.getBoardSpace(tile.x, tile.y);
                            space.removeTile(tile);

                            tile.y--;
                            space = self.getBoardSpace(tile.x, tile.y);
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
            for(var i = 0; i < self.boardSpaces.length; i++)
            {
                for(var j = 0; j < self.boardSpaces[i].length; j++)
                {
                    var tile = self.getTileAtSpace(j, i);

                    // any of these exciting things happening?
                    self.stopBoardFromGrowing = self.stopBoardFromGrowing |
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
                            var left = self.getTileAtSpace(j - 1, i);
                            var leftleft = self.getTileAtSpace(j - 2, i);
                            allComboTiles[leftleft.id] = leftleft;
                            allComboTiles[left.id] = left;
                            allComboTiles[tile.id] = tile;
                        }

                        // combo down and downx2
                        if(i >= 3 && tile.type == currentRow[j] && tile.type == lastRow[j])
                        {
                            var down = self.getTileAtSpace(j, i - 1);
                            var downdown = self.getTileAtSpace(j, i - 2);
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
            self.allAttackBlocksCombodThisFrame = [];
            keys.forEach(
                function(key)
                {
                    self.checkForAdjacentAttackBlocks(allComboTiles[key]);
                });

            // total combo length of both (attack and non attack tiles) and (plain tiles)
            var totalComboDelay = (keys.length + self.allAttackBlocksCombodThisFrame.length) * self.comboDelayResetPerTile + self.comboDelayReset;
            var basicComboDelay = keys.length * self.comboDelayResetPerTile + self.comboDelayReset;
            keys.forEach(
                function(key)
                {
                    var tile = allComboTiles[key];
                    tile.comboStart(basicComboDelay, false);
                    wasChainFormedThisFrame |= tile.isChaining;

                    // hacky, stop growing for one frame
                    self.stopBoardFromGrowing = true;
                });

            // go through the attack block and generate tiles for the bottom rows
            if(self.allAttackBlocksCombodThisFrame.length > 0)
            {
                for(var i = self.boardSpaces.length - 1; i >= 0; i--)
                {
                    self.lastRowOfTileTypes = [];
                    for(var j = 0; j < self.boardSpaces[i].length; j++)
                    {
                        var tile = self.getTileAtSpace(j, i);

                        if(tile != null && tile.isComboJustStarted && tile.isAttackBlock)
                        {
                            tile.comboStart(totalComboDelay, true);

                            if(!tile.isConnectedDown)
                            {
                                if(tile.isConnectedUp)
                                {
                                    self.getTileAtSpace(tile.x, tile.y + 1).isConnectedDown = false;
                                }
                                
                                // generate the tile type, cannot be 3 same in a row
                                var ignoreTypes = [];
                                if(self.lastRowOfTileTypes[j - 2] == self.lastRowOfTileTypes[j - 1])
                                {
                                    ignoreTypes.push(self.lastRowOfTileTypes[j - 2]);
                                }
                                var newType = self.getNextRandomTile(ignoreTypes);

                                // remove attack tile
                                var boardSpace = self.getBoardSpace(tile.x, tile.y);
                                boardSpace.removeTile(tile);
                                self.tiles.splice(self.tiles.indexOf(tile), 1);

                                // replace with new basic tile
                                // todo some ignore generation logic
                                var newBasicTile = new Tile(tile.x, tile.y, newType, self);
                                newBasicTile.comboStart(totalComboDelay, true);
                                newBasicTile.isChaining = true;
                                boardSpace.addTile(newBasicTile);
                                self.tiles.push(newBasicTile);

                                self.lastRowOfTileTypes[j] = newBasicTile.type;
                            }
                        }
                    }
                }
            }

            // Tiles that just landed should not be chaining anymore, unless....
            tilesToEndChain.forEach(
                function(tile)
                {
                    tile.isChaining = false;
                });

            // If a chain was formed this frame, The whole combo is now 'chaining'
            // therefore tiles that just landed, can be chaining again!
            if(wasChainFormedThisFrame)
            {
                self.globalChainCounter++;
                keys.forEach(
                    function(key)
                    {
                        allComboTiles[key].isChaining = true;
                    });
            }

            // chain ends if no tiles are chaining
            if(self.globalChainCounter > 1)
            {
                var isStillChaining = false;
                self.tiles.forEach(
                    function(tile)
                    {
                        isStillChaining |= tile.isChaining;
                    });

                if(!isStillChaining)
                {
                    // attack other player -- chains are strong!
                    self.sendChainAttack(self.globalChainCounter);
                    self.globalChainCounter = 1;
                }
            }

            // attack other player -- weak combos will be ignored
            self.sendComboAttack(keys.length);
        }

        this.hurtAttackBlock = function(tile)
        {
            if(tile && tile.isAttackBlock)
            {
                if(self.allAttackBlocksCombodThisFrame.indexOf(tile) == -1)
                {
                    self.allAttackBlocksCombodThisFrame.push(tile);
                    self.hurtAttackBlock(self.getTileAtSpace(tile.x + 1, tile.y));
                    self.hurtAttackBlock(self.getTileAtSpace(tile.x - 1, tile.y));
                    self.hurtAttackBlock(self.getTileAtSpace(tile.x, tile.y + 1));
                    self.hurtAttackBlock(self.getTileAtSpace(tile.x, tile.y - 1));
                    tile.isComboJustStarted = true;
                }
            }
        }

        this.checkForAdjacentAttackBlocks = function(tile)
        {
            self.hurtAttackBlock(self.getTileAtSpace(tile.x + 1, tile.y));
            self.hurtAttackBlock(self.getTileAtSpace(tile.x, tile.y + 1));
            self.hurtAttackBlock(self.getTileAtSpace(tile.x, tile.y - 1));
            self.hurtAttackBlock(self.getTileAtSpace(tile.x - 1, tile.y));
        }

        this.updateSwapDelay = function()
        {
            self.swapDelayCount = Math.max(-1, self.swapDelayCount - 1);
        }

        this.killTiles = function(tilesToKill)
        {
            if(!tilesToKill || tilesToKill.length == 0)
            {
                return;
            }
            
            // remove from board spaces
            tilesToKill.forEach(
                function(tile)
                {
                    var boardSpace = self.getBoardSpace(tile.x, tile.y);
                    boardSpace.removeTile(tile);
                });

            // delete these tiles by constructing a new list
            var newListOfTiles = [];
            self.tiles.forEach(
                function(tile)
                {
                    // if we are not killing the tile
                    // save in new list
                    if(tilesToKill.indexOf(tile) == -1)
                    {
                        newListOfTiles.push(tile);
                    }
                });
            
            self.tiles = newListOfTiles;
        }

        this.getBoardSpace = function(x, y)
        {
            if(y >= 0 && y < self.boardSpaces.length)
            {
                if(x >= 0 && x < self.boardSpaces[y].length)
                {
                    return self.boardSpaces[y][x];
                }
            }

            return null;
        }

        this.getTileAtSpace = function(x, y)
        {
            var space = self.getBoardSpace(x, y);
            if(space)
            {
                return space.getTile();
            }

            return null;
        }

        this.wasAttackedByOtherPlayer = function(attackBlock)
        {
            self.attackBlocksInWait.push(attackBlock);
        }

        this.releaseAttackBlockIntoBoard = function(attackBlock)
        {
            // todo handle... stacks too tall for the board
            // todo handle 2 blocks on the same frame
            for(var i = 0; i < attackBlock.tilesHigh; i++)
            {
                for(var j = 0; j < attackBlock.tilesWide; j++)
                {
                    var tile = new Tile(j, GameEngine.prototype.instance.attackBlockAllowedHeight + 1 + i, attackBlock.attackType, self);
                    tile.isAttackBlock = true;
                    tile.isConnectedRight = j < attackBlock.tilesWide - 1;
                    tile.isConnectedLeft = j > 0;
                    tile.isConnectedUp = i < attackBlock.tilesHigh - 1;
                    tile.isConnectedDown = i > 0;
                    tile.isFalling = true;

                    var boardSpace = self.getBoardSpace(tile.x, tile.y);
                    boardSpace.addTile(tile);
                    self.tiles.push(tile);
                }
            }
        }

        this.updateWaitingAttackBlocks = function()
        {
            for(var i = 0; i < self.attackBlocksInWait.length; i++)
            {
                var attackBlock = self.attackBlocksInWait[i];
                attackBlock.framesLeftUntilDrop--;

                // if the tile is ready to fall
                // remove it from queue and fall
                if(attackBlock.framesLeftUntilDrop <= 0 && !self.stopBoardFromGrowing &&
                    self.highestTileHeight <= GameEngine.prototype.instance.attackBlockAllowedHeight)
                {
                    // only one attack per frame
                    self.releaseAttackBlockIntoBoard(attackBlock);
                    self.attackBlocksInWait.splice(i, 1);
                    break;
                }
            }
        }

        // todo - see if combos are queued up alongside chains, and if they are all sent at once
        this.sendComboAttack = function(comboSize)
        {
            if(comboSize >= 4)
            {
                // combo patterns are predetermined i.e:
                // an 8-combo will always generate a size-3 block and a size-4 block.
                var comboIndex = Math.min(comboSize, GameEngine.prototype.instance.comboAttackPatterns.length - 1);
                var comboPattern = GameEngine.prototype.instance.comboAttackPatterns[comboIndex];

                // multiple blocks can be generated from one combo.
                for(var i = 0; i < comboPattern.length; i++)
                {
                    GameEngine.prototype.instance.attackOtherPlayer(
                        self.playerIndex, 
                        new AttackBlock(comboPattern[i], 1, self.attackBlockType));
                }
            }
        }

        this.sendChainAttack = function(chainSize)
        {
            // chain attacks are always the width of the board
            // the height grows as the chain grows
            GameEngine.prototype.instance.attackOtherPlayer(
                self.playerIndex,
                new AttackBlock(GameEngine.prototype.instance.colCount, chainSize - 1, self.attackBlockType));
        }

        this.getNextRandomTile = function(ignoreList)
        {
            while(true)
            {
                var type = GameEngine.prototype.instance.basicTileTypeStartIndex +
                    Math.floor(self.randomNumberGenerator() * GameEngine.prototype.instance.basicTileTypeCount);
                if(!ignoreList || ignoreList.indexOf(type) == -1)
                {
                    return type;
                }
            }
        }

        this.generateRow = function(rowNum)
        {
            var row = new Array();
            for(var i = 0; i < GameEngine.prototype.instance.colCount; i++)
            {
                // no type can repeat in adjacent rows
                var ignoreTypes = [self.lastRowOfTileTypes[i]];

                // no type can repeat 3x in a row
                if(i >= 2)
                {
                    if(self.lastRowOfTileTypes[i - 2] == self.lastRowOfTileTypes[i - 1])
                    {
                        ignoreTypes.push(self.lastRowOfTileTypes[i - 2]);
                    }
                }

                // get next tile, following rules
                var type = self.getNextRandomTile(ignoreTypes);
                row[i] = new Tile(i, rowNum, type, self);
                self.lastRowOfTileTypes[i] = type;
            }
            return row;
        }


        this.updateBoardHeight = function()
        {
            if(self.stopBoardFromGrowing)
            {
                return;
            }

            if(self.fastElevate)
            {
                // reset the frame count
                self.yOffsetFrameCount = self.yOffsetFrameReset;

                // move up a notch
                self.yOffset += self.fastElevateHeightPerFrame;

                // a new row has formed, cancel elevate
                if(self.yOffset >= self.yOffsetMax)
                {
                    self.yOffset = 0;
                    self.fastElevate = false;
                    self.updateBoardNewHeight();
                }
            }
            else
            {
                // if so many frames pass
                // shift all tiles up a bit
                self.yOffsetFrameCount--;
                if(self.yOffsetFrameCount <= 0)
                {
                    self.yOffsetFrameCount = self.yOffsetFrameReset;
                    self.yOffset++;

                    // a new row has formed
                    if(self.yOffset >= self.yOffsetMax)
                    {
                        self.yOffset = 0;
                        self.updateBoardNewHeight();
                    }
                }
            }
        }

        this.updateBoardNewHeight = function()
        {
            //copy the contents of the space below
            for(var i = GameEngine.prototype.instance.rowCount - 1; i > 0; i--)
            {
                for(var j = 0; j < GameEngine.prototype.instance.colCount; j++)
                {
                    self.boardSpaces[i][j].contents = self.boardSpaces[i-1][j].contents;
                }
            }

            // send all tiles up a notch
            for(var i = 0; i < self.tiles.length; i++)
            {
                self.tiles[i].y++;
            }
            
            // clear previous row and add a new bottom row
            var newRow = self.generateRow(0);
            self.tiles = self.tiles.concat(newRow);
            for(var i = 0; i < newRow.length; i++)
            {
                var tile = newRow[i];
                var boardSpace = self.getBoardSpace(tile.x, tile.y)
                boardSpace.clear();
                boardSpace.addTile(tile);
            }

            self.cursor.y++;
        }

        this.swapAction = function()
        {
            // can't swap too quickly
            if(self.swapDelayCount >= 0)
            {
                self.queuedUpSwapAction = true;
                return;
            }
            self.queuedUpSwapAction = false;

            // get tile at cursor x,y and x+1,y
            var leftSpace = self.getBoardSpace(self.cursor.x, self.cursor.y);
            var rightSpace = self.getBoardSpace(self.cursor.x + 1, self.cursor.y);
            var leftTile = leftSpace.getTile();
            var rightTile = rightSpace.getTile();
            
            var leftUpTile = self.getTileAtSpace(self.cursor.x, self.cursor.y + 1);
            var rightUpTile = self.getTileAtSpace(self.cursor.x + 1, self.cursor.y + 1);

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
                self.swapDelayCount = self.swapDelayReset;
            }

            // physically move right tile
            if(rightTile != null)
            {
                // will occupy both adjacent spaces for now
                leftSpace.addTile(rightTile);
                rightTile.swapStart(-1);
                self.swapDelayCount = self.swapDelayReset;
            }
        }

        this.readInputs = function(inputs)
        {
            if(inputs != null)
            {
                if(inputs.indexOf(GameEngine.prototype.instance.inputTypes.Up) != -1)
                {
                    self.cursor.y = Math.min(self.cursor.y + 1, GameEngine.prototype.instance.rowCountInBounds);
                }
                if(inputs.indexOf(GameEngine.prototype.instance.inputTypes.Down) != -1)
                {
                    self.cursor.y = Math.max(self.cursor.y - 1, 1);
                }
                if(inputs.indexOf(GameEngine.prototype.instance.inputTypes.Left) != -1)
                {
                    self.cursor.x = Math.max(self.cursor.x - 1, 0);
                }
                if(inputs.indexOf(GameEngine.prototype.instance.inputTypes.Right) != -1)
                {
                    self.cursor.x = Math.min(self.cursor.x + 1, GameEngine.prototype.instance.colCount - 2);
                }
                if(inputs.indexOf(GameEngine.prototype.instance.inputTypes.Swap) != -1 ||
                    self.queuedUpSwapAction)
                {
                    self.swapAction();
                }
                if(inputs.indexOf(GameEngine.prototype.instance.inputTypes.Elevate) != -1)
                {
                    self.fastElevate = true;
                }
            }
        }
        
        this.incrementTileId = function()
        {
            self.lastTileId++;
            return "id:" + self.lastTileId;
        }

        // ************************************************
        // AttackBlock object.
        // Represents an attack block that is waiting to fall
        // ************************************************
        var AttackBlock = function(tilesWide, tilesHigh, attackType)
        {
            this.tilesWide = tilesWide;
            this.tilesHigh = tilesHigh;
            this.attackType = attackType;
            this.framesLeftUntilDrop = GameEngine.prototype.instance.attackBlockDelay;
        }

        // ************************************************
        // Tile object.
        // Represents a tile on the board.
        // ************************************************
        var Tile = function(x, y, type, board)
        {
            this.x = x;
            this.y = y;
            this.type = type;
            this.board = board;
            this.id = board.incrementTileId();
            this.xShift = 0;

            this.isSwapping = false;
            this.swappingFrameCount = 0;
            this.swappingFrameReset = board.swapDelayReset;

            this.isComboing = false;
            this.isComboJustFinished = false;
            this.isChaining = false;
            this.comboFrameCount = 0;
            this.persistAfterCombo = false;

            this.isFalling = false;
            this.isHovering = false;
            this.hoverFrameCount = 0;
            this.hoverFrameReset = board.fallDelayReset;

            this.isAttackBlock = false;
            this.isConnectedRight = false;
            this.isConnectedLeft = false;
            this.isConnectedUp = false;
            this.isConnectedDown = false;
            
            var self = this;

            this.canMove = function()
            {
                return !(self.isComboing || self.isSwapping || self.isHovering);
            }

            this.swapStart = function(xShift)
            {
                // some frames to wait
                self.xShift = xShift;
                self.swappingFrameCount = self.swappingFrameReset;
                self.isSwapping = true;
            }

            this.comboStart = function(totalDelay, persistAfterCombo)
            {
                self.comboFrameCount = totalDelay;
                self.isComboing = true;
                self.persistAfterCombo = persistAfterCombo;
            }

            this.hoverStart = function()
            {
                self.hoverFrameCount = self.hoverFrameReset;
                self.isHovering = true;
            }

            this.update = function()
            {
                // swap --
                self.swappingFrameCount = Math.max(-1, self.swappingFrameCount - 1);

                // just finished swapping, check for combos
                if(self.swappingFrameCount == 0)
                {
                    // used to be occupying two spaces, now remove old occupancy
                    var oldSpace = board.getBoardSpace(self.x, self.y);
                    oldSpace.removeTile(self);

                    self.x += self.xShift;
                    self.xShift = 0;
                    self.isSwapping = false;
                }

                // combo --
                self.comboFrameCount = Math.max(-1, self.comboFrameCount - 1);

                // just finished comboing, time to die
                if(self.comboFrameCount == 0)
                {
                    self.isComboJustFinished = true;
                    self.isComboing = false;
                }

                // hover --
                self.hoverFrameCount = Math.max(-1, self.hoverFrameCount - 1);

                // just finished hovering, time to fall
                if(self.hoverFrameCount == 0)
                {
                    self.isFalling = true;
                    self.isHovering = false;
                }
            }
        }
    }
}