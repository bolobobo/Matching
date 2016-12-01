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
    game.blockDelas = [
        { deltaRow: 0, deltaCol: -1 },
        { deltaRow: 0, deltaCol: 1 }];
    game.blockDelasRoted = [
        { deltaRow: -1, deltaCol: 0 },
        { deltaRow: 1, deltaCol: 0 }];
    game.rowsNum = 8;
    game.colsNum = 8;
    game.rowsBox = 3;
    game.colsBox = 9;
    game.nextZIndex = 61;
    game.draggingStartedRowCol = null;
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
        // log.info("x is " + x);
        // log.info("y is " + y);
        // log.info("board offset left: " + boardArea.offsetLeft + "Top: " + boardArea.offsetTop);
        // log.info("game offset left: " + gameArea.offsetLeft + "Top: " + gameArea.offsetTop);
        //TODO: CLEAR Drag
        // Is the touch in the prepared box area?
        if (x < 0 || y < 0 || x >= game.boardArea.clientWidth ||
            y < game.boardArea.clientWidth + game.boardArea.clientWidth * 0.0375 || y >= game.boardArea.clientWidth * 1.125) {
            //TODO: if the drag is outside the legal board, it should return to the original position
            return;
        }
        else {
            // Inside prepared box area. Let's find the containing square's row and col
            var col = Math.floor(game.colsBox * x / game.boardArea.clientWidth) % game.rowsBox;
            var row = Math.floor(game.rowsBox * x / game.boardArea.clientWidth);
            log.info("the box row is: " + row + " col is : " + col);
            if (type === "touchstart" && !game.draggingStartedRowCol) {
                // drag started
                log.info("drag start");
                game.draggingStartedRowCol = { row: row, col: col };
                game.draggingPiece = document.getElementById("MyPiece" + game.draggingStartedRowCol.row);
                game.draggingPiece.style['z-index'] = ++game.nextZIndex;
                game.draggingPiece.style.background = "gray";
                game.draggingPiece.style.width = game.boardArea.clientWidth / 3.0;
                game.draggingPiece.style.height = game.boardArea.clientWidth / 9.0;
            }
        }
        //   if (!draggingPiece) {
        //     return;
        //   }
        //   if (type === "touchend") {
        //     var from = draggingStartedRowCol;
        //     var to = {row: row, col: col};
        //     dragDone(from, to);
        //   } else {
        //     // Drag continue
        //     setDraggingPieceTopLeft(getSquareTopLeft(row, col));
        //     draggingLines.style.display = "inline";
        //     var centerXY = getSquareCenterXY(row, col);
        //     verticalDraggingLine.setAttribute("x1", centerXY.x);
        //     verticalDraggingLine.setAttribute("x2", centerXY.x);
        //     horizontalDraggingLine.setAttribute("y1", centerXY.y);
        //     horizontalDraggingLine.setAttribute("y2", centerXY.y);
        //   }
        // // Is the entire block inside the board?
        // if (!isInsideBoard(row, col, blockDelas)) {
        //   return;
        // }
    }
    // Helper Function: to judge whether the neighbor cell is in the boardArea
    function isInsideBoard(row, col, blockDelas) {
        for (var i = 0; i < blockDelas.length; i++) {
            var delta = blockDelas[i];
            var r_neighbor = row + delta.deltaRow;
            var c_neighbor = col + delta.deltaCol;
            if (r_neighbor < 0 || r_neighbor >= game.rowsNum || c_neighbor < 0 || c_neighbor >= game.colsNum) {
                return false;
            }
        }
        return true;
    }
    function getSquareWidthHeight() {
        return {
            width: game.gameArea.clientWidth / game.colsNum,
            height: game.gameArea.clientHeight / game.rowsNum
        };
    }
    // function getSquareTopLeft(row, col) {
    //     var size = getSquareWidthHeight();
    //     return {top: row * size.height, left: col * size.width}
    // }
    //   function getSquareCenterXY(row, col) {
    //     var size = getSquareWidthHeight();
    //     return {
    //       x: col * size.width + size.width / 2,
    //       y: row * size.height + size.height / 2
    //     };
    //   }
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
})(game || (game = {}));
angular.module('myApp', ['gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
// what is updateUI, what is playmode
//# sourceMappingURL=game.js.map