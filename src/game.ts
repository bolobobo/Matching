interface SupportedLanguages {
    en: string, zh: string
};

interface Translations {
    [index: string]: SupportedLanguages;
}

module game {
    // Global variables are cleared when getting updateUI.
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console, e.g.,
    // game.currentUpdateUI
    export let currentUpdateUI: IUpdateUI = null;
    //export let animationEnded = false;
    export let didMakeMove: boolean = false; // You can only make one move per updateUI
    export let animationEndedTimeout: ng.IPromise<any> = null;
    // TODO: gamelogic
    export let state: IState = null;
    // TODO: MANY EXTRA
    export let isMyScore = 0;
    export let shouldShowScore = true;
    export let linesStyle = false;
    export let record: number;
    export let $httpt: angular.IHttpService;


    export function init() {
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

    function getTranslations(): Translations {
        return {};
    }

    export function updateUI(params: IUpdateUI): void {
        log.info("Game got updateUI:", params);
        didMakeMove = false; // only one move per updateUI
        currentUpdateUI = params;
        clearAnimationTimeout();
        state = params.move.stateAfterMove;
        if (isFirstMove()) {
            state = gameLogic.getInitialState();
            if (isMyTurn()) makeMove(gameLogic.createInitialMove);
        }
    }

}

var app = angular.module('myApp', ['gameServices'])
  .run(function () {
    $rootScope['game'] = game;
    game.init();
  });