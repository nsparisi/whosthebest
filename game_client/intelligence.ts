/// <reference path="references.ts" />

class IntelligenceEngine
{
    board: Board;
    thoughts = [];
    potentials: Potential[];
    
    constructor(board: Board)
    {
        this.board = board;
        this.thoughts = [];
        this.potentials = [];

        this.thoughts.push(SERVER_GAME_ENGINE.inputTypes.None);
        
        for(var i = 0; i < SERVER_GAME_ENGINE.attackBlockTypeStartIndex; i++)
        {
            this.potentials.push(new Potential(i, board));
        }
    }

    empty = () =>
    {
    
    }

    next = () =>
    {
        this.think();

        if (this.thoughts.length > 0)
        {

            var thought = this.thoughts.shift();
            //Debug.log(thought);
            return thought;
        }

        return SERVER_GAME_ENGINE.inputTypes.None;
    }

    think = () =>
    {
        // follow current train of thought, don't overthink it
        if(this.thoughts.length > 0)
        {
            return;
        }

        // don't do anything if something interesting is happening
        // this.thinkAboutSomethingInteresting();
        if(this.thoughts.length > 0)
        {
            //Debug.log("Thinking about something interesting.");
            return;
        }

        // prioritize adding more tiles if board is low
        this.thinkAboutRaisingTiles();
        if(this.thoughts.length > 0)
        {
            Debug.log("Thinking about raising tiles.");
            return;
        }

        // remove attack blocks (garbage blocks)
        this.thinkAboutDefending();
        if(this.thoughts.length > 0)
        {
            Debug.log("Thinking about defending.");
            return;
        }

        // organize the tiles
        this.thinkAboutFlattening();
        if(this.thoughts.length > 0)
        {
            Debug.log("Thinking about flattening.");
            return;
        }

        // make a combo happen
        this.thinkAboutCombos();
        if(this.thoughts.length > 0)
        {
            Debug.log("Thinking about combos.");
            return;
        }

        // nothing to think about... let's relax
        this.getLostInThought(90);
        Debug.log("Lost in thought");
    }

    thinkAboutDefending = () =>
    {
        var attackBlocks: Tile[] = [];
        this.board.tiles.forEach((tile) =>
        {
            if(tile != null && tile.isAttackBlock)
            {
                attackBlocks.push(tile);
            }
        });

        if(attackBlocks.length > 0)
        {
            this.thinkAboutCombos();
        }
    }

    thinkAboutSomethingInteresting = () => 
    {
        if(this.board.stopBoardFromGrowing)
        {
            this.thoughts.push(SERVER_GAME_ENGINE.inputTypes.None);
        }
    }

    thinkAboutFlattening = () =>
    {
        var minHole: AIPoint = {x: 100, y: 100};
        var maxTile: AIPoint = {x: 0, y: 0};

        for(var y = 0; y < this.board.boardSpaces.length; y++)
        {
            for(var x = 0; x < this.board.boardSpaces[y].length; x++)
            {
                var tile = this.board.boardSpaces[y][x].getTile();
                
                if(tile != null)
                {
                    if(tile.isAttackBlock || tile.y >= SERVER_GAME_ENGINE.rowCountInBounds)
                    {
                        continue;
                    }

                    if(maxTile.y < y)
                    {
                        maxTile.x = x;
                        maxTile.y = y;
                    }
                }
                else 
                {
                    if(minHole.y > y)
                    {
                        minHole.x = x;
                        minHole.y = y;
                    }
                }
            }
        }

        // if there is a hole
        // then go ahead and move the tile in the direction of the hole
        if(minHole.y < maxTile.y)
        {
            var destinationX = minHole.x < maxTile.x ? maxTile.x - 1 : maxTile.x;
            var cursor = {x: this.board.cursor.x, y: this.board.cursor.y};
            Debug.log(`FLATTEN: cursor ${cursor.x},${cursor.y} tile ${maxTile.x},${maxTile.y} hole ${minHole.x},${minHole.y}`);
            AIHelpers.moveTo(cursor, destinationX, maxTile.y, this.thoughts);
            AIHelpers.swapTo(cursor, minHole.x, this.thoughts);
        }
    }

    thinkAboutRaisingTiles = () =>
    {
        if(this.board.highestTileHeight < 3)
        {
            AIHelpers.insertElevate(this.thoughts);
            AIHelpers.insertElevate(this.thoughts);
            AIHelpers.insertElevate(this.thoughts);
        }
    }

