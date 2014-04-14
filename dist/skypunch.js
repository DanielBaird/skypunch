(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var actions = {
    'gethurtLeft': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            'moveLeft',
            'hurtPic',
            'moveLeft', 'moveLeft',
            'pushbackPic',
            'moveLeft', 'moveLeft',
            'nothing', 'nothing', 'nothing',
            'normalPic',
            'nothing', 'nothing', 'nothing'
        ]
    },
    'gethurtRight': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            'moveRight',
            'hurtPic',
            'moveRight', 'moveRight',
            'pushbackPic',
            'moveRight', 'moveRight',
            'nothing', 'nothing', 'nothing',
            'normalPic',
            'nothing', 'nothing', 'nothing'
        ]
    },
    'dead': {
        moveOkay: false,
        fallOkay: true,
        final: true,
        steps: [
            'deadPic'
        ]
    },
    'winner': {
        moveOkay: false,
        fallOkay: false,
        final: true,
        steps: [
            'winnerPic',
            'moveUp', 'nothing',
            'moveUp', 'nothing',
            'moveDown', 'nothing',
            'moveDown', 'nothing',
            'nothing', 'nothing'
        ]
    },
    'jump': {
        moveOkay: true,
        fallOkay: false,
        final: false,
        steps: [
            'moveUp',
            'jumpPic',
            'moveUp', 'moveUp', 'moveUp', 'moveUp', 'moveUp'
        ]
    },
    'land': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            'landingPic',
            'nothing', 'nothing', 'nothing',
            'normalPic'
        ]
    },
    'punch': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            'moveForward',
            'punchPic',
            'moveForward',
            'smallHit',
            'moveBack',
            'normalPic',
            'nothing', 'nothing', 'nothing'
        ]
    },
    'kick': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            'moveForward',
            'moveForward',
            'kickPic',
            'moveForward',
            'bigHit',
            'moveBack', 'moveBack',
            'normalPic',
            'nothing', 'nothing', 'nothing'
        ]
    }
}

