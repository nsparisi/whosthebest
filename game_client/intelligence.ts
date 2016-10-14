/// <reference path="references.ts" />

interface AIPoint {x: number, y: number}

class AIThought
{
    static types = { 
        SWAP_TO: "SWAP_TO",
        WAIT: "WAIT",
        ELEVATE: "ELEVATE",
        WAIT_FOR_COMBO: "WAIT_FOR_COMBO",
        WAIT_FOR_CHAIN_CHANGE: "WAIT_FOR_CHAIN_CHANGE"
    }

    type: string;
    tile: Tile;
    swapToDestination: AIPoint;
    waitCount: number;
    elevateCount: number;
    elevateWaiting: boolean;
    chainCounter: number;

    static CreateSwapToThought(tile: Tile, destination: AIPoint)
    {
        var thought = new AIThought();
        thought.type = AIThought.types.SWAP_TO;
        thought.swapToDestination = destination;
        thought.tile = tile;
        return thought;
    }

    static CreateWaitThought(waitCount: number)
    {
        var thought = new AIThought();
        thought.type = AIThought.types.WAIT;
        thought.waitCount = waitCount;
        return thought;
    }

    static CreateElevateThought(elevateCount: number)
    {
        var thought = new AIThought();
        thought.type = AIThought.types.ELEVATE;
        thought.elevateCount = elevateCount;
        return thought;
    }

    static CreateWaitForChainToChangeThought(chainCounter: number)
    {
        var thought = new AIThought();
        thought.type = AIThought.types.WAIT_FOR_CHAIN_CHANGE;
        thought.chainCounter = chainCounter;
        return thought;
    }
}

class IntelligenceEngine
{
    board: Board;
    currentThought: AIThought;
    thoughts: AIThought[];
    potentials: Potential[];

    justSwapped = false;

    constructor(board: Board)
    {
        this.board = board;
        this.thoughts = [];
        this.potentials = [];
        
        for(var i = 0; i < SERVER_GAME_ENGINE.attackBlockTypeStartIndex; i++)
        {
            this.potentials.push(new Potential(i, board));
        }

        this.getLostInThought(30);
    }

    empty = () =>
    {
    
    }

    next = () =>
    {   
        // fill your head with thoughts
        this.think();

        // act on those thoughts
        var action =  this.act();

        // keep track of swap, so we can avoid getting trapped.
        this.justSwapped = action == SERVER_GAME_ENGINE.inputTypes.Swap;

        return action;
    }

