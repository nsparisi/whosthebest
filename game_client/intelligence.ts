/// <reference path="references.ts" />

interface AIPoint {x: number, y: number}

/**
 * A thought represents some sort of goal that the AI is trying to achieve. 
 * The AI will continue to think about a thought until the goal is finalized.
 * 
 * @class AIThought
 */
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

/**
 * Intelligence engine manages the AI for one board.
 * The AI will perform think() and act() each frame. 
 * 
 * think() produces new thoughts about what to do next.
 * act() will perform the associated actions for the current thought.
 * 
 * The AI will return the action to take for the current frame. Only one call is made per frame.
 * 
 * @class IntelligenceEngine
 */
class IntelligenceEngine
{
    name = "AI";
    board: Board;
    currentThought: AIThought;
    thoughts: AIThought[];

    justSwapped = false;
    pauseBetweenAcions = 2;

    constructor(name: string, board: Board)
    {
        this.name = name;
        this.board = board;
        this.thoughts = [];

        this.getLostInThought(30);
    }

    log = (message) =>
    {
        //Debug.log("[" + this.name +"]" + message);
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
        // always end a train of thought with a wait
        if( this.thoughts.length > 0 &&
            this.thoughts[this.thoughts.length - 1].type != AIThought.types.WAIT)
        {
            this.thoughts.push(AIThought.CreateWaitThought(this.pauseBetweenAcions));
        }

        if (this.currentThought == null && this.thoughts.length > 0)
        {
            this.currentThought = this.thoughts.shift();
            this.log("ACT: new thought:: " + this.currentThought.type);
        }

        if(this.currentThought == null)
        {
            this.log("ACT: no thoughts....");
            return SERVER_GAME_ENGINE.inputTypes.None;
        }

        if(this.currentThought.type == AIThought.types.WAIT)
        {
            this.log("ACT: waiting " + this.currentThought.waitCount);
            this.currentThought.waitCount--;
            if(this.currentThought.waitCount <= 0)
            {
                this.currentThought = null;
            }

            return SERVER_GAME_ENGINE.inputTypes.None;
        }
        else if(this.currentThought.type == AIThought.types.ELEVATE)
        {
            this.log("ACT: this.board.fastElevate " + this.board.fastElevate);
            if( this.board.fastElevate == false)
            {
                if(this.currentThought.elevateCount > 0)
                {
                    this.log("ACT: elevate " + this.currentThought.elevateCount);
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
            
            this.log("ACT: waiting for chain action");
            return SERVER_GAME_ENGINE.inputTypes.None;
        }
        else if(this.currentThought.type == AIThought.types.WAIT_FOR_COMBO)
        {
            if( this.currentThought.tile == null ||
                !this.currentThought.tile.isComboing)
            {
                this.log("ACT: waiting for combo ");
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

                this.log(`ACT: swap cursor: ${this.board.cursor.x},${this.board.cursor.y} goal:${x},${y} tile:${this.currentThought.tile.x},${this.currentThought.tile.y} to: ${this.currentThought.swapToDestination.x},${this.currentThought.swapToDestination.y}`);

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
                    this.log("ACT: woah, this block is busted!");
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
        // disabled for now.
        // this.thinkAboutSomethingInteresting();
        if(this.thoughts.length > 0)
        {
            //this.log("Thinking about something interesting.");
            return;
        }

        this.thinkAboutChains();
        if(this.thoughts.length > 0)
        {
            this.log("Thinking about chains.");
            return;
        }

        // prioritize adding more tiles if board is low
        this.thinkAboutRaisingTiles();
        if(this.thoughts.length > 0)
        {
            this.log("Thinking about raising tiles.");
            return;
        }

        // remove attack blocks (garbage blocks)
        this.thinkAboutDefending();
        if(this.thoughts.length > 0)
        {
            this.log("Thinking about defending.");
            return;
        }

        // organize the tiles
        this.thinkAboutFlattening();
        if(this.thoughts.length > 0)
        {
            this.log("Thinking about flattening.");
            return;
        }

        // make a combo happen
        this.thinkAboutCombos();
        if(this.thoughts.length > 0)
        {
            this.log("Thinking about combos.");
            return;
        }

        // nothing to think about... let's relax
        this.getLostInThought(2);
        this.log("Lost in thought");
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
        var sourceYs: number[][] = [];
        var destinationYs: number[][] = [];
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
            var topTile = null;

            // on the left,
            // noncombo | combo ...
            if( i > 0 &&
                combosInColumns[i - 1].length == 0 && 
                combosInColumns[i].length > 0)
            {
                topTile = combosInColumns[i][combosInColumns[i].length - 1];
            }

            // on the right
            // ... combo | noncombo
            else if( i < combosInColumns.length - 1 &&
                combosInColumns[i + 1].length == 0 && 
                combosInColumns[i].length > 0)
            {
                topTile = combosInColumns[i][combosInColumns[i].length - 1];
            }
            
            // add focus points
            // these are every Y coordinate above this top tile, while still in bounds
            if(topTile != null)
            {
                for(var currentY = topTile.y + 1; currentY < SERVER_GAME_ENGINE.rowCountInBounds - 1; currentY++)
                {
                    this.log(`PUSH FOCUS ${topTile.x},${currentY}`);
                    focusPoints.push({x: topTile.x, y: currentY});
                }
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
            
            this.log(`Focusing on ${focusPoint.x},${focusPoint.y} : ending at ${focusGoal.x},${focusGoal.y}`);

            // for each tile in the focus row
            var candidateTiles: Tile[] = [];
            for(var x = 0; x < this.board.boardSpaces[focusPoint.y].length; x++)
            {
                var tile = this.board.boardSpaces[focusPoint.y][x].getTile();
                if(tile != null && tile.canMove() && AIHelpers.canSwapTo(tile, focusPoint.x, this.board))
                {
                    //this.log(`candidate: ${tile.x},${tile.y}`);
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
            //this.log(`goalLeft: ${goalLeft.x},${goalLeft.y}`);
            //this.log(`goalLeftLeft: ${goalLeftLeft.x},${goalLeftLeft.y}`);
            //this.log(`goalRight: ${goalRight.x},${goalRight.y}`);
            //this.log(`goalRightRight: ${goalRightRight.x},${goalRightRight.y}`);
            //this.log(`goalUp: ${goalUp.x},${goalUp.y}`);
            //this.log(`goalDown: ${goalDown.x},${goalDown.y}`);
            //this.log(`goalDownDown: ${goalDownDown.x},${goalDownDown.y}`);

            // TODO, for each candidate, look for a tile with the same type that can swap to each of the goals above.
            // avoid using the same tile for two calculations
            var cursor = {x: this.board.cursor.x, y: this.board.cursor.y};
            while(candidateTiles.length != 0)
            {
                var candidate = candidateTiles.shift();
                var topTileInCombo = combosInColumns[candidate.x][combosInColumns[candidate.x].length - 1];
                this.log("TESTING CANDIDATE: " + AIHelpers.printTile(candidate));

                // scan from right to left for this particular match
                var leftAndLeftLeft = AIHelpers.matchThree(goalLeft, goalLeftLeft, candidate, this.board, true);
                if(leftAndLeftLeft)
                {
                    this.log("leftAndLeftLeft: " + AIHelpers.printMatch(leftAndLeftLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndLeftLeft[0], goalLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndLeftLeft[1], goalLeftLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndLeftLeft[0], goalLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }

                var leftAndRight = AIHelpers.matchThree(goalLeft, goalRight, candidate, this.board);
                if(leftAndRight)
                {
                    this.log("leftAndRight: " + AIHelpers.printMatch(leftAndRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndRight[0], goalLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndRight[1], goalRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(leftAndRight[0], goalLeft));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }

                var rightAndRightRight = AIHelpers.matchThree(goalRight, goalRightRight, candidate, this.board);
                if(rightAndRightRight)
                {
                    this.log("rightAndRightRight: " + AIHelpers.printMatch(rightAndRightRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(rightAndRightRight[0], goalRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(rightAndRightRight[1], goalRightRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(rightAndRightRight[0], goalRight));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }

                var upAndDown = AIHelpers.matchThree(goalUp, goalDown, candidate, this.board);
                if(upAndDown)
                {
                    this.log("upAndDown: " + AIHelpers.printMatch(upAndDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(upAndDown[0], goalUp));
                    this.thoughts.push(AIThought.CreateSwapToThought(upAndDown[1], goalDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(upAndDown[0], goalUp));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateWaitForChainToChangeThought(this.board.globalChainCounter));
                    break;
                }

                var downAndDownDown = AIHelpers.matchThree(goalDown, goalDownDown, candidate, this.board);
                if(downAndDownDown)
                {
                    this.log("downAndDownDown: " + AIHelpers.printMatch(downAndDownDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndDownDown[0], goalDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndDownDown[1], goalDownDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndDownDown[0], goalDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(candidate, focusPoint));
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
        for(var y = 2; y < this.board.boardSpaces.length; y++)
        {
            for(var x = 0; x < this.board.boardSpaces[y].length; x++)
            {
                var candidate = this.board.boardSpaces[y][x].getTile();
                if(candidate == null || candidate.isAttackBlock || !candidate.canMove())
                {
                    continue;
                }

                // this.log(`flatten candidate: ${AIHelpers.printTile(candidate)}`);
                for(var xx = 0; xx < this.board.boardSpaces[y].length; xx++)
                {
                    var belowTile = this.board.getTileAtSpace(xx, y - 1);
                    if(belowTile != null)
                    {
                        continue;
                    }

                    // found an empty space below me, can I swap to it?
                    // this.log(`flatten hole ${xx},${y-1}`);
                    if(AIHelpers.canSwapTo(candidate, xx, this.board, true))
                    {
                        this.log(`FLATTEN: tile ${candidate.x},${candidate.y} hole ${xx},${y-1}`);
                        this.thoughts.push(AIThought.CreateSwapToThought(candidate, {x: xx, y: candidate.y}));
                        return;
                    }
                }
            }
        }
    }

    thinkAboutRaisingTiles = () =>
    {
        // never elevate if attacks are coming
        if(this.board.attackBlocksInWait.length > 0)
        {
            return;
        }

        // elevate if we're low
        if(this.board.highestTileHeight < 6)
        {
            this.thoughts.push(AIThought.CreateElevateThought(3));
            return;
        }

        // elevate if there's not enough tiles. i.e. if there are attacks
        // sitting on top of a few amount of tiles.
        var tileCount = 0;
        this.board.tiles.forEach((tile) =>
        {
            if(tile && !tile.isAttackBlock)
            {
                tileCount++;
            }
        });

        if(tileCount <= 21 && 
            this.board.highestTileHeight < SERVER_GAME_ENGINE.rowCountInBounds - 1)
        {
            this.thoughts.push(AIThought.CreateElevateThought(1));
            return;
        }
    }

    thinkAboutCombos = () =>
    {
        // randomly change behavior of AI
        // this is so two AIs act differently
        var isReverse = Math.floor((Math.random() * 2)) == 0;
        var startY = isReverse ? 1 : this.board.boardSpaces.length - 1;
        var endY = isReverse ? this.board.boardSpaces.length - 1 : 1;
        var dirY = isReverse ? 1 : -1;

        for(var y = startY; y != endY; y += dirY)
        {
            for(var x = 0; x < this.board.boardSpaces[y].length; x++)
            {
                var candidate = this.board.boardSpaces[y][x].getTile();
                if(candidate == null || candidate.isAttackBlock || !candidate.canMove())
                {
                    continue;
                }

                var goalCandidate = {x: x, y: y};
                var goalDown = {x: x, y: y - 1};
                var goalDownDown = {x: x, y: y - 2};
                var goalUp = {x: x, y: y + 1};
                var goalUpUp = {x: x, y: y + 2};

                // for combos within a row, we set the destination to the candidate itself.
                var anyInRow = AIHelpers.matchThree(goalCandidate, goalCandidate, candidate, this.board);
                if(anyInRow != null)
                {
                    this.log("anyInRow: " + AIHelpers.printMatch(anyInRow));
                    this.thoughts.push(AIThought.CreateSwapToThought(anyInRow[0], goalCandidate));
                    this.thoughts.push(AIThought.CreateSwapToThought(anyInRow[1], goalCandidate));
                    return;
                }

                var downAndDownDown = AIHelpers.matchThree(goalDown, goalDownDown, candidate, this.board);
                if(downAndDownDown != null)
                {
                    this.log("downAndDownDown: " + AIHelpers.printMatch(downAndDownDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndDownDown[0], goalDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndDownDown[1], goalDownDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndDownDown[0], goalDown));
                    return;
                }
                
                var downAndUp = AIHelpers.matchThree(goalDown, goalUp, candidate, this.board);
                if(downAndUp != null)
                {
                    this.log("downAndUp: " + AIHelpers.printMatch(downAndUp));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndUp[0], goalDown));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndUp[1], goalUp));
                    this.thoughts.push(AIThought.CreateSwapToThought(downAndUp[0], goalDown));
                    return;
                }
                
                var upAndUpUp = AIHelpers.matchThree(goalUp, goalUpUp, candidate, this.board);
                if(upAndUpUp)
                {
                    this.log("upAndUpUp: " + AIHelpers.printMatch(upAndUpUp));
                    this.thoughts.push(AIThought.CreateSwapToThought(upAndUpUp[0], goalUp));
                    this.thoughts.push(AIThought.CreateSwapToThought(upAndUpUp[1], goalUpUp));
                    this.thoughts.push(AIThought.CreateSwapToThought(upAndUpUp[0], goalUp));
                    return;
                }
            }
        }
    }

    getLostInThought = (waitLength: number) =>
    {
        this.thoughts.push(AIThought.CreateWaitThought(waitLength));
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
    
    static canSwapTo = (tile: Tile, endX: number, board: Board, ignoreHole: boolean = false) =>
    {
        if(tile == null || tile.y == 0 || tile.isAttackBlock || !tile.canMove())
        {
            return false;
        }

        var y = tile.y;
        var x = tile.x;
        var direction = endX < tile.x ? -1 : 1;

        function makeChecks(direction: number, ignoreCombo: boolean, ignoreHole: boolean)
        {
            // check for unswappable neighbor
            var tileMiddle = board.getTileAtSpace(x + direction, y);
            if(tileMiddle != null && (!tileMiddle.canMove() || tileMiddle.isAttackBlock))
            {
                return false;
            }

            // check for a hole in the ground
            var tileBelow = board.getTileAtSpace(x + direction, y - 1);
            if(tileBelow == null && !ignoreHole)
            {
                return false;
            }

            // we need to ignore the combo trap check in the final case
            if(ignoreCombo)
            {
                return true;
            }

            // check for a combo trap
            var tileAbove = board.getTileAtSpace(x + direction, y + 1);
            var tileAboveAbove = board.getTileAtSpace(x + direction, y + 2);
            var tileBelowBelow = board.getTileAtSpace(x + direction, y - 2);
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
            if(!makeChecks(direction, ignoreCombo, ignoreHole))
            {
                return false;
            }

            x += direction;
        }

        return true;
    }
    
    // ***********************
    static matchThree = (one: AIPoint, two: AIPoint, candidate: Tile, board: Board, reverseX: boolean = false) =>
    {
        var tileOne = AIHelpers.getValidTile(one, candidate, board, [candidate], reverseX);
        if(tileOne == null)
        {
            return null;
        }

        var tileTwo = AIHelpers.getValidTile(two, candidate, board, [candidate, tileOne], reverseX);
        if(tileTwo == null)
        {
            return null
        }

        return [tileOne, tileTwo];
    }

    static getValidTile = (goal: AIPoint, candidate: Tile, board: Board, ignore: Tile[], reverseX: boolean = false) =>
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

    static printTile = (tile: Tile) =>
    {
        return tile == null ? "null" : `${tile.x},${tile.y}`
    }

    static printMatch = (tile: Tile[]) =>
    {
        return tile == null ? "null" : `${AIHelpers.printTile(tile[0])} AND ${AIHelpers.printTile(tile[1])} `
    }
}