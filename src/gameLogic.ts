type Board = string[][];
type Box = string[][];
interface BoardDelta {
    row: number;
    col: number;
    color: string; // the color of each cell and if the cell is empty, its value is ''
}

interface IState {
    board: Board;
    delta: BoardDelta[]; //because we have 3 boxes to put everytime, so the delta is an array, used for check test
    currentScores: number[]; //becase we need to decide which player's score is the highest
    currentTurn: number; // it's used to decide if the game is in the final turn
    preparedBox: Box;
}

// it's a temporary datestruce just used for compute the score, not important
interface ScoreAndChangedBoard {
    board: Board;
    score: number;
}

module gameLogic {
    export const ROWS = 8;
    export const COLS = 8;
    export const PLAYERNUM = 2
    export const TOTALTURNS = 11;
    export const COLORNUM = 4;

    /** Returns the initial Matching board, which is a ROWSxCOLS matrix containing 7 different color blocks */
    function getInitialBoard(): Board {
        let board: Board = [];
        for (let i = 0; i < ROWS; i++) {
            board[i] = [];
            for (let j = 0; j < COLS; j++) {
                board[i][j] = '';
            }
        }
        //getInitialRandomCell(board);
        board[3][3] = 'G';
        board[3][4] = 'Y';
        board[4][3] = 'B';
        board[4][4] = 'R';
        // LATER: in order to pass the test, we should first decide the original 4 cells
        // board[3][3] = getRandomColor();
        // board[3][4] = getRandomColor();
        // board[4][3] = getRandomColor();
        // board[4][4] = getRandomColor();
        // Note: can add the *2 *3 function and the star here
        return board;
    }

    //Note: not used; initialize the first 4 cells, just for automatically initialize the board
    function getInitialRandomCell(board: Board): Board {
        let cell = 0;
        while(cell < 4) {
            let resRow = Math.floor((Math.random() * ROWS) + 1);
            let resCol = Math.floor((Math.random() * COLS) + 1);
            if (board[resRow][resCol] === '') {
                board[resRow][resCol] = getRandomColor();
            } else {
                continue;
            }
        }
        return board;
    }

    // generate the random color of each cell
    function getRandomColor(): string {
        let color = Math.floor((Math.random() * COLORNUM) + 1);
        switch (color) {
            case 1:
                return 'R'; // short for red
            case 2:
                return 'G'; // short for green
            case 3:
                return 'B'; // short for blue
            case 4:
                return 'Y'; // short for yellow
            default:
                break;
        }
    }

    export function getInitialState(): IState {
        log.log("this is getInitialState");
        return {board: getInitialBoard(), delta: [], currentScores: getInitialScores(), currentTurn: 0, preparedBox: generatePreparedBox()};
    }

    export function getInitialScores(): number[] {
        let scores: number[] = [];
        for (let i = 0; i < PLAYERNUM; i++) {
            scores[i] = 0;
        }
        return scores;
    }

    /**
     * Return true if the game ended in a tie because there are no three related
     * horizontal and vertical empty cells to put in the prepare cells;
     * E.g., isTie returns true for the following board:
     * [['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
     *  ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R'],
     *  ['B', 'R', 'G', 'B', 'R', 'G', 'R', 'G'],
     *  ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
     *  ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R'],
     *  ['B', 'R', 'G', 'B', 'R', 'G', 'R', 'G'],
     *  ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
     *  ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']]
     * E.g., isTie returns true for the following board:
     * [['R', 'G', 'B', 'R', 'G', 'B', ' ', ' '],
     *  ['G', 'B', 'R', 'G', 'B', 'R', 'G', ' '],
     *  ['B', 'R', 'G', 'B', 'R', 'G', 'R', 'G'],
     *  ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
     *  ['G', 'B', 'R', 'G', 'B', 'R', 'G', ' '],
     *  ['B', 'R', 'G', 'B', 'R', 'G', 'R', ' '],
     *  ['R', 'G', 'B', 'R', 'G', 'B', ' ', 'G'],
     *  ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']]
     */

