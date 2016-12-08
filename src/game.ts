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
    export let needToSettle: boolean = false;
    export let isVertical: boolean = false; // denote the shape of the draggingPieceGroup 
    export let boardLayer1: string[][] = [];
    export let boardLayer2: string[][] = [];
    export let boardLayer3: string[][] = [];
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
        getInitialAllBoardLayer(); // initialize all the boardLayer to store the color of each layer in board
        getSquareWidthHeight();
        getSquareWidthHeight_Box();
        indication = 0;
        dragAndDropService.addDragListener("boardArea", handleDragEvent);
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
            getInitialBoardDragged(); // initialize the boardDragged
            getInitialAllBoardLayer(); // initialize all the boardLayer to store the color of each layer in board
            animationEndedTimeout = $timeout(animationEndedCallback, 500);
        }
    }

    /**
     * When you click the button outside the game area, it will do a move operation and update of the UI
     */
    export function buttonClicked(row: number, col: number, color: string): void {
        log.info("Clicked on button=================");
        if (window.location.search === "?throwException") { // to test encoding a stack trace with sourcemap
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        
        // check the move is valid, the cell is only valid: 
        // 1) each cell in board has no more than one color;
        // 2) all the prepared boxes are on board;
        if (!checkStartMoveIsValid()) {
            alert("the move is invalid");
            return;
        }

        let moves: BoardDelta[] = generateMoves();
        let nextMove: IMove = null;
        try {
            nextMove = gameLogic.createMove(state, moves, currentUpdateUI.move.turnIndexAfterMove);
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

    function isFirstMove() {
        log.log("this is the first move");
        return !currentUpdateUI.move.stateAfterMove;
    }

    function isMyTurn() {
        return !didMakeMove && // you can only make one move per updateUI.
            currentUpdateUI.move.turnIndexAfterMove >= 0 && // game is ongoing
            currentUpdateUI.yourPlayerIndex === currentUpdateUI.move.turnIndexAfterMove; // it's my turn
    }


//------------------------------------------------------------------------------------------------
    // TODO: ADD OHTHER CONDITIONS
    function checkStartMoveIsValid(): boolean {
        for (let i = 0; i < gameLogic.ROWS; i++) {
            for (let j = 0; j < gameLogic.COLS; j++) {
                if (computeLength(i, j) > 1) {
                    return false;
                }
            }
        }
        return true;
    }

    function generateMoves(): BoardDelta[] {
        let moves: BoardDelta[] = [];
        let index: number = 0;
        for (let i = 0; i < gameLogic.ROWS; i++) {
            for (let j = 0; j < gameLogic.COLS; j++) {
                if (computeLength(i, j) !== 0) {
                    for (let key in boardDragged[i][j]) {
                        moves[index] = {row: i, col: j, color: boardDragged[i][j][key]};
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
                setDraggingPieceGroupTopLeft({top: y - boardSquareSize.height / 2, left: x - boardSquareSize.width / 2}, draggingStartedRowCol.isInBoard);
            }
        } else if (y < boardArea.clientWidth + boardArea.clientWidth*0.0375) {
                // the touch in the board area but not in the prepared area
                // Position: Inside board box area. Let's find the containing square's row and col
                let row = Math.floor(rowsNum * y / boardArea.clientWidth);
                let col = Math.floor(colsNum * x / boardArea.clientWidth);
                log.info("this is in Board area: row is " + row + " col is " + col);

                if (type === "touchstart" && !draggingStartedRowCol) {
                    // drag started in board
                    log.info("drag start AT BOARD.");
                    let ind: number = computeIndicationAndLayer(row, col).ind;
                    let layer: number = computeIndicationAndLayer(row, col).layer;
                    if (ind === -1) {
                        // no piece be moved in this cell
                        return;
                    }
                    draggingStartedRowCol = {row: row, col: col, isInBoard: true, indication: ind, layer: layer};
                    computeBlockDeltas(draggingStartedRowCol, draggingStartedRowCol.isInBoard);
                    createDraggingPieceGroup(draggingStartedRowCol);
                    setDraggingPieceGroupTopLeft(getSquareTopLeft(row, col), draggingStartedRowCol.isInBoard);
                }

                if (!draggingPiece) {
                    return;
                }

                if (type === "touchend") {
                    let from = draggingStartedRowCol;
                    let to = {row: row, col: col};
                    dragDone(from, to, "BOARD");
                } else {
                    // Drag continue
                    setDraggingPieceGroupTopLeft(getSquareTopLeft(row, col), draggingStartedRowCol.isInBoard);
                } 
                //TODO: FROM BOARD TO BOARD AND FROM BOARD TO PREPARED
                // MOVE FROM EVERYWHERE
                // drag ended
        } else {
            // Position: Inside prepared box area. Let's find the containing square's row and col
            let col = Math.floor(colsBox * x / boardArea.clientWidth) % rowsBox;
            let row = Math.floor(rowsBox * x / boardArea.clientWidth);
            
            if (type === "touchstart" && !draggingStartedRowCol) {
                // drag started in prepared area
                log.info("drag start AT PREPARED.");
                if (state.preparedBox[row][col] === '') {
                    // no color in prepared area
                    return;
                }
                
                draggingStartedRowCol = {row: row, col: col, isInBoard: false, indication: -1, layer: -1};
                computeBlockDeltas(draggingStartedRowCol, draggingStartedRowCol.isInBoard);
                createDraggingPieceGroup(draggingStartedRowCol);
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(row, col), draggingStartedRowCol.isInBoard);
            }
            if (!draggingPiece) {
                return;
            }

            if (type === "touchend") {
                let from = draggingStartedRowCol;
                let to = {row: row, col: col};
                dragDone(from, to, "PREPARED");
            } else {
                // Drag continue
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(row, col), draggingStartedRowCol.isInBoard);
            } 
        }

        // If the drag is outside the legal board, it should return to the original position
        if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
            // drag ended
            // return the piece to it's original style (then angular will take care to hide it).
            if (!draggingStartedRowCol.isInBoard) {
                needToShrink = true;
                //needToSettle = true;
                setDraggingPieceGroupTopLeft(getSquareTopLeft_Box(draggingStartedRowCol.row, draggingStartedRowCol.col), 
                draggingStartedRowCol.isInBoard);
                setDraggingPieceGroupStyle();
            } else {
                needToShrink = false;
                needToSettle = true;
                setDraggingPieceGroupTopLeft(getSquareTopLeft(draggingStartedRowCol.row, draggingStartedRowCol.col), 
                draggingStartedRowCol.isInBoard);
                setDraggingPieceGroupStyle();
                
            }
            changeUIForEachMove();
            // clear the draggingPiece every time when ended
            
            draggingStartedRowCol = null;
            draggingPiece = null;
            draggingPieceGroup = [];
            blockDeltas = [];
            needToShrink = false;
            isVertical = false;
            needToSettle = false;

            // BOLOBOBO
            // for(let i = 0; i < boardDragged.length; i++) {
            //     log.info("this is line " + i + "=======================");
            //     for(let j = 0; j < boardDragged[i].length; j++) {
            //         log.info("row: " + i + " col: " + j + " value :" + angular.toJson(boardDragged[i][j], true));
            //     } 
            // }
            // log.info("this is layer1111111111111111111111111111111")
            // for(let i = 0; i < boardLayer1.length; i++) {
            //     log.info("this is line " + i + "=======================");
            //     for(let j = 0; j < boardLayer1[i].length; j++) {
            //         log.info("row: " + i + " col: " + j + " value :" + boardLayer1[i][j]);
            //     } 
            // }
            // log.info("this is layer2222222222222222222222222222222")
            // for(let i = 0; i < boardLayer2.length; i++) {
            //     log.info("this is line " + i + "=======================");
            //     for(let j = 0; j < boardLayer2[i].length; j++) {
            //         log.info("row: " + i + " col: " + j + " value :" + boardLayer2[i][j]);
            //     } 
            // }
            // log.info("this is layer3333333333333333333333333333333")
            // for(let i = 0; i < boardLayer3.length; i++) {
            //     log.info("this is line " + i + "=======================");
            //     for(let j = 0; j < boardLayer3[i].length; j++) {
            //         log.info("row: " + i + " col: " + j + " value :" + boardLayer3[i][j]);
            //     } 
            // }

            // TOTEST: print the color in preparedBox
            // for(let i = 0; i < 3; i++) {
            //     for(let j = 0; j < 3; j++) {
            //         log.info("PREPARED, row: " + i + " col: " + j + " color: " + state.preparedBox[i][j]);
            //     }
            // }
        }  
    }

    function changeUIForEachMove() {
        let count = 0;
        getInitialAllBoardLayer();
        for(let i = 0; i < boardDragged.length; i++) {
            for(let j = 0; j < boardDragged[i].length; j++) {
                let length = computeLength(i, j); 
                //clearOriginBoardCell(i, j);
                let layers = findLayer(i, j);
                if (length === 0) {
                    // just clear the origin layers
                } else if (length === 1) {
                    boardLayer1[i][j] = boardDragged[i][j][layers.layer1];
                    
                } else if (length === 2) {
                    boardLayer1[i][j] = boardDragged[i][j][layers.layer1];
                    boardLayer2[i][j] = boardDragged[i][j][layers.layer2];
                } else if (length === 3) {
                    boardLayer1[i][j] = boardDragged[i][j][layers.layer1];
                    boardLayer2[i][j] = boardDragged[i][j][layers.layer2];
                    boardLayer3[i][j] = boardDragged[i][j][layers.layer3];
                }
            }
            
        }
        $timeout(function () {}, 100);
    }

    function computeLength(row: number, col: number): number {
        let length: number = 0;
        for (let key in boardDragged[row][col]) {
            length++;
        }
        return length;
    }

    function clearOriginBoardCell(row: number, col: number) {
        boardLayer1[row][col] = '';
        boardLayer2[row][col] = '';
        boardLayer3[row][col] = '';
    }

    function findLayer(row: number, col: number): any {
        let bottom: number = -1;
        let middle: number = -1;
        let up: number = -1;
        let length: number = 0;
        for (let key in boardDragged[row][col]) {
            if(parseInt(key) > up) {
                let temp1 = up;
                let temp2 = middle;
                up = parseInt(key);
                middle = temp1;
                bottom = temp2;
            } else if (parseInt(key) > middle) {
                let temp1 = middle;
                middle = parseInt(key);
                bottom = temp1;
            } else {
                bottom = parseInt(key);
            }
            length++;
        }
        // settle the layer
        if (length === 1) {
            bottom = up;
            up = -1;
            middle = -1;
        } else if (length === 2) {
            bottom = middle;
            middle = up;
            up = -1;
        } 
        return {layer1: bottom, layer2: middle, layer3: up};
    }

    function findExactLayer(row: number, col: number, ind: number): number {
        let result = findLayer(row, col);
        let up: number = result.layer3;
        let middle: number = result.layer2;
        let bottom: number = result.layer1;
        if (ind === up) {
            return 3;
        } else if (ind === middle) {
            return 2;
        } else if (ind === bottom) {
            return 1;
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
        let tempBoardDragged: any = [];
        // extend the board to initialize the boundary
        for (let i = 0; i < gameLogic.ROWS + 4; i++) {
            tempBoardDragged[i] = [];
            for (let j = 0; j < gameLogic.COLS + 4; j++) {
                // every cell in boardDragged is a map datastructure
                // the key is the indication, the value is the color
                tempBoardDragged[i][j] = {};
                //tempBoardDragged[i][j] = {0:''};
            }
        }

        for (let i = 0; i < gameLogic.ROWS; i++) {
            for (let j = 0; j < gameLogic.COLS; j++) {
                // copy each boardDragged to tempBoardDragged
                tempBoardDragged[i+2][j+2]= angular.copy(boardDragged[i][j]);
            }
        }

        let row = draggingStartedRowCol.row + 2;
        let col = draggingStartedRowCol.col + 2;
        let ind = draggingStartedRowCol.indication;
        //let value = boardDragged[row][col][ind];

        if (tempBoardDragged[row-1][col].hasOwnProperty(ind)) {
            // up 
            if (tempBoardDragged[row-2][col].hasOwnProperty(ind)) {
                blockDeltas = [
                {deltaRow: -1, deltaCol: 0},
                {deltaRow: -2, deltaCol: 0}];
            } else if (tempBoardDragged[row+1][col].hasOwnProperty(ind)) {
                blockDeltas = [
                {deltaRow: -1, deltaCol: 0},
                {deltaRow: 1, deltaCol: 0}];
            }
            isVertical = true;
        } else if (tempBoardDragged[row+1][col].hasOwnProperty(ind)) {
            // down
            if (tempBoardDragged[row+2][col].hasOwnProperty(ind)) {
                blockDeltas = [
                {deltaRow: 1, deltaCol: 0},
                {deltaRow: 2, deltaCol: 0}];               
            } else if (tempBoardDragged[row-1][col].hasOwnProperty(ind)) {
                blockDeltas = [
                {deltaRow: -1, deltaCol: 0},
                {deltaRow: 1, deltaCol: 0}];                  
            }
            isVertical = true;
        } else if (tempBoardDragged[row][col-1].hasOwnProperty(ind)) {
            // left
            if (tempBoardDragged[row][col-2].hasOwnProperty(ind)) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: -1},
                {deltaRow: 0, deltaCol: -2}];    
            } else if (tempBoardDragged[row][col+1].hasOwnProperty(ind)) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: -1},
                {deltaRow: 0, deltaCol: 1}];  
            }
        } else if (tempBoardDragged[row][col+1].hasOwnProperty(ind)) {
            //right
            if (tempBoardDragged[row][col+2].hasOwnProperty(ind)) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: 1},
                {deltaRow: 0, deltaCol: 2}];  
            } else if (tempBoardDragged[row][col-1].hasOwnProperty(ind)) {
                blockDeltas = [
                {deltaRow: 0, deltaCol: -1},
                {deltaRow: 0, deltaCol: 1}];  
            }
        }   
    }

    // Helper Function: compute the hightest indication in specific cell
    function computeIndicationAndLayer(row: number, col: number): any {
        let ind: number = -1;
        let layer: number = 0;
        for (let key in boardDragged[row][col]) {
            if (boardDragged[row][col].hasOwnProperty(key)) {
                if(parseInt(key) > ind) {
                    ind = parseInt(key);
                }
            }
            layer++;
        }
        return {ind: ind, layer: layer};
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
            let layer = draggingStartedRowCol.layer;
            draggingPiece = document.getElementById("MyPieceBoard_" + layer + "_Layer" + draggingStartedRowCol.row + "x" + draggingStartedRowCol.col);
            // set the dragging piece
            draggingPiece.style['z-index'] = 100;
            //draggingPiece.style.background = "pink";

            // get the html element of the neighbors of draggingPiece
            for (let i = 0; i < blockDeltas.length; i++) {
                let newRow = draggingStartedRowCol.row + blockDeltas[i].deltaRow;
                let newCol = draggingStartedRowCol.col + blockDeltas[i].deltaCol;
                let exactLayer: number = findExactLayer(newRow, newCol, draggingStartedRowCol.indication)
                let newhtml: any = document.getElementById("MyPieceBoard_" + exactLayer + "_Layer" + newRow + "x" + newCol);
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
            // if(needToSettle) {
            //     draggingPiece.style['z-index'] = -1;
            // } else {
            //     draggingPiece.style['z-index'] = 100;
            // } 
            draggingPiece.style['z-index'] = 100;
        } else {
            size = getSquareWidthHeight();

        }

        for (let i = 0; i < draggingPieceGroup.length; i++) {
            // draggingPieceGroup[i].style['width'] = size.width;
            // draggingPieceGroup[i].style['height'] = size.height;
            if(needToSettle) {
                draggingPieceGroup[i].style['z-index'] = 60;
                // draggingPieceGroup[i].style['width'] = size.width * 0.96;
                // draggingPieceGroup[i].style['height'] = size.height * 0.96;  
            } else {
                draggingPieceGroup[i].style['z-index'] = 100;
                draggingPieceGroup[i].style['width'] = size.width;
                draggingPieceGroup[i].style['height'] = size.height;
            } 
            //draggingPieceGroup[i].style['z-index'] = 100;
            //draggingPieceGroup[i].style.background = 'grey';
        }
    }

    // Helper Function: set the top left of the draggingPiece group
    function setDraggingPieceGroupTopLeft(draggingPieceCurTopLeft: TopLeft, isInBoard: boolean) {
        
        let size: any;
        let originalSize: any;
        let originalTopLeft: TopLeft;
        if (needToShrink) {
            size = preparedSquareSize;
        } else {
            size = boardSquareSize;
        }

        if (isInBoard) {
            setDraggingPieceTopLeft(draggingPiece,  draggingPieceCurTopLeft, getSquareTopLeft(draggingStartedRowCol.row, draggingStartedRowCol.col));
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
        let msg = "Dragged piece " + from.row + "x" + from.col + " to square " + to.row + "x" + to.col;
        log.info(msg);

        if (isVertical) {
            // Piece is vertical 
            if (dest === "PREPARED") {
                // from board to prepared area
                return;
            } else {
                // from board to board
                movePieceToBoard(from, to);
            }
        } else {
            // Piece is horizontal
            if (dest === "PREPARED") {
                if (state.preparedBox[to.row][to.col]) {
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

    function movePieceToPrepared(from: any, to: any) {
        if (blockDeltas[0].deltaCol === 1 &&  blockDeltas[1].deltaCol === 2 ) {
            setPieceToFitPreparedArea(from, to, 0, [0, 1, 2]);
        } else if (blockDeltas[0].deltaCol === -1 &&  blockDeltas[1].deltaCol === 1 ){
            setPieceToFitPreparedArea(from, to, 1, [0, -1, 1]);
        } else if (blockDeltas[0].deltaCol === -2 &&  blockDeltas[1].deltaCol === -1 ){
            setPieceToFitPreparedArea(from, to, 2, [0, -2, -1]);
        }

        // clear the original color 
        if (from.isInBoard) {
            clearOriginalPieceInBoard(from);
        } else {
            clearOriginalPieceInPrepared(from);
        }
    }

    function setPieceToFitPreparedArea(from: any, to: any, realCol: number, colDelta: number[]) {
        for (let i = 0; i < colDelta.length; i++) {
            let delta = colDelta[i];
            if (from.isInBoard) {
                state.preparedBox[to.row][realCol+delta] = boardDragged[from.row][from.col+delta][from.indication];
            } else {
                state.preparedBox[to.row][realCol+delta] = state.preparedBox[from.row][from.col+delta];
            }     
        }
    }

    function movePieceToBoard(from: any, to: any) {
        if (isInsideBoard(to.row, to.col, blockDeltas)) {
            indication++;
            if (from.isInBoard) {
                boardDragged[to.row][to.col][indication] = boardDragged[from.row][from.col][from.indication];
            } else {
                boardDragged[to.row][to.col][indication] = state.preparedBox[from.row][from.col];
            }
            
            for (let i = 0; i < blockDeltas.length; i++) {
                let oldRow = from.row + blockDeltas[i].deltaRow;
                let oldCol = from.col + blockDeltas[i].deltaCol;
                let color: string;

                if (from.isInBoard) {
                    color = boardDragged[oldRow][oldCol][from.indication];
                } else {
                    color = state.preparedBox[oldRow][oldCol];
                }
                  
                let newRow = to.row + blockDeltas[i].deltaRow;
                let newCol = to.col + blockDeltas[i].deltaCol;
                boardDragged[newRow][newCol][indication] = color;
            }
            // clear the color in the original place
            if (from.isInBoard) {
                clearOriginalPieceInBoard(from);
            } else {
                clearOriginalPieceInPrepared(from);
            }
            
        } else {
            return;
        }
    }

    function clearOriginalPieceInBoard(from: any) {
        delete boardDragged[from.row][from.col][from.indication];
        for (let i = 0; i < blockDeltas.length; i++) {
            let oldRow = from.row + blockDeltas[i].deltaRow;
            let oldCol = from.col + blockDeltas[i].deltaCol;
            // clear the color in the original place
            delete boardDragged[oldRow][oldCol][from.indication];
        }
    }

    function clearOriginalPieceInPrepared(from: any) {
        state.preparedBox[from.row][from.col] = '';
        for (let i = 0; i < blockDeltas.length; i++) {
            let oldRow = from.row + blockDeltas[i].deltaRow;
            let oldCol = from.col + blockDeltas[i].deltaCol;
            // clear the color in the original place
            //$timeout(function() {getPreparedBoxColor(oldRow, oldCol);},100);
            state.preparedBox[oldRow][oldCol] = '';
            $timeout(function () {state.preparedBox[oldRow][oldCol] = '';}, 100);
            
        }
    }

    // Helper Function: initialize the boardDragged
    function getInitialBoardDragged() {
        for (let i = 0; i < gameLogic.ROWS; i++) {
            boardDragged[i] = [];
            for (let j = 0; j < gameLogic.COLS; j++) {
                // put the original color of the board into boardDragged
                // use the map datastructure to store the layer
                boardDragged[i][j] = {};
                //boardDragged[i][j] = {0 : state.board[i][j]};
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

    function getSquareWidthHeightSmall() : Size {
        return {
          height: boardArea.clientWidth / colsNum * 0.96,
          width: boardArea.clientWidth / rowsNum * 0.96
        };
    }

    function getSquareWidthHeight_Box(): Size {
        preparedSquareSize =  {height: boardArea.clientWidth * 0.9 / colsBox, width: boardArea.clientWidth * 0.9 / colsBox};
        return {
          height: boardArea.clientWidth * 0.9 / colsBox,
          width: boardArea.clientWidth * 0.9 / colsBox
        };
    }

    function getInitialAllBoardLayer() {
        for (let i = 0; i < gameLogic.ROWS; i++) {
            boardLayer1[i] = [];
            boardLayer2[i] = [];
            boardLayer3[i] = [];
            for (let j = 0; j < gameLogic.COLS; j++) {
                boardLayer1[i][j] = '';
                boardLayer2[i][j] = '';
                boardLayer3[i][j] = '';
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













    // UI operation
    export function shouldShowImage(row: number, col: number): boolean {
        let cell = state.board[row][col];
        //log.info(typeof state);
        //log.info("this is the cell, row: " + row + " col: " + col + " color: " + cell);
        return state.board[row][col] !== '';
    }

    export function shouldShowImage_Box(row: number, col: number): boolean {
        let cell = state.preparedBox[row][col];
        //log.info("this is the cell, row: " + row + " col: " + col + " color: " + state.preparedBox[row][col]);
        return cell !== '';
    }


    export function shouldSlowlyAppear(row: number, col: number): boolean {
        // return state.delta &&
        //     state.delta.row === row && state.delta.col === col;
        return true;
    }
    export function getBoardBoxColor(row: number, col: number): string {
        let cellStyle = state.board[row][col];
        return cellStyle; 
    }

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
        } else {
            return "grey";
        }
    }

    export function getBoardColorAt_1_Layer(row: number, col: number): string {
        let color = boardLayer1[row][col];
        if (color === 'R') {
            return "rgb(255, 128, 170)";
        } else if (color === 'G') {
            return "rgb(71, 209, 71)";
        } else if (color === 'B') {
            return "rgb(51, 204, 255)";
        } else if (color === 'Y') {
            return "rgb(246, 246, 85)";
        } else {
            return "grey";
        }

    }

    export function getBoardColorAt_2_Layer(row: number, col: number): string {
        return boardLayer2[row][col];
    }

    export function getBoardColorAt_3_Layer(row: number, col: number): string {
        return boardLayer3[row][col];
    }

    export function getBoardColorAt_1_LayerShow(row: number, col: number): boolean {
        return true;
    }
}

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