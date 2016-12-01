interface SupportedLanguages {
    en: string, zh: string,
};

interface Translations {
    [index: string]: SupportedLanguages;
}
interface DraggingPiece {
    draggingPos: TopLeft;
    blockDeltas: any;
}

interface TopLeft {
    top: number;
    left: number;
}
module game {
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    export let currentUpdateUI: IUpdateUI = null;
    export let didMakeMove: boolean = false; // You can only make one move per updateUI
    export let animationEndedTimeout: ng.IPromise<any> = null;
    export let state: IState = null;
    // TODO: MANY EXTRA

    
    export let gameArea: HTMLElement;
    export let boardArea: HTMLElement;
    export let gamePrepare: HTMLElement;
    //export let clickToDragPiece: HTMLImageElement;
    export let blockDeltas = [
        {deltaRow: 0, deltaCol: -1},
        {deltaRow: 0, deltaCol: 1}];
    export let blockDeltasRotated = [
        {deltaRow: -1, deltaCol: 0},
        {deltaRow: 1, deltaCol: 0}];
    export let rowsNum: number = 8;
    export let colsNum: number = 8;
    export let rowsBox: number = 3;
    export let colsBox: number = 9;
    export let nextZIndex: number = 61;
    export let draggingStartedRowCol: any = null;
    export let draggingPiece: any = null;
    export let draggingPieceNeighbor: any = null;
    export let draggingPieceGroup: any = null;

    /**
     * Register for the turnBasedService3.js
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
        dragAndDropService.addDragListener("boardArea", handleDragEvent);

        gameArea = document.getElementById("gameArea");
        boardArea = document.getElementById("boardArea");
        gamePrepare = document.getElementById("gamePrepare");

        //clickToDragPiece = document.getElementById("clickToDragPiece");
    }  

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
    function handleDragEvent(type: any, clientX: any, clientY: any) {
        // Center point in gameArea
        let x = clientX - boardArea.offsetLeft - gameArea.offsetLeft;
        let y = clientY - boardArea.offsetTop - gameArea.offsetTop;

        //TODO: CLEAR Drag
        // Is the touch in the prepared box area?
        if (x < 0 || y < 0 || x >= boardArea.clientWidth || y >= boardArea.clientHeight) {
            //TODO: if the drag is outside the legal board, it should return to the original position
            log.info("this is the outside preparedBox and board");
            if (!draggingPiece) {
                // The start touch is in a valid area, ignore it
                return;
            } else {
                // the finger is in the piece, but the touch is in a invalid area 
                // Drag the piece where the touch is (without snapping to a square).
                let size = getSquareWidthHeight();
                setDraggingPieceGroupTopLeft({draggingPos: {top: y - size.height / 2, left: x - size.width / 2}, blockDeltas: blockDeltas});
            }
        } else {
            if (!draggingPiece && y < boardArea.clientWidth + boardArea.clientWidth*0.0375 ) {
                return;
            }
            // Inside prepared box area. Let's find the containing square's row and col
            let col = Math.floor(colsBox * x / boardArea.clientWidth) % rowsBox;
            let row = Math.floor(rowsBox * x / boardArea.clientWidth);
            log.info("the box row is: " + row + " col is : " + col);
            if (type === "touchstart" && !draggingStartedRowCol) {
                // drag started
                log.info("drag start");
                draggingStartedRowCol = {row: row, col: col, isInBoard: false};
                blockDeltas = computeBlockDeltas(draggingStartedRowCol);
                draggingPiece = document.getElementById("MyPiece" + draggingStartedRowCol.row + "x" + draggingStartedRowCol.col);
                draggingPieceGroup = createDraggingPieceGroup(draggingStartedRowCol, blockDeltas);
                draggingPiece.style['z-index'] = 100;
                //draggingPiece.style.background= "pink";
                draggingPiece.style['width'] = boardArea.clientWidth/8.0;
                draggingPiece.style['height'] = boardArea.clientWidth/8.0;

            }

            if (!draggingPiece) {
                return;
            }

            if (type === "touchend") {
                var from = draggingStartedRowCol;
                var to = {row: row, col: col};
                //dragDone(from, to);
            } else {
                // Drag continue
                setDraggingPieceTopLeft(getSquareTopLeft(row, col));
            } 
        }   

        //
        if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            // drag ended
            // return the piece to it's original style (then angular will take care to hide it).
            setDraggingPieceTopLeft(getSquareTopLeft(draggingStartedRowCol.row, draggingStartedRowCol.col));
            draggingStartedRowCol = null;
            draggingPiece = null;
        }
    }

    // Helper Function: to find the neighbor cells related to the finger-pointed cell
    function computeBlockDeltas(draggingStartedRowCol: any): any {
        
    }
    
    // Helper Function: to get the HTMLElement of draggingPiece's neighbors
    function createDraggingPieceGroup(draggingStartedRowCol: any, blockDeltas: any) {
        
    }

    // Helper Function: set the top left of the draggingPiece group
    function setDraggingPieceGroupTopLeft(draggingPiece: DraggingPiece) {
        let draggingPos = draggingPiece.draggingPos;
        setDraggingPieceTopLeft(draggingPos);
        for(let i = 0; i < blockDeltas.length; i++) {
            setDraggingPiece
        }
        
    }

    // Helper Function: to judge whether the neighbor cell is in the boardArea
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


    
    function setDraggingPieceTopLeft(topLeft: any) {
        var originalSize = getSquareTopLeft(draggingStartedRowCol.row, draggingStartedRowCol.col);
        draggingPiece.style.left = (topLeft.left - originalSize.left) + "px";
        draggingPiece.style.top = (topLeft.top - originalSize.top) + "px";
    }

    function getSquareTopLeft(row: number, col: number) {
        var size = getSquareWidthHeight();
        return {top: row * size.height, left: col * size.width}
    }

    function getSquareWidthHeight() {
        return {
          width: boardArea.clientWidth / colsNum,
          height: boardArea.clientWidth / rowsNum
        };
    }

    // function getSquareCenterXY(row: number, col: number) {
    //     var size = getSquareWidthHeight();
    //     return {
    //         x: col * size.width + size.width / 2,
    //         y: row * size.height + size.height / 2
    //     };
    // }












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
    export function cellClicked(row: number, col: number, color: string): void {
        log.info("Clicked on cell:", row, col);
        if (window.location.search === "?throwException") { // to test encoding a stack trace with sourcemap
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        let nextMove: IMove = null;
        try {
            nextMove = gameLogic.createMove(state, [{row: row, col: col, color: color}], currentUpdateUI.move.turnIndexAfterMove);
        } catch (e) {
            log.info(["Cell is already full in position:", row, col]);
            return;
        }
        // Move is legal, make it!
        makeMove(nextMove);
    }

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
