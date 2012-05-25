/* Author:
    Max Degterev <me@maxdegterev.name> @suprMax
*/

// ======================================================================================
// Polyfills
// ======================================================================================
// requestAnimationFrame polyfill
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

var monkyTime = function(settings) {
// ======================================================================================
// Options
// ======================================================================================
    var options = $.extend({
        debug: true,
        lives: 6,
        objects: {
            banana: {
                chance: 1,
                num: 2,
                points: 10,
                lives: 0
            },
            bomb: {
                chance: .75,
                num: 1,
                points: -10,
                lives: -1
            },
            heart: {
                chance: .1,
                num: 1,
                points: 20,
                lives: 1
            }
        } 
    }, settings);
    
// ======================================================================================
// Utility
// ======================================================================================
    var debug = function() {
        if (options.debug && 'console' in window) {
            (arguments.length > 1) ? console.log(Array.prototype.slice.call(arguments)) : console.log(arguments[0]);
        }
    };
    
    var supports = (function() {
        var div = document.createElement('div'),
            vendors = 'Ms O Moz Webkit'.split(' '),
            len = vendors.length,
            succeeded,
            memo = {};

        return function(prop) {
            var key = prop;

            if (typeof memo[key] !== 'undefined') {
                return memo[key];
            }

            if (typeof div.style[prop] !== 'undefined') {
                memo[key] = prop;
                return memo[key];
            } 

            prop = prop.replace(/^[a-z]/, function(val) {
                return val.toUpperCase();
            });

            for (var i = len - 1; i >= 0; i--) {
                if (typeof div.style[vendors[i] + prop] !== 'undefined') {
                    succeeded = '-' + vendors[i] + '-' + prop;
                    memo[key] = succeeded.toLowerCase();
                    return memo[key];
                }
            }

            return false;
        };
    })();
    
// ======================================================================================
// Running selectors
// ======================================================================================
    var els = {
        mt: $('#monkytime'),
        mtScreens: this.mt.find('.mt-screen'),
        
        // Basic
        gameScreen: this.mt.find('#mt-game-screen'),
        gameObjects: this.gameScreen.find('.mt-game-object'),
        gameLives: this.gameScreen.find('#mt-game-lives'),
        gameScore: this.gameScreen.find('#mt-game-lives'),
        gamePlayer: this.gameScreen.find('#mt-game-player'),
        
        // Screens
        introScreen: this.mtScreens.filter('.mt-introduction-screen'),
        startScreen: this.mtScreens.filter('.mt-start-screen'),
        endScreen: this.mtScreens.filter('.mt-end-screen'),
        
        // Buttons
        buttonStartGame: this.startScreen.find('#sm-game-start'),
        buttonRestartGame: this.endScreen.find('#sm-game-restart'),
        buttonEndGame: this.endScreen.find('#sm-game-quit'),
        
        // Game objects
        gameObjBanana: this.gameObjects.filter('.mt-banana'),
        gameObjBomb: this.gameObjects.filter('.mt-bomb'),
        gameObjHeart: this.gameObjects.filter('.mt-heart')
    };

    debug('[MonkyTime]: game initialized');
        
// ======================================================================================
// Setting vars
// ======================================================================================
    var score = 0,
        renderedScore = 0,

        lives = options.lives,

        rendererId,

        transform = supports('transform'),

        objects = [],
        
        gameWidth = gameScreen.width(),
        gameHeight = gameScreen.height();

// ======================================================================================
// Initializing game objects
// ======================================================================================

    var GameObject = function(type, settings) {
        this.type = type;
        this.options = settings;
        
        this.points = settings.points;
        this.lives = settings.lives;
    
        this.velocity = 0;
        this.accelerated = false;
        
        this.x = 0;
        this.y = 0;
        
        this.elem = $('<span class="mt-' + this.type + ' mt-game-object" />');
    };
    GameObject.prototype.reset = function() {
        this.x = 0;
        this.y = 0;
    };
    GameObject.prototype.move = function() {
        if (this.accelerated) {
            this.velocity++;
            this.y += options.accelmx + this.velocity / 2;
        }
        else {
            this.y += options.accelmx;
        }

        if (this.y >= this.game.height) {
            this.velocity = 0;
            this.reset();
        }
    };
    GameObject.prototype.render = function() {
        this.move();
        
        this.elem.css({
            left: this.x,
            top: this.y
        })
    };

    for (object in options.objects) {
        objects.push(new GameObject(object, options.objects[object]));
    }
// ======================================================================================
// Handling screens
// ======================================================================================
    var inviteToPlay = function() {
        debug('[MonkyTime]: inviting to the game');
        introScreen.removeClass('active');
        startScreen.addClass('active');
    };
    
    var startGame = function() {
        debug('[MonkyTime]: starting the game');
        startScreen.removeClass('active');
        gameScreen.addClass('active');
    };
    
    var resetGame = function() {
        debug('[MonkyTime]: resetting the game');
        resetObjects();
        
        score = 0;
        renderedScore = 0;
        lives = options.lives;
        
        gameScreen.removeClass('active');
        startScreen.addClass('active');
    };
    
    var endGame = function() {
        debug('[MonkyTime]: quitting the game');
        
        gameScreen.removeClass('active');
        endScreen.addClass('active');
    };
    
    
    var quitGame = function() {
        debug('[MonkyTime]: quitting the game');
        
        endScreen.removeClass('active');
        introScreen.addClass('active');
    };
    
    var pauseGame = function() {
        if (isPaused) {
            debug('[MonkyTime]: unpausing the game');
        
            gameScreen.addClass('paused');
        }
        else {
            debug('[MonkyTime]: pausing the game');
        
            gameScreen.addClass('paused');
        }
    };
    
    buttonStartGame.onpress(startGame);
    buttonRestartGame.onpress(resetGame);
    buttonEndGame.onpress(quitGame);

// ======================================================================================
// Game logic
// ======================================================================================

    var resetObjects = function() {
        debug('[MonkyTime]: resetting objects');
    };
// ======================================================================================
// Rendering screen
// ======================================================================================


// ======================================================================================
// Returning game controls
// ======================================================================================
    return {
        ready: inviteToPlay,
        start: startGame,
        reset: resetGame,
        end: quitGame,
        pause: pauseGame
    };
};