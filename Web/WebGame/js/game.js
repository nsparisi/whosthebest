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

        // how long a combo lasts
        // todo, make tile 'popping' a different counter
        this.comboDelayReset = 22;

        // how long to hang in the air before falling
        this.fallDelayReset = 4; // roughly 2x swap delay

        // the elevate command will advance the height until a new row is added
        this.fastElevateHeightPerFrame = 4;
        this.fastElevate = false;

        // some actions will stop the board from progressing
        this.stopBoardFromGrowing = false;

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
            self.updateBoardHeight();

            // act on player inputs
            self.readInputs(inputs);

            // update every tile
            self.tiles.forEach(function(tile)
            {
                tile.update();
            });

            // run a pass through all tiles
            self.scanAllTilesForChanges();

            // delete combo'd out tiles
            self.checkForTilesToKill();

            // update swap delay
            self.updateSwapDelay();
        }

        this.scanAllTilesForChanges = function()
        {
            // update this value if anything exciting is happening
            self.stopBoardFromGrowing = false;

            // find falling tiles
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

                    // should be falling?
                    var belowTile = self.getTileAtSpace(tile.x, tile.y - 1);
                    var shouldBeFalling = !belowTile && tile.y > 1 && tile.canMove();

                    // if I'm resting on a hovering tile, copy the hover attribute
                    if(belowTile && belowTile.isHovering)
                    {
                        tile.isHovering = belowTile.isHovering;
                        tile.hoverFrameCount = belowTile.hoverFrameCount;
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

            var lastRow = [];
            var currentRow = [];
            var allComboTiles = [];

            // find comboing tiles
            for(var i = 0; i < self.boardSpaces.length; i++)
            {
                for(var j = 0; j < self.boardSpaces[i].length; j++)
                {
                    var tile = self.getTileAtSpace(j, i);

                    // any of these exciting things happening?
                    self.stopBoardFromGrowing = self.stopBoardFromGrowing |
                        (tile && (tile.isHovering || tile.isFalling || tile.comboFrameCount > 0))

                    // ignore these tiles
                    if(!tile || tile.y == 0 || !tile.canMove() || tile.isFalling)
                    {
                        // mark this row as a 0
                        lastRow[j] = currentRow[j];
                        currentRow[j] = 0;
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

            // trigger combo start
            var keys = Object.keys(allComboTiles);
            keys.forEach(
                function(key)
                {
                    var tile = allComboTiles[key];
                    tile.comboStart();

                    self.stopBoardFromGrowing = true;
                });
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
            for(var i = gameEngine.rowCount - 1; i > 0; i--)
            {
                for(var j = 0; j < gameEngine.colCount; j++)
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
            if(leftTile != null && !leftTile.canMove())
            {
                return;
            }
            if(rightTile != null && !rightTile.canMove())
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
                if(inputs.indexOf(gameEngine.inputTypes.Elevate) != -1)
                {
                    self.fastElevate = true;
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

        this.addTileToFallList = function(tile)
        {
            if(!tile)
            {
                return;
            }

            self.tileFallList.push(tile);
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
            this.isHovering = false;
            this.xShift = 0;

            this.swappingFrameCount = 0;
            this.swappingFrameReset = board.swapDelayReset;

            this.comboFrameCount = 0;
            this.comboFrameReset = board.comboDelayReset;

            this.hoverFrameCount = 0;
            this.hoverFrameReset = board.fallDelayReset;
            
            var self = this;

            this.canMove = function()
            {
                return !(self.comboFrameCount > 0 || self.swappingFrameCount > 0 || self.isHovering);
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
                }

                // combo --
                self.comboFrameCount = Math.max(-1, self.comboFrameCount - 1);

                // just finished comboing, time to die
                if(self.comboFrameCount == 0)
                {
                    board.addTileToKillList(self);
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