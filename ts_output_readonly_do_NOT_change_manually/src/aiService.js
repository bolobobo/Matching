var aiService;
(function (aiService) {
    /** Returns the move that the computer player should do for the given state in move. */
    function findComputerMove(move) {
        return getPossibleMoves(move.stateAfterMove, move.turnIndexAfterMove);
    }
    aiService.findComputerMove = findComputerMove;
    //use istie to get legal moves then randomly choose one
    /**
     * Returns all the possible moves for the given state and turnIndexBeforeMove.
     * Returns an empty array if the game is over.
     */
    function getPossibleMoves(state, turnIndexBeforeMove) {
        var possibleMoves = []; //should be 2d array of moves b/c we have 3 pieces to place
        var allmoves = [];
        var board = [];
        var box = [];
        var colors;
        for (var i = 0; i < state.board.length; i++) {
            board[i] = [];
            for (var j = 0; j < state.board[i].length; j++) {
                board[i][j] = state.board[i][j];
            }
        }
        for (var k = 0; k < (state.preparedBox).length; k++) {
            colors = state.preparedBox[k];
            var possible_indiv = [];
            for (var i = 0; i < board.length; i++) {
                for (var j = 0; j < board[i].length; j++) {
                    var bd = []; //3 moves
                    if (checkPositionRow(board, i, j, bd, colors)) {
                        possible_indiv.push(bd);
                    }
                    bd = []; //3 moves                
                    if (checkPositionCol(board, i, j, bd, colors)) {
                        possible_indiv.push(bd);
                    }
                }
            }
            allmoves.push(possible_indiv);
        }
        log.log(allmoves);
        //allmoves now contain all poasible boardDelta for each piece
        /*
        [[[bd1],[bd2],[bd3],[bd4],[bd5]],//for piece1
         [[bd1],[bd2],[bd3],[bd4],[bd5]],//for piece2
         [[bd1],[bd2],[bd3],[bd4],[bd5]]]//for piece3
        */
        //now dump everything into possibleMoves
        var done = false;
        var bdfinal = [];
        for (var i = 0; i < allmoves.length; i++) {
            //log.log("ALL moves : " + i);
            var ok = false;
            //let rand = Math.floor((Math.random() * allmoves[i].length));
            var _bd = [];
            while (!ok) {
                ok = true;
                var rand = Math.floor((Math.random() * allmoves[i].length));
                var bd_temp = allmoves[i][rand];
                //log.log("bd_temp: ", bd_temp);
                if (!(bdfinal.length === 0)) {
                    for (var j = 0; j < bd_temp.length; j++) {
                        //log.log("bd_temp size: ", bd_temp.length)
                        for (var k = 0; k < bdfinal.length; k++) {
                            if (bd_temp[j].col === bdfinal[k].col && bd_temp[j].row === bdfinal[k].row) {
                                ok = false;
                            }
                        }
                    }
                }
                if (ok) {
                    for (var p = 0; p < bd_temp.length; p++) {
                        bdfinal.push(bd_temp[p]);
                    }
                }
            }
        }
        // log.log("There are : " + bdfinal.length);
        for (var p = 0; p < bdfinal.length; p++) {
            log.log("bd: row: " + bdfinal[p].row + " col: " + bdfinal[p].col + " color: " + bdfinal[p].color);
        }
        return gameLogic.createMove(state, bdfinal, turnIndexBeforeMove);
        //return allmoves;
    }
    aiService.getPossibleMoves = getPossibleMoves;
    /**
     * check if the position is available for a new move, if so, return the indexes
     */
    function checkPositionRow(board, row, col, bd, colors) {
        //log.log("row: " + row + " col: " + col);
        if (board[row][col] === "") {
            if (row >= board.length - 2 && col >= board.length - 2) {
                return false;
            }
            if (row < board.length - 2) {
                if (board[row + 1][col] === "" && board[row + 2][col] === "") {
                    // board[row][col] = "X";
                    // board[row+1][col] = "X";
                    // board[row+2][col] = "X";
                    var bd_1 = { row: row, col: col, color: colors[0] };
                    var bd_2 = { row: row + 1, col: col, color: colors[1] };
                    var bd_3 = { row: row + 2, col: col, color: colors[2] };
                    bd.push(bd_1);
                    bd.push(bd_2);
                    bd.push(bd_3);
                    return true;
                }
            }
        }
        return false;
    }
    function checkPositionCol(board, row, col, bd, colors) {
        //log.log("row: " + row + " col: " + col);
        if (board[row][col] === "") {
            if (row >= board.length - 2 && col >= board.length - 2) {
                return false;
            }
            if (col < board.length - 2) {
                if (board[row][col + 1] === "" && board[row][col + 2] === "") {
                    // board[row][col] = "X";                    
                    // board[row][col+1] = "X";
                    // board[row][col+2] = "X";
                    var bd_4 = { row: row, col: col, color: colors[0] };
                    var bd_5 = { row: row, col: col + 1, color: colors[1] };
                    var bd_6 = { row: row, col: col + 2, color: colors[2] };
                    bd.push(bd_4);
                    bd.push(bd_5);
                    bd.push(bd_6);
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Returns the move that the computer player should do for the given state.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    //   export function createComputerMove(move: IMove): IMove {
    //     // We use alpha-beta search, where the search states are TicTacToe moves.
    //     return getNextStates;
    //   }
    //   function getStateScoreForIndex0(move: IMove, playerIndex: number): number {
    //     let endMatchScores = move.endMatchScores;
    //     if (endMatchScores) {
    //       return endMatchScores[0] > endMatchScores[1] ? Number.POSITIVE_INFINITY
    //           : endMatchScores[0] < endMatchScores[1] ? Number.NEGATIVE_INFINITY
    //           : 0;
    //     }
    //     return 0;
    //   }
    function getNextStates(move, playerIndex) {
        return getPossibleMoves(move.stateAfterMove, playerIndex);
    }
    function forSimpleTestHtml() {
        log.log("AI Service");
        var temp_board = 
        // [['R', 'G', 'B', '', 'G', 'B', 'R', 'G'],
        // ['G', 'B', 'R', 'G', '', 'R', 'G', 'R'],
        // ['B', 'R', '', '', 'R', 'G', 'R', 'G'],
        // ['R', 'G', 'B', 'R', 'G', '', 'R', 'G'],
        // ['G', 'B', '', 'G', 'B', 'R', '', 'R'],
        // ['B', '', 'G', 'B', 'R', 'G', 'R', ''],
        // ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
        // ['', 'B', 'R', 'G', 'B', 'R', 'G', 'R']];
        //   [['R', 'G', 'B', 'R', 'G', '', '', ''],
        //    ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
        //    ['', 'R', '', '', '', 'G', 'R', 'G'],
        //    ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
        //    ['', 'B', '', 'G', 'B', 'R', 'G', ''],
        //    ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
        //    ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
        //    ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']];
        // [['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','',''],
        //  ['','','','','','','','']];
        [['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', 'B', 'Y', '', '', ''],
            ['', '', '', 'R', 'G', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '']];
        var temp_state = { board: temp_board,
            delta: [],
            currentScores: [],
            currentTurn: 4,
            preparedBox: [['R', 'G', 'G'],
                ['B', 'B', 'Y'],
                ['R', 'R', 'R']] };
        // var move = findComputerMove(game.currentUpdateUI.move);
        // log.info("Computer move: ", move);
        var move = getPossibleMoves(temp_state, temp_state.currentTurn);
        log.log("Possible: ", move);
        for (var i = 0; i < temp_board.length; i++) {
            var line = i + "\t";
            for (var j = 0; j < temp_board[i].length; j++) {
                if (temp_board[i][j] !== '') {
                    line = line + temp_board[i][j] + "\t";
                }
                else {
                    line = line + "-\t";
                }
            }
            log.log(line);
        }
        log.log("\n\n");
        for (var i = 0; i < move.stateAfterMove.board.length; i++) {
            var line = i + "\t";
            for (var j = 0; j < move.stateAfterMove.board[i].length; j++) {
                if (move.stateAfterMove.board[i][j] !== '') {
                    line = line + move.stateAfterMove.board[i][j] + "\t";
                }
                else {
                    line = line + "-\t";
                }
            }
            log.log(line);
        }
    }
    aiService.forSimpleTestHtml = forSimpleTestHtml;
})(aiService || (aiService = {}));
//# sourceMappingURL=aiService.js.map