    // Note: TODO: Debby
    // to judge whether this board has enough space to put 3 prepared box(I mean 9 cells)
    // not just 9 non-connected empty cells
    // Suggestion: you can use DFS to do it,
    // recursion may cause memory proplem
    //
    // returns true if there is not enough space to put the 3 boxes, false otherwise
    function isTie(board: Board): boolean {
        let after_board: Board = [];
        let numEmpty = 0;

        for (let i = 0; i < board.length; i++) {
            after_board[i] = [];
            for (let j = 0; j < board[i].length; j++) {  
                after_board[i][j] = board[i][j];                                            
                if (board[i][j] ===""){
                    numEmpty++
                }
            }
        }
        //   check if there are at least 9 empty cells on the board
        //   regardless of there relative position to each other
        if (numEmpty < 9) {
            log.log("numEmply < 9 ")
            return true; //not enough
        }
        if(checkBoardAvailable(after_board, 0)){
            return false; //ok for all 3 boxes to be placed on board
        }

        return true;
    }

    function checkBoardAvailable(board: Board, numPlaced: number):boolean{       
        if (numPlaced === 3){
            //log.log("numPlaced === 3")
            return true
        }
        for(let i = 0; i < board.length; i++){
            for(let j=0; j < board[i].length; j++){
                if(checkCanPlace(board, i, j)){
                    //log.log("can place in "+ i + " , " + j)
                    numPlaced+=1
                    if(checkBoardAvailable(board, numPlaced)){
                        return true;
                    }
                }
            }
        }
        return false;
    }

/**
* if row > board.length-2 : only check right
* if col > board.length-2 : only check down
* if row > board.length-2 && col > board.length-2, return false,
*    bracuase at this point the last 4 tiles are already checked
*/

    export function checkCanPlace(board:Board, row:number, col:number): boolean{
        if (board[row][col]===""){            
            if(row >= board.length-2 && col >= board.length-2){          
                return false;
            }
            if(row < board.length-2){
                if(board[row+1][col]==="" && board[row+2][col]===""){
                    board[row][col] = "X";
                    board[row+1][col] = "X";
                    board[row+2][col] = "X";
                    return true
                }
            }
            if(col < board.length-2){
                if(board[row][col+1]==="" && board[row][col+2]===""){
                    board[row][col] = "X";                    
                    board[row][col+1] = "X";
                    board[row][col+2] = "X";
                    return true
                }
            }
        }
        return false;
    }

    /**
     * Return the winner (either 0, 1 ,2...) or '' if there is no winner (because they have the same score);
     * getWinner will return the player with the highest score at the final turn or when there is a tie state;
     */
    // Note: if this is the final turn?
    function getWinner(state: IState): string {
        // if the game is in a tie state, it means the end of the game
        if (isTie(state.board)) {
            return getHighestScore(state.currentScores).toString();
        }

        // if the game is in its final turn, it means the end of the game
        if (state.currentTurn === TOTALTURNS) {
            return getHighestScore(state.currentScores).toString();
        }

        // otherwise, there is not yet winner
        return '';
    }

    // Helper Function: to return the highest score when the game is done
    function getHighestScore(scores: number[]): number {
        let highest = -1;
        let index = -1;
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] > highest) {
                highest = scores[i];
                index = i;
            }
        }
        return index;
    }

    /**
     * When there is a try to move the prepared cells into the board,
     * use this function to judge whether it is legal to move or not
     * if so, use this function to do the move operation.
     */

    export function createMove(
        stateBeforeMove: IState, moves: BoardDelta[], turnIndexBeforeMove: number): IMove {
        // if it's the state before initialization, just initialize the state
        if (!stateBeforeMove) {
            stateBeforeMove = getInitialState();
        }

        let board: Board = stateBeforeMove.board;
        // to guarantee the cell to put in is empty
        for (let i = 0; i < moves.length; i++) {
            if (board[moves[i].row][moves[i].col] !== '') {
                throw new Error("One can only make a move in an empty position!");
            }
        }
        // to guarantee the state to be put in has legal empty space

        if (getWinner(stateBeforeMove) !== '' || isTie(board)) {
            throw new Error("Can only make a move if the game is not over!");
        }

        // Do the move operation, and change the state of the game
        // Note: if the game has many players, the turn index should be changed
        let currentTurnIndex = getCurrentTurnIndex(turnIndexBeforeMove);
        let stateAfterMove = getTheStateAfterMove(stateBeforeMove, moves, currentTurnIndex);

        let winner = getWinner(stateAfterMove);
        let endMatchScores: number[];
        let turnIndexAfterMove: number;
        // Note(very important): need to consider if there are two players who have the equal scores
        if (winner !== '' || isTie(stateAfterMove.board)) {
            // Game over.
            turnIndexAfterMove = -1;
            endMatchScores = stateAfterMove.currentScores;
        } else {
            // Game continues. Now it's the opponent's turn (the turn switches to next player).
            turnIndexAfterMove = currentTurnIndex;
            endMatchScores = stateAfterMove.currentScores;
        }
        log.log("this is create move");
        return {endMatchScores: endMatchScores, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove};
    }

    // Helper Function: Since there maybe many players, so we need to decide who is the next player
    function getCurrentTurnIndex(turnIndexBeforeMove: number): number {
        let currentTurnIndex = 0;
        if (turnIndexBeforeMove === PLAYERNUM - 1) {
            currentTurnIndex = 0;
        } else {
            currentTurnIndex = turnIndexBeforeMove + 1;
        }
        return currentTurnIndex;
    }

    function getTheStateAfterMove(stateBeforeMove: IState, moves: BoardDelta[], currentTurnIndex: number): IState {
        let stateAfterMove = angular.copy(stateBeforeMove);
        for (let i = 0; i < moves.length; i++) {
            stateAfterMove.board[moves[i].row][moves[i].col] = moves[i].color;
        }
        stateAfterMove.currentTurn = stateBeforeMove.currentTurn + 1;
        stateAfterMove.delta = angular.copy(moves);
        // compute the score and change the board
        let res = computeCurrentTurnScore(stateAfterMove.board);
        stateAfterMove.currentScores[currentTurnIndex] = res.score;
        stateAfterMove.board = res.board;

        return stateAfterMove;
    }

    // Helper Funtion: to compute the score of the current turn
    // Note: if it doesn't work, can change the length of board to 8
    function computeCurrentTurnScore(board: Board): ScoreAndChangedBoard{
        // initialize the boundary of the board in order to compute score easily
        // so we need not to consider the boundary condition of the board
        let boardWithBoundary: Board = [];
        let currentTurnScore = 0;
        for (let i = 0; i < ROWS+2; i++) {
            boardWithBoundary[i] = [];
            for (let j = 0; j < COLS+2; j++) {
                boardWithBoundary[i][j] = '';
            }
        }

        // copy board to boardWithBoundary
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                boardWithBoundary[i+1][j+1] = board[i][j];
            }
        }

        // compute the score for this turn
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (boardWithBoundary[i+1][j+1] !== '') {
                    let res = computeScoreBFS(boardWithBoundary,{row: i+1, col: j+1, color: boardWithBoundary[i+1][j+1]});
                    boardWithBoundary = res.board;
                    currentTurnScore += res.score;
                }
            }
        }

        // clear the color in the original board
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board.length; j++) {
                board[i][j] = boardWithBoundary[i+1][j+1];
            }
        }
        return {board: board, score: currentTurnScore};
    }

    // Helper Funtion: to compute the score of the board by Breadth-First-Search
    function computeScoreBFS(board: Board, pos: BoardDelta): ScoreAndChangedBoard {
        let connectedCells: BoardDelta[] = [];
        let cellsToBeCleared: BoardDelta[] = [];
        let visited: BoardDelta[] = [];
        let movement = [[0,1],[0,-1],[-1,0],[1,0]];

        let score = 0;
        let color = pos.color;

        log.log("========================row: " + pos.row + ", col: " + pos.col + ", color: " + pos.color);
        connectedCells.push(pos);
        visited.push(pos);
        while(connectedCells.length !== 0) {
            let temp = connectedCells.shift();
            cellsToBeCleared.push(temp);
            let row = temp.row;
            let col = temp.col;

            // find all the connected cells depending on this one
            for (let i = 0; i < movement.length; i++) {
                let newRow = row + movement[i][0];
                let newCol = col + movement[i][1];
                let newPoint = {row: newRow, col: newCol, color: color};
                if (board[newRow][newCol] === color && !contains(visited, newPoint)) {
                    connectedCells.push(newPoint);
                    visited.push(newPoint);
                }
            }
        }

        if (cellsToBeCleared.length >= 3) {
            score = cellsToBeCleared.length;
            for (let i = 0; i < cellsToBeCleared.length; i++) {
                // clear the color of the current cell, make the cell empty
                board[cellsToBeCleared[i].row][cellsToBeCleared[i].col] = '';
            }
        }
        return {board: board, score: score};
    }
    // Helper Function: to judge whether the array contains the element
    function contains(arr: BoardDelta[], e: BoardDelta): boolean {
        for(let i = 0; i < arr.length; i++) {
            if (arr[i].row === e.row && arr[i].col === e.col && arr[i].color === e.color ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate the initial move, no player make a real move on the board
     */
    export function createInitialMove(): IMove {
        return {endMatchScores: null, turnIndexAfterMove: 0, stateAfterMove: getInitialState()};
    }

    /**
     * Just for test, to judge whether the move the player do meet the expection or not
     */
    export function checkMoveOk(stateTransition: IStateTransition): void {
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that the move is OK.
        let turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
        let stateBeforeMove = stateTransition.stateBeforeMove;
        let move: IMove = stateTransition.move;

        // to test the initial case
        if (!stateBeforeMove && turnIndexBeforeMove === 0 &&
            angular.equals(createInitialMove(), move)) {
                return;
        }

        // to test the regular case
        let deltaValue: BoardDelta[] = move.stateAfterMove.delta;
        let expectedMove = createMove(stateBeforeMove, deltaValue, turnIndexBeforeMove);
        if (!angular.equals(move, expectedMove)) {
            throw new Error("Expected move=" + angular.toJson(expectedMove, true) +
                ", but got stateTransition=" + angular.toJson(stateTransition, true));
        }
    }

    /**
     * Just for test, to call the checkMoveOk function
     */
    export function forSimpleTestHtml() {
        var move = gameLogic.createMove(null, [{row: 0, col: 0, color: 'R'}, {row: 1, col: 1, color: 'B'}], 0);
        log.log("move= ", move);
        var params: IStateTransition = {
            turnIndexBeforeMove: 0,
            stateBeforeMove: null,
            move: move,
            numberOfPlayers: 2
        };
        gameLogic.checkMoveOk(params);
        let temp_board: Board =
        // [['R', 'G', 'B', '', 'G', 'B', 'R', 'G'],
        // ['G', 'B', 'R', 'G', '', 'R', 'G', 'R'],
        // ['B', 'R', '', '', 'R', 'G', 'R', 'G'],
        // ['R', 'G', 'B', 'R', 'G', '', 'R', 'G'],
        // ['G', 'B', '', 'G', 'B', 'R', '', 'R'],
        // ['B', '', 'G', 'B', 'R', 'G', 'R', ''],
        // ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
        // ['', 'B', 'R', 'G', 'B', 'R', 'G', 'R']];

      [['R', 'G', 'B', 'R', 'G', '', '', ''],
       ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
       ['', 'R', '', '', '', 'G', 'R', 'G'],
       ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
       ['', 'B', '', 'G', 'B', 'R', 'G', ''],
       ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
       ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
       ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']];
        // [['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','','']];

        log.log(isTie(temp_board));
    }


    // Note: not sure, need to generate the 9 cells for the game
    /**
     * Generate the 3 prepared box for the player, one time just generate one box containing 3 cells
     */
    export function generatePreparedBox(): Box {
        let box: Box = [];
        for (let i = 0; i < 3; i++) {
            box[i] = [];
            for (let j = 0; j < 3; j++) {
                box[i][j] = 'G';
            }  
        }
        //log.log("this is generatePreparedBox");
        return box;
    }



    //TODO: Add the community function to make two group of people can play the same game
    // use proposal and majority

    // delta in board is useless, just for test====> keep it
    // turnIndexAfterMove = -1 is useless, just for test ====> keep it
    // the whole IMove datastructure is just for test =====> keep it
    // endMatchScores, don't know the use ====>????
    // angular.copy, if it's deep copy, need to know ===???
    // the parameter in typescript function is passed by value or inference, need to know
    // ===> ???, we need to test the score function very carefully
}