module.exports = actions;

},{}],2:[function(require,module,exports){

var robotPlayerMaker = require('./players/robotPlayer');
var aiPlayerMaker = require('./players/robotAI');
var punchingBagMaker = require('./players/robotPunchBag');

var keys = [];
var players = [];

// this function starts the game..
function skypunch() {

    $('.loadingscreen').fadeOut(900, function() {
        // ...
    });

    player = robotPlayerMaker(5, 80, 15);
    player.setPlayerDom($('.robot.player0'));
    player.setHealthBarDom($('.health.player0'));
    players.push(player);

    opponent = aiPlayerMaker(5, 320, 20);
    opponent = punchingBagMaker(10, 320, 20);
    opponent.setPlayerDom($('.robot.player1'));
    opponent.setHealthBarDom($('.health.player1'));
    players.push(opponent);

    $('body').on('keydown', function(event) {
        var key = event.which;
        if (keys.indexOf(key) == -1) {
            keys.push(key);
        }
    });

    $('body').on('keyup', function(event) {
        var keyIndex = keys.indexOf(event.which);
        if (keyIndex != -1) {
            keys.splice(keyIndex, 1);
        }
    });

    setInterval(tick, 50);
}

window.skypunch = skypunch;

// periodically process events
function tick() {
    var player;
    var state = {
        keys: keys,
        positions: []
    };
    var hits = [];
    function recordHit(player, dir, pos, height, damage) {
        hits.push({ player:player, dir:dir, pos:pos, height:height, damage:damage });
    }

    // assemble positions of players..
    for (playerId in players) {
        player = players[playerId];
        state.positions.push(player.position);
    }

    // now give each player the game state and see what they do
    for (playerId in players) {
        player = players[playerId];
        // let the player do a thing
        player.tick(state, {
            hit: function(dir, pos, height, damage) { recordHit(player, dir, pos, height, damage); }
        });
        // draw the possibly-updated player
        player.draw();
    }

    var hit = null;

    // now tell each player about the hits that happened
    for (playerId in players) {
        player = players[playerId];
        for (hitId in hits) {
            if (player !== hits[hitId].player) {
                hit = hits[hitId];
                player.getHit(hit.direction, hit.pos, hit.height, hit.damage);
            }
        }

        // this is the last loop through players, so draw
        // the possibly-updated player now.
        player.draw();
    }
}

},{"./players/robotAI":4,"./players/robotPlayer":5,"./players/robotPunchBag":6}],3:[function(require,module,exports){

actions = require('../actions/basicactions');

function Player(type, health, position, height) {
    this.type = type;
    this.health = health || 5;
    this.robot = 'robot2';
    this.direction = 1;
    this.pic = 'normal';
    this.currentAction = null;
    this.nextStep = 0;
    this.position = position || 80;
    this.height = height || 15;
    this.health = health || 5;
    this.dirty = ['pic', 'position', 'height', 'health'];

    this.dom = null;
}

Player.prototype = {

    // --------------------------------------------------------------
    // stuff you should override ------------------------------------
    // --------------------------------------------------------------

    // override this to pick the next action during a tick
    chooseNextAction: function chooseNextAction(state, callbacks) {
        console.log('Subclasses of Player should override chooseNextAction().');
    },

    // override this to perform a hit at the location that matches
    // your pictures, probably a punch
    smallHit: function smallHit(state, callbacks) {
        var armLength = 20;  // how far in front of you are you punching
        var direction = this.direction; // -1 is left, +1 is right
        var hitPosition = this.position + (direction * armLength);
        var hitHeight = this.height;
        // now invoke the callback for hitting at that spot
        callbacks.hit(direction, hitPosition, hitHeight, 1);
    },

    // override this to perform a hit at the location that matches
    // your pictures, probably a kick
    bigHit: function bigHit(state, callbacks) {
        var legLength = 30;  // how far in front of you are you kicking
        var direction = this.direction; // -1 is left, +1 is right
        var hitPosition = this.position + (direction * legLength);
        var hitHeight = this.height;
        // now invoke the callback for hitting at that spot
        callbacks.hit(direction, hitPosition, hitHeight, 2);
    },

    // override this to work out of your player gets hit or not.
    // make sure you return true if you get killed by the hit.
    getHit: function getHit(hitDirection, hitPos, hitHeight, damage) {
        var playerWidth = 100; // how wide is your combatant
        var playerHeight = 2; // how tall is your combatant

        var minPos = this.position;
        var maxPos = this.position + playerWidth;

        var minHeight = this.height;
        var maxHeight = this.height + playerHeight;

        // now work out if you were hit..
        if (
                  minPos <=    hitPos && hitPos    <= maxPos
            && minHeight <= hitHeight && hitHeight <= maxHeight
        ) {
            // we're hit!
            this.currentAction = 'gethurt' + (hitDirection == 1 ? 'Right' : 'Left');

            this.health -= damage;
            // when you change health, note that health is dirty
            this.dirty.push('health');

            this.nextStep = 0;
            if (this.health <= 0) {
                this.currentAction = 'dead';
            }
            return true;
        } else {
            return false;
        }
    },

    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // below here you won't need to override anything unless you're
    // making something special.
    // --------------------------------------------------------------
    // --------------------------------------------------------------

    constructor: Player,
    // --------------------------------------------------------------
    sayType: function sayType() {
        console.log(this.type);
    },
    // draw the player ----------------------------------------------
    setPlayerDom: function setPlayerDom(element) {
        this.dom = $(element);
    },

    setHealthBarDom: function setHealthBarDom(element) {
        this.healthDom = $(element);
    },

    draw: function draw() {
        if (this.dom) {
            var cssUpdate = {}

            var top = 130 - (this.height * 20);
            var left = this.position;

            // health bar need updating?
            if (this.dirty.indexOf('health') != -1) {
                this.healthDom.width(this.health * 20);
            }

            // player need updating?
            if (this.dirty.indexOf('pic') != -1) {
                cssUpdate.backgroundImage = [
                    'url(robots',
                    this.robot,
                    (this.direction == 1 ? 'right' : 'left'),
                    this.pic + '.svg)',
                ].join('/');
            }
            if (this.dirty.indexOf('position') != -1 ||
                this.dirty.indexOf('height') != -1) {
                cssUpdate.left = this.position;
                cssUpdate.top = (130 - (this.height * 20));
            }
            this.dirty = [];
            this.dom.css(cssUpdate);
        } else {
            alert("Can't draw " + this.type +
                  " player without a DOM element. \n" +
                  "Call player.setDom(element) to assign an element."
            );
        }
    },
    // actually do things -------------------------------------------
    tick: function tick(state, callbacks) {

        // perform the current action ...............................
        if (this.currentAction) {
            // if there's a current action, take its next step
            var action = actions[this.currentAction];
            var step = action.steps[this.nextStep];

            if (step && this[step]) {
                this[step].call(this, state, callbacks);
            }

            // get ready for the next step
            this.nextStep += 1;
            if (this.nextStep >= action.steps.length) {
                // did the last step.. clear off the currentAction
                this.currentAction = null;
                this.nextStep = 0;
            }
        }

        // obey gravity .............................................
        if (this.canFall()) {
            this.moveDown();
            if (this.height < 1) {
                this.height = 0;
                if (! this.isLocked()) {
                    this.currentAction = 'land';
                    this.nextStep = 0;
                }
            }
        }

        // decide what to do next ...................................
        if (! this.currentAction) {
            // downstream subclasses supply this
            this.chooseNextAction(state, callbacks);
        }
    },

    // pic pic switching --------------------------------------------
    switchPic: function switchPic(newPic) {
        if (this.pic != newPic) {
            this.pic = newPic;
            this.dirty.push('pic');
        }
    },
    jumpPic: function jumpPic()         { this.switchPic('jump'); },
    punchPic: function punchPic()       { this.switchPic('punch'); },
    kickPic: function kickPic()         { this.switchPic('kick'); },
    normalPic: function normalPic()     { this.switchPic('normal'); },
    landingPic: function landingPic()   { this.switchPic('landing'); },
    hurtPic: function hurtPic()         { this.switchPic('hurt'); },
    pushbackPic: function pushbackPic() { this.switchPic('pushback'); },
    deadPic: function deadPic()         { this.switchPic('dead'); },
    winnerPic: function winnerPic()     { this.switchPic('winner'); },

    // tests --------------------------------------------------------
    canFall: function canFall() {
        return ( this.height > 0 && (
            this.currentAction === null
            || actions[this.currentAction].fallOkay
        )   )
    },

    canMove: function canMove() {
        return (
            this.currentAction === null
            || actions[this.currentAction].moveOkay
        )
    },

    isLocked: function isLocked() {
        return (
            this.currentAction !== null
            && actions[this.currentAction].isFinal
        )
    },

    // doing nothing... ---------------------------------------------
    nothing: function nothing() {
        // .. doing nothing, as instructed
    },

    // absolute movement --------------------------------------------
    moveUp: function moveUp() {
        this.height++;
        this.dirty.push('height');
    },

    moveDown: function moveDown() {
        this.height--;
        this.dirty.push('height');
    },

    moveLeft: function moveLeft() {
        if (this.position > 10) {
            this.position -= 5;
            this.dirty.push('position');
        }
    },

    moveRight: function moveRight() {
        if (this.position < 350) {
            this.position += 5;
            this.dirty.push('position');
        }
    },

    // directional movement -----------------------------------------
    faceLeft: function faceLeft() {
        if (this.direction != -1) {
            this.direction = -1;
            this.dirty.push('pic');
        }
    },

    faceRight: function faceRight() {
        if (this.direction != 1) {
            this.direction = 1;
            this.dirty.push('pic');
        }
    },

    moveForward: function moveForward() {
        if (this.direction == 1) {
            this.moveRight();
        } else {
            this.moveLeft();
        }
    },

    moveBack: function moveBack() {
        if (this.direction == 1) {
            this.moveLeft();
        } else {
            this.moveRight();
        }
    }
    // --------------------------------------------------------------
    // end of Player prototype --------------------------------------
}

module.exports = Player;
},{"../actions/basicactions":1}],4:[function(require,module,exports){
BasicPlayer = require('./BasicPlayer');

aiPlayerMaker = function AiPlayerMaker(health, position, height) {
    var player = new BasicPlayer('AI', health, position, height);

    player.chooseNextAction = function chooseAiAction(state, callbacks) {
        // ----------------------------------------------
        //  AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI
        //
        //           __/__/__/__/        __/__/__/
        //          __/      __/           __/
        //         __/__/__/__/           __/
        //        __/      __/  __/   __/__/__/  __/
        //
        //  AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI
        // ----------------------------------------------
        // decide what to do
        var rand = Math.random();

        var otherPos = state.positions.filter( function(pos) {
            return (pos != this.position);
        }, this);

        // is the oppoent to our left?
        var opponentIsLeft = (otherPos[0] < this.position);

        if (rand < 0.2) {
            // move toward the other player
            if (opponentIsLeft) {
                this.faceLeft(playerId);
            } else {
                this.faceRight(playerId);
            }
            if (this.canMove()) {
                this.moveForward(playerId);
            }
        }
        if (0.2 < rand && rand < 0.3) {
            // move AWAY FROM the other player
            if (opponentIsLeft) {
                this.faceRight(playerId);
            } else {
                this.faceLeft(playerId);
            }
            if (this.canMove()) {
                this.moveForward(playerId);
            }
        }
        if (!this.currentAction && 0.3 < rand && rand < 0.4) {
            this.currentAction = 'punch';
        }
        if (!this.currentAction && 0.4 < rand && rand < 0.5) {
            this.currentAction = 'kick';
        }
        if (
            !this.currentAction && 0.6 < rand && rand < 0.7
            && this.height == 0
        ) {
            this.currentAction = 'jump';
        }
        // AI -------------------------------------------
    }

    return player;
}

module.exports = aiPlayerMaker;
},{"./BasicPlayer":3}],5:[function(require,module,exports){

BasicPlayer = require('./BasicPlayer');

function isIn(key, keys) {
    return (keys.indexOf(key) != -1);
}

robotPlayerMaker = function robotPlayerMaker(health, position, height) {

    var player = new BasicPlayer('robot', health, position, height);

    player.chooseNextAction = function chooseAction(state, callbacks) {
        if (! this.currentAction) {
            // no current action.. decide what's next
            if (isIn(69, state.keys)) { this.currentAction = 'punch'; }
            if (isIn(82, state.keys)) { this.currentAction = 'kick'; }
            if (isIn(32, state.keys) && this.height == 0) {
                this.currentAction = 'jump';
            }
        }
        if ( !this.currentAction ||
             actions[this.currentAction].moveOkay) {
            if (isIn(65, state.keys) || isIn(37, state.keys)) {
                this.faceLeft(playerId);
                this.moveLeft(playerId);
            }
            if (isIn(68, state.keys) || isIn(39, state.keys)) {
                this.faceRight(playerId);
                this.moveRight(playerId);
            }
        }

    }

    return player;
}

module.exports = robotPlayerMaker;
},{"./BasicPlayer":3}],6:[function(require,module,exports){
BasicPlayer = require('./BasicPlayer');

playerMaker = function playerMaker(health, position, height) {
    var player = new BasicPlayer('PunchBag', health, position, height);

    player.chooseNextAction = function chooseAiAction(state, callbacks) {
        // decide what to do
        var rand = Math.random();

        var otherPos = state.positions.filter( function(pos) {
            return (pos != this.position);
        }, this);

        // is the oppoent to our left?
        var opponentIsLeft = (otherPos[0] < this.position);

        if (rand < 0.01) {
            // face the other player
            if (opponentIsLeft) {
                this.faceLeft(playerId);
            } else {
                this.faceRight(playerId);
            }
        }
    }

    return player;
}

module.exports = playerMaker;
},{"./BasicPlayer":3}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9kYW5pZWwvcHJvamVjdHMvc2t5cHVuY2gvc3JjL2pzL2FjdGlvbnMvYmFzaWNhY3Rpb25zLmpzIiwiL1VzZXJzL2RhbmllbC9wcm9qZWN0cy9za3lwdW5jaC9zcmMvanMvZmFrZV8zNTc2NWRjZS5qcyIsIi9Vc2Vycy9kYW5pZWwvcHJvamVjdHMvc2t5cHVuY2gvc3JjL2pzL3BsYXllcnMvQmFzaWNQbGF5ZXIuanMiLCIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL3NyYy9qcy9wbGF5ZXJzL3JvYm90QUkuanMiLCIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL3NyYy9qcy9wbGF5ZXJzL3JvYm90UGxheWVyLmpzIiwiL1VzZXJzL2RhbmllbC9wcm9qZWN0cy9za3lwdW5jaC9zcmMvanMvcGxheWVycy9yb2JvdFB1bmNoQmFnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIGFjdGlvbnMgPSB7XG4gICAgJ2dldGh1cnRMZWZ0Jzoge1xuICAgICAgICBtb3ZlT2theTogZmFsc2UsXG4gICAgICAgIGZhbGxPa2F5OiB0cnVlLFxuICAgICAgICBmaW5hbDogZmFsc2UsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAnbW92ZUxlZnQnLFxuICAgICAgICAgICAgJ2h1cnRQaWMnLFxuICAgICAgICAgICAgJ21vdmVMZWZ0JywgJ21vdmVMZWZ0JyxcbiAgICAgICAgICAgICdwdXNoYmFja1BpYycsXG4gICAgICAgICAgICAnbW92ZUxlZnQnLCAnbW92ZUxlZnQnLFxuICAgICAgICAgICAgJ25vdGhpbmcnLCAnbm90aGluZycsICdub3RoaW5nJyxcbiAgICAgICAgICAgICdub3JtYWxQaWMnLFxuICAgICAgICAgICAgJ25vdGhpbmcnLCAnbm90aGluZycsICdub3RoaW5nJ1xuICAgICAgICBdXG4gICAgfSxcbiAgICAnZ2V0aHVydFJpZ2h0Jzoge1xuICAgICAgICBtb3ZlT2theTogZmFsc2UsXG4gICAgICAgIGZhbGxPa2F5OiB0cnVlLFxuICAgICAgICBmaW5hbDogZmFsc2UsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAnbW92ZVJpZ2h0JyxcbiAgICAgICAgICAgICdodXJ0UGljJyxcbiAgICAgICAgICAgICdtb3ZlUmlnaHQnLCAnbW92ZVJpZ2h0JyxcbiAgICAgICAgICAgICdwdXNoYmFja1BpYycsXG4gICAgICAgICAgICAnbW92ZVJpZ2h0JywgJ21vdmVSaWdodCcsXG4gICAgICAgICAgICAnbm90aGluZycsICdub3RoaW5nJywgJ25vdGhpbmcnLFxuICAgICAgICAgICAgJ25vcm1hbFBpYycsXG4gICAgICAgICAgICAnbm90aGluZycsICdub3RoaW5nJywgJ25vdGhpbmcnXG4gICAgICAgIF1cbiAgICB9LFxuICAgICdkZWFkJzoge1xuICAgICAgICBtb3ZlT2theTogZmFsc2UsXG4gICAgICAgIGZhbGxPa2F5OiB0cnVlLFxuICAgICAgICBmaW5hbDogdHJ1ZSxcbiAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgICdkZWFkUGljJ1xuICAgICAgICBdXG4gICAgfSxcbiAgICAnd2lubmVyJzoge1xuICAgICAgICBtb3ZlT2theTogZmFsc2UsXG4gICAgICAgIGZhbGxPa2F5OiBmYWxzZSxcbiAgICAgICAgZmluYWw6IHRydWUsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAnd2lubmVyUGljJyxcbiAgICAgICAgICAgICdtb3ZlVXAnLCAnbm90aGluZycsXG4gICAgICAgICAgICAnbW92ZVVwJywgJ25vdGhpbmcnLFxuICAgICAgICAgICAgJ21vdmVEb3duJywgJ25vdGhpbmcnLFxuICAgICAgICAgICAgJ21vdmVEb3duJywgJ25vdGhpbmcnLFxuICAgICAgICAgICAgJ25vdGhpbmcnLCAnbm90aGluZydcbiAgICAgICAgXVxuICAgIH0sXG4gICAgJ2p1bXAnOiB7XG4gICAgICAgIG1vdmVPa2F5OiB0cnVlLFxuICAgICAgICBmYWxsT2theTogZmFsc2UsXG4gICAgICAgIGZpbmFsOiBmYWxzZSxcbiAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgICdtb3ZlVXAnLFxuICAgICAgICAgICAgJ2p1bXBQaWMnLFxuICAgICAgICAgICAgJ21vdmVVcCcsICdtb3ZlVXAnLCAnbW92ZVVwJywgJ21vdmVVcCcsICdtb3ZlVXAnXG4gICAgICAgIF1cbiAgICB9LFxuICAgICdsYW5kJzoge1xuICAgICAgICBtb3ZlT2theTogZmFsc2UsXG4gICAgICAgIGZhbGxPa2F5OiB0cnVlLFxuICAgICAgICBmaW5hbDogZmFsc2UsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAnbGFuZGluZ1BpYycsXG4gICAgICAgICAgICAnbm90aGluZycsICdub3RoaW5nJywgJ25vdGhpbmcnLFxuICAgICAgICAgICAgJ25vcm1hbFBpYydcbiAgICAgICAgXVxuICAgIH0sXG4gICAgJ3B1bmNoJzoge1xuICAgICAgICBtb3ZlT2theTogZmFsc2UsXG4gICAgICAgIGZhbGxPa2F5OiB0cnVlLFxuICAgICAgICBmaW5hbDogZmFsc2UsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAnbW92ZUZvcndhcmQnLFxuICAgICAgICAgICAgJ3B1bmNoUGljJyxcbiAgICAgICAgICAgICdtb3ZlRm9yd2FyZCcsXG4gICAgICAgICAgICAnc21hbGxIaXQnLFxuICAgICAgICAgICAgJ21vdmVCYWNrJyxcbiAgICAgICAgICAgICdub3JtYWxQaWMnLFxuICAgICAgICAgICAgJ25vdGhpbmcnLCAnbm90aGluZycsICdub3RoaW5nJ1xuICAgICAgICBdXG4gICAgfSxcbiAgICAna2ljayc6IHtcbiAgICAgICAgbW92ZU9rYXk6IGZhbHNlLFxuICAgICAgICBmYWxsT2theTogdHJ1ZSxcbiAgICAgICAgZmluYWw6IGZhbHNlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgJ21vdmVGb3J3YXJkJyxcbiAgICAgICAgICAgICdtb3ZlRm9yd2FyZCcsXG4gICAgICAgICAgICAna2lja1BpYycsXG4gICAgICAgICAgICAnbW92ZUZvcndhcmQnLFxuICAgICAgICAgICAgJ2JpZ0hpdCcsXG4gICAgICAgICAgICAnbW92ZUJhY2snLCAnbW92ZUJhY2snLFxuICAgICAgICAgICAgJ25vcm1hbFBpYycsXG4gICAgICAgICAgICAnbm90aGluZycsICdub3RoaW5nJywgJ25vdGhpbmcnXG4gICAgICAgIF1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYWN0aW9ucztcbiIsIlxudmFyIHJvYm90UGxheWVyTWFrZXIgPSByZXF1aXJlKCcuL3BsYXllcnMvcm9ib3RQbGF5ZXInKTtcbnZhciBhaVBsYXllck1ha2VyID0gcmVxdWlyZSgnLi9wbGF5ZXJzL3JvYm90QUknKTtcbnZhciBwdW5jaGluZ0JhZ01ha2VyID0gcmVxdWlyZSgnLi9wbGF5ZXJzL3JvYm90UHVuY2hCYWcnKTtcblxudmFyIGtleXMgPSBbXTtcbnZhciBwbGF5ZXJzID0gW107XG5cbi8vIHRoaXMgZnVuY3Rpb24gc3RhcnRzIHRoZSBnYW1lLi5cbmZ1bmN0aW9uIHNreXB1bmNoKCkge1xuXG4gICAgJCgnLmxvYWRpbmdzY3JlZW4nKS5mYWRlT3V0KDkwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIC4uLlxuICAgIH0pO1xuXG4gICAgcGxheWVyID0gcm9ib3RQbGF5ZXJNYWtlcig1LCA4MCwgMTUpO1xuICAgIHBsYXllci5zZXRQbGF5ZXJEb20oJCgnLnJvYm90LnBsYXllcjAnKSk7XG4gICAgcGxheWVyLnNldEhlYWx0aEJhckRvbSgkKCcuaGVhbHRoLnBsYXllcjAnKSk7XG4gICAgcGxheWVycy5wdXNoKHBsYXllcik7XG5cbiAgICBvcHBvbmVudCA9IGFpUGxheWVyTWFrZXIoNSwgMzIwLCAyMCk7XG4gICAgb3Bwb25lbnQgPSBwdW5jaGluZ0JhZ01ha2VyKDEwLCAzMjAsIDIwKTtcbiAgICBvcHBvbmVudC5zZXRQbGF5ZXJEb20oJCgnLnJvYm90LnBsYXllcjEnKSk7XG4gICAgb3Bwb25lbnQuc2V0SGVhbHRoQmFyRG9tKCQoJy5oZWFsdGgucGxheWVyMScpKTtcbiAgICBwbGF5ZXJzLnB1c2gob3Bwb25lbnQpO1xuXG4gICAgJCgnYm9keScpLm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGtleSA9IGV2ZW50LndoaWNoO1xuICAgICAgICBpZiAoa2V5cy5pbmRleE9mKGtleSkgPT0gLTEpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkKCdib2R5Jykub24oJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGtleUluZGV4ID0ga2V5cy5pbmRleE9mKGV2ZW50LndoaWNoKTtcbiAgICAgICAgaWYgKGtleUluZGV4ICE9IC0xKSB7XG4gICAgICAgICAgICBrZXlzLnNwbGljZShrZXlJbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHNldEludGVydmFsKHRpY2ssIDUwKTtcbn1cblxud2luZG93LnNreXB1bmNoID0gc2t5cHVuY2g7XG5cbi8vIHBlcmlvZGljYWxseSBwcm9jZXNzIGV2ZW50c1xuZnVuY3Rpb24gdGljaygpIHtcbiAgICB2YXIgcGxheWVyO1xuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAga2V5czoga2V5cyxcbiAgICAgICAgcG9zaXRpb25zOiBbXVxuICAgIH07XG4gICAgdmFyIGhpdHMgPSBbXTtcbiAgICBmdW5jdGlvbiByZWNvcmRIaXQocGxheWVyLCBkaXIsIHBvcywgaGVpZ2h0LCBkYW1hZ2UpIHtcbiAgICAgICAgaGl0cy5wdXNoKHsgcGxheWVyOnBsYXllciwgZGlyOmRpciwgcG9zOnBvcywgaGVpZ2h0OmhlaWdodCwgZGFtYWdlOmRhbWFnZSB9KTtcbiAgICB9XG5cbiAgICAvLyBhc3NlbWJsZSBwb3NpdGlvbnMgb2YgcGxheWVycy4uXG4gICAgZm9yIChwbGF5ZXJJZCBpbiBwbGF5ZXJzKSB7XG4gICAgICAgIHBsYXllciA9IHBsYXllcnNbcGxheWVySWRdO1xuICAgICAgICBzdGF0ZS5wb3NpdGlvbnMucHVzaChwbGF5ZXIucG9zaXRpb24pO1xuICAgIH1cblxuICAgIC8vIG5vdyBnaXZlIGVhY2ggcGxheWVyIHRoZSBnYW1lIHN0YXRlIGFuZCBzZWUgd2hhdCB0aGV5IGRvXG4gICAgZm9yIChwbGF5ZXJJZCBpbiBwbGF5ZXJzKSB7XG4gICAgICAgIHBsYXllciA9IHBsYXllcnNbcGxheWVySWRdO1xuICAgICAgICAvLyBsZXQgdGhlIHBsYXllciBkbyBhIHRoaW5nXG4gICAgICAgIHBsYXllci50aWNrKHN0YXRlLCB7XG4gICAgICAgICAgICBoaXQ6IGZ1bmN0aW9uKGRpciwgcG9zLCBoZWlnaHQsIGRhbWFnZSkgeyByZWNvcmRIaXQocGxheWVyLCBkaXIsIHBvcywgaGVpZ2h0LCBkYW1hZ2UpOyB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBkcmF3IHRoZSBwb3NzaWJseS11cGRhdGVkIHBsYXllclxuICAgICAgICBwbGF5ZXIuZHJhdygpO1xuICAgIH1cblxuICAgIHZhciBoaXQgPSBudWxsO1xuXG4gICAgLy8gbm93IHRlbGwgZWFjaCBwbGF5ZXIgYWJvdXQgdGhlIGhpdHMgdGhhdCBoYXBwZW5lZFxuICAgIGZvciAocGxheWVySWQgaW4gcGxheWVycykge1xuICAgICAgICBwbGF5ZXIgPSBwbGF5ZXJzW3BsYXllcklkXTtcbiAgICAgICAgZm9yIChoaXRJZCBpbiBoaXRzKSB7XG4gICAgICAgICAgICBpZiAocGxheWVyICE9PSBoaXRzW2hpdElkXS5wbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICBoaXQgPSBoaXRzW2hpdElkXTtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuZ2V0SGl0KGhpdC5kaXJlY3Rpb24sIGhpdC5wb3MsIGhpdC5oZWlnaHQsIGhpdC5kYW1hZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhpcyBpcyB0aGUgbGFzdCBsb29wIHRocm91Z2ggcGxheWVycywgc28gZHJhd1xuICAgICAgICAvLyB0aGUgcG9zc2libHktdXBkYXRlZCBwbGF5ZXIgbm93LlxuICAgICAgICBwbGF5ZXIuZHJhdygpO1xuICAgIH1cbn1cbiIsIlxuYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvYmFzaWNhY3Rpb25zJyk7XG5cbmZ1bmN0aW9uIFBsYXllcih0eXBlLCBoZWFsdGgsIHBvc2l0aW9uLCBoZWlnaHQpIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaGVhbHRoID0gaGVhbHRoIHx8IDU7XG4gICAgdGhpcy5yb2JvdCA9ICdyb2JvdDInO1xuICAgIHRoaXMuZGlyZWN0aW9uID0gMTtcbiAgICB0aGlzLnBpYyA9ICdub3JtYWwnO1xuICAgIHRoaXMuY3VycmVudEFjdGlvbiA9IG51bGw7XG4gICAgdGhpcy5uZXh0U3RlcCA9IDA7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uIHx8IDgwO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0IHx8IDE1O1xuICAgIHRoaXMuaGVhbHRoID0gaGVhbHRoIHx8IDU7XG4gICAgdGhpcy5kaXJ0eSA9IFsncGljJywgJ3Bvc2l0aW9uJywgJ2hlaWdodCcsICdoZWFsdGgnXTtcblxuICAgIHRoaXMuZG9tID0gbnVsbDtcbn1cblxuUGxheWVyLnByb3RvdHlwZSA9IHtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gc3R1ZmYgeW91IHNob3VsZCBvdmVycmlkZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLy8gb3ZlcnJpZGUgdGhpcyB0byBwaWNrIHRoZSBuZXh0IGFjdGlvbiBkdXJpbmcgYSB0aWNrXG4gICAgY2hvb3NlTmV4dEFjdGlvbjogZnVuY3Rpb24gY2hvb3NlTmV4dEFjdGlvbihzdGF0ZSwgY2FsbGJhY2tzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTdWJjbGFzc2VzIG9mIFBsYXllciBzaG91bGQgb3ZlcnJpZGUgY2hvb3NlTmV4dEFjdGlvbigpLicpO1xuICAgIH0sXG5cbiAgICAvLyBvdmVycmlkZSB0aGlzIHRvIHBlcmZvcm0gYSBoaXQgYXQgdGhlIGxvY2F0aW9uIHRoYXQgbWF0Y2hlc1xuICAgIC8vIHlvdXIgcGljdHVyZXMsIHByb2JhYmx5IGEgcHVuY2hcbiAgICBzbWFsbEhpdDogZnVuY3Rpb24gc21hbGxIaXQoc3RhdGUsIGNhbGxiYWNrcykge1xuICAgICAgICB2YXIgYXJtTGVuZ3RoID0gMjA7ICAvLyBob3cgZmFyIGluIGZyb250IG9mIHlvdSBhcmUgeW91IHB1bmNoaW5nXG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLmRpcmVjdGlvbjsgLy8gLTEgaXMgbGVmdCwgKzEgaXMgcmlnaHRcbiAgICAgICAgdmFyIGhpdFBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiArIChkaXJlY3Rpb24gKiBhcm1MZW5ndGgpO1xuICAgICAgICB2YXIgaGl0SGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgICAgIC8vIG5vdyBpbnZva2UgdGhlIGNhbGxiYWNrIGZvciBoaXR0aW5nIGF0IHRoYXQgc3BvdFxuICAgICAgICBjYWxsYmFja3MuaGl0KGRpcmVjdGlvbiwgaGl0UG9zaXRpb24sIGhpdEhlaWdodCwgMSk7XG4gICAgfSxcblxuICAgIC8vIG92ZXJyaWRlIHRoaXMgdG8gcGVyZm9ybSBhIGhpdCBhdCB0aGUgbG9jYXRpb24gdGhhdCBtYXRjaGVzXG4gICAgLy8geW91ciBwaWN0dXJlcywgcHJvYmFibHkgYSBraWNrXG4gICAgYmlnSGl0OiBmdW5jdGlvbiBiaWdIaXQoc3RhdGUsIGNhbGxiYWNrcykge1xuICAgICAgICB2YXIgbGVnTGVuZ3RoID0gMzA7ICAvLyBob3cgZmFyIGluIGZyb250IG9mIHlvdSBhcmUgeW91IGtpY2tpbmdcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuZGlyZWN0aW9uOyAvLyAtMSBpcyBsZWZ0LCArMSBpcyByaWdodFxuICAgICAgICB2YXIgaGl0UG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uICsgKGRpcmVjdGlvbiAqIGxlZ0xlbmd0aCk7XG4gICAgICAgIHZhciBoaXRIZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICAgICAgLy8gbm93IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIGhpdHRpbmcgYXQgdGhhdCBzcG90XG4gICAgICAgIGNhbGxiYWNrcy5oaXQoZGlyZWN0aW9uLCBoaXRQb3NpdGlvbiwgaGl0SGVpZ2h0LCAyKTtcbiAgICB9LFxuXG4gICAgLy8gb3ZlcnJpZGUgdGhpcyB0byB3b3JrIG91dCBvZiB5b3VyIHBsYXllciBnZXRzIGhpdCBvciBub3QuXG4gICAgLy8gbWFrZSBzdXJlIHlvdSByZXR1cm4gdHJ1ZSBpZiB5b3UgZ2V0IGtpbGxlZCBieSB0aGUgaGl0LlxuICAgIGdldEhpdDogZnVuY3Rpb24gZ2V0SGl0KGhpdERpcmVjdGlvbiwgaGl0UG9zLCBoaXRIZWlnaHQsIGRhbWFnZSkge1xuICAgICAgICB2YXIgcGxheWVyV2lkdGggPSAxMDA7IC8vIGhvdyB3aWRlIGlzIHlvdXIgY29tYmF0YW50XG4gICAgICAgIHZhciBwbGF5ZXJIZWlnaHQgPSAyOyAvLyBob3cgdGFsbCBpcyB5b3VyIGNvbWJhdGFudFxuXG4gICAgICAgIHZhciBtaW5Qb3MgPSB0aGlzLnBvc2l0aW9uO1xuICAgICAgICB2YXIgbWF4UG9zID0gdGhpcy5wb3NpdGlvbiArIHBsYXllcldpZHRoO1xuXG4gICAgICAgIHZhciBtaW5IZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICAgICAgdmFyIG1heEhlaWdodCA9IHRoaXMuaGVpZ2h0ICsgcGxheWVySGVpZ2h0O1xuXG4gICAgICAgIC8vIG5vdyB3b3JrIG91dCBpZiB5b3Ugd2VyZSBoaXQuLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBtaW5Qb3MgPD0gICAgaGl0UG9zICYmIGhpdFBvcyAgICA8PSBtYXhQb3NcbiAgICAgICAgICAgICYmIG1pbkhlaWdodCA8PSBoaXRIZWlnaHQgJiYgaGl0SGVpZ2h0IDw9IG1heEhlaWdodFxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIHdlJ3JlIGhpdCFcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9ICdnZXRodXJ0JyArIChoaXREaXJlY3Rpb24gPT0gMSA/ICdSaWdodCcgOiAnTGVmdCcpO1xuXG4gICAgICAgICAgICB0aGlzLmhlYWx0aCAtPSBkYW1hZ2U7XG4gICAgICAgICAgICAvLyB3aGVuIHlvdSBjaGFuZ2UgaGVhbHRoLCBub3RlIHRoYXQgaGVhbHRoIGlzIGRpcnR5XG4gICAgICAgICAgICB0aGlzLmRpcnR5LnB1c2goJ2hlYWx0aCcpO1xuXG4gICAgICAgICAgICB0aGlzLm5leHRTdGVwID0gMDtcbiAgICAgICAgICAgIGlmICh0aGlzLmhlYWx0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gJ2RlYWQnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIGJlbG93IGhlcmUgeW91IHdvbid0IG5lZWQgdG8gb3ZlcnJpZGUgYW55dGhpbmcgdW5sZXNzIHlvdSdyZVxuICAgIC8vIG1ha2luZyBzb21ldGhpbmcgc3BlY2lhbC5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBjb25zdHJ1Y3RvcjogUGxheWVyLFxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2F5VHlwZTogZnVuY3Rpb24gc2F5VHlwZSgpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy50eXBlKTtcbiAgICB9LFxuICAgIC8vIGRyYXcgdGhlIHBsYXllciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc2V0UGxheWVyRG9tOiBmdW5jdGlvbiBzZXRQbGF5ZXJEb20oZWxlbWVudCkge1xuICAgICAgICB0aGlzLmRvbSA9ICQoZWxlbWVudCk7XG4gICAgfSxcblxuICAgIHNldEhlYWx0aEJhckRvbTogZnVuY3Rpb24gc2V0SGVhbHRoQmFyRG9tKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5oZWFsdGhEb20gPSAkKGVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICBkcmF3OiBmdW5jdGlvbiBkcmF3KCkge1xuICAgICAgICBpZiAodGhpcy5kb20pIHtcbiAgICAgICAgICAgIHZhciBjc3NVcGRhdGUgPSB7fVxuXG4gICAgICAgICAgICB2YXIgdG9wID0gMTMwIC0gKHRoaXMuaGVpZ2h0ICogMjApO1xuICAgICAgICAgICAgdmFyIGxlZnQgPSB0aGlzLnBvc2l0aW9uO1xuXG4gICAgICAgICAgICAvLyBoZWFsdGggYmFyIG5lZWQgdXBkYXRpbmc/XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eS5pbmRleE9mKCdoZWFsdGgnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGVhbHRoRG9tLndpZHRoKHRoaXMuaGVhbHRoICogMjApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBwbGF5ZXIgbmVlZCB1cGRhdGluZz9cbiAgICAgICAgICAgIGlmICh0aGlzLmRpcnR5LmluZGV4T2YoJ3BpYycpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgY3NzVXBkYXRlLmJhY2tncm91bmRJbWFnZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3VybChyb2JvdHMnLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvYm90LFxuICAgICAgICAgICAgICAgICAgICAodGhpcy5kaXJlY3Rpb24gPT0gMSA/ICdyaWdodCcgOiAnbGVmdCcpLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBpYyArICcuc3ZnKScsXG4gICAgICAgICAgICAgICAgXS5qb2luKCcvJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eS5pbmRleE9mKCdwb3NpdGlvbicpICE9IC0xIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5kaXJ0eS5pbmRleE9mKCdoZWlnaHQnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIGNzc1VwZGF0ZS5sZWZ0ID0gdGhpcy5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBjc3NVcGRhdGUudG9wID0gKDEzMCAtICh0aGlzLmhlaWdodCAqIDIwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gW107XG4gICAgICAgICAgICB0aGlzLmRvbS5jc3MoY3NzVXBkYXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZHJhdyBcIiArIHRoaXMudHlwZSArXG4gICAgICAgICAgICAgICAgICBcIiBwbGF5ZXIgd2l0aG91dCBhIERPTSBlbGVtZW50LiBcXG5cIiArXG4gICAgICAgICAgICAgICAgICBcIkNhbGwgcGxheWVyLnNldERvbShlbGVtZW50KSB0byBhc3NpZ24gYW4gZWxlbWVudC5cIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLy8gYWN0dWFsbHkgZG8gdGhpbmdzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0aWNrOiBmdW5jdGlvbiB0aWNrKHN0YXRlLCBjYWxsYmFja3MpIHtcblxuICAgICAgICAvLyBwZXJmb3JtIHRoZSBjdXJyZW50IGFjdGlvbiAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRBY3Rpb24pIHtcbiAgICAgICAgICAgIC8vIGlmIHRoZXJlJ3MgYSBjdXJyZW50IGFjdGlvbiwgdGFrZSBpdHMgbmV4dCBzdGVwXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gYWN0aW9uc1t0aGlzLmN1cnJlbnRBY3Rpb25dO1xuICAgICAgICAgICAgdmFyIHN0ZXAgPSBhY3Rpb24uc3RlcHNbdGhpcy5uZXh0U3RlcF07XG5cbiAgICAgICAgICAgIGlmIChzdGVwICYmIHRoaXNbc3RlcF0pIHtcbiAgICAgICAgICAgICAgICB0aGlzW3N0ZXBdLmNhbGwodGhpcywgc3RhdGUsIGNhbGxiYWNrcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGdldCByZWFkeSBmb3IgdGhlIG5leHQgc3RlcFxuICAgICAgICAgICAgdGhpcy5uZXh0U3RlcCArPSAxO1xuICAgICAgICAgICAgaWYgKHRoaXMubmV4dFN0ZXAgPj0gYWN0aW9uLnN0ZXBzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIC8vIGRpZCB0aGUgbGFzdCBzdGVwLi4gY2xlYXIgb2ZmIHRoZSBjdXJyZW50QWN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRTdGVwID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG9iZXkgZ3Jhdml0eSAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgKHRoaXMuY2FuRmFsbCgpKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVEb3duKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5oZWlnaHQgPCAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSAwO1xuICAgICAgICAgICAgICAgIGlmICghIHRoaXMuaXNMb2NrZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSAnbGFuZCc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dFN0ZXAgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlY2lkZSB3aGF0IHRvIGRvIG5leHQgLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgKCEgdGhpcy5jdXJyZW50QWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBkb3duc3RyZWFtIHN1YmNsYXNzZXMgc3VwcGx5IHRoaXNcbiAgICAgICAgICAgIHRoaXMuY2hvb3NlTmV4dEFjdGlvbihzdGF0ZSwgY2FsbGJhY2tzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBwaWMgcGljIHN3aXRjaGluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN3aXRjaFBpYzogZnVuY3Rpb24gc3dpdGNoUGljKG5ld1BpYykge1xuICAgICAgICBpZiAodGhpcy5waWMgIT0gbmV3UGljKSB7XG4gICAgICAgICAgICB0aGlzLnBpYyA9IG5ld1BpYztcbiAgICAgICAgICAgIHRoaXMuZGlydHkucHVzaCgncGljJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGp1bXBQaWM6IGZ1bmN0aW9uIGp1bXBQaWMoKSAgICAgICAgIHsgdGhpcy5zd2l0Y2hQaWMoJ2p1bXAnKTsgfSxcbiAgICBwdW5jaFBpYzogZnVuY3Rpb24gcHVuY2hQaWMoKSAgICAgICB7IHRoaXMuc3dpdGNoUGljKCdwdW5jaCcpOyB9LFxuICAgIGtpY2tQaWM6IGZ1bmN0aW9uIGtpY2tQaWMoKSAgICAgICAgIHsgdGhpcy5zd2l0Y2hQaWMoJ2tpY2snKTsgfSxcbiAgICBub3JtYWxQaWM6IGZ1bmN0aW9uIG5vcm1hbFBpYygpICAgICB7IHRoaXMuc3dpdGNoUGljKCdub3JtYWwnKTsgfSxcbiAgICBsYW5kaW5nUGljOiBmdW5jdGlvbiBsYW5kaW5nUGljKCkgICB7IHRoaXMuc3dpdGNoUGljKCdsYW5kaW5nJyk7IH0sXG4gICAgaHVydFBpYzogZnVuY3Rpb24gaHVydFBpYygpICAgICAgICAgeyB0aGlzLnN3aXRjaFBpYygnaHVydCcpOyB9LFxuICAgIHB1c2hiYWNrUGljOiBmdW5jdGlvbiBwdXNoYmFja1BpYygpIHsgdGhpcy5zd2l0Y2hQaWMoJ3B1c2hiYWNrJyk7IH0sXG4gICAgZGVhZFBpYzogZnVuY3Rpb24gZGVhZFBpYygpICAgICAgICAgeyB0aGlzLnN3aXRjaFBpYygnZGVhZCcpOyB9LFxuICAgIHdpbm5lclBpYzogZnVuY3Rpb24gd2lubmVyUGljKCkgICAgIHsgdGhpcy5zd2l0Y2hQaWMoJ3dpbm5lcicpOyB9LFxuXG4gICAgLy8gdGVzdHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjYW5GYWxsOiBmdW5jdGlvbiBjYW5GYWxsKCkge1xuICAgICAgICByZXR1cm4gKCB0aGlzLmhlaWdodCA+IDAgJiYgKFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID09PSBudWxsXG4gICAgICAgICAgICB8fCBhY3Rpb25zW3RoaXMuY3VycmVudEFjdGlvbl0uZmFsbE9rYXlcbiAgICAgICAgKSAgIClcbiAgICB9LFxuXG4gICAgY2FuTW92ZTogZnVuY3Rpb24gY2FuTW92ZSgpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9PT0gbnVsbFxuICAgICAgICAgICAgfHwgYWN0aW9uc1t0aGlzLmN1cnJlbnRBY3Rpb25dLm1vdmVPa2F5XG4gICAgICAgIClcbiAgICB9LFxuXG4gICAgaXNMb2NrZWQ6IGZ1bmN0aW9uIGlzTG9ja2VkKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uICE9PSBudWxsXG4gICAgICAgICAgICAmJiBhY3Rpb25zW3RoaXMuY3VycmVudEFjdGlvbl0uaXNGaW5hbFxuICAgICAgICApXG4gICAgfSxcblxuICAgIC8vIGRvaW5nIG5vdGhpbmcuLi4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbm90aGluZzogZnVuY3Rpb24gbm90aGluZygpIHtcbiAgICAgICAgLy8gLi4gZG9pbmcgbm90aGluZywgYXMgaW5zdHJ1Y3RlZFxuICAgIH0sXG5cbiAgICAvLyBhYnNvbHV0ZSBtb3ZlbWVudCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG1vdmVVcDogZnVuY3Rpb24gbW92ZVVwKCkge1xuICAgICAgICB0aGlzLmhlaWdodCsrO1xuICAgICAgICB0aGlzLmRpcnR5LnB1c2goJ2hlaWdodCcpO1xuICAgIH0sXG5cbiAgICBtb3ZlRG93bjogZnVuY3Rpb24gbW92ZURvd24oKSB7XG4gICAgICAgIHRoaXMuaGVpZ2h0LS07XG4gICAgICAgIHRoaXMuZGlydHkucHVzaCgnaGVpZ2h0Jyk7XG4gICAgfSxcblxuICAgIG1vdmVMZWZ0OiBmdW5jdGlvbiBtb3ZlTGVmdCgpIHtcbiAgICAgICAgaWYgKHRoaXMucG9zaXRpb24gPiAxMCkge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiAtPSA1O1xuICAgICAgICAgICAgdGhpcy5kaXJ0eS5wdXNoKCdwb3NpdGlvbicpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG1vdmVSaWdodDogZnVuY3Rpb24gbW92ZVJpZ2h0KCkge1xuICAgICAgICBpZiAodGhpcy5wb3NpdGlvbiA8IDM1MCkge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiArPSA1O1xuICAgICAgICAgICAgdGhpcy5kaXJ0eS5wdXNoKCdwb3NpdGlvbicpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIGRpcmVjdGlvbmFsIG1vdmVtZW50IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZmFjZUxlZnQ6IGZ1bmN0aW9uIGZhY2VMZWZ0KCkge1xuICAgICAgICBpZiAodGhpcy5kaXJlY3Rpb24gIT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gLTE7XG4gICAgICAgICAgICB0aGlzLmRpcnR5LnB1c2goJ3BpYycpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZhY2VSaWdodDogZnVuY3Rpb24gZmFjZVJpZ2h0KCkge1xuICAgICAgICBpZiAodGhpcy5kaXJlY3Rpb24gIT0gMSkge1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSAxO1xuICAgICAgICAgICAgdGhpcy5kaXJ0eS5wdXNoKCdwaWMnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBtb3ZlRm9yd2FyZDogZnVuY3Rpb24gbW92ZUZvcndhcmQoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpcmVjdGlvbiA9PSAxKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVSaWdodCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tb3ZlTGVmdCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG1vdmVCYWNrOiBmdW5jdGlvbiBtb3ZlQmFjaygpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uID09IDEpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZUxlZnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVJpZ2h0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBlbmQgb2YgUGxheWVyIHByb3RvdHlwZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllcjsiLCJCYXNpY1BsYXllciA9IHJlcXVpcmUoJy4vQmFzaWNQbGF5ZXInKTtcblxuYWlQbGF5ZXJNYWtlciA9IGZ1bmN0aW9uIEFpUGxheWVyTWFrZXIoaGVhbHRoLCBwb3NpdGlvbiwgaGVpZ2h0KSB7XG4gICAgdmFyIHBsYXllciA9IG5ldyBCYXNpY1BsYXllcignQUknLCBoZWFsdGgsIHBvc2l0aW9uLCBoZWlnaHQpO1xuXG4gICAgcGxheWVyLmNob29zZU5leHRBY3Rpb24gPSBmdW5jdGlvbiBjaG9vc2VBaUFjdGlvbihzdGF0ZSwgY2FsbGJhY2tzKSB7XG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgICAgICAgICBfXy9fXy9fXy9fXy8gICAgICAgIF9fL19fL19fL1xuICAgICAgICAvLyAgICAgICAgICBfXy8gICAgICBfXy8gICAgICAgICAgIF9fL1xuICAgICAgICAvLyAgICAgICAgIF9fL19fL19fL19fLyAgICAgICAgICAgX18vXG4gICAgICAgIC8vICAgICAgICBfXy8gICAgICBfXy8gIF9fLyAgIF9fL19fL19fLyAgX18vXG4gICAgICAgIC8vXG4gICAgICAgIC8vICBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSVxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vIGRlY2lkZSB3aGF0IHRvIGRvXG4gICAgICAgIHZhciByYW5kID0gTWF0aC5yYW5kb20oKTtcblxuICAgICAgICB2YXIgb3RoZXJQb3MgPSBzdGF0ZS5wb3NpdGlvbnMuZmlsdGVyKCBmdW5jdGlvbihwb3MpIHtcbiAgICAgICAgICAgIHJldHVybiAocG9zICE9IHRoaXMucG9zaXRpb24pO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAvLyBpcyB0aGUgb3Bwb2VudCB0byBvdXIgbGVmdD9cbiAgICAgICAgdmFyIG9wcG9uZW50SXNMZWZ0ID0gKG90aGVyUG9zWzBdIDwgdGhpcy5wb3NpdGlvbik7XG5cbiAgICAgICAgaWYgKHJhbmQgPCAwLjIpIHtcbiAgICAgICAgICAgIC8vIG1vdmUgdG93YXJkIHRoZSBvdGhlciBwbGF5ZXJcbiAgICAgICAgICAgIGlmIChvcHBvbmVudElzTGVmdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjZUxlZnQocGxheWVySWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY2VSaWdodChwbGF5ZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5jYW5Nb3ZlKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVGb3J3YXJkKHBsYXllcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoMC4yIDwgcmFuZCAmJiByYW5kIDwgMC4zKSB7XG4gICAgICAgICAgICAvLyBtb3ZlIEFXQVkgRlJPTSB0aGUgb3RoZXIgcGxheWVyXG4gICAgICAgICAgICBpZiAob3Bwb25lbnRJc0xlZnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY2VSaWdodChwbGF5ZXJJZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjZUxlZnQocGxheWVySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuY2FuTW92ZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRm9yd2FyZChwbGF5ZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRBY3Rpb24gJiYgMC4zIDwgcmFuZCAmJiByYW5kIDwgMC40KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSAncHVuY2gnO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5jdXJyZW50QWN0aW9uICYmIDAuNCA8IHJhbmQgJiYgcmFuZCA8IDAuNSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gJ2tpY2snO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICF0aGlzLmN1cnJlbnRBY3Rpb24gJiYgMC42IDwgcmFuZCAmJiByYW5kIDwgMC43XG4gICAgICAgICAgICAmJiB0aGlzLmhlaWdodCA9PSAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gJ2p1bXAnO1xuICAgICAgICB9XG4gICAgICAgIC8vIEFJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB9XG5cbiAgICByZXR1cm4gcGxheWVyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFpUGxheWVyTWFrZXI7IiwiXG5CYXNpY1BsYXllciA9IHJlcXVpcmUoJy4vQmFzaWNQbGF5ZXInKTtcblxuZnVuY3Rpb24gaXNJbihrZXksIGtleXMpIHtcbiAgICByZXR1cm4gKGtleXMuaW5kZXhPZihrZXkpICE9IC0xKTtcbn1cblxucm9ib3RQbGF5ZXJNYWtlciA9IGZ1bmN0aW9uIHJvYm90UGxheWVyTWFrZXIoaGVhbHRoLCBwb3NpdGlvbiwgaGVpZ2h0KSB7XG5cbiAgICB2YXIgcGxheWVyID0gbmV3IEJhc2ljUGxheWVyKCdyb2JvdCcsIGhlYWx0aCwgcG9zaXRpb24sIGhlaWdodCk7XG5cbiAgICBwbGF5ZXIuY2hvb3NlTmV4dEFjdGlvbiA9IGZ1bmN0aW9uIGNob29zZUFjdGlvbihzdGF0ZSwgY2FsbGJhY2tzKSB7XG4gICAgICAgIGlmICghIHRoaXMuY3VycmVudEFjdGlvbikge1xuICAgICAgICAgICAgLy8gbm8gY3VycmVudCBhY3Rpb24uLiBkZWNpZGUgd2hhdCdzIG5leHRcbiAgICAgICAgICAgIGlmIChpc0luKDY5LCBzdGF0ZS5rZXlzKSkgeyB0aGlzLmN1cnJlbnRBY3Rpb24gPSAncHVuY2gnOyB9XG4gICAgICAgICAgICBpZiAoaXNJbig4Miwgc3RhdGUua2V5cykpIHsgdGhpcy5jdXJyZW50QWN0aW9uID0gJ2tpY2snOyB9XG4gICAgICAgICAgICBpZiAoaXNJbigzMiwgc3RhdGUua2V5cykgJiYgdGhpcy5oZWlnaHQgPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9ICdqdW1wJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoICF0aGlzLmN1cnJlbnRBY3Rpb24gfHxcbiAgICAgICAgICAgICBhY3Rpb25zW3RoaXMuY3VycmVudEFjdGlvbl0ubW92ZU9rYXkpIHtcbiAgICAgICAgICAgIGlmIChpc0luKDY1LCBzdGF0ZS5rZXlzKSB8fCBpc0luKDM3LCBzdGF0ZS5rZXlzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjZUxlZnQocGxheWVySWQpO1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZUxlZnQocGxheWVySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzSW4oNjgsIHN0YXRlLmtleXMpIHx8IGlzSW4oMzksIHN0YXRlLmtleXMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWNlUmlnaHQocGxheWVySWQpO1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZVJpZ2h0KHBsYXllcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHBsYXllcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByb2JvdFBsYXllck1ha2VyOyIsIkJhc2ljUGxheWVyID0gcmVxdWlyZSgnLi9CYXNpY1BsYXllcicpO1xuXG5wbGF5ZXJNYWtlciA9IGZ1bmN0aW9uIHBsYXllck1ha2VyKGhlYWx0aCwgcG9zaXRpb24sIGhlaWdodCkge1xuICAgIHZhciBwbGF5ZXIgPSBuZXcgQmFzaWNQbGF5ZXIoJ1B1bmNoQmFnJywgaGVhbHRoLCBwb3NpdGlvbiwgaGVpZ2h0KTtcblxuICAgIHBsYXllci5jaG9vc2VOZXh0QWN0aW9uID0gZnVuY3Rpb24gY2hvb3NlQWlBY3Rpb24oc3RhdGUsIGNhbGxiYWNrcykge1xuICAgICAgICAvLyBkZWNpZGUgd2hhdCB0byBkb1xuICAgICAgICB2YXIgcmFuZCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICAgICAgdmFyIG90aGVyUG9zID0gc3RhdGUucG9zaXRpb25zLmZpbHRlciggZnVuY3Rpb24ocG9zKSB7XG4gICAgICAgICAgICByZXR1cm4gKHBvcyAhPSB0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gaXMgdGhlIG9wcG9lbnQgdG8gb3VyIGxlZnQ/XG4gICAgICAgIHZhciBvcHBvbmVudElzTGVmdCA9IChvdGhlclBvc1swXSA8IHRoaXMucG9zaXRpb24pO1xuXG4gICAgICAgIGlmIChyYW5kIDwgMC4wMSkge1xuICAgICAgICAgICAgLy8gZmFjZSB0aGUgb3RoZXIgcGxheWVyXG4gICAgICAgICAgICBpZiAob3Bwb25lbnRJc0xlZnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY2VMZWZ0KHBsYXllcklkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWNlUmlnaHQocGxheWVySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBsYXllcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwbGF5ZXJNYWtlcjsiXX0=