    thinkAboutCombos = () =>
    {
        // reset and fill up a list of potential tiles
        this.potentials.forEach((potential) =>
        {
            potential.reset();
        });

        this.board.tiles.forEach((tile) =>
        {
            if(!tile || tile.y == 0 || !tile.canMove() || tile.isAttackBlock || tile.y >= SERVER_GAME_ENGINE.rowCountInBounds)
            {
                return;
            }

            this.potentials[tile.type].add(tile);
        });

        // check each potential
        // a successful check will fill our thoughts and we can exit
        for(var i = 0; i < this.potentials.length; i++)
        {
            this.thoughts = this.potentials[i].check(this.board.cursor);
            if(this.thoughts.length > 0)
            {
                this.getLostInThought(30);
                return;
            }
        }
    }

    getLostInThought = (waitLength: number) =>
    {
        for(var i = 0; i < waitLength; i++)
        {
            this.thoughts.push(SERVER_GAME_ENGINE.inputTypes.None);
        }
    }
}

class Potential 
{
    type: number;
    board: Board;
    rows: Tile[][];

    constructor(type: number, board: Board)
    {
        this.type = type;
        this.board = board;
        this.rows = [];
        for(var i = 0; i < SERVER_GAME_ENGINE.rowCountInBounds; i++)
        {
            this.rows.push([]);
        }

    }

    reset = () =>
    {
        for(var i = 0; i < SERVER_GAME_ENGINE.rowCountInBounds; i++)
        {
            this.rows[i] = [];
        }
    }

    add = (tile: Tile) =>
    {
        this.rows[tile.y].push(tile);
    }

    check = (cursor: any) =>
    {
        var tilesToThinkAbout = [];
        var moves = [];
        for(var i = 0; i < SERVER_GAME_ENGINE.rowCountInBounds; i++)
        {
            if(this.rows[i].length >= 3)
            {
                tilesToThinkAbout = [];
                tilesToThinkAbout.push(this.rows[i][0]);
                tilesToThinkAbout.push(this.rows[i][1]);
                tilesToThinkAbout.push(this.rows[i][2]);

                Debug.log(`solving. type: ${this.type}, in a row of 3.`);
                this.solve(tilesToThinkAbout, cursor, this.board, moves);
                if(moves.length > 0)
                {
                    return moves;
                }
            }

            if(this.rows[i].length > 0)
            {
                tilesToThinkAbout.push(this.rows[i][0]);
                if(tilesToThinkAbout.length >= 3)
                {
                    Debug.log(`solving. type: ${this.type}, in a col of 3.`);
                    this.solve(tilesToThinkAbout, cursor, this.board, moves);
                    if(moves.length > 0)
                    {
                        return moves;
                    }
                    else 
                    {
                        tilesToThinkAbout.shift();
                    }
                }
            }
            else 
            {
                tilesToThinkAbout = [];
            }
        }

        return [];
    }

    solve = (tiles: Tile[], cursor: any, board: Board, moves: number[]) =>
    {
        Debug.log(`TILE0:${tiles[0].x},${tiles[0].y} TILE1:${tiles[1].x},${tiles[1].y} TILE2:${tiles[2].x},${tiles[2].y}`);
        
        function possible(tileOne: Tile, tileTwo: Tile, destX: number)
        {
            if(!AIHelpers.canSwapTo(tileOne, destX, board))
            {
                Debug.log(`can't swap to! ${tiles[1].x},${tiles[1].y} destx ${destX}`);
                return false;
            }
            
            if(!AIHelpers.canSwapTo(tileTwo, destX, board))
            {
                Debug.log(`can't swap to! ${tiles[2].x},${tiles[2].y} destx ${destX}`);
                return false
            }

            return true;
        }

        // move each tile to the x-coordinate of the first tile
        var currentCursor =  {x: cursor.x, y: cursor.y};
        var destX = 0;
        var tilesToMove: Tile[] = [];

        if(possible(tiles[0], tiles[1], tiles[2].x))
        {
            tilesToMove.push(tiles[0]);
            tilesToMove.push(tiles[1]);
            destX = tiles[2].x
        }
        else if(possible(tiles[1], tiles[2], tiles[0].x))
        {
            tilesToMove.push(tiles[1]);
            tilesToMove.push(tiles[2]);
            destX = tiles[0].x
        }
        else if(possible(tiles[0], tiles[2], tiles[1].x))
        {
            tilesToMove.push(tiles[0]);
            tilesToMove.push(tiles[2]);
            destX = tiles[1].x
        }
        else
        {
            return [];
        }

        // solve each tile
        tilesToMove.forEach((currentTile) =>
        {
            if(currentTile.x < destX)
            {
                AIHelpers.moveTo(currentCursor, currentTile.x, currentTile.y, moves);
                AIHelpers.swapTo(currentCursor, destX, moves);
            }
            else if(currentTile.x > destX)
            {
                AIHelpers.moveTo(currentCursor, currentTile.x - 1, currentTile.y, moves);
                AIHelpers.swapTo(currentCursor, destX, moves);
            }
        });
    }
}

