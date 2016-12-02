;
var game;
(function (game) {
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    game.currentUpdateUI = null;
    game.didMakeMove = false; // You can only make one move per updateUI
    game.animationEndedTimeout = null;
    game.state = null;
    //export let clickToDragPiece: HTMLImageElement;
    game.blockDeltas = [];
    // export let blockDeltasRotated = [
    //     {deltaRow: -1, deltaCol: 0},
    //     {deltaRow: 1, deltaCol: 0}];
    game.rowsNum = 8;
    game.colsNum = 8;
    game.rowsBox = 3;
    game.colsBox = 9;
    game.nextZIndex = 61;
    game.draggingStartedRowCol = null;
    game.draggingPiece = null;
    game.draggingPieceGroup = [];
    game.boardDragged = [];
    /**
     * Register for the turnBasedService3.js
     */
    function init() {
        //registerServiceWorker();
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        resizeGameAreaService.setWidthToHeight(0.8);
        moveService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            checkMoveOk: gameLogic.checkMoveOk,
            updateUI: updateUI,
            gotMessageFromPlatform: null,
        });
        //initialize the drag-n-drop varibles
        dragAndDropService.addDragListener("boardArea", handleDragEvent);
        game.gameArea = document.getElementById("gameArea");
        game.boardArea = document.getElementById("boardArea");
        game.gamePrepare = document.getElementById("gamePrepare");
        getInitialBoardDragged();
        game.indication = 0;
        //clickToDragPiece = document.getElementById("clickToDragPiece");
    }
    game.init = init;
    /**
     * Drag the prepared box to the game board:
     * Suppose I'm dragging a blokus block that looks like:
     * XYX
     * --------
     * X
     * Y
     * X
     * and my finger is dragging where the symbol "Y"
     * E.g., if my finger is in square 2x3 (row=2, col=3), the block has
     * squares: [2x2, 2x3, 2x4]
     * and the rotated squares(when you click "Y", it will rotate the box from horizontal to vertical):
     * [1x3, 2x3, 3x3]
     */
    function handleDragEvent(type, clientX, clientY) {
        // Center point in gameArea
        var x = clientX - game.boardArea.offsetLeft - game.gameArea.offsetLeft;
        var y = clientY - game.boardArea.offsetTop - game.gameArea.offsetTop;
        //TODO: CLEAR Drag
        // Is the touch in the prepared box area?
        if (x < 0 || y < 0 || x >= game.boardArea.clientWidth || y >= game.boardArea.clientHeight) {
            //TODO: if the drag is outside the legal board, it should return to the original position
            log.info("this is the outside preparedBox and board");
            if (!game.draggingPiece) {
                // The start touch is in a valid area, ignore it
                return;
            }
            else {
                // the finger is in the piece, but the touch is in a invalid area 
                // Drag the piece where the touch is (without snapping to a square).
                var size = getSquareWidthHeight();
                // do not need to shrink the size of the cell
                setDraggingPieceGroupTopLeft({ top: y - size.height / 2, left: x - size.width / 2 }, false);
            }
        }
        else {
            // the first touch in the board but not in the prepared area
            if (!game.draggingPiece && y < game.boardArea.clientWidth + game.boardArea.clientWidth * 0.0375) {
                return;
            }
            if (game.draggingPiece && y < game.boardArea.clientWidth + game.boardArea.clientWidth * 0.0375) {
            }
            else {
                // Inside prepared box area. Let's find the containing square's row and col
                var col = Math.floor(game.colsBox * x / game.boardArea.clientWidth) % game.rowsBox;
                var row = Math.floor(game.rowsBox * x / game.boardArea.clientWidth);
                log.info("the prepared box row is: " + row + " col is : " + col);
                if (type === "touchstart" && !game.draggingStartedRowCol) {
                    // drag started
                    log.info("drag start");
                    game.draggingStartedRowCol = { row: row, col: col, isInBoard: false, indication: -1 };
                    computeBlockDeltas(game.draggingStartedRowCol);
                    game.draggingPiece = document.getElementById("MyPieceBox" + game.draggingStartedRowCol.row + "x" + game.draggingStartedRowCol.col);
                    createDraggingPieceGroup(game.draggingStartedRowCol);
                    game.draggingPiece.style['z-index'] = 100;
                    game.draggingPiece.style['width'] = game.boardArea.clientWidth / 8.0;
                    game.draggingPiece.style['height'] = game.boardArea.clientWidth / 8.0;
                    setDraggingPieceGroupTopLeft(getSquareTopLeft(row, col), false);
                    if (!game.draggingPiece) {
                        return;
                    }
                    if (type === "touchend") {
                        var from = game.draggingStartedRowCol;
                        var to = { row: row, col: col };
                    }
                    else {
                        // Drag continue
                        setDraggingPieceGroupTopLeft(getSquareTopLeft(row, col), false);
                    }
                }
            }
            if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
                // drag ended
                // return the piece to it's original style (then angular will take care to hide it).
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col), true);
                game.draggingStartedRowCol = null;
                game.draggingPiece = null;
                game.draggingPieceGroup = [];
                game.blockDeltas = [];
            }
        }
    }
    // Helper Function: to find the neighbor cells related to the finger-pointed cell
    function computeBlockDeltas(draggingStartedRowCol) {
        if (!draggingStartedRowCol.isInBoard) {
            if (draggingStartedRowCol.col === 0) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: 1 },
                    { deltaRow: 0, deltaCol: 2 }];
            }
            else if (draggingStartedRowCol.col === 1) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: -1 },
                    { deltaRow: 0, deltaCol: 1 }];
            }
            else if (draggingStartedRowCol.col === 2) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: -2 },
                    { deltaRow: 0, deltaCol: -1 }];
            }
        }
        else {
            computeBlockDeltasInBoard(draggingStartedRowCol);
        }
    }
    // TODO: this function is too silly
    function computeBlockDeltasInBoard(draggingStartedRowCol) {
        var row = draggingStartedRowCol.row + 2;
        var col = draggingStartedRowCol.col + 2;
        var value = draggingStartedRowCol.indication;
        if (game.boardDragged[row - 1][col] === value) {
            // up 
            if (game.boardDragged[row - 2][col] === value) {
                game.blockDeltas = [
                    { deltaRow: -1, deltaCol: 0 },
                    { deltaRow: -2, deltaCol: 0 }];
            }
            else if (game.boardDragged[row + 1][col] === value) {
                game.blockDeltas = [
                    { deltaRow: -1, deltaCol: 0 },
                    { deltaRow: 1, deltaCol: 0 }];
            }
        }
        else if (game.boardDragged[row + 1][col] === value) {
            // down
            if (game.boardDragged[row + 2][col] === value) {
                game.blockDeltas = [
                    { deltaRow: 1, deltaCol: 0 },
                    { deltaRow: 2, deltaCol: 0 }];
            }
            else if (game.boardDragged[row - 1][col] === value) {
                game.blockDeltas = [
                    { deltaRow: -1, deltaCol: 0 },
                    { deltaRow: 1, deltaCol: 0 }];
            }
        }
        else if (game.boardDragged[row][col - 1] === value) {
            // left
            if (game.boardDragged[row][col - 2] === value) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: -1 },
                    { deltaRow: 0, deltaCol: -2 }];
            }
            else if (game.boardDragged[row][col + 1] === value) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: -1 },
                    { deltaRow: 0, deltaCol: 1 }];
            }
        }
        else if (game.boardDragged[row][col + 1] == value) {
            //right
            if (game.boardDragged[row][col + 2] === value) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: 1 },
                    { deltaRow: 0, deltaCol: 2 }];
            }
            else if (game.boardDragged[row][col - 1] === value) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: -1 },
                    { deltaRow: 0, deltaCol: 1 }];
            }
        }
    }
    // Helper Function: to get the HTMLElement of draggingPiece's neighbors
    function createDraggingPieceGroup(draggingStartedRowCol) {
        if (!draggingStartedRowCol.isInBoard) {
            for (var i = 0; i < game.blockDeltas.length; i++) {
                var newRow = draggingStartedRowCol.row + game.blockDeltas[i].deltaRow;
                var newCol = draggingStartedRowCol.col + game.blockDeltas[i].deltaCol;
                var newhtml = document.getElementById("MyPieceBox" + newRow + "x" + newCol);
                newhtml.style['width'] = game.boardArea.clientWidth / 8.0;
                newhtml.style['height'] = game.boardArea.clientWidth / 8.0;
                game.draggingPieceGroup[i] = newhtml;
            }
        }
    }
    // Helper Function: set the top left of the draggingPiece group
    function setDraggingPieceGroupTopLeft(draggingPieceCurTopLeft, needToShrink) {
        setDraggingPieceTopLeft(game.draggingPiece, draggingPieceCurTopLeft);
        var size;
        if (needToShrink) {
            size = getSquareWidthHeight_Box();
        }
        else {
            size = getSquareWidthHeight();
        }
        for (var i = 0; i < game.blockDeltas.length; i++) {
            var top_1 = draggingPieceCurTopLeft.top + game.blockDeltas[i].deltaRow * size.height;
            var left = draggingPieceCurTopLeft.left + game.blockDeltas[i].deltaRow * size.width;
            setDraggingPieceTopLeft(game.draggingPieceGroup[i], { top: top_1, left: left });
        }
    }
    function setDraggingPieceTopLeft(piece, topLeft) {
        var originalSize;
        if (game.draggingStartedRowCol.isInBoard) {
            originalSize = getSquareTopLeft(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col);
        }
        else {
            originalSize = getSquareTopLeft_Box(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col);
        }
        piece.style.left = (topLeft.left - originalSize.left) + "px";
        piece.style.top = (topLeft.top - originalSize.top) + "px";
    }
    function getSquareTopLeft(row, col) {
        var size = getSquareWidthHeight();
        return { top: row * size.height, left: col * size.width };
    }
    function getSquareTopLeft_Box(row, col) {
        var size = getSquareWidthHeight();
        return { top: game.boardArea.clientHeight * 0.91, left: (row * 3 + col) * size.width };
    }
    function getSquareWidthHeight() {
        return {
            width: game.boardArea.clientWidth / game.colsNum,
            height: game.boardArea.clientWidth / game.rowsNum
        };
    }
    function getSquareWidthHeight_Box() {
        return {
            width: game.boardArea.clientWidth / game.colsBox,
            height: game.boardArea.clientWidth / game.colsBox
        };
    }
    // Helper Function: to judge whether the neighbor cell is in the boardArea
    function isInsideBoard(row, col, blockDeltas) {
        for (var i = 0; i < blockDeltas.length; i++) {
            var delta = blockDeltas[i];
            var r_neighbor = row + delta.deltaRow;
            var c_neighbor = col + delta.deltaCol;
            if (r_neighbor < 0 || r_neighbor >= game.rowsNum || c_neighbor < 0 || c_neighbor >= game.colsNum) {
                return false;
            }
        }
        return true;
    }
    // function getSquareCenterXY(row: number, col: number) {
    //     var size = getSquareWidthHeight();
    //     return {
    //         x: col * size.width + size.width / 2,
    //         y: row * size.height + size.height / 2
    //     };
    // }
    function getInitialBoardDragged() {
        // extend the board to initialize the boundary
        for (var i = 0; i < gameLogic.ROWS + 2; i++) {
            game.boardDragged[i] = [];
            for (var j = 0; j < gameLogic.COLS + 2; j++) {
                game.boardDragged[i][j] = 0;
            }
        }
    }
    //------------------------------------------------------------------------------------------------
    /**
     * Define the different translation of the rule of the game
     */
    function getTranslations() {
        return {};
    }
    /**
     * When you intialize the game OR make a update of the game UI, should call this function.
     */
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.didMakeMove = false; // only one move per updateUI
        game.currentUpdateUI = params;
        clearAnimationTimeout();
        game.state = params.move.stateAfterMove;
        if (isFirstMove()) {
            game.state = gameLogic.getInitialState();
            if (isMyTurn())
                makeMove(gameLogic.createInitialMove());
        }
        else {
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            game.animationEndedTimeout = $timeout(animationEndedCallback, 500);
        }
    }
    game.updateUI = updateUI;
    /**
     * When you click the cell in the game area, it will do a move operation and update of the UI
     */
    function cellClicked(row, col, color) {
        log.info("Clicked on cell:", row, col);
        if (window.location.search === "?throwException") {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        var nextMove = null;
        try {
            nextMove = gameLogic.createMove(game.state, [{ row: row, col: col, color: color }], game.currentUpdateUI.move.turnIndexAfterMove);
        }
        catch (e) {
            log.info(["Cell is already full in position:", row, col]);
            return;
        }
        // Move is legal, make it!
        makeMove(nextMove);
    }
    game.cellClicked = cellClicked;
    /**
     * To do the real move operation of the game;
     */
    function makeMove(move) {
        log.log("this is make move");
        if (game.didMakeMove) {
            return;
        }
        game.didMakeMove = true;
        moveService.makeMove(move);
    }
    //------------------------------------------------------------------------------------------------
    /**
     * Indicate that the update operation is done
     */
    function animationEndedCallback() {
        log.info("Animation ended");
        //maybeSendComputerMove();
    }
    /**
     * When you are going to do the update, call this to cancel the animation timeout
     */
    function clearAnimationTimeout() {
        if (game.animationEndedTimeout) {
            $timeout.cancel(game.animationEndedTimeout);
            game.animationEndedTimeout = null;
        }
    }
    // function animationEndedCallback() {
    //     log.info("Animation ended");
    //     maybeSendComputerMove();
    // }
    function isFirstMove() {
        log.log("this is the first move");
        return !game.currentUpdateUI.move.stateAfterMove;
    }
    function isMyTurn() {
        return !game.didMakeMove &&
            game.currentUpdateUI.move.turnIndexAfterMove >= 0 &&
            game.currentUpdateUI.yourPlayerIndex === game.currentUpdateUI.move.turnIndexAfterMove; // it's my turn
    }
    // UI operation
    function shouldShowImage(row, col) {
        var cell = game.state.board[row][col];
        //log.info(typeof state);
        //log.info("this is the cell, row: " + row + " col: " + col + " color: " + cell);
        return true;
    }
    game.shouldShowImage = shouldShowImage;
    function isPieceR(row, col) {
        return game.state.board[row][col] === 'R';
    }
    game.isPieceR = isPieceR;
    function isPieceG(row, col) {
        //log.info(state.board[row][col] === 'G');
        return game.state.board[row][col] === 'G';
    }
    game.isPieceG = isPieceG;
    function isPieceB(row, col) {
        return game.state.board[row][col] === 'B';
    }
    game.isPieceB = isPieceB;
    function isPieceY(row, col) {
        return game.state.board[row][col] === 'Y';
    }
    game.isPieceY = isPieceY;
    function shouldShowImage_Box(row, col) {
        var cell = game.state.board[row][col];
        //log.info("this is the cell, row: " + row + " col: " + col + " color: " + state.preparedBox[row][col]);
        return true;
    }
    game.shouldShowImage_Box = shouldShowImage_Box;
    function isPieceR_Box(row, col) {
        return game.state.preparedBox[row][col] === 'R';
    }
    game.isPieceR_Box = isPieceR_Box;
    function isPieceG_Box(row, col) {
        return game.state.preparedBox[row][col] === 'G';
    }
    game.isPieceG_Box = isPieceG_Box;
    function isPieceB_Box(row, col) {
        return game.state.preparedBox[row][col] === 'B';
    }
    game.isPieceB_Box = isPieceB_Box;
    function isPieceY_Box(row, col) {
        return game.state.preparedBox[row][col] === 'Y';
    }
    game.isPieceY_Box = isPieceY_Box;
    // export function shouldSlowlyAppear(row: number, col: number): boolean {
    //     return state.delta &&
    //         state.delta.row === row && state.delta.col === col;
    // }
    function getPreparedBoxColor(row, col) {
        var color = game.state.preparedBox[row][col];
        if (color === 'R') {
            return "rgb(255, 128, 170)";
        }
        else if (color === 'G') {
            return "rgb(71, 209, 71)";
        }
        else if (color === 'B') {
            return "rgb(51, 204, 255)";
        }
        else if (color === 'Y') {
            return "rgb(246, 246, 85)";
        }
    }
    game.getPreparedBoxColor = getPreparedBoxColor;
})(game || (game = {}));
angular.module('myApp', ['gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
// what is updateUI, what is playmode
// use enum to notate the right, left, top and down
//# sourceMappingURL=game.js.map