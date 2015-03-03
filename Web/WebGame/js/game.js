function GameEngine()
{    
    //tile reference:
    // 0 = empty
    // 1 = metal
    // 2 = enemy metal
    // 3-10 basic types
    // 10+ = enemy dropped blocks
    this.rowCount = 20;
    this.colCount = 6;
    this.rowCountInBounds = 12;
    this.basicTileTypeCount = 5

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

    // board references
    this.board = null;
    
    // a reference to itself
    var self = this;
    this.initialize = function()
    {
        // board to initialize 
        // todo have 2 boards in the future
        self.board = new Board();
        self.board.initialize();
    }
    
    // updates the engine by one frame
    this.update = function(data)
    {
        // parse frame packet data into a set of inputs for each board
        var frameData = self.parseFrameData(data);
        
        // todo update all boards
        self.board.update(frameData.inputs[0]);
    }
    
    this.parseFrameData = function(data)
    {
        var frameData = null;
        var gameId = 0;
        
        // id | frame | time | p1input1,p1inputN | pNinput1,pNinputN
        var tokens = data.split(self.packetDelimiter);
        if(tokens.length > 0 && tokens[0] == gameId)
        {
            frameData = new FrameData();
            frameData.frame = tokens[1];
            frameData.time = tokens[2];

            // inputs[0] == player 0 input
            // inputs[n] == player n input
            for(var i = 3; i < tokens.length; i++)
            {
                frameData.inputs[i-3] = tokens[i];
            }
        }
        
        return frameData;
    }

    // ************************************************
    // FrameData object.
    // Represents the frame string in a readable data format
    // ************************************************
    var FrameData = function()
    {
        this.frame = -1;
        this.time = -1;
        this.inputs = [];
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
    var Board = function()
    {
        this.tiles = [];
        this.boardSpaces = [];
        this.lastRowOfTileTypes = [];
        this.tileCheckList = [];
        this.tileKillList = [];
        this.tileFallList = [];

        this.lastTileId = 0;

        this.yOffset = 0; 
        this.yOffsetMax = 16;
        this.yOffsetFrameCount = 15; //todo frames
        this.yOffsetFrameReset = 15;

        this.swapDelayReset = 2; //todo frames
        this.swapDelayCount = -1;
        this.queuedUpSwapAction = false;

        this.cursor =
        {
            x: 1,
            y: 1
        }

        var self = this;

        this.initialize = function()
        {
            // make board spaces
            // these are static boxes at fixed coordinates
            for(var i = 0; i < gameEngine.rowCount; i++)
            {
                self.boardSpaces[i] = new Array();
            }
            for(var i = 0; i < gameEngine.rowCount; i++)
            {
                for(var j = 0; j < gameEngine.colCount; j++)
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
            self.updateYOffset();

            // act on player inputs
            self.readInputs(inputs);

            // update every tile
            self.tiles.forEach(function(tile)
            {
                tile.update();
            });

            // run checks for combos and such
            self.checkTilesForChanges();

            // delete found tiles
            self.checkForTilesToKill();

            // fall down found tiles
            self.checkForTilesToFall();

            // update swap delay
            self.updateSwapDelay();
        }

        this.updateSwapDelay = function()
        {
            self.swapDelayCount = Math.max(-1, self.swapDelayCount - 1);
        }

        this.checkForTilesToKill = function()
        {
            if(self.tileKillList.length == 0)
            {
                return;
            }
            
            // remove from board spaces
            self.tileKillList.forEach(
                function(tile)
                {
                    console.log("deleting tile " + tile.id);
                    var boardSpace = self.getBoardSpace(tile.x, tile.y);
                    boardSpace.removeTile(tile);
                });

            // notify all adjacent tiles above
            self.tileKillList.forEach(
                function(tile)
                {
                    var aboveTile = self.getTileAtSpace(tile.x, tile.y + 1);

                    if(aboveTile)
                    {
                        console.log("adding to checklist " + aboveTile.id);
                        self.addTileToFallList(aboveTile);
                    }
                });

            // delete these tiles by constructing a new list
            var newListOfTiles = [];
            self.tiles.forEach(
                function(tile)
                {
                    // if we are not killing the tile
                    // save in new list
                    if(self.tileKillList.indexOf(tile) == -1)
                    {
                        newListOfTiles.push(tile);
                    }
                });
            
            console.log("old count: " + self.tiles.length + ", new count: " + newListOfTiles.length);
            self.tiles = newListOfTiles;
            self.tileKillList = [];
        }

        this.checkForTilesToFall = function()
        {
            if(self.tileFallList.length == 0)
            {
                return;
            }

            // reset list
            var tilesToFall = self.tileFallList;
            self.tileFallList = [];

            // check for tiles to start falling
            tilesToFall.forEach(
                function(tile)
                {
                    console.log("checking for falls!");
                    tile.isFalling = false;

                    if(self.shouldStartFalling(tile))
                    {
                        console.log("tile should fall. " + tile.id);
                        var oldSpace = self.getBoardSpace(tile.x, tile.y);
                        var newSpace = self.getBoardSpace(tile.x, tile.y - 1);

                        if(oldSpace && newSpace)
                        {
                            // move tile down
                            oldSpace.removeTile(tile);
                            newSpace.addTile(tile);
                            tile.y--;

                            // keep falling
                            tile.isFalling = true;
                            self.addTileToFallList(tile);
                        }
                    }

                    // tile hit something
                    if(!tile.isFalling)
                    {
                        self.addTileToCheckList(tile);
                    }
                });
        }

        this.shouldStartFalling = function(tile)
        {
            var belowTile = self.getTileAtSpace(tile.x, tile.y - 1);
            return !belowTile && tile.y > 1 && tile.canMove();
        }

        this.checkTilesForChanges = function()
        {
            if(self.tileCheckList.length == 0)
            {
                return;
            }

            // check for tiles to start falling
            self.tileCheckList.forEach(
                function(tile)
                {
                    if(self.shouldStartFalling(tile))
                    {
                        self.addTileToFallList(tile);
                    }
                });

            // check for tiles to start comboing
            var allComboTiles = [];
            self.tileCheckList.forEach(
                function(tile)
                {
                    // no interest in bottom row
                    if(tile.y == 0)
                    {
                        return;
                    }

                    // no interest in tiles already part of an action (not falling)
                    if(!tile.canMove())
                    {
                        return;
                    }

                    console.log("checking for combos!");
                    var left1 = self.getTileAtSpace(tile.x - 1, tile.y);
                    var left2 = self.getTileAtSpace(tile.x - 2, tile.y);

                    var right1 = self.getTileAtSpace(tile.x + 1, tile.y);
                    var right2 = self.getTileAtSpace(tile.x + 2, tile.y);

                    var up1 = self.getTileAtSpace(tile.x, tile.y + 1);
                    var up2 = self.getTileAtSpace(tile.x, tile.y + 2);

                    // don't consider bottom (0th) row.
                    var down1 = null;
                    var down2 = null;
                    if(tile.y > 2)
                    {
                        var down2 = self.getTileAtSpace(tile.x, tile.y - 2);
                    }
                    if(tile.y > 1)
                    {
                        var down1 = self.getTileAtSpace(tile.x, tile.y - 1);
                    }

                    var safeCheckTypeEquality = function(tile1, tile2, tile3)
                    {
                        return tile1 && tile2 && tile3 &&
                            !tile.isFalling && !tile2.isFalling && !tile3.isFalling &&
                            tile.canMove() && tile2.canMove() && tile3.canMove() &&
                            tile1.type == tile2.type && tile1.type == tile3.type;
                    }

                    if(safeCheckTypeEquality(tile, left1, left2))
                    {
                        // great!
                        allComboTiles[left1.id] = left1;
                        allComboTiles[left2.id] = left2;
                        allComboTiles[tile.id] = tile;
                    }

                    if(safeCheckTypeEquality(tile, right1, right2))
                    {
                        allComboTiles[right1.id] = right1;
                        allComboTiles[right2.id] = right2;
                        allComboTiles[tile.id] = tile;
                    }

                    if(safeCheckTypeEquality(tile, up1, up2))
                    {
                        allComboTiles[up1.id] = up1;
                        allComboTiles[up2.id] = up2;
                        allComboTiles[tile.id] = tile;
                    }

                    if(safeCheckTypeEquality(tile, down1, down2))
                    {
                        allComboTiles[down1.id] = down1;
                        allComboTiles[down2.id] = down2;
                        allComboTiles[tile.id] = tile;
                    }

                    if(safeCheckTypeEquality(tile, left1, right1))
                    {
                        allComboTiles[left1.id] = left1;
                        allComboTiles[right1.id] = right1;
                        allComboTiles[tile.id] = tile;
                    }

                    if(safeCheckTypeEquality(tile, down1, up1))
                    {
                        allComboTiles[down1.id] = down1;
                        allComboTiles[up1.id] = up1;
                        allComboTiles[tile.id] = tile;
                    }
                });

            self.tileCheckList = [];
            
            // trigger combo start
            var keys = Object.keys(allComboTiles);
            console.log("found tiles to combo: " + keys.length);
            keys.forEach(
                function(key)
                {
                    var tile = allComboTiles[key];
                    console.log("combo start: " + tile.id);
                    tile.comboStart();
                });
        }

        this.updateYOffset = function()
        {
            // if so many frames pass
            // shift all tiles up a bit
            self.yOffsetFrameCount--;
            if(self.yOffsetFrameCount <= 0)
            {
                self.yOffsetFrameCount = self.yOffsetFrameReset;
                self.yOffset++;

                // a new row has formed
                if(self.yOffset % self.yOffsetMax == 0)
                {
                    self.yOffset = 0;
                    self.updateBoardNewHeight();
                }
            }
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

        this.getNextRandomTile = function(ignoreList)
        {
            while(true)
            {
                var type = 3 + Math.floor(Math.random() * gameEngine.basicTileTypeCount);
                if(!ignoreList || ignoreList.indexOf(type) == -1)
                {
                    return type;
                }
            }
        }

        this.generateRow = function(rowNum)
        {
            var row = new Array();
            for(var i = 0; i < gameEngine.colCount; i++)
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

        this.updateBoardNewHeight = function()
        {
            //clear all previous BoardSpace knowledge
            for(var i = 0; i < gameEngine.rowCount; i++)
            {
                for(var j = 0; j < gameEngine.colCount; j++)
                {
                    self.boardSpaces[i][j].clear();
                }
            }

            // send all tiles up a notch and add to BoardSpaces
            for(var i = 0; i < self.tiles.length; i++)
            {
                var tile = self.tiles[i];
                tile.y++;

                self.getBoardSpace(tile.x, tile.y).addTile(tile);
            }

            // add a new bottom row
            var newRow = self.generateRow(0);
            self.tiles = self.tiles.concat(newRow);
            for(var i = 0; i < newRow.length; i++)
            {
                var tile = newRow[i];
                self.getBoardSpace(tile.x, tile.y).addTile(tile);
            }

            // send checks for 1st row
            for(var j = 0; j < gameEngine.colCount; j++)
            {
                self.addTileToCheckList(self.getTileAtSpace(j, 1));
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

            if(leftTile != null && !leftTile.canMove())
            {
                // ignore input
                return;
            }

            if(rightTile != null && !rightTile.canMove())
            {
                // ignore input
                return;
            }

            // physically move left tile
            if(leftTile != null)
            {
                leftSpace.removeTile(leftTile);
                rightSpace.addTile(leftTile);
                leftTile.swapStart(1);
                self.swapDelayCount = self.swapDelayReset;
            }

            // physically move right tile
            if(rightTile != null)
            {
                rightSpace.removeTile(rightTile);
                leftSpace.addTile(rightTile);
                rightTile.swapStart(-1);
                self.swapDelayCount = self.swapDelayReset;
            }
        }

        this.readInputs = function(inputs)
        {
            if(inputs != null)
            {
                if(inputs.indexOf(gameEngine.inputTypes.Up) != -1)
                {
                    self.cursor.y = Math.min(self.cursor.y + 1, gameEngine.rowCountInBounds);
                }
                if(inputs.indexOf(gameEngine.inputTypes.Down) != -1)
                {
                    self.cursor.y = Math.max(self.cursor.y - 1, 1);
                }
                if(inputs.indexOf(gameEngine.inputTypes.Left) != -1)
                {
                    self.cursor.x = Math.max(self.cursor.x - 1, 0);
                }
                if(inputs.indexOf(gameEngine.inputTypes.Right) != -1)
                {
                    self.cursor.x = Math.min(self.cursor.x + 1, gameEngine.colCount - 2);
                }
                if(inputs.indexOf(gameEngine.inputTypes.Swap) != -1 ||
                    self.queuedUpSwapAction)
                {
                    self.swapAction();
                }
            }
        }
        
        this.addTileToKillList = function(tile)
        {
            if(!tile)
            {
                return;
            }

            self.tileKillList.push(tile);
        }

        this.addTileToCheckList = function(tile)
        {
            if(!tile)
            {
                return;
            }

            self.tileCheckList.push(tile);
        }

        this.addTileToFallList = function(tile)
        {
            if(!tile)
            {
                return;
            }

            tile.isFalling = true;

            // if I go down, I'm taking you with me!
            var currentTile = tile;
            while(currentTile)
            {
                self.tileFallList.push(currentTile);
                currentTile = self.getTileAtSpace(currentTile.x, currentTile.y + 1);
            }
        }

        this.incrementTileId = function()
        {
            self.lastTileId++;
            return "id:" + self.lastTileId;
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
            this.isFalling = false;
            this.xShift = 0;

            this.swappingFrameCount = 0;
            this.swappingFrameReset = board.swapDelayReset;

            this.comboFrameCount = 0;
            this.comboFrameReset = 32;
            
            var self = this;

            this.canMove = function()
            {
                return !(self.comboFrameCount > 0 || self.swappingFrameCount > 0);
            }

            this.swapStart = function(xShift)
            {
                // some frames to wait
                self.xShift = xShift;
                self.swappingFrameCount = self.swappingFrameReset;
            }

            this.comboStart = function()
            {
                self.comboFrameCount = self.comboFrameReset;
            }

            this.update = function()
            {
                // swap --
                self.swappingFrameCount = Math.max(-1, self.swappingFrameCount - 1);

                // just finished swapping, check for combos
                if(self.swappingFrameCount == 0)
                {
                    board.addTileToFallList( board.getTileAtSpace(self.x, self.y + 1) );
                    self.x += self.xShift;
                    self.xShift = 0;
                    board.addTileToCheckList(self);
                }

                // combo --
                self.comboFrameCount = Math.max(-1, self.comboFrameCount - 1);

                // just finished swapping, check for combos
                if(self.comboFrameCount == 0)
                {
                    board.addTileToKillList(self);
                }
            }
        }
    }
}