interface AIPoint {x: number, y: number}

class AIHelpers 
{
    empty = () =>
    {

    }

    static swapTo = (cursor: AIPoint, endX: number, moves: number[]) =>
    {
        while(cursor.x < endX - 1)
        {
            AIHelpers.insertSwap(moves);
            moves.push(SERVER_GAME_ENGINE.inputTypes.Right);
            cursor.x++;
        }

        while(cursor.x > endX)
        {
            AIHelpers.insertSwap(moves);
            moves.push(SERVER_GAME_ENGINE.inputTypes.Left);
            cursor.x--;
        }

        AIHelpers.insertSwap(moves);
    }

    static moveTo = (cursor: AIPoint, endX: number, endY: number, moves: number[]) =>
    {
        while(cursor.x < endX)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Right);
            cursor.x++;
        }
        while(cursor.x > endX)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Left);
            cursor.x--;
        }
        while(cursor.y < endY)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Up);
            cursor.y++;
        }
        while(cursor.y > endY)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Down);
            cursor.y--;
        }
    }

    static insertSwap = (moves: number[]) =>
    {
        // add a swap, then wait a number of frames for swap to finish
        moves.push(SERVER_GAME_ENGINE.inputTypes.Swap);
        for(var i = 0; i < SERVER_GAME_ENGINE.boards[0].swapDelayReset - 1; i++)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.None);
        }
    }

    static insertElevate = (moves: number[]) =>
    {
        // add a swap, then wait a number of frames for swap to finish
        moves.push(SERVER_GAME_ENGINE.inputTypes.Elevate);
        var wait = SERVER_GAME_ENGINE.boards[0].yOffsetMax / SERVER_GAME_ENGINE.boards[0].fastElevateHeightPerFrame;
        for(var i = 0; i < wait - 1; i++)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.None);
        }
    }
    

    static canSwapTo = (tile: Tile, endX: number, board: Board) =>
    {
        var y = tile.y;
        var x = endX < tile.x ? tile.x - 1 : tile.x;
        var lookahead = endX < tile.x ? 0 : 1;
        var direction = endX < tile.x ? -1 : 1;

        function makeChecks(lookahead: number, ignoreCombo: boolean)
        {
            // check for unswappable neighbor
            var tileMiddle = board.getTileAtSpace(x + lookahead, y);
            if(tileMiddle != null && !tileMiddle.canMove())
            {
                return false;
            }

            // check for a hole in the ground
            var tileBelow = board.getTileAtSpace(x + lookahead, y - 1);
            if(tileBelow == null)
            {
                return false;
            }

            // we need to ignore the combo trap check in the final case
            if(ignoreCombo)
            {
                return true;
            }

            // check for a combo trap
            var tileAbove = board.getTileAtSpace(x + lookahead, y + 1);
            var tileAboveAbove = board.getTileAtSpace(x + lookahead, y + 2);
            var tileBelowBelow = board.getTileAtSpace(x + lookahead, y - 2);
            if( tileAbove != null && 
                tileAboveAbove != null &&
                tile.type == tileAbove.type && 
                tile.type == tileAboveAbove.type)
            {
                return false;
            }

            if( tileAbove != null && 
                tileBelow != null &&
                tile.type == tileAbove.type && 
                tile.type == tileBelow.type)
            {
                return false;
            }

            if( tileBelow != null && 
                tileBelowBelow != null &&
                tile.type == tileBelow.type && 
                tile.type == tileBelowBelow.type)
            {
                return false;
            }

            return true;
        }

        while(x != endX)
        {
            var ignoreCombo = Math.abs(x - endX) == 1;
            if(!makeChecks(lookahead, ignoreCombo))
            {
                return false;
            }

            x += direction;
        }

        return true;
    }
}