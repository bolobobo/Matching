;
var game;
(function (game) {
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    game.currentUpdateUI = null;
    //export let animationEnded = false;
    game.didMakeMove = false; // You can only make one move per updateUI
    game.animationEndedTimeout = null;
    // TODO: gamelogic
    game.state = null;
    // TODO: MANY EXTRA
    game.isMyScore = 0;
    game.shouldShowScore = true;
    game.linesStyle = false;
    function init() {
        //registerServiceWorker();
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        log.log("Translation of 'RULES_OF_MATCHING' is " + translate('MATCHING'));
        resizeGameAreaService.setWidthToHeight(0.8);
        moveService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            checkMoveOk: gameLogic.checkMoveOk,
            updateUI: updateUI,
            gotMessageFromPlatform: null,
        });
    }
    game.init = init;
    function getTranslations() {
        return {};
    }
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.didMakeMove = false; // only one move per updateUI
        game.currentUpdateUI = params;
        clearAnimationTimeout();
        game.state = params.move.stateAfterMove;
        if (isFirstMove()) {
            game.state = gameLogic.getInitialState();
            if (isMyTurn())
                makeMove(gameLogic.createInitialMove);
        }
    }
    game.updateUI = updateUI;
})(game || (game = {}));
var app = angular.module('myApp', ['gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
//# sourceMappingURL=game.js.map