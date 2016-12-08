var gameLogic;
(function (gameLogic) {
    gameLogic.ROWS = 8;
    gameLogic.COLS = 8;
    gameLogic.PLAYERNUM = 2;
    gameLogic.TOTALTURNS = 11;
    gameLogic.COLORNUM = 4;
    /** Returns the initial Matching board, which is a ROWSxCOLS matrix containing 7 different color blocks */
    function getInitialBoard() {
        var board = [];
        for (var i = 0; i < gameLogic.ROWS; i++) {
            board[i] = [];
            for (var j = 0; j < gameLogic.COLS; j++) {
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
    function getInitialRandomCell(board) {
        var cell = 0;
        while (cell < 4) {
            var resRow = Math.floor((Math.random() * gameLogic.ROWS) + 1);
            var resCol = Math.floor((Math.random() * gameLogic.COLS) + 1);
            if (board[resRow][resCol] === '') {
                board[resRow][resCol] = getRandomColor();
            }
            else {
                continue;
            }
        }
        return board;
    }
    // generate the random color of each cell
    function getRandomColor() {
        var color = Math.floor((Math.random() * gameLogic.COLORNUM) + 1);
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
    function getInitialState() {
        log.log("this is getInitialState");
        return { board: getInitialBoard(), delta: [], currentScores: getInitialScores(), currentTurn: 0, preparedBox: generatePreparedBox() };
    }
    gameLogic.getInitialState = getInitialState;
    function getInitialScores() {
        var scores = [];
        for (var i = 0; i < gameLogic.PLAYERNUM; i++) {
            scores[i] = 0;
        }
        return scores;
    }
    gameLogic.getInitialScores = getInitialScores;
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
    function isTie(board) {
        var after_board = [];
        var numEmpty = 0;
        for (var i = 0; i < board.length; i++) {
            after_board[i] = [];
            for (var j = 0; j < board[i].length; j++) {
                after_board[i][j] = board[i][j];
                if (board[i][j] === "") {
                    numEmpty++;
                }
            }
        }
        //   check if there are at least 9 empty cells on the board
        //   regardless of there relative position to each other
        if (numEmpty < 9) {
            log.log("numEmply < 9 ");
            return true; //not enough
        }
        if (checkBoardAvailable(after_board, 0)) {
            return false; //ok for all 3 boxes to be placed on board
        }
        return true;
    }
    function checkBoardAvailable(board, numPlaced) {
        if (numPlaced === 3) {
            //log.log("numPlaced === 3")
            return true;
        }
        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board[i].length; j++) {
                if (checkCanPlace(board, i, j)) {
                    //log.log("can place in "+ i + " , " + j)
                    numPlaced += 1;
                    if (checkBoardAvailable(board, numPlaced)) {
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
    function checkCanPlace(board, row, col) {
        if (board[row][col] === "") {
            if (row >= board.length - 2 && col >= board.length - 2) {
                return false;
            }
            if (row < board.length - 2) {
                if (board[row + 1][col] === "" && board[row + 2][col] === "") {
                    board[row][col] = "X";
                    board[row + 1][col] = "X";
                    board[row + 2][col] = "X";
                    return true;
                }
            }
            if (col < board.length - 2) {
                if (board[row][col + 1] === "" && board[row][col + 2] === "") {
                    board[row][col] = "X";
                    board[row][col + 1] = "X";
                    board[row][col + 2] = "X";
                    return true;
                }
            }
        }
        return false;
    }
    gameLogic.checkCanPlace = checkCanPlace;
    /**
     * Return the winner (either 0, 1 ,2...) or '' if there is no winner (because they have the same score);
     * getWinner will return the player with the highest score at the final turn or when there is a tie state;
     */
    // Note: if this is the final turn?
    function getWinner(state) {
        // if the game is in a tie state, it means the end of the game
        if (isTie(state.board)) {
            return getHighestScore(state.currentScores).toString();
        }
        // if the game is in its final turn, it means the end of the game
        if (state.currentTurn === gameLogic.TOTALTURNS) {
            return getHighestScore(state.currentScores).toString();
        }
        // otherwise, there is not yet winner
        return '';
    }
    // Helper Function: to return the highest score when the game is done
    function getHighestScore(scores) {
        var highest = -1;
        var index = -1;
        for (var i = 0; i < scores.length; i++) {
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
    function createMove(stateBeforeMove, moves, turnIndexBeforeMove) {
        // if it's the state before initialization, just initialize the state
        if (!stateBeforeMove) {
            stateBeforeMove = getInitialState();
        }
        var board = stateBeforeMove.board;
        // to guarantee the cell to put in is empty
        for (var i = 0; i < moves.length; i++) {
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
        var currentTurnIndex = getCurrentTurnIndex(turnIndexBeforeMove);
        var stateAfterMove = getTheStateAfterMove(stateBeforeMove, moves, currentTurnIndex);
        var winner = getWinner(stateAfterMove);
        var endMatchScores;
        var turnIndexAfterMove;
        // Note(very important): need to consider if there are two players who have the equal scores
        if (winner !== '' || isTie(stateAfterMove.board)) {
            // Game over.
            turnIndexAfterMove = -1;
            endMatchScores = stateAfterMove.currentScores;
        }
        else {
            // Game continues. Now it's the opponent's turn (the turn switches to next player).
            turnIndexAfterMove = currentTurnIndex;
            endMatchScores = stateAfterMove.currentScores;
        }
        log.log("this is create move");
        return { endMatchScores: endMatchScores, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove };
    }
    gameLogic.createMove = createMove;
    // Helper Function: Since there maybe many players, so we need to decide who is the next player
    function getCurrentTurnIndex(turnIndexBeforeMove) {
        var currentTurnIndex = 0;
        if (turnIndexBeforeMove === gameLogic.PLAYERNUM - 1) {
            currentTurnIndex = 0;
        }
        else {
            currentTurnIndex = turnIndexBeforeMove + 1;
        }
        return currentTurnIndex;
    }
    function getTheStateAfterMove(stateBeforeMove, moves, currentTurnIndex) {
        var stateAfterMove = angular.copy(stateBeforeMove);
        for (var i = 0; i < moves.length; i++) {
            stateAfterMove.board[moves[i].row][moves[i].col] = moves[i].color;
        }
        stateAfterMove.currentTurn = stateBeforeMove.currentTurn + 1;
        stateAfterMove.delta = angular.copy(moves);
        // compute the score and change the board
        var res = computeCurrentTurnScore(stateAfterMove.board);
        stateAfterMove.currentScores[currentTurnIndex] = res.score;
        stateAfterMove.board = res.board;
        return stateAfterMove;
    }
    // Helper Funtion: to compute the score of the current turn
    // Note: if it doesn't work, can change the length of board to 8
    function computeCurrentTurnScore(board) {
        // initialize the boundary of the board in order to compute score easily
        // so we need not to consider the boundary condition of the board
        var boardWithBoundary = [];
        var currentTurnScore = 0;
        for (var i = 0; i < gameLogic.ROWS + 2; i++) {
            boardWithBoundary[i] = [];
            for (var j = 0; j < gameLogic.COLS + 2; j++) {
                boardWithBoundary[i][j] = '';
            }
        }
        // copy board to boardWithBoundary
        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board[i].length; j++) {
                boardWithBoundary[i + 1][j + 1] = board[i][j];
            }
        }
        // compute the score for this turn
        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board[i].length; j++) {
                if (boardWithBoundary[i + 1][j + 1] !== '') {
                    var res = computeScoreBFS(boardWithBoundary, { row: i + 1, col: j + 1, color: boardWithBoundary[i + 1][j + 1] });
                    boardWithBoundary = res.board;
                    currentTurnScore += res.score;
                }
            }
        }
        // clear the color in the original board
        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board.length; j++) {
                board[i][j] = boardWithBoundary[i + 1][j + 1];
            }
        }
        return { board: board, score: currentTurnScore };
    }
    // Helper Funtion: to compute the score of the board by Breadth-First-Search
    function computeScoreBFS(board, pos) {
        var connectedCells = [];
        var cellsToBeCleared = [];
        var visited = [];
        var movement = [[0, 1], [0, -1], [-1, 0], [1, 0]];
        var score = 0;
        var color = pos.color;
        log.log("========================row: " + pos.row + ", col: " + pos.col + ", color: " + pos.color);
        connectedCells.push(pos);
        visited.push(pos);
        while (connectedCells.length !== 0) {
            var temp = connectedCells.shift();
            cellsToBeCleared.push(temp);
            var row = temp.row;
            var col = temp.col;
            // find all the connected cells depending on this one
            for (var i = 0; i < movement.length; i++) {
                var newRow = row + movement[i][0];
                var newCol = col + movement[i][1];
                var newPoint = { row: newRow, col: newCol, color: color };
                if (board[newRow][newCol] === color && !contains(visited, newPoint)) {
                    connectedCells.push(newPoint);
                    visited.push(newPoint);
                }
            }
        }
        if (cellsToBeCleared.length >= 3) {
            score = cellsToBeCleared.length;
            for (var i = 0; i < cellsToBeCleared.length; i++) {
                // clear the color of the current cell, make the cell empty
                board[cellsToBeCleared[i].row][cellsToBeCleared[i].col] = '';
            }
        }
        return { board: board, score: score };
    }
    // Helper Function: to judge whether the array contains the element
    function contains(arr, e) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].row === e.row && arr[i].col === e.col && arr[i].color === e.color) {
                return true;
            }
        }
        return false;
    }
    /**
     * Generate the initial move, no player make a real move on the board
     */
    function createInitialMove() {
        return { endMatchScores: null, turnIndexAfterMove: 0, stateAfterMove: getInitialState() };
    }
    gameLogic.createInitialMove = createInitialMove;
    /**
     * Just for test, to judge whether the move the player do meet the expection or not
     */
    function checkMoveOk(stateTransition) {
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that the move is OK.
        var turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
        var stateBeforeMove = stateTransition.stateBeforeMove;
        var move = stateTransition.move;
        // to test the initial case
        if (!stateBeforeMove && turnIndexBeforeMove === 0 &&
            angular.equals(createInitialMove(), move)) {
            return;
        }
        // to test the regular case
        var deltaValue = move.stateAfterMove.delta;
        var expectedMove = createMove(stateBeforeMove, deltaValue, turnIndexBeforeMove);
        if (!angular.equals(move, expectedMove)) {
            throw new Error("Expected move=" + angular.toJson(expectedMove, true) +
                ", but got stateTransition=" + angular.toJson(stateTransition, true));
        }
    }
    gameLogic.checkMoveOk = checkMoveOk;
    /**
     * Just for test, to call the checkMoveOk function
     */
    function forSimpleTestHtml() {
        var move = gameLogic.createMove(null, [{ row: 0, col: 0, color: 'R' }, { row: 1, col: 1, color: 'B' }], 0);
        log.log("move= ", move);
        var params = {
            turnIndexBeforeMove: 0,
            stateBeforeMove: null,
            move: move,
            numberOfPlayers: 2
        };
        gameLogic.checkMoveOk(params);
        var temp_board = 
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
    gameLogic.forSimpleTestHtml = forSimpleTestHtml;
    // Note: not sure, need to generate the 9 cells for the game
    /**
     * Generate the 3 prepared box for the player, one time just generate one box containing 3 cells
     */
    function generatePreparedBox() {
        var box = [];
        for (var i = 0; i < 3; i++) {
            box[i] = [];
            for (var j = 0; j < 3; j++) {
                box[i][j] = 'G';
            }
        }
        //log.log("this is generatePreparedBox");
        return box;
    }
    gameLogic.generatePreparedBox = generatePreparedBox;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map