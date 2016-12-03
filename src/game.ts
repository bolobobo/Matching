interface SupportedLanguages {
    en: string, zh: string,
};

interface Translations {
    [index: string]: SupportedLanguages;
}

interface TopLeft {
    top: number;
    left: number;
}

interface Size {
    height: number;
    width: number;
}

module game {
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    // basic configuration
    export let currentUpdateUI: IUpdateUI = null;
    export let didMakeMove: boolean = false; // You can only make one move per updateUI
    export let animationEndedTimeout: ng.IPromise<any> = null;
    export let state: IState = null;


    // Record the status of the boardArea and the preparedBox area during every update
    export let gameArea: HTMLElement;
    export let boardArea: HTMLElement;
    export let gamePrepare: HTMLElement;
    export let blockDeltas: any = [];
    // export let blockDeltasRotated: any = [];
    export let rowsNum: number = 8;
    export let colsNum: number = 8;
    export let rowsBox: number = 3;
    export let colsBox: number = 9;
    export let boardSquareSize: Size;
    export let preparedSquareSize: Size;

    export let nextZIndex: number = 61;
    export let draggingStartedRowCol: any = null;
    export let draggingPiece: any = null;
    export let draggingPieceGroup: any[] = [];
    export let boardDragged: any = []; // to record which box has been moved to the board
    export let indication: number; // to indicate the cells in the same box when they are moved to board
    export let needToShrink: boolean = false; // At begginning, do not need to Shrink
    /**
     * Register for the turnBasedService3.js file 
     */
    export function init() {
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
        

        gameArea = document.getElementById("gameArea");
        boardArea = document.getElementById("boardArea");
        gamePrepare = document.getElementById("gamePrepare");
        getInitialBoardDragged(); // initialize the boardDragged
        getSquareWidthHeight();
        getSquareWidthHeight_Box();
        indication = 0;
        dragAndDropService.addDragListener("boardArea", handleDragEvent);
    }  

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
    function handleDragEvent(type: any, clientX: any, clientY: any) {
        // Center point in gameArea
        let x = clientX - boardArea.offsetLeft - gameArea.offsetLeft;
        let y = clientY - boardArea.offsetTop - gameArea.offsetTop;

        // Is the touch in the whole board area?
        if (x < 0 || y < 0 || x >= boardArea.clientWidth || y >= boardArea.clientHeight) {
            if (!draggingPiece) {
                // The start touch is in a valid area, ignore it
                return;
            } else {
                // The finger is in the piece, but the touch is in a invalid area 
                // Drag the piece where the touch is (without snapping to a square). 
                // Just to show the drag position
                // do not need to shrink the size of the cell
                setDraggingPieceGroupTopLeft({top: y - boardSquareSize.height / 2, left: x - boardSquareSize.width / 2}, needToShrink, draggingStartedRowCol.isInBoard);
            }
        } else {
            // the first touch in the board but not in the prepared area
            if (!draggingPiece && y < boardArea.clientWidth + boardArea.clientWidth*0.0375) {
                // TODO: START FROM BOARD TO BOARD OR FROM BOARD TO PREPARED
                return;
            }
            if (draggingPiece && y < boardArea.clientWidth + boardArea.clientWidth*0.0375) {
                //TODO: FROM BOARD TO BOARD AND FROM BOARD TO PREPARED
                // MOVE FROM EVERYWHERE
                // 1: the drag in the board part

                // drag start

                // drag continue


                // drag ended


            } else {
                // Position: Inside prepared box area. Let's find the containing square's row and col
                let col = Math.floor(colsBox * x / boardArea.clientWidth) % rowsBox;
                let row = Math.floor(rowsBox * x / boardArea.clientWidth);
                
                if (type === "touchstart" && !draggingStartedRowCol) {
                    // drag started
                    log.info("drag start AT PREPARED.");
                    draggingStartedRowCol = {row: row, col: col, isInBoard: false, isVertical: false, indication: -1};
                    computeBlockDeltas(draggingStartedRowCol, draggingStartedRowCol.isInBoard);
                    createDraggingPieceGroup(draggingStartedRowCol);
                    setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(row, col), needToShrink, draggingStartedRowCol.isInBoard);
                }
                if (!draggingPiece) {
                    return;
                }

                if (type === "touchend") {
                    let from = draggingStartedRowCol;
                    let to = {row: row, col: col};
                    //dragDone(from, to, "PREPARED");
                } else {
                    // Drag continue
                    setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(row, col), false, draggingStartedRowCol.isInBoard);
                } 
            }
        } 

        // If the drag is outside the legal board, it should return to the original position
        if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            // drag ended
            // return the piece to it's original style (then angular will take care to hide it).
            if (!draggingStartedRowCol.isInBoard) {
                needToShrink = true;
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(draggingStartedRowCol.row, draggingStartedRowCol.col), 
                needToShrink, draggingStartedRowCol.isInBoard);
                setDraggingPieceGroupStyle();
            } else {
                needToShrink = false;
                setDraggingPieceGroupTopLeft(getSquareTopLeft(draggingStartedRowCol.row, draggingStartedRowCol.col), 
                needToShrink, draggingStartedRowCol.isInBoard);
                
            }
            // clear the draggingPiece every time when ended
            draggingStartedRowCol = null;
            draggingPiece = null;
            draggingPieceGroup = [];
            blockDeltas = [];
            needToShrink = false;
        }  
    }

    // Helper Function: to find the neighbor cells related to the finger-pointed cell
    function computeBlockDeltas(draggingStartedRowCol: any, isInBoard: boolean): any {
        if (!isInBoard) {
            if (draggingStartedRowCol.col === 0) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: 1},
                {deltaRow: 0, deltaCol: 2}];
            } else if (draggingStartedRowCol.col === 1) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: -1},
                {deltaRow: 0, deltaCol: 1}];
            } else if (draggingStartedRowCol.col === 2) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: -2},
                {deltaRow: 0, deltaCol: -1}];
            }
        } else {
            computeBlockDeltasInBoard(draggingStartedRowCol);
        }
    }
    
    // TODO: this function is too silly
    function computeBlockDeltasInBoard(draggingStartedRowCol: any) {
        let row = draggingStartedRowCol.row + 2;
        let col = draggingStartedRowCol.col + 2;
        let value = draggingStartedRowCol.indication;

        if (boardDragged[row-1][col] === value) {
            // up 
            if (boardDragged[row-2][col] === value) {
                blockDeltas = [
                {deltaRow: -1, deltaCol: 0},
                {deltaRow: -2, deltaCol: 0}];
            } else if (boardDragged[row+1][col] === value) {
                blockDeltas = [
                {deltaRow: -1, deltaCol: 0},
                {deltaRow: 1, deltaCol: 0}];
            }
        } else if (boardDragged[row+1][col] === value) {
            // down
            if (boardDragged[row+2][col] === value) {
                blockDeltas = [
                {deltaRow: 1, deltaCol: 0},
                {deltaRow: 2, deltaCol: 0}];               
            } else if (boardDragged[row-1][col] === value) {
                blockDeltas = [
                {deltaRow: -1, deltaCol: 0},
                {deltaRow: 1, deltaCol: 0}];                  
            }
        } else if (boardDragged[row][col-1] === value) {
            // left
            if (boardDragged[row][col-2] === value) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: -1},
                {deltaRow: 0, deltaCol: -2}];    
            } else if (boardDragged[row][col+1] === value) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: -1},
                {deltaRow: 0, deltaCol: 1}];  
            }
        } else if (boardDragged[row][col+1] == value) {
            //right
            if (boardDragged[row][col+2] === value) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: 1},
                {deltaRow: 0, deltaCol: 2}];  
            } else if (boardDragged[row][col-1] === value) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: -1},
                {deltaRow: 0, deltaCol: 1}];  
            }
        }   
    }


    // Helper Function: to get the HTMLElement of draggingPiece's neighbors
    function createDraggingPieceGroup(draggingStartedRowCol: any) {
        // If the start dragging positon is in the preparedBox area
        if (!draggingStartedRowCol.isInBoard) {

            // set the dragging piece
            draggingPiece = document.getElementById("MyPieceBox" + draggingStartedRowCol.row + "x" + draggingStartedRowCol.col);
            draggingPiece.style['z-index'] = 100;
            draggingPiece.style['width'] = boardArea.clientWidth/8.0;
            draggingPiece.style['height'] = boardArea.clientWidth/ 8.0;

            // get the html element of the neighbors of draggingPiece
            for (let i = 0; i < blockDeltas.length; i++) {
                let newRow = draggingStartedRowCol.row + blockDeltas[i].deltaRow;
                let newCol = draggingStartedRowCol.col + blockDeltas[i].deltaCol;
                let newhtml: any = document.getElementById("MyPieceBox" + newRow + "x" + newCol);
                draggingPieceGroup[i] = newhtml;
            }
            // set the css style of the neighbors of draggingPiece
            setDraggingPieceGroupStyle();

        } else {
            // If the start dragging position is in the board area
            draggingPiece = document.getElementById("MyPiece" + draggingStartedRowCol.row + "x" + draggingStartedRowCol.col);
            // set the dragging piece
            draggingPiece.style['z-index'] = 100;

            // get the html element of the neighbors of draggingPiece
            for (let i = 0; i < blockDeltas.length; i++) {
                let newRow = draggingStartedRowCol.row + blockDeltas[i].deltaRow;
                let newCol = draggingStartedRowCol.col + blockDeltas[i].deltaCol;
                let newhtml: any = document.getElementById("MyPiece" + newRow + "x" + newCol);
                newhtml.style['z-index'] = 100;
                draggingPieceGroup[i] = newhtml;
            }
        }
    }

    // Helper Function: Change the UI of the dragging Piece, from big to small or otherwize
    function setDraggingPieceGroupStyle() {
        let size: Size;
        if (needToShrink) {
            size = getSquareWidthHeight_Box();
            draggingPiece.style['width'] = size.width;
            draggingPiece.style['height'] = size.height;
            draggingPiece.style['z-index'] = 100;
        } else {
            size = getSquareWidthHeight();
        }

        for (let i = 0; i < draggingPieceGroup.length; i++) {
            draggingPieceGroup[i].style['width'] = size.width;
            draggingPieceGroup[i].style['height'] = size.height;
            draggingPieceGroup[i].style['z-index'] = 100;
        }
    }

    // Helper Function: set the top left of the draggingPiece group
    function setDraggingPieceGroupTopLeft(draggingPieceCurTopLeft: TopLeft, needToShrink: boolean, isInBoard: boolean) {
        
        let size: any;
        let originalSize: any;
        let originalTopLeft: TopLeft;
        if (needToShrink) {
            size = preparedSquareSize;
        } else {
            size = boardSquareSize;
        }

        if (isInBoard) {
            setDraggingPieceTopLeft(draggingPiece,  draggingPieceCurTopLeft, getSquareTopLeft_Box(draggingStartedRowCol.row, draggingStartedRowCol.col));
            originalTopLeft = getSquareTopLeft(draggingStartedRowCol.row, draggingStartedRowCol.col);
            originalSize = boardSquareSize;
        } else {
            setDraggingPieceTopLeft(draggingPiece,  draggingPieceCurTopLeft, getSquareTopLeft_Box(draggingStartedRowCol.row, draggingStartedRowCol.col));
            originalTopLeft = getSquareTopLeft_Box(draggingStartedRowCol.row, draggingStartedRowCol.col);
            originalSize = preparedSquareSize;
        }
        for(let i = 0; i < blockDeltas.length; i++) {
            let originalTop = originalTopLeft.top + blockDeltas[i].deltaRow * originalSize.height;
            let originalLeft = originalTopLeft.left + blockDeltas[i].deltaCol * originalSize.width;
            let top = draggingPieceCurTopLeft.top + blockDeltas[i].deltaRow * size.height;
            let left = draggingPieceCurTopLeft.left + blockDeltas[i].deltaCol * size.width;
            setDraggingPieceTopLeft(draggingPieceGroup[i], {top: top, left: left}, {top: originalTop, left: originalLeft});
        }
    }

    function setDraggingPieceTopLeft(piece: any, topLeft: TopLeft, originalTopLeft: TopLeft) {
        piece.style.left = topLeft.left - originalTopLeft.left;
        piece.style.top = topLeft.top - originalTopLeft.top;
    }

    function getSquareTopLeft(row: number, col: number): TopLeft {
        let size = getSquareWidthHeight();
        return {top: row * size.height, left: col * size.width};
    }

    function getSquareTopLeft_Box(row: number, col: number): TopLeft {
        let size = getSquareWidthHeight_Box();
        return {top: boardArea.clientHeight * 0.91, left: row * boardArea.clientWidth * 0.35 + col * size.width};
    }
    

    // Helper Funciton: do the drag done, clear the color in original place and put color in the new place
    function dragDone(from: any, to: any, dest: string) {
        let flag = "Failed";
        // Update piece in board
        if (from.isVertical) {
            // Piece is vertical 
            if (dest === "PREPARED") {
                // from board to prepared area
                return;
            } else {
                // from board to board
                movePieceFromBoardToBoard(from, to);
            }
        } else {
            // Piece is horizontal
            if (from.isInBoard) {
                if (dest === "PREPARED") {
                    // from board to prepared area
                    if (state.preparedBox[to.row][to.col]) {
                        // the prepared box already has color
                        return;
                    } else {

                    }
                } else {
                    // from board to board
                    movePieceFromBoardToBoard(from, to);
                }
            } else {

            }

        }

        state.preparedBox[from.row][from.col] = null;
        state.preparedBox[to.row][to.col] = 'O';

        let msg = "Dragged piece " + from.row + "x" + from.col + " to square " + to.row + "x" + to.col + " is " + flag;
        log.info(msg);
    }

    function movePieceFromBoardToBoard(from: any, to: any) {
        if (isInsideBoard(to.row, to.col, blockDeltas)) {
            indication++;
            boardDragged[to.row][to.col][indication] = boardDragged[from.row][from.col][from.indication];
            boardDragged[from.row][from.col].delete(from.indication);
            for (let i = 0; i < blockDeltas.length; i++) {
                let oldRow = from.row + blockDeltas[i].deltaRow;
                let oldCol = from.row + blockDeltas[i].deltaCol;
                let color = boardDragged[oldRow][oldCol][from.indication];
                
                let newRow = to.row + blockDeltas[i].deltaRow;
                let newCol = to.col + blockDeltas[i].deltaCol;
                boardDragged[newRow][newCol][indication] = color;
                // clear the color in the original place
                boardDragged[oldRow][oldCol].delete(from.indication);
            }
        } else {
            return;
        }
    }








    // Helper Function: initialize the boardDragged
    function getInitialBoardDragged() {
        // extend the board to initialize the boundary
        for (let i = 0; i < gameLogic.ROWS + 2; i++) {
            boardDragged[i] = [];
            for (let j = 0; j < gameLogic.COLS + 2; j++) {
                // every cell in boardDragged is a map datastructure
                // the key is the indication, so the initial value is 0
                boardDragged[i][j] = { 0: ''};
            }
        }

        for (let i = 0; i < gameLogic.ROWS; i++) {
            for (let j = 0; j < gameLogic.COLS; j++) {
                boardDragged[i+2][j+2][0]= state.board[i][j];
            }
        }
    }

    function getSquareWidthHeight(): Size {
        boardSquareSize = {height: boardArea.clientWidth / colsNum, width: boardArea.clientWidth / rowsNum};
        return {
          height: boardArea.clientWidth / colsNum,
          width: boardArea.clientWidth / rowsNum
        };
    }

    function getSquareWidthHeight_Box(): Size {
        preparedSquareSize =  {height: boardArea.clientWidth * 0.9 / colsBox, width: boardArea.clientWidth * 0.9 / colsBox};
        return {
          height: boardArea.clientWidth * 0.9 / colsBox,
          width: boardArea.clientWidth * 0.9 / colsBox
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
    function isInsideBoard(row: number, col: number, blockDeltas: any) {
        for (let i = 0; i < blockDeltas.length; i++) {
          let delta = blockDeltas[i];
          let r_neighbor = row + delta.deltaRow;
          let c_neighbor = col + delta.deltaCol;
          if (r_neighbor < 0 || r_neighbor >= rowsNum || c_neighbor < 0 || c_neighbor >= colsNum) {
            return false;
          }
        }
        return true;
    }











//------------------------------------------------------------------------------------------------

    /**
     * Define the different translation of the rule of the game
     */
    function getTranslations(): Translations {
        return {};
    }

    /**
     * When you intialize the game OR make a update of the game UI, should call this function.
     */
    export function updateUI(params: IUpdateUI): void {
        log.info("Game got updateUI:", params);
        didMakeMove = false; // only one move per updateUI
        currentUpdateUI = params;
        clearAnimationTimeout();
        state = params.move.stateAfterMove;
        if (isFirstMove()) {
            state = gameLogic.getInitialState();
            if (isMyTurn()) makeMove(gameLogic.createInitialMove());
        } else {
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            animationEndedTimeout = $timeout(animationEndedCallback, 500);
        }
    }

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
    function makeMove(move: IMove) {
        log.log("this is make move");
        if (didMakeMove) {
            return;
        }
        didMakeMove = true;
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
        if (animationEndedTimeout) {
            $timeout.cancel(animationEndedTimeout);
            animationEndedTimeout = null;
        }
    }

    // function animationEndedCallback() {
    //     log.info("Animation ended");
    //     maybeSendComputerMove();
    // }


    function isFirstMove() {
        log.log("this is the first move");
        return !currentUpdateUI.move.stateAfterMove;
    }

    function isMyTurn() {
        return !didMakeMove && // you can only make one move per updateUI.
            currentUpdateUI.move.turnIndexAfterMove >= 0 && // game is ongoing
            currentUpdateUI.yourPlayerIndex === currentUpdateUI.move.turnIndexAfterMove; // it's my turn
    }



    // UI operation
    export function shouldShowImage(row: number, col: number): boolean {
        let cell = state.board[row][col];
        //log.info(typeof state);
        //log.info("this is the cell, row: " + row + " col: " + col + " color: " + cell);
        return true;
    }

    export function isPieceR(row: number, col: number): boolean {      
        return state.board[row][col] === 'R';
    }

    export function isPieceG(row: number, col: number): boolean {
        //log.info(state.board[row][col] === 'G');
        return state.board[row][col] === 'G';
    }

    export function isPieceB(row: number, col: number): boolean {
        return state.board[row][col] === 'B';
    }

    export function isPieceY(row: number, col: number): boolean {
        return state.board[row][col] === 'Y';
    }  

    export function shouldShowImage_Box(row: number, col: number): boolean {
        let cell = state.board[row][col];
        //log.info("this is the cell, row: " + row + " col: " + col + " color: " + state.preparedBox[row][col]);
        return true;
    }
    export function isPieceR_Box(row: number, col: number): boolean {
        return state.preparedBox[row][col] === 'R';
    }

    export function isPieceG_Box(row: number, col: number): boolean {
        return state.preparedBox[row][col] === 'G';
    }

    export function isPieceB_Box(row: number, col: number): boolean {
        return state.preparedBox[row][col] === 'B';
    }

    export function isPieceY_Box(row: number, col: number): boolean {
        return state.preparedBox[row][col] === 'Y';
    } 

    // export function shouldSlowlyAppear(row: number, col: number): boolean {
    //     return state.delta &&
    //         state.delta.row === row && state.delta.col === col;
    // }

    export function getPreparedBoxColor(row: number, col: number): string {
        let color = state.preparedBox[row][col];
        if (color === 'R') {
            return "rgb(255, 128, 170)";
        } else if (color === 'G') {
            return "rgb(71, 209, 71)";
        } else if (color === 'B') {
            return "rgb(51, 204, 255)";
        } else if (color === 'Y') {
            return "rgb(246, 246, 85)";
        }
    }
}

angular.module('myApp', ['gameServices'])
  .run(function () {
    $rootScope['game'] = game;
    game.init();
  });



// what is updateUI, what is playmode

// use enum to notate the right, left, top and down

//TODO set draggin'S params CAN BE OPTIMIZED

// map in the dragged board is a pit

// TODO Z-INDEX need to do better

//TODO to compute the pass