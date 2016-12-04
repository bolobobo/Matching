;
var game;
(function (game) {
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    // basic configuration
    game.currentUpdateUI = null;
    game.didMakeMove = false; // You can only make one move per updateUI
    game.animationEndedTimeout = null;
    game.state = null;
    game.blockDeltas = [];
    // export let blockDeltasRotated: any = [];
    game.rowsNum = 8;
    game.colsNum = 8;
    game.rowsBox = 3;
    game.colsBox = 9;
    game.nextZIndex = 61;
    game.draggingStartedRowCol = null;
    game.draggingPiece = null;
    game.draggingPieceGroup = [];
    game.boardDragged = []; // to record which box has been moved to the board
    game.needToShrink = false; // At begginning, do not need to Shrink
    /**
     * Register for the turnBasedService3.js file
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
        game.gameArea = document.getElementById("gameArea");
        game.boardArea = document.getElementById("boardArea");
        game.gamePrepare = document.getElementById("gamePrepare");
        getInitialBoardDragged(); // initialize the boardDragged
        getSquareWidthHeight();
        getSquareWidthHeight_Box();
        game.indication = 0;
        dragAndDropService.addDragListener("boardArea", handleDragEvent);
    }
    game.init = init;
    /**
     * Drag the piece from prepared area to the game board area
     * OR from board area to board area
     * OR from prepared area to prepared area
     * OR from board area to prepared area
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
        // Is the touch in the whole board area?
        if (x < 0 || y < 0 || x >= game.boardArea.clientWidth || y >= game.boardArea.clientHeight) {
            if (!game.draggingPiece) {
                // The start touch is in a valid area, ignore it
                return;
            }
            else {
                // The finger is in the piece, but the touch is in a invalid area 
                // Drag the piece where the touch is (without snapping to a square). 
                // Just to show the drag position
                // do not need to shrink the size of the cell
                setDraggingPieceGroupTopLeft({ top: y - game.boardSquareSize.height / 2, left: x - game.boardSquareSize.width / 2 }, game.needToShrink, game.draggingStartedRowCol.isInBoard);
            }
        }
        else {
            // the first touch in the board but not in the prepared area
            if (!game.draggingPiece && y < game.boardArea.clientWidth + game.boardArea.clientWidth * 0.0375) {
                // TODO: START FROM BOARD TO BOARD OR FROM BOARD TO PREPARED
                return;
            }
            if (game.draggingPiece && y < game.boardArea.clientWidth + game.boardArea.clientWidth * 0.0375) {
            }
            else {
                // Position: Inside prepared box area. Let's find the containing square's row and col
                var col = Math.floor(game.colsBox * x / game.boardArea.clientWidth) % game.rowsBox;
                var row = Math.floor(game.rowsBox * x / game.boardArea.clientWidth);
                if (type === "touchstart" && !game.draggingStartedRowCol) {
                    // drag started
                    log.info("drag start AT PREPARED.");
                    game.draggingStartedRowCol = { row: row, col: col, isInBoard: false, isVertical: false, indication: -1 };
                    computeBlockDeltas(game.draggingStartedRowCol, game.draggingStartedRowCol.isInBoard);
                    createDraggingPieceGroup(game.draggingStartedRowCol);
                    setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(row, col), game.needToShrink, game.draggingStartedRowCol.isInBoard);
                }
                if (!game.draggingPiece) {
                    return;
                }
                if (type === "touchend") {
                    var from = game.draggingStartedRowCol;
                    var to = { row: row, col: col };
                    dragDone(from, to, "PREPARED");
                }
                else {
                    // Drag continue
                    setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(row, col), false, game.draggingStartedRowCol.isInBoard);
                }
            }
        }
        // If the drag is outside the legal board, it should return to the original position
        if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            // drag ended
            // return the piece to it's original style (then angular will take care to hide it).
            if (!game.draggingStartedRowCol.isInBoard) {
                game.needToShrink = true;
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col), game.needToShrink, game.draggingStartedRowCol.isInBoard);
                setDraggingPieceGroupStyle();
            }
            else {
                game.needToShrink = false;
                setDraggingPieceGroupTopLeft(getSquareTopLeft(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col), game.needToShrink, game.draggingStartedRowCol.isInBoard);
            }
            // clear the draggingPiece every time when ended
            game.draggingStartedRowCol = null;
            game.draggingPiece = null;
            game.draggingPieceGroup = [];
            game.blockDeltas = [];
            game.needToShrink = false;
        }
    }
    // Helper Function: to find the neighbor cells related to the finger-pointed cell
    function computeBlockDeltas(draggingStartedRowCol, isInBoard) {
        if (!isInBoard) {
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
        // If the start dragging positon is in the preparedBox area
        if (!draggingStartedRowCol.isInBoard) {
            // set the dragging piece
            game.draggingPiece = document.getElementById("MyPieceBox" + draggingStartedRowCol.row + "x" + draggingStartedRowCol.col);
            game.draggingPiece.style['z-index'] = 100;
            game.draggingPiece.style['width'] = game.boardArea.clientWidth / 8.0;
            game.draggingPiece.style['height'] = game.boardArea.clientWidth / 8.0;
            // get the html element of the neighbors of draggingPiece
            for (var i = 0; i < game.blockDeltas.length; i++) {
                var newRow = draggingStartedRowCol.row + game.blockDeltas[i].deltaRow;
                var newCol = draggingStartedRowCol.col + game.blockDeltas[i].deltaCol;
                var newhtml = document.getElementById("MyPieceBox" + newRow + "x" + newCol);
                game.draggingPieceGroup[i] = newhtml;
            }
            // set the css style of the neighbors of draggingPiece
            setDraggingPieceGroupStyle();
        }
        else {
            // If the start dragging position is in the board area
            game.draggingPiece = document.getElementById("MyPiece" + draggingStartedRowCol.row + "x" + draggingStartedRowCol.col);
            // set the dragging piece
            game.draggingPiece.style['z-index'] = 100;
            // get the html element of the neighbors of draggingPiece
            for (var i = 0; i < game.blockDeltas.length; i++) {
                var newRow = draggingStartedRowCol.row + game.blockDeltas[i].deltaRow;
                var newCol = draggingStartedRowCol.col + game.blockDeltas[i].deltaCol;
                var newhtml = document.getElementById("MyPiece" + newRow + "x" + newCol);
                newhtml.style['z-index'] = 100;
                game.draggingPieceGroup[i] = newhtml;
            }
        }
    }
    // Helper Function: Change the UI of the dragging Piece, from big to small or otherwize
    function setDraggingPieceGroupStyle() {
        var size;
        if (game.needToShrink) {
            size = getSquareWidthHeight_Box();
            game.draggingPiece.style['width'] = size.width;
            game.draggingPiece.style['height'] = size.height;
            game.draggingPiece.style['z-index'] = 100;
        }
        else {
            size = getSquareWidthHeight();
        }
        for (var i = 0; i < game.draggingPieceGroup.length; i++) {
            game.draggingPieceGroup[i].style['width'] = size.width;
            game.draggingPieceGroup[i].style['height'] = size.height;
            game.draggingPieceGroup[i].style['z-index'] = 100;
        }
    }
    // Helper Function: set the top left of the draggingPiece group
    function setDraggingPieceGroupTopLeft(draggingPieceCurTopLeft, needToShrink, isInBoard) {
        var size;
        var originalSize;
        var originalTopLeft;
        if (needToShrink) {
            size = game.preparedSquareSize;
        }
        else {
            size = game.boardSquareSize;
        }
        if (isInBoard) {
            setDraggingPieceTopLeft(game.draggingPiece, draggingPieceCurTopLeft, getSquareTopLeft_Box(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col));
            originalTopLeft = getSquareTopLeft(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col);
            originalSize = game.boardSquareSize;
        }
        else {
            setDraggingPieceTopLeft(game.draggingPiece, draggingPieceCurTopLeft, getSquareTopLeft_Box(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col));
            originalTopLeft = getSquareTopLeft_Box(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col);
            originalSize = game.preparedSquareSize;
        }
        for (var i = 0; i < game.blockDeltas.length; i++) {
            var originalTop = originalTopLeft.top + game.blockDeltas[i].deltaRow * originalSize.height;
            var originalLeft = originalTopLeft.left + game.blockDeltas[i].deltaCol * originalSize.width;
            var top_1 = draggingPieceCurTopLeft.top + game.blockDeltas[i].deltaRow * size.height;
            var left = draggingPieceCurTopLeft.left + game.blockDeltas[i].deltaCol * size.width;
            setDraggingPieceTopLeft(game.draggingPieceGroup[i], { top: top_1, left: left }, { top: originalTop, left: originalLeft });
        }
    }
    function setDraggingPieceTopLeft(piece, topLeft, originalTopLeft) {
        piece.style.left = topLeft.left - originalTopLeft.left;
        piece.style.top = topLeft.top - originalTopLeft.top;
    }
    function getSquareTopLeft(row, col) {
        var size = getSquareWidthHeight();
        return { top: row * size.height, left: col * size.width };
    }
    function getSquareTopLeft_Box(row, col) {
        var size = getSquareWidthHeight_Box();
        return { top: game.boardArea.clientHeight * 0.91, left: row * game.boardArea.clientWidth * 0.35 + col * size.width };
    }
    // Helper Funciton: do the drag done, clear the color in original place and put color in the new place
    function dragDone(from, to, dest) {
        var msg = "Dragged piece " + from.row + "x" + from.col + " to square " + to.row + "x" + to.col;
        log.info(msg);
        if (from.isVertical) {
            // Piece is vertical 
            if (dest === "PREPARED") {
                // from board to prepared area
                return;
            }
            else {
                // from board to board
                movePieceToBoard(from, to);
            }
        }
        else {
            // Piece is horizontal
            if (dest === "PREPARED") {
                if (game.state.preparedBox[to.row][to.col]) {
                    // if the prepared box already has color, it's invalid to put the piece
                    return;
                }
                // from board to prepared area
                // from prepared to prepared
                movePieceToPrepared(from, to);
            }
            if (dest === "BOARD") {
                // from board to board
                // from prepared to board
                movePieceToBoard(from, to);
            }
        }
    }
    function movePieceToPrepared(from, to) {
        if (game.blockDeltas[0].col === 1 && game.blockDeltas[1].col === 2) {
            setPieceToFitPreparedArea(from, to, 0, [0, 1, 2]);
        }
        else if (game.blockDeltas[0].col === -1 && game.blockDeltas[1].col === 1) {
            setPieceToFitPreparedArea(from, to, 1, [0, -1, 1]);
        }
        else if (game.blockDeltas[0].col === -2 && game.blockDeltas[1].col === -1) {
            setPieceToFitPreparedArea(from, to, 2, [0, -2, -1]);
        }
        // clear the original color 
        if (from.isInBoard) {
            clearOriginalPieceInBoard(from);
        }
        else {
            clearOriginalPieceInPrepared(from);
        }
    }
    function setPieceToFitPreparedArea(from, to, realCol, colDelta) {
        for (var i = 0; i < colDelta.length; i++) {
            var delta = colDelta[i];
            if (from.isInBoard) {
                game.state.preparedBox[to.row][realCol + delta] = game.boardDragged[from.row][from.col + delta][from.indication];
            }
            else {
                game.state.preparedBox[to.row][realCol + delta] = game.state.preparedBox[from.row][from.col + delta];
            }
        }
    }
    function movePieceToBoard(from, to) {
        if (isInsideBoard(to.row, to.col, game.blockDeltas)) {
            game.indication++;
            if (from.isInBoard) {
                game.boardDragged[to.row][to.col][game.indication] = game.boardDragged[from.row][from.col][from.indication];
            }
            else {
                game.boardDragged[to.row][to.col][game.indication] = game.state.preparedBox[from.row][from.col];
            }
            for (var i = 0; i < game.blockDeltas.length; i++) {
                var oldRow = from.row + game.blockDeltas[i].deltaRow;
                var oldCol = from.row + game.blockDeltas[i].deltaCol;
                var color = void 0;
                if (from.isInBoard) {
                    color = game.boardDragged[oldRow][oldCol][from.indication];
                }
                else {
                    color = game.state.preparedBox[oldRow][oldCol];
                }
                var newRow = to.row + game.blockDeltas[i].deltaRow;
                var newCol = to.col + game.blockDeltas[i].deltaCol;
                game.boardDragged[newRow][newCol][game.indication] = color;
            }
            // clear the color in the original place
            if (from.isInBoard) {
                clearOriginalPieceInBoard(from);
            }
            else {
                clearOriginalPieceInPrepared(from);
            }
        }
        else {
            return;
        }
    }
    function clearOriginalPieceInBoard(from) {
        game.boardDragged[from.row][from.col].delete(from.indication);
        for (var i = 0; i < game.blockDeltas.length; i++) {
            var oldRow = from.row + game.blockDeltas[i].deltaRow;
            var oldCol = from.row + game.blockDeltas[i].deltaCol;
            // clear the color in the original place
            game.boardDragged[oldRow][oldCol].delete(from.indication);
        }
    }
    function clearOriginalPieceInPrepared(from) {
        game.state.preparedBox[from.row][from.col] = '';
        for (var i = 0; i < game.blockDeltas.length; i++) {
            var oldRow = from.row + game.blockDeltas[i].deltaRow;
            var oldCol = from.row + game.blockDeltas[i].deltaCol;
            // clear the color in the original place
            game.state.preparedBox[oldRow][oldCol] = '';
        }
    }
    // Helper Function: initialize the boardDragged
    function getInitialBoardDragged() {
        // extend the board to initialize the boundary
        for (var i = 0; i < gameLogic.ROWS + 2; i++) {
            game.boardDragged[i] = [];
            for (var j = 0; j < gameLogic.COLS + 2; j++) {
                // every cell in boardDragged is a map datastructure
                // the key is the indication, so the initial value is 0
                game.boardDragged[i][j] = { 0: '' };
            }
        }
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                // put the original color of the board into boardDragged
                game.boardDragged[i + 2][j + 2][0] = game.state.board[i][j];
            }
        }
    }
    function getSquareWidthHeight() {
        game.boardSquareSize = { height: game.boardArea.clientWidth / game.colsNum, width: game.boardArea.clientWidth / game.rowsNum };
        return {
            height: game.boardArea.clientWidth / game.colsNum,
            width: game.boardArea.clientWidth / game.rowsNum
        };
    }
    function getSquareWidthHeight_Box() {
        game.preparedSquareSize = { height: game.boardArea.clientWidth * 0.9 / game.colsBox, width: game.boardArea.clientWidth * 0.9 / game.colsBox };
        return {
            height: game.boardArea.clientWidth * 0.9 / game.colsBox,
            width: game.boardArea.clientWidth * 0.9 / game.colsBox
        };
    }
    // function getSquareCenterXY(row: number, col: number) {
    //     var size = getSquareWidthHeight();
    //     return {
    //         x: col * size.width + size.width / 2,
    //         y: row * size.height + size.height / 2
    //     };
    // }
    //Helper Function: to judge whether the neighbor cell is in the boardArea
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
    // export function cellClicked(row: number, col: number, color: string): void {
    //     log.info("Clicked on cell:", row, col);
    //     if (window.location.search === "?throwException") { // to test encoding a stack trace with sourcemap
    //         throw new Error("Throwing the error because URL has '?throwException'");
    //     }
    //     let nextMove: IMove = null;
    //     try {
    //         nextMove = gameLogic.createMove(state, [{row: row, col: col, color: color}], currentUpdateUI.move.turnIndexAfterMove);
    //     } catch (e) {
    //         log.info(["Cell is already full in position:", row, col]);
    //         return;
    //     }
    //     // Move is legal, make it!
    //     makeMove(nextMove);
    // }
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
//TODO set draggin'S params CAN BE OPTIMIZED
// map in the dragged board is a pit, delete may not work
// TODO Z-INDEX need to do better
//TODO to compute the pass 
//# sourceMappingURL=game.js.map