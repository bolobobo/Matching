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
        board[3][3] = getRandomColor();
        board[3][4] = getRandomColor();
        board[4][3] = getRandomColor();
        board[4][4] = getRandomColor();
        return board;
    }
    // initialize the first 7 cells
    // function getInitialRandomCell(board: Board): Board {
    //     let cell = 0;
    //     while(cell < 7) {
    //         let resRow = Math.floor((Math.random() * ROWS) + 1);
    //         let resCol = Math.floor((Math.random() * COLS) + 1);
    //         if (board[resRow][resCol] === '') {
    //             board[resRow][resCol] = getRandomColor();
    //         } else {
    //             continue;
    //         }
    //     }
    //     return board;
    // }
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
        return { board: getInitialBoard(), delta: null, currentScores: getInitialScores(), currentTurn: 0 };
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
    function isTie(board) {
        return true;
    }
    /**
     * Return the winner (either 'X' or 'O') or '' if there is no winner (because they have the same score);
     * getWinner will return the player with the highest score at the final turn or when there is a tie state;
     */
    function getWinner(state) {
        // if the game is in a tie state, it means the end of the game
        if (isTie(state.board)) {
            return getHighestScore(state.currentScores).toString();
        }
        // if the game is in its final turn, it means the end of the game
        if (state.currentTurn == gameLogic.TOTALTURNS) {
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
     * use this function to
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
        // to guarantee the state to be put in has 
    }
    gameLogic.createMove = createMove;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map