    act = () =>
    {
        if (this.currentThought == null && this.thoughts.length > 0)
        {
            this.currentThought = this.thoughts.shift();
            Debug.log("ACT: new thought:: " + this.currentThought.type);
        }

        if(this.currentThought == null)
        {
            Debug.log("ACT: no thoughts....");
            return SERVER_GAME_ENGINE.inputTypes.None;
        }

        if(this.currentThought.type == AIThought.types.WAIT)
        {
            Debug.log("ACT: waiting " + this.currentThought.waitCount);
            this.currentThought.waitCount--;
            if(this.currentThought.waitCount <= 0)
            {
                this.currentThought = null;
            }

            return SERVER_GAME_ENGINE.inputTypes.None;
        }
        else if(this.currentThought.type == AIThought.types.ELEVATE)
        {
            Debug.log("ACT: this.board.fastElevate " + this.board.fastElevate);
            if( this.board.fastElevate == false)
            {
                if(this.currentThought.elevateCount > 0)
                {
                    Debug.log("ACT: elevate " + this.currentThought.elevateCount);
                    this.currentThought.elevateCount--;
                    return SERVER_GAME_ENGINE.inputTypes.Elevate;
                }
                else 
                {
                    this.currentThought = null;
                }
            }
        }
        else if(this.currentThought.type == AIThought.types.WAIT_FOR_CHAIN_CHANGE)
        {
            if( this.currentThought.chainCounter != this.board.globalChainCounter || 
                !this.board.stopBoardFromGrowing)
            {
                this.currentThought = null;
            }
            
            Debug.log("ACT: waiting for chain action");
            return SERVER_GAME_ENGINE.inputTypes.None;
        }
        else if(this.currentThought.type == AIThought.types.WAIT_FOR_COMBO)
        {
            if( this.currentThought.tile == null ||
                !this.currentThought.tile.isComboing)
            {
                Debug.log("ACT: waiting for combo ");
                this.currentThought = null;
            }
            
            return SERVER_GAME_ENGINE.inputTypes.None;
        }
        else if(this.currentThought.type == AIThought.types.SWAP_TO)
        {
            if( this.currentThought.tile != null && this.currentThought.tile.isSwapping)
            {
                return SERVER_GAME_ENGINE.inputTypes.None;
            }
            else if( this.currentThought.tile == null ||
                this.currentThought.tile.y != this.currentThought.swapToDestination.y ||
                this.currentThought.tile.canMove() == false ||
                this.currentThought.tile.isComboJustFinished ||
                this.currentThought.tile.x == this.currentThought.swapToDestination.x)
            {
                this.currentThought = null;
            }
            else
            {
                // move to destination
                var x = this.currentThought.tile.x; 
                var y = this.currentThought.tile.y;
                x = x < this.currentThought.swapToDestination.x ? x : x - 1;

                Debug.log(`ACT: swap cursor: ${this.board.cursor.x},${this.board.cursor.y} goal:${x},${y} tile:${this.currentThought.tile.x},${this.currentThought.tile.y} to: ${this.currentThought.swapToDestination.x},${this.currentThought.swapToDestination.y}`);

                if(this.board.cursor.x < x)
                {
                    return SERVER_GAME_ENGINE.inputTypes.Right;
                }
                else if(this.board.cursor.x > x)
                {
                    return SERVER_GAME_ENGINE.inputTypes.Left;
                }
                else if(this.board.cursor.y < y)
                {
                    return SERVER_GAME_ENGINE.inputTypes.Up;
                }
                else if(this.board.cursor.y > y)
                {
                    return SERVER_GAME_ENGINE.inputTypes.Down;
                }

                if(this.justSwapped)
                {
                    // somethings wrong, the tile won't swap!
                    Debug.log("ACT: woah, this block is busted!");
                    this.currentThought = null;
                    return SERVER_GAME_ENGINE.inputTypes.None;
                }

                // if cursor is lined up, swap
                return SERVER_GAME_ENGINE.inputTypes.Swap;
            }
        }

        return SERVER_GAME_ENGINE.inputTypes.None;
    }

    think = () =>
    {
        // follow current train of thought, don't overthink it
        if( this.currentThought != null ||
            this.thoughts.length > 0)
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

        this.thinkAboutChains();
        if(this.thoughts.length > 0)
        {
            Debug.log("Thinking about chains.");
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

        // make a combo happen
        this.thinkAboutCombos();
        if(this.thoughts.length > 0)
        {
            Debug.log("Thinking about combos.");
            return;
        }

        // organize the tiles
        this.thinkAboutFlattening();
        if(this.thoughts.length > 0)
        {
            Debug.log("Thinking about flattening.");
            return;
        }

        // nothing to think about... let's relax
        this.getLostInThought(2);
        Debug.log("Lost in thought");
    }

    thinkAboutChains = () =>
    {
        // check first if valid
        var isComboing = false;
        this.board.tiles.forEach((tile) =>
        {
            if(isComboing || (tile != null && tile.isComboing && !tile.isAttackBlock))
            {
                isComboing = true;
                return;
            }
        });

        if(!isComboing)
        {
            return;
        }

        // organize tiles into columns
        var combosInColumns: Tile[][] = [];
        var sourceYs: number[][] = [];
        var destinationYs: number[][] = [];
        for(var i = 0; i < this.board.boardSpaces[0].length; i++)
        {
            combosInColumns.push([]);
        }

        // populate the columns
        // they will be sorted bottom to top
        for(var y = 0; y < this.board.boardSpaces.length; y++)
        {
            for(var x = 0; x < this.board.boardSpaces[y].length; x++)
            {
                var tile = this.board.boardSpaces[y][x].getTile();
                if(tile != null && tile.isComboing && !tile.isAttackBlock)
                {
                    combosInColumns[tile.x].push(tile);
                }
            }
        }
        
        // map out where the tiles will fall to (their y's), once the combo drops
        for(var y = 0; y < this.board.boardSpaces.length; y++)
        {
            destinationYs.push([]);
            sourceYs.push([]);
            for(var x = 0; x < this.board.boardSpaces[y].length; x++)
            {
                destinationYs[y].push(y);
                sourceYs[y].push(y);

                var numberInColumn = combosInColumns[x].length;
                if(numberInColumn > 0 && combosInColumns[x][numberInColumn - 1].y < y)
                {
                    destinationYs[y][x] -= numberInColumn;
                }

                if(numberInColumn > 0 && combosInColumns[x][0].y <= y)
                {
                    sourceYs[y][x] += numberInColumn;
                }
            }
        }        

        // find columns adjacent to non-columns
        // determine "focus" points, hovering above combo
        var focusPoints: AIPoint[] = [];
        for(var i = 0; i < combosInColumns.length; i++)
        {
            // on the left,
            // noncombo | combo ...
            if( i > 0 &&
                combosInColumns[i - 1].length == 0 && 
                combosInColumns[i].length > 0)
            {
                // todo, add more targets
                var topTile = combosInColumns[i][combosInColumns[i].length - 1];
                focusPoints.push({x: topTile.x, y: topTile.y + 1});
            }

            // on the right
            // ... combo | noncombo
            else if( i < combosInColumns.length - 1 &&
                combosInColumns[i + 1].length == 0 && 
                combosInColumns[i].length > 0)
            {
                // todo, add more targets
                var topTile = combosInColumns[i][combosInColumns[i].length - 1];
                focusPoints.push({x: topTile.x, y: topTile.y + 1});
            }
        }

        function safeGet(arr: any[][], y: number, x: number)
        {
            if(y >= 0 && x >= 0 && y < arr.length && x < arr[y].length)
            {
                return arr[y][x];
            }

            return null;
        }

        // now evaluate each focus
        for(var i = 0; i < focusPoints.length; i++)
        {
            var focusPoint = focusPoints[i];
            var focusGoal: AIPoint = {
                x: focusPoint.x, 
                y: destinationYs[focusPoint.y][focusPoint.x]
            };
            
            Debug.log(`Focusing on ${focusPoint.x},${focusPoint.y} : ending at ${focusGoal.x},${focusGoal.y}`);

            // for each tile in the focus row
            var candidateTiles: Tile[] = [];
            for(var x = 0; x < this.board.boardSpaces[focusPoint.y].length; x++)
            {
                var tile = this.board.boardSpaces[focusPoint.y][x].getTile();
                if(tile != null && tile.canMove() && AIHelpers.canSwapTo(tile, focusPoint.x, this.board))
                {
                    //Debug.log(`candidate: ${tile.x},${tile.y}`);
                    candidateTiles.push(tile);
                }
            }

            var goalLeft: AIPoint = {x: focusGoal.x - 1, y: safeGet(sourceYs, focusGoal.y, focusGoal.x - 1)};
            var goalLeftLeft: AIPoint = {x: focusGoal.x - 2, y: safeGet(sourceYs, focusGoal.y, focusGoal.x - 2) };
            var goalRight: AIPoint = {x: focusGoal.x + 1, y: safeGet(sourceYs, focusGoal.y, focusGoal.x + 1) };
            var goalRightRight: AIPoint = {x: focusGoal.x + 2, y: safeGet(sourceYs, focusGoal.y, focusGoal.x + 2) };
            var goalUp: AIPoint = {x: focusGoal.x, y: safeGet(sourceYs, focusGoal.y + 1, focusGoal.x) };
            var goalDown: AIPoint = {x: focusGoal.x, y: safeGet(sourceYs, focusGoal.y - 1, focusGoal.x) };
            var goalDownDown: AIPoint = {x: focusGoal.x, y: safeGet(sourceYs, focusGoal.y - 2, focusGoal.x) };
            //Debug.log(`goalLeft: ${goalLeft.x},${goalLeft.y}`);
            //Debug.log(`goalLeftLeft: ${goalLeftLeft.x},${goalLeftLeft.y}`);
            //Debug.log(`goalRight: ${goalRight.x},${goalRight.y}`);
            //Debug.log(`goalRightRight: ${goalRightRight.x},${goalRightRight.y}`);
            //Debug.log(`goalUp: ${goalUp.x},${goalUp.y}`);
            //Debug.log(`goalDown: ${goalDown.x},${goalDown.y}`);
            //Debug.log(`goalDownDown: ${goalDownDown.x},${goalDownDown.y}`);

            function getValidTile(goal: AIPoint, candidate: Tile, board: Board, ignore: Tile[], reverseX: boolean = false)
            {
                if(goal.x == null || goal.y == null)
                {
                    return null;
                }

                // for each tile in the goal row
                var initX = reverseX ? board.boardSpaces[goal.y].length - 1 : 0;
                var endX = reverseX ? 0 : board.boardSpaces[goal.y].length - 1;
                var xDir = reverseX ? -1 : 1;

                for(var x = initX; x != endX; x += xDir)
                {
                    var tile = board.boardSpaces[goal.y][x].getTile();
                    if( tile != null && 
                        tile.type == candidate.type && 
                        tile.canMove() && 
                        ignore.indexOf(tile) == -1 &&
                        AIHelpers.canSwapTo(tile, goal.x, board))
                    {
                        return tile;
                    }
                }

                return null;
            }

            function matchThree(one: AIPoint, two: AIPoint, candidate: Tile, board: Board, reverseX: boolean = false)
            {
                var tileOne = getValidTile(one, candidate, board, [candidate], reverseX);
                if(tileOne == null)
                {
                    return null;
                }

                var tileTwo = getValidTile(two, candidate, board, [candidate, tileOne], reverseX);
                if(tileTwo == null)
                {
                    return null
                }

                return [tileOne, tileTwo];
            }

            function printTile(tile: Tile)
            {
                return tile == null ? "null" : `${tile.x},${tile.y}`
            }

            function printMatch(tile: Tile[])
            {
                return tile == null ? "null" : `${printTile(tile[0])} AND ${printTile(tile[1])} `
            }

            // TODO, for each candidate, look for a tile with the same type that can swap to each of the goals above.
            // avoid using the same tile for two calculations
            var cursor = {x: this.board.cursor.x, y: this.board.cursor.y};
            while(candidateTiles.length != 0)
            {
                var candidate = candidateTiles.shift();
                var topTileInCombo = combosInColumns[candidate.x][combosInColumns[candidate.x].length - 1];
                Debug.log("TESTING CANDIDATE: " + printTile(candidate));

                // scan from right to left for this particular match
                var leftAndLeftLeft = matchThree(goalLeft, goalLeftLeft, candidate, this.board, true);
                if(leftAndLeftLeft)
                {
                    Debug.log("leftAndLeftLeft: " + printMatch(leftAndLeftLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndLeftLeft[0], goalLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndLeftLeft[1], goalLeftLeft));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }

                var leftAndRight = matchThree(goalLeft, goalRight, candidate, this.board);
                if(leftAndRight)
                {
                    Debug.log("leftAndRight: " + printMatch(leftAndRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndRight[0], goalLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndRight[1], goalRight));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }

                var rightAndRightRight = matchThree(goalRight, goalRightRight, candidate, this.board);
                if(rightAndRightRight)
                {
                    Debug.log("rightAndRightRight: " + printMatch(rightAndRightRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(rightAndRightRight[0], goalRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(rightAndRightRight[1], goalRightRight));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }

                var upAndDown = matchThree(goalUp, goalDown, candidate, this.board);
                if(upAndDown)
                {
                    Debug.log("upAndDown: " + printMatch(upAndDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(upAndDown[0], goalUp));
                    this.thoughts.push(AIThought.CreateSwapToThought(upAndDown[1], goalDown));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }

                var downAndDownDown = matchThree(goalDown, goalDownDown, candidate, this.board);
                if(downAndDownDown)
                {
                    Debug.log("downAndDownDown: " + printMatch(downAndDownDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndDownDown[0], goalDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndDownDown[1], goalDownDown));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }
            }

            if(this.thoughts.length > 0)
            {
                break;
            }
        }      
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
            this.thoughts.push(AIThought.CreateWaitThought(1));
        }
    }

    thinkAboutFlattening = () =>
    {
        var minHole: AIPoint = {x: 100, y: 100};
        var maxTile: Tile = null;

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

                    if(maxTile == null || maxTile.y < y)
                    {
                        maxTile = tile;
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
            this.thoughts.push(AIThought.CreateSwapToThought(maxTile, {x: minHole.x, y: maxTile.y}));
        }
    }

    thinkAboutRaisingTiles = () =>
    {
        if(this.board.highestTileHeight < 6)
        {
            this.thoughts.push(AIThought.CreateElevateThought(3));
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
        AIHelpers.shuffleArray(this.potentials);
        for(var i = 0; i < this.potentials.length; i++)
        {
            this.thoughts = this.potentials[i].check(this.board.cursor);
            if(this.thoughts.length > 0)
            {
                //this.getLostInThought(30);
                return;
            }
        }
    }

    getLostInThought = (waitLength: number) =>
    {
        this.thoughts.push(AIThought.CreateWaitThought(waitLength));
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
        var moves: AIThought[] = [];
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

    solve = (tiles: Tile[], cursor: any, board: Board, moves: AIThought[]) =>
    {
        Debug.log(`TILE0:${tiles[0].x},${tiles[0].y} TILE1:${tiles[1].x},${tiles[1].y} TILE2:${tiles[2].x},${tiles[2].y}`);
        
        function possible(tileOne: Tile, tileTwo: Tile, destX: number)
        {
            if(!AIHelpers.canSwapTo(tileOne, destX, board))
            {
                //Debug.log(`can't swap to! ${tiles[1].x},${tiles[1].y} destx ${destX}`);
                return false;
            }
            
            if(!AIHelpers.canSwapTo(tileTwo, destX, board))
            {
                //Debug.log(`can't swap to! ${tiles[2].x},${tiles[2].y} destx ${destX}`);
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
            moves.push(AIThought.CreateSwapToThought(currentTile, {x: destX, y: currentTile.y}));
        });
    }
}

class AIHelpers 
{
    empty = () =>
    {

    }

    static shuffleArray = (array) =>
    {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    static moveToTileAndSwapTo = (cursor: AIPoint, tile: Tile, endX: number, moves: number[]) =>
    {
        if(tile.x < endX)
        {
            AIHelpers.moveTo(cursor, tile.x, tile.y, moves);
            AIHelpers.swapTo(cursor, endX, moves);
        }
        else if(tile.x > endX)
        {
            AIHelpers.moveTo(cursor, tile.x - 1, tile.y, moves);
            AIHelpers.swapTo(cursor, endX, moves);
        }
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
        if(tile == null || tile.y == 0 || tile.isAttackBlock || !tile.canMove())
        {
            return false;
        }

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