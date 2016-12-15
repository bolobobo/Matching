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
    game.needToSettle = false;
    game.isVertical = false; // denote the shape of the draggingPieceGroup 
    game.boardLayer1 = [];
    game.boardLayer2 = [];
    game.boardLayer3 = [];
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
        //getInitialBoardRotated(); // initialize the boardRotated
        getInitialAllBoardLayer(); // initialize all the boardLayer to store the color of each layer in board
        getSquareWidthHeight();
        getSquareWidthHeight_Box();
        game.indication = 0;
        dragAndDropService.addDragListener("boardArea", handleDragEvent);
    }
    game.init = init;
    //------------------------------------------------------------------------------------------------
    /**
     * Define the different translation of the rule of the game
     */
    function getTranslations() {
        return {
            LEFT_TURNS: {
                en: "Turns left",
                zh: "剩余回合"
            },
            YOUR_SCORE: {
                en: "Current",
                zh: "当前分数",
            },
            OPPONENT_SCORE: {
                en: "Opponent",
                zh: "对手",
            }
        };
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
            getInitialBoardDragged(); // initialize the boardDragged
            //getInitialBoardRotated(); // initialize the boardRotated
            getInitialAllBoardLayer(); // initialize all the boardLayer to store the color of each layer in board
            game.animationEndedTimeout = $timeout(animationEndedCallback, 500);
        }
    }
    game.updateUI = updateUI;
    /**
     * When you click the button outside the game area, it will do a move operation and update of the UI
     */
    function buttonClicked(row, col, color) {
        log.info("Clicked on button=================");
        if (window.location.search === "?throwException") {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        // check the move is valid, the cell is only valid: 
        // 1) each cell in board has no more than one color;
        // 2) all the prepared boxes are on board;
        if (!checkStartMoveIsValid()) {
            alert("the move is invalid");
            return;
        }
        var moves = generateMoves();
        var nextMove = null;
        try {
            nextMove = gameLogic.createMove(game.state, moves, game.currentUpdateUI.move.turnIndexAfterMove);
        }
        catch (e) {
            log.info(["Cell is already full in position:", row, col]);
            return;
        }
        // Move is legal, make it!
        makeMove(nextMove);
    }
    game.buttonClicked = buttonClicked;
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
    /**
     * Indicate that the update operation is done
     */
    function animationEndedCallback() {
        log.info("Animation ended");
        maybeSendComputerMove();
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
    function isFirstMove() {
        log.log("this is the first move");
        return !game.currentUpdateUI.move.stateAfterMove;
    }
    function isMyTurn() {
        return !game.didMakeMove &&
            game.currentUpdateUI.move.turnIndexAfterMove >= 0 &&
            game.currentUpdateUI.yourPlayerIndex === game.currentUpdateUI.move.turnIndexAfterMove; // it's my turn
    }
    function isComputer() {
        var playerInfo = game.currentUpdateUI.playersInfo[game.currentUpdateUI.yourPlayerIndex];
        // In community games, playersInfo is [].
        return playerInfo && playerInfo.playerId === '';
    }
    function isComputerTurn() {
        return isMyTurn() && isComputer();
    }
    function maybeSendComputerMove() {
        if (!isComputerTurn())
            return;
        var move = aiService.findComputerMove(game.currentUpdateUI.move);
        log.info("Computer move: ", move);
        makeMove(move);
    }
    //------------------------------------------------------------------------------------------------
    // TODO: ADD OHTHER CONDITIONS
    function checkStartMoveIsValid() {
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                if (computeLength(i, j) > 1) {
                    return false;
                }
            }
        }
        return true;
    }
    function generateMoves() {
        var moves = [];
        var index = 0;
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                if (computeLength(i, j) !== 0) {
                    for (var key in game.boardDragged[i][j]) {
                        moves[index] = { row: i, col: j, color: game.boardDragged[i][j][key] };
                        index++;
                    }
                }
            }
        }
        return moves;
    }
    //========================================================================================
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
                setDraggingPieceGroupTopLeft({ top: y - game.boardSquareSize.height / 2, left: x - game.boardSquareSize.width / 2 }, game.draggingStartedRowCol.isInBoard);
            }
        }
        else if (y < game.boardArea.clientWidth + game.boardArea.clientWidth * 0.0375) {
            // the touch in the board area but not in the prepared area
            // Position: Inside board box area. Let's find the containing square's row and col
            var row = Math.floor(game.rowsNum * y / game.boardArea.clientWidth);
            var col = Math.floor(game.colsNum * x / game.boardArea.clientWidth);
            log.info("this is in Board area: row is " + row + " col is " + col);
            if (type === "touchstart" && !game.draggingStartedRowCol) {
                // drag started in board
                log.info("drag start AT BOARD.");
                var ind = computeIndicationAndLayer(row, col).ind;
                var layer = computeIndicationAndLayer(row, col).layer;
                if (ind === -1) {
                    // no piece be moved in this cell
                    return;
                }
                game.touchStartTime = new Date().getTime();
                log.info("the time now is " + game.touchStartTime + "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
                game.draggingStartedRowCol = { row: row, col: col, isInBoard: true, indication: ind, layer: layer };
                computeBlockDeltas(game.draggingStartedRowCol, game.draggingStartedRowCol.isInBoard);
                createDraggingPieceGroup(game.draggingStartedRowCol);
                setDraggingPieceGroupTopLeft(getSquareTopLeft(row, col), game.draggingStartedRowCol.isInBoard);
            }
            if (!game.draggingPiece) {
                return;
            }
            if (type === "touchend") {
                var from = game.draggingStartedRowCol;
                var to = { row: row, col: col };
                game.touchEndTime = new Date().getTime();
                log.info("the time now is " + game.touchEndTime + "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
                dragDone(from, to, "BOARD");
            }
            else {
                // Drag continue
                setDraggingPieceGroupTopLeft(getSquareTopLeft(row, col), game.draggingStartedRowCol.isInBoard);
            }
        }
        else {
            // Position: Inside prepared box area. Let's find the containing square's row and col
            var col = Math.floor(game.colsBox * x / game.boardArea.clientWidth) % game.rowsBox;
            var row = Math.floor(game.rowsBox * x / game.boardArea.clientWidth);
            if (type === "touchstart" && !game.draggingStartedRowCol) {
                // drag started in prepared area
                log.info("drag start AT PREPARED.");
                if (game.state.preparedBox[row][col] === '') {
                    // no color in prepared area
                    return;
                }
                game.draggingStartedRowCol = { row: row, col: col, isInBoard: false, indication: -1, layer: -1 };
                computeBlockDeltas(game.draggingStartedRowCol, game.draggingStartedRowCol.isInBoard);
                createDraggingPieceGroup(game.draggingStartedRowCol);
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(row, col), game.draggingStartedRowCol.isInBoard);
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
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(row, col), game.draggingStartedRowCol.isInBoard);
            }
        }
        // If the drag is outside the legal board, it should return to the original position
        if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            // drag ended
            // return the piece to it's original style (then angular will take care to hide it).
            if (!game.draggingStartedRowCol.isInBoard) {
                game.needToShrink = true;
                //needToSettle = true;
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col), game.draggingStartedRowCol.isInBoard);
                setDraggingPieceGroupStyle();
            }
            else {
                game.needToShrink = false;
                game.needToSettle = true;
                setDraggingPieceGroupTopLeft(getSquareTopLeft(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col), game.draggingStartedRowCol.isInBoard);
                setDraggingPieceGroupStyle();
            }
            changeUIForEachMove();
            // clear the draggingPiece every time when ended
            game.draggingStartedRowCol = null;
            game.draggingPiece = null;
            game.draggingPieceGroup = [];
            game.blockDeltas = [];
            game.needToShrink = false;
            game.isVertical = false;
            game.needToSettle = false;
            game.touchStartTime = 0;
            game.touchEndTime = 0;
        }
    }
    function changeUIForEachMove() {
        var count = 0;
        getInitialAllBoardLayer();
        for (var i = 0; i < game.boardDragged.length; i++) {
            for (var j = 0; j < game.boardDragged[i].length; j++) {
                var length_1 = computeLength(i, j);
                //clearOriginBoardCell(i, j);
                var layers = findLayer(i, j);
                if (length_1 === 0) {
                }
                else if (length_1 === 1) {
                    game.boardLayer1[i][j] = game.boardDragged[i][j][layers.layer1];
                }
                else if (length_1 === 2) {
                    game.boardLayer1[i][j] = game.boardDragged[i][j][layers.layer1];
                    game.boardLayer2[i][j] = game.boardDragged[i][j][layers.layer2];
                }
                else if (length_1 === 3) {
                    game.boardLayer1[i][j] = game.boardDragged[i][j][layers.layer1];
                    game.boardLayer2[i][j] = game.boardDragged[i][j][layers.layer2];
                    game.boardLayer3[i][j] = game.boardDragged[i][j][layers.layer3];
                }
            }
        }
        $timeout(function () { }, 100);
    }
    function computeLength(row, col) {
        var length = 0;
        for (var key in game.boardDragged[row][col]) {
            length++;
        }
        return length;
    }
    function clearOriginBoardCell(row, col) {
        game.boardLayer1[row][col] = '';
        game.boardLayer2[row][col] = '';
        game.boardLayer3[row][col] = '';
    }
    function findLayer(row, col) {
        var bottom = -1;
        var middle = -1;
        var up = -1;
        var length = 0;
        for (var key in game.boardDragged[row][col]) {
            if (parseInt(key) > up) {
                var temp1 = up;
                var temp2 = middle;
                up = parseInt(key);
                middle = temp1;
                bottom = temp2;
            }
            else if (parseInt(key) > middle) {
                var temp1 = middle;
                middle = parseInt(key);
                bottom = temp1;
            }
            else {
                bottom = parseInt(key);
            }
            length++;
        }
        // settle the layer
        if (length === 1) {
            bottom = up;
            up = -1;
            middle = -1;
        }
        else if (length === 2) {
            bottom = middle;
            middle = up;
            up = -1;
        }
        return { layer1: bottom, layer2: middle, layer3: up };
    }
    function findExactLayer(row, col, ind) {
        var result = findLayer(row, col);
        var up = result.layer3;
        var middle = result.layer2;
        var bottom = result.layer1;
        if (ind === up) {
            return 3;
        }
        else if (ind === middle) {
            return 2;
        }
        else if (ind === bottom) {
            return 1;
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
        var tempBoardDragged = [];
        // extend the board to initialize the boundary
        for (var i = 0; i < gameLogic.ROWS + 4; i++) {
            tempBoardDragged[i] = [];
            for (var j = 0; j < gameLogic.COLS + 4; j++) {
                // every cell in boardDragged is a map datastructure
                // the key is the indication, the value is the color
                tempBoardDragged[i][j] = {};
            }
        }
        for (var i = 0; i < gameLogic.ROWS; i++) {
            for (var j = 0; j < gameLogic.COLS; j++) {
                // copy each boardDragged to tempBoardDragged
                tempBoardDragged[i + 2][j + 2] = angular.copy(game.boardDragged[i][j]);
            }
        }
        var row = draggingStartedRowCol.row + 2;
        var col = draggingStartedRowCol.col + 2;
        var ind = draggingStartedRowCol.indication;
        //let value = boardDragged[row][col][ind];
        if (tempBoardDragged[row - 1][col].hasOwnProperty(ind)) {
            // up 
            if (tempBoardDragged[row - 2][col].hasOwnProperty(ind)) {
                game.blockDeltas = [
                    { deltaRow: -1, deltaCol: 0 },
                    { deltaRow: -2, deltaCol: 0 }];
            }
            else if (tempBoardDragged[row + 1][col].hasOwnProperty(ind)) {
                game.blockDeltas = [
                    { deltaRow: -1, deltaCol: 0 },
                    { deltaRow: 1, deltaCol: 0 }];
            }
            game.isVertical = true;
        }
        else if (tempBoardDragged[row + 1][col].hasOwnProperty(ind)) {
            // down
            if (tempBoardDragged[row + 2][col].hasOwnProperty(ind)) {
                game.blockDeltas = [
                    { deltaRow: 1, deltaCol: 0 },
                    { deltaRow: 2, deltaCol: 0 }];
            }
            else if (tempBoardDragged[row - 1][col].hasOwnProperty(ind)) {
                game.blockDeltas = [
                    { deltaRow: -1, deltaCol: 0 },
                    { deltaRow: 1, deltaCol: 0 }];
            }
            game.isVertical = true;
        }
        else if (tempBoardDragged[row][col - 1].hasOwnProperty(ind)) {
            // left
            if (tempBoardDragged[row][col - 2].hasOwnProperty(ind)) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: -1 },
                    { deltaRow: 0, deltaCol: -2 }];
            }
            else if (tempBoardDragged[row][col + 1].hasOwnProperty(ind)) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: -1 },
                    { deltaRow: 0, deltaCol: 1 }];
            }
        }
        else if (tempBoardDragged[row][col + 1].hasOwnProperty(ind)) {
            //right
            if (tempBoardDragged[row][col + 2].hasOwnProperty(ind)) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: 1 },
                    { deltaRow: 0, deltaCol: 2 }];
            }
            else if (tempBoardDragged[row][col - 1].hasOwnProperty(ind)) {
                game.blockDeltas = [
                    { deltaRow: 0, deltaCol: -1 },
                    { deltaRow: 0, deltaCol: 1 }];
            }
        }
    }
    // Helper Function: compute the hightest indication in specific cell
    function computeIndicationAndLayer(row, col) {
        var ind = -1;
        var layer = 0;
        for (var key in game.boardDragged[row][col]) {
            if (game.boardDragged[row][col].hasOwnProperty(key)) {
                if (parseInt(key) > ind) {
                    ind = parseInt(key);
                }
            }
            layer++;
        }
        return { ind: ind, layer: layer };
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
            var layer = draggingStartedRowCol.layer;
            game.draggingPiece = document.getElementById("MyPieceBoard_" + layer + "_Layer" + draggingStartedRowCol.row + "x" + draggingStartedRowCol.col);
            // set the dragging piece
            game.draggingPiece.style['z-index'] = 100;
            //draggingPiece.style.background = "pink";
            // get the html element of the neighbors of draggingPiece
            for (var i = 0; i < game.blockDeltas.length; i++) {
                var newRow = draggingStartedRowCol.row + game.blockDeltas[i].deltaRow;
                var newCol = draggingStartedRowCol.col + game.blockDeltas[i].deltaCol;
                var exactLayer = findExactLayer(newRow, newCol, draggingStartedRowCol.indication);
                var newhtml = document.getElementById("MyPieceBoard_" + exactLayer + "_Layer" + newRow + "x" + newCol);
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
            // if(needToSettle) {
            //     draggingPiece.style['z-index'] = -1;
            // } else {
            //     draggingPiece.style['z-index'] = 100;
            // } 
            game.draggingPiece.style['z-index'] = 100;
        }
        else {
            size = getSquareWidthHeight();
        }
        for (var i = 0; i < game.draggingPieceGroup.length; i++) {
            // draggingPieceGroup[i].style['width'] = size.width;
            // draggingPieceGroup[i].style['height'] = size.height;
            if (game.needToSettle) {
                game.draggingPieceGroup[i].style['z-index'] = 60;
            }
            else {
                game.draggingPieceGroup[i].style['z-index'] = 100;
                game.draggingPieceGroup[i].style['width'] = size.width;
                game.draggingPieceGroup[i].style['height'] = size.height;
            }
        }
    }
    // Helper Function: set the top left of the draggingPiece group
    function setDraggingPieceGroupTopLeft(draggingPieceCurTopLeft, isInBoard) {
        var size;
        var originalSize;
        var originalTopLeft;
        if (game.needToShrink) {
            size = game.preparedSquareSize;
        }
        else {
            size = game.boardSquareSize;
        }
        if (isInBoard) {
            setDraggingPieceTopLeft(game.draggingPiece, draggingPieceCurTopLeft, getSquareTopLeft(game.draggingStartedRowCol.row, game.draggingStartedRowCol.col));
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
        if (game.isVertical) {
            // Piece is vertical 
            if (dest === "PREPARED") {
                // from board to prepared area
                return;
            }
            else {
                // from board to board
                if (isTouchTheCentralCell(from, to) && isRotateOperation()) {
                    game.isVertical = false;
                    rotatePiece(from, to);
                }
                else {
                    movePieceToBoard(from, to);
                }
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
                if (from.isInBoard) {
                    if (isTouchTheCentralCell(from, to) && isRotateOperation()) {
                        // from board to board: rotate piece
                        game.isVertical = true;
                        rotatePiece(from, to);
                    }
                    else {
                        // from board to board
                        movePieceToBoard(from, to);
                    }
                }
                else {
                    // from prepared to board
                    movePieceToBoard(from, to);
                }
            }
        }
    }
    function isTouchTheCentralCell(from, to) {
        if (from.row != to.row || from.col != to.col) {
            return false;
        }
        if (game.blockDeltas[0].deltaCol === -1 && game.blockDeltas[1].deltaCol === 1 && !game.isVertical) {
            return true;
        }
        if (game.blockDeltas[0].deltaRow === -1 && game.blockDeltas[1].deltaRow === 1 && game.isVertical) {
            return true;
        }
        return false;
    }
    function isRotateOperation() {
        if (game.touchEndTime - game.touchStartTime > 150) {
            return false;
        }
        return true;
    }
    function rotatePiece(from, to) {
        game.indication++;
        game.boardDragged[to.row][to.col][game.indication] = game.boardDragged[from.row][from.col][from.indication];
        if (game.isVertical) {
            var newBlockDeltas = [
                { deltaRow: 1, deltaCol: 0 },
                { deltaRow: -1, deltaCol: 0 }];
            if (isInsideBoard(to.row, to.col, newBlockDeltas)) {
                for (var i = 0; i < game.blockDeltas.length; i++) {
                    var oldRow = from.row + game.blockDeltas[i].deltaRow;
                    var oldCol = from.col + game.blockDeltas[i].deltaCol;
                    var color = game.boardDragged[oldRow][oldCol][from.indication];
                    var newRow = to.row + newBlockDeltas[i].deltaRow;
                    var newCol = to.col + newBlockDeltas[i].deltaCol;
                    game.boardDragged[newRow][newCol][game.indication] = color;
                }
            }
            else {
                for (var i = 0; i < game.blockDeltas.length; i++) {
                    var oldRow = from.row + game.blockDeltas[i].deltaRow;
                    var oldCol = from.col + game.blockDeltas[i].deltaCol;
                    var color = game.boardDragged[oldRow][oldCol][from.indication];
                    var newRow = to.row + game.blockDeltas[i].deltaRow;
                    var newCol = to.col + game.blockDeltas[i].deltaCol;
                    game.boardDragged[newRow][newCol][game.indication] = color;
                }
            }
        }
        else {
            var newBlockDeltas = [
                { deltaRow: 0, deltaCol: -1 },
                { deltaRow: 0, deltaCol: 1 }];
            if (isInsideBoard(to.row, to.col, newBlockDeltas)) {
                for (var i = 0; i < game.blockDeltas.length; i++) {
                    var oldRow = from.row + game.blockDeltas[i].deltaRow;
                    var oldCol = from.col + game.blockDeltas[i].deltaCol;
                    var color = game.boardDragged[oldRow][oldCol][from.indication];
                    var newRow = to.row + newBlockDeltas[i].deltaRow;
                    var newCol = to.col + newBlockDeltas[i].deltaCol;
                    game.boardDragged[newRow][newCol][game.indication] = color;
                }
            }
            else {
                for (var i = 0; i < game.blockDeltas.length; i++) {
                    var oldRow = from.row + game.blockDeltas[i].deltaRow;
                    var oldCol = from.col + game.blockDeltas[i].deltaCol;
                    var color = game.boardDragged[oldRow][oldCol][from.indication];
                    var newRow = to.row + game.blockDeltas[i].deltaRow;
                    var newCol = to.col + game.blockDeltas[i].deltaCol;
                    game.boardDragged[newRow][newCol][game.indication] = color;
                }
            }
        }
        // clear the color in the original place
        clearOriginalPieceInBoard(from);
        //     if (isInsideBoard(to.row, to.col, blockDeltas)) {
        //     indication++;
        //     if (from.isInBoard) {
        //         boardDragged[to.row][to.col][indication] = boardDragged[from.row][from.col][from.indication];
        //     } else {
        //         boardDragged[to.row][to.col][indication] = state.preparedBox[from.row][from.col];
        //     }
        //     for (let i = 0; i < blockDeltas.length; i++) {
        //         let oldRow = from.row + blockDeltas[i].deltaRow;
        //         let oldCol = from.col + blockDeltas[i].deltaCol;
        //         let color: string;
        //         if (from.isInBoard) {
        //             color = boardDragged[oldRow][oldCol][from.indication];
        //         } else {
        //             color = state.preparedBox[oldRow][oldCol];
        //         }
        //         let newRow = to.row + blockDeltas[i].deltaRow;
        //         let newCol = to.col + blockDeltas[i].deltaCol;
        //         boardDragged[newRow][newCol][indication] = color;
        //     }
        //     // clear the color in the original place
        //     if (from.isInBoard) {
        //         clearOriginalPieceInBoard(from);
        //     } else {
        //         clearOriginalPieceInPrepared(from);
        //     }
        // } else {
        //     return;
        // }
    }
    function movePieceToPrepared(from, to) {
        if (game.blockDeltas[0].deltaCol === 1 && game.blockDeltas[1].deltaCol === 2) {
            setPieceToFitPreparedArea(from, to, 0, [0, 1, 2]);
        }
        else if (game.blockDeltas[0].deltaCol === -1 && game.blockDeltas[1].deltaCol === 1) {
            setPieceToFitPreparedArea(from, to, 1, [0, -1, 1]);
        }
        else if (game.blockDeltas[0].deltaCol === -2 && game.blockDeltas[1].deltaCol === -1) {
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
                var oldCol = from.col + game.blockDeltas[i].deltaCol;
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
        delete game.boardDragged[from.row][from.col][from.indication];
        for (var i = 0; i < game.blockDeltas.length; i++) {
            var oldRow = from.row + game.blockDeltas[i].deltaRow;
            var oldCol = from.col + game.blockDeltas[i].deltaCol;
            // clear the color in the original place
            delete game.boardDragged[oldRow][oldCol][from.indication];
        }
    }
    function clearOriginalPieceInPrepared(from) {
        game.state.preparedBox[from.row][from.col] = '';
        var _loop_1 = function(i) {
            var oldRow = from.row + game.blockDeltas[i].deltaRow;
            var oldCol = from.col + game.blockDeltas[i].deltaCol;
            // clear the color in the original place
            //$timeout(function() {getPreparedBoxColor(oldRow, oldCol);},100);
            game.state.preparedBox[oldRow][oldCol] = '';
            $timeout(function () { game.state.preparedBox[oldRow][oldCol] = ''; }, 100);
        };
        for (var i = 0; i < game.blockDeltas.length; i++) {
            _loop_1(i);
        }
    }
    // Helper Function: initialize the boardDragged
    function getInitialBoardDragged() {
        for (var i = 0; i < gameLogic.ROWS; i++) {
            game.boardDragged[i] = [];
            for (var j = 0; j < gameLogic.COLS; j++) {
                // put the original color of the board into boardDragged
                // use the map datastructure to store the layer
                game.boardDragged[i][j] = {};
            }
        }
    }
    // // Helper Function: initialize the boardRotated
    // function getInitialBoardRotated() {
    //     for (let i = 0; i < gameLogic.ROWS; i++) {
    //         boardRotated[i] = [];
    //         for (let j = 0; j < gameLogic.COLS; j++) {
    //             // put the original color of the board into boardRotated
    //             // use the map datastructure to store the layer and the rotated direction
    //             boardRotated[i][j] = {};
    //             // boardRotated[i][j] = {0: false};
    //         }
    //     }
    // }
    function getSquareWidthHeight() {
        game.boardSquareSize = { height: game.boardArea.clientWidth / game.colsNum, width: game.boardArea.clientWidth / game.rowsNum };
        return {
            height: game.boardArea.clientWidth / game.colsNum,
            width: game.boardArea.clientWidth / game.rowsNum
        };
    }
    function getSquareWidthHeightSmall() {
        return {
            height: game.boardArea.clientWidth / game.colsNum * 0.96,
            width: game.boardArea.clientWidth / game.rowsNum * 0.96
        };
    }
    function getSquareWidthHeight_Box() {
        game.preparedSquareSize = { height: game.boardArea.clientWidth * 0.9 / game.colsBox, width: game.boardArea.clientWidth * 0.9 / game.colsBox };
        return {
            height: game.boardArea.clientWidth * 0.9 / game.colsBox,
            width: game.boardArea.clientWidth * 0.9 / game.colsBox
        };
    }
    function getInitialAllBoardLayer() {
        for (var i = 0; i < gameLogic.ROWS; i++) {
            game.boardLayer1[i] = [];
            game.boardLayer2[i] = [];
            game.boardLayer3[i] = [];
            for (var j = 0; j < gameLogic.COLS; j++) {
                game.boardLayer1[i][j] = '';
                game.boardLayer2[i][j] = '';
                game.boardLayer3[i][j] = '';
            }
        }
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
    // UI operation
    function shouldShowImage(row, col) {
        var cell = game.state.board[row][col];
        //log.info(typeof state);
        //log.info("this is the cell, row: " + row + " col: " + col + " color: " + cell);
        return game.state.board[row][col] !== '';
    }
    game.shouldShowImage = shouldShowImage;
    function shouldShowImage_Box(row, col) {
        var cell = game.state.preparedBox[row][col];
        //log.info("this is the cell, row: " + row + " col: " + col + " color: " + state.preparedBox[row][col]);
        return cell !== '';
    }
    game.shouldShowImage_Box = shouldShowImage_Box;
    function shouldSlowlyAppear(row, col) {
        // return state.delta &&
        //     state.delta.row === row && state.delta.col === col;
        return true;
    }
    game.shouldSlowlyAppear = shouldSlowlyAppear;
    function getBoardBoxColor(row, col) {
        var cellStyle = game.state.board[row][col];
        return cellStyle;
    }
    game.getBoardBoxColor = getBoardBoxColor;
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
        else {
            return "grey";
        }
    }
    game.getPreparedBoxColor = getPreparedBoxColor;
    function getBoardColorAt_1_Layer(row, col) {
        var color = game.boardLayer1[row][col];
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
        else {
            return "grey";
        }
    }
    game.getBoardColorAt_1_Layer = getBoardColorAt_1_Layer;
    function getBoardColorAt_2_Layer(row, col) {
        return game.boardLayer2[row][col];
    }
    game.getBoardColorAt_2_Layer = getBoardColorAt_2_Layer;
    function getBoardColorAt_3_Layer(row, col) {
        return game.boardLayer3[row][col];
    }
    game.getBoardColorAt_3_Layer = getBoardColorAt_3_Layer;
    function getBoardColorAt_1_LayerShow(row, col) {
        return true;
    }
    game.getBoardColorAt_1_LayerShow = getBoardColorAt_1_LayerShow;
    function getOpponentPlayerScore() {
        return game.state.currentScores[game.currentUpdateUI.yourPlayerIndex];
    }
    game.getOpponentPlayerScore = getOpponentPlayerScore;
    function getCurrentPlayerScore() {
        var opponentPlayerIndex = 1 - game.currentUpdateUI.yourPlayerIndex;
        return game.state.currentScores[opponentPlayerIndex];
    }
    game.getCurrentPlayerScore = getCurrentPlayerScore;
    function getCurrentTurn() {
        return 11 - Math.floor(game.state.currentTurn / 2);
    }
    game.getCurrentTurn = getCurrentTurn;
})(game || (game = {}));
angular.module('myApp', ['gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
// export function isPieceR(row: number, col: number): boolean {      
//     return state.board[row][col] === 'R';
// }
// export function isPieceG(row: number, col: number): boolean {
//     //log.info(state.board[row][col] === 'G');
//     return state.board[row][col] === 'G';
// }
// export function isPieceB(row: number, col: number): boolean {
//     return state.board[row][col] === 'B';
// }
// export function isPieceY(row: number, col: number): boolean {
//     return state.board[row][col] === 'Y';
// } 
// export function isPieceR_Box(row: number, col: number): boolean {
//     return state.preparedBox[row][col] === 'R';
// }
// export function isPieceG_Box(row: number, col: number): boolean {
//     return state.preparedBox[row][col] === 'G';
// }
// export function isPieceB_Box(row: number, col: number): boolean {
//     return state.preparedBox[row][col] === 'B';
// }
// export function isPieceY_Box(row: number, col: number): boolean {
//     return state.preparedBox[row][col] === 'Y';
// }  
// what is updateUI, what is playmode
// use enum to notate the right, left, top and down
//TODO set draggin'S params CAN BE OPTIMIZED
// map in the dragged board is a pit, delete may not work
// TODO Z-INDEX need to do better, RECOMPUTE
//TODO to compute the pass
//TODO translation initialize
// optimize compute delta in board
// optimize map datastructure by length in each cell {length: 1}
// clear board cell in original place 
//# sourceMappingURL=game.js.map