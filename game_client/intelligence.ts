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
            this.potentials.push(new Potential(i));
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

        // prioritize adding more tiles if board is low
        if(this.board.highestTileHeight < 3)
        {
            this.thoughts.push(SERVER_GAME_ENGINE.inputTypes.Elevate);
            this.thoughts.push(SERVER_GAME_ENGINE.inputTypes.Elevate);
            this.thoughts.push(SERVER_GAME_ENGINE.inputTypes.Elevate);
            return;
        }

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
                this.getLostInThought();
                return;
            }
        }

        if(this.thoughts.length == 0)
        {
            // play dumb for a couple seconds
            Debug.log("No valid moves found, giving up on life");
            this.getLostInThought();
            return;
        }
    }

    getLostInThought = () =>
    {
        var waitLength = 90;
        for(var i = 0; i < waitLength; i++)
        {
            this.thoughts.push(SERVER_GAME_ENGINE.inputTypes.None);
        }
    }

    generateOpponentsMove = () =>
    {
        var opponentMoves = [
            SERVER_GAME_ENGINE.inputTypes.Swap,
            SERVER_GAME_ENGINE.inputTypes.None,
            SERVER_GAME_ENGINE.inputTypes.Up,
            SERVER_GAME_ENGINE.inputTypes.Down,
            SERVER_GAME_ENGINE.inputTypes.Down,
            SERVER_GAME_ENGINE.inputTypes.Left,
            SERVER_GAME_ENGINE.inputTypes.Right,
            //SERVER_GAME_ENGINE.inputTypes.Elevate
        ];
    }
}

class Potential 
{
    type: number;
    rows: Tile[][];

    constructor(type: number)
    {
        this.type = type;
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
        for(var i = 0; i < SERVER_GAME_ENGINE.rowCountInBounds; i++)
        {
            if(this.rows[i].length >= 3)
            {
                tilesToThinkAbout = [];
                tilesToThinkAbout.push(this.rows[i][0]);
                tilesToThinkAbout.push(this.rows[i][1]);
                tilesToThinkAbout.push(this.rows[i][2]);
                Debug.log(`solving. type: ${this.type}, in a row of 3.`);
                return this.solve(tilesToThinkAbout, cursor);
            }

            if(this.rows[i].length > 0)
            {
                tilesToThinkAbout.push(this.rows[i][0]);
                if(tilesToThinkAbout.length >= 3)
                {
                    Debug.log(`solving. type: ${this.type}, in a col of 3.`);
                    return this.solve(tilesToThinkAbout, cursor);
                }
            }
            else 
            {
                tilesToThinkAbout = [];
            }
        }

        return [];
    }

    solve = (tiles: Tile[], cursor: any) =>
    {
        // move each tile to the x-coordinate of the first tile
        var result = [];
        var destX = tiles[0].x;
        var currentX = cursor.x;
        var currentY = cursor.y;

        Debug.log(`TILE0:${tiles[0].x},${tiles[0].y} TILE1:${tiles[1].x},${tiles[1].y} TILE2:${tiles[2].x},${tiles[2].y}`);
        
        // solve tile 1
        var currentTile = tiles[1];
        if(currentTile.x < destX)
        {
            this.moveTo(currentX, currentY, currentTile.x, currentTile.y, result);
            currentX = currentTile.x;
            currentY = currentTile.y;
            this.swapTo(currentTile.x, destX, result);
            currentX = destX - 1;
        }
        else if(currentTile.x > destX)
        {
            this.moveTo(currentX, currentY, currentTile.x - 1, currentTile.y, result);
            currentX = currentTile.x - 1;
            currentY = currentTile.y;
            this.swapTo(currentTile.x, destX, result);
            currentX = destX + 1;
        }

        // solve tile 2
        var currentTile = tiles[2];
        if(currentTile.x < destX)
        {
            this.moveTo(currentX, currentY, currentTile.x, currentTile.y, result);
            currentX = currentTile.x;
            currentY = currentTile.y;
            this.swapTo(currentTile.x, destX, result);
            currentX = destX - 1;
        }
        else if(currentTile.x > destX)
        {
            this.moveTo(currentX, currentY, currentTile.x - 1, currentTile.y, result);
            currentX = currentTile.x - 1;
            currentY = currentTile.y;
            this.swapTo(currentTile.x, destX, result);
            currentX = destX + 1;
        }
        
        return result;
    }
    
    swapTo = (startX: number, endX: number, moves: number[]) =>
    {
        Debug.log(`swapTo sx ${startX}, endx ${endX}`);
        while(startX < endX - 1)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Swap);
            moves.push(SERVER_GAME_ENGINE.inputTypes.Right);
            startX++;
        }

        while(startX > endX + 1)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Swap);
            moves.push(SERVER_GAME_ENGINE.inputTypes.Left);
            startX--;
        }

        moves.push(SERVER_GAME_ENGINE.inputTypes.Swap);
    }

    moveTo = (startX: number, startY, endX: number, endY: number, moves: number[]) =>
    {
        Debug.log(`moveTo sx ${startX},${startY} end ${endX},${endY}`);
        while(startX < endX)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Right);
            startX++;
        }
        while(startX > endX)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Left);
            startX--;
        }
        while(startY < endY)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Up);
            startY++;
        }
        while(startY > endY)
        {
            moves.push(SERVER_GAME_ENGINE.inputTypes.Down);
            startY--;
        }
    }
}