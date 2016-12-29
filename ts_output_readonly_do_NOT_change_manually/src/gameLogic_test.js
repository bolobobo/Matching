describe("In PlayMatching", function () {
    var OK = true;
    var ILLEGAL = false;
    var PLAYER0_TURN = 0;
    var PLAYER1_TURN = 1;
    var NO_ONE_TURN = -1;
    var NO_ONE_WINS = null;
    var PLAYER0_WIN_SCORES = [1, 0];
    var PLAYER1_WIN_SCORES = [0, 1];
    var TIE_SCORES = [0, 0];
    var BOARD_NO_MOVES = [['R', 'G', 'B', '', 'G', 'B', 'R', 'G'],
        ['Y', 'B', 'R', 'G', '', 'R', 'G', 'Y'],
        ['B', 'R', '', '', 'R', 'G', 'R', 'G'],
        ['Y', 'G', 'Y', 'R', 'Y', '', 'Y', 'G'],
        ['G', 'B', '', 'G', 'Y', 'R', '', 'R'],
        ['B', '', 'G', 'B', 'R', 'G', 'R', ''],
        ['R', 'G', 'B', 'R', 'Y', 'B', 'R', 'G'],
        ['', 'B', 'R', 'G', 'B', 'R', 'Y', 'R']];
    var numberOfTimesCalledRandom = 0;
    Math.random = function () {
        numberOfTimesCalledRandom++;
        if (numberOfTimesCalledRandom == 1)
            return 1;
        if (numberOfTimesCalledRandom == 2)
            return 2;
        if (numberOfTimesCalledRandom == 3)
            return 3;
        if (numberOfTimesCalledRandom == 4) {
            numberOfTimesCalledRandom = 0;
            return 4;
        }
        throw new Error("Called Math.random more times than expected");
    };
    function expectStateTransition(isOk, stateTransition) {
        if (isOk) {
            gameLogic.checkMoveOk(stateTransition);
        }
        else {
            // We expect an exception to be thrown :)
            var didThrowException = false;
            try {
                gameLogic.checkMoveOk(stateTransition);
            }
            catch (e) {
                didThrowException = true;
            }
            if (!didThrowException) {
                throw new Error("We expect an illegal move, but checkMoveOk didn't throw any exception!");
            }
        }
    }
    function expectMove(isOK, turnIndexBeforeMove, boardBeforeMove, scoreBeforeMove, boardDelta, boardAfterMove, scoreAfterMove, turnIndexAfterMove, endMatchScores) {
        var stateTransition = {
            turnIndexBeforeMove: turnIndexBeforeMove,
            stateBeforeMove: boardBeforeMove ? {
                board: boardBeforeMove, delta: boardDelta,
                currentTurn: turnIndexBeforeMove,
                currentScores: scoreBeforeMove,
                preparedBox: null
            } : null,
            move: {
                turnIndexAfterMove: turnIndexAfterMove,
                endMatchScores: endMatchScores,
                stateAfterMove: {
                    board: boardAfterMove,
                    delta: boardDelta,
                    currentScores: scoreAfterMove,
                    currentTurn: turnIndexAfterMove,
                    preparedBox: null
                }
            },
            numberOfPlayers: null
        };
        expectStateTransition(isOK, stateTransition);
    }
    it("Initial state", function () {
        expectStateTransition(OK, {
            turnIndexBeforeMove: PLAYER0_TURN,
            stateBeforeMove: null,
            move: {
                turnIndexAfterMove: PLAYER1_TURN,
                endMatchScores: NO_ONE_WINS,
                stateAfterMove: null
            },
            numberOfPlayers: null
        });
    });
    it("Making a move that forms a match of 3 or over 3 is legal", function () {
        expectMove(OK, PLAYER0_TURN, [['R', 'G', 'B', 'R', 'G', '', '', ''],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['', 'R', '', '', '', 'G', 'R', 'G'],
            ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
            ['', 'B', '', 'G', 'B', 'R', 'G', ''],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], [{ row: 0, col: 5, color: 'R' }, { row: 0, col: 6, color: 'B' }, { row: 0, col: 7, color: 'Y' },
            { row: 2, col: 0, color: 'B' }, { row: 3, col: 0, color: 'B' }, { row: 4, col: 0, color: 'G' },
            { row: 3, col: 7, color: 'B' }, { row: 4, col: 7, color: 'R' }, { row: 5, col: 7, color: 'Y' }], [['R', 'G', 'B', 'R', 'G', 'R', 'B', 'Y'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['B', 'R', '', '', '', 'G', 'R', 'G'],
            ['B', 'G', 'B', 'R', 'G', 'B', 'R', 'B'],
            ['G', 'B', '', 'G', 'B', 'R', 'G', 'R'],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', 'Y'],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], PLAYER1_TURN, [40, 0]);
    });
    it("Not placing all 3 piece on board is illegal", function () {
        expectMove(ILLEGAL, PLAYER0_TURN, [['R', 'G', 'B', 'R', 'G', '', '', ''],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['', 'R', '', '', '', 'G', 'R', 'G'],
            ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
            ['', 'B', '', 'G', 'B', 'R', 'G', ''],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], [{ row: 0, col: 5, color: 'R' }, { row: 0, col: 6, color: 'B' }, { row: 0, col: 7, color: 'Y' }], [['R', 'G', 'B', 'R', 'G', 'R', 'B', 'Y'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['', 'R', '', '', '', 'G', 'R', 'G'],
            ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
            ['', 'B', '', 'G', 'B', 'R', 'G', ''],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], PLAYER1_TURN, [40, 0]);
    });
    it("Making a move without board delta is illegal", function () {
        expectMove(ILLEGAL, PLAYER0_TURN, [['R', 'G', 'B', 'R', 'G', '', '', ''],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['', 'R', '', '', '', 'G', 'R', 'G'],
            ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
            ['', 'B', '', 'G', 'B', 'R', 'G', ''],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], [], [['R', 'G', 'B', 'R', 'G', '', '', ''],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['', 'R', '', '', '', 'G', 'R', 'G'],
            ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
            ['', 'B', '', 'G', 'B', 'R', 'G', ''],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], PLAYER1_TURN, [40, 0]);
    });
    it("Making a move on a board with < 9 empty spots is illegal", function () {
        expectMove(ILLEGAL, PLAYER0_TURN, [['R', 'G', 'B', 'R', 'G', 'B', ' ', ' '],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', ' '],
            ['B', 'R', 'G', 'B', 'R', 'G', 'R', 'G'],
            ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', ' '],
            ['B', 'R', 'G', 'B', 'R', 'G', 'R', ' '],
            ['R', 'G', 'B', 'R', 'G', 'B', ' ', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], [{ row: 0, col: 5, color: 'R' }, { row: 0, col: 6, color: 'B' }, { row: 0, col: 7, color: 'Y' }], [['R', 'G', 'B', 'R', 'G', 'R', 'B', 'Y'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['', 'R', '', '', '', 'G', 'R', 'G'],
            ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
            ['', 'B', '', 'G', 'B', 'R', 'G', ''],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], null, NO_ONE_TURN, TIE_SCORES);
    });
    it("the game ties when there are no more empty cells", function () {
        expectMove(OK, PLAYER0_TURN, [['R', 'G', 'B', 'R', 'G', 'B', 'Y', 'Y'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R'],
            ['B', 'R', 'G', 'B', 'R', 'G', 'R', 'G'],
            ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R'],
            ['B', 'R', 'G', 'B', 'R', 'G', 'R', 'G'],
            ['R', 'G', 'B', 'R', 'G', 'B', 'Y', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], [{ row: 0, col: 5, color: 'R' }, { row: 0, col: 6, color: 'B' }, { row: 0, col: 7, color: 'Y' }], [['R', 'G', 'B', 'R', 'G', 'B', 'Y', 'Y'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R'],
            ['B', 'R', 'G', 'B', 'R', 'G', 'R', 'G'],
            ['R', 'G', 'B', 'R', 'G', 'B', 'R', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R'],
            ['B', 'R', 'G', 'B', 'R', 'G', 'R', 'G'],
            ['R', 'G', 'B', 'R', 'G', 'B', 'Y', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], null, NO_ONE_TURN, TIE_SCORES);
    });
    it("placing a piece outside board area is illegal", function () {
        expectMove(OK, PLAYER0_TURN, [['R', 'G', 'B', 'R', 'G', '', '', ''],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['', 'R', '', '', '', 'G', 'R', 'G'],
            ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
            ['', 'B', '', 'G', 'B', 'R', 'G', ''],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], [0, 0], [{ row: 0, col: 8, color: 'R' }, { row: 0, col: 0, color: 'B' }, { row: 0, col: 10, color: 'Y' }], [['R', 'G', 'B', 'R', 'G', '', '', ''],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'B'],
            ['', 'R', '', '', '', 'G', 'R', 'G'],
            ['', 'G', 'B', 'R', 'G', 'B', 'R', ''],
            ['', 'B', '', 'G', 'B', 'R', 'G', ''],
            ['B', 'R', 'R', 'B', 'R', 'G', 'R', ''],
            ['R', 'G', '', 'R', 'G', 'B', '', 'G'],
            ['G', 'B', 'R', 'G', 'B', 'R', 'G', 'R']], null, PLAYER1_TURN, NO_ONE_WINS);
    });
});
//# sourceMappingURL=gameLogic_test.js.map