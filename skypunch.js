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

var keys = [];
var players = [];

// this function starts the game..
function skypunch() {

    player = robotPlayerMaker(5, 80, 15);
    player.setPlayerDom($('.robot.player0'));
    player.setHealthBarDom($('.health.player0'));
    players.push(player);

    opponent = aiPlayerMaker(5, 320, 20);
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


// hitting --------------------------------------------------

function hit(playerId, size) {
    var player = players[playerId];
    // look through other players, finding players in range
    for (opponentId in players) {
        if (opponentId == playerId) {
            continue;
        }
        var opponent = players[opponentId];
        var near = player.position + (player.direction * 10);
        var far = player.position + (player.direction * 100);
        if (
               (opponent.position < Math.max(near, far))
            && (opponent.position > Math.min(near, far))
        ) {
            // he's in range of our hit
            opponent.currentAction = 'gethurt' + (player.direction == 1 ? 'Right' : 'Left');
            opponent.health -= size;
            $('.health.player' + opponentId).css('width', (20 * opponent.health) + 'px');
            opponent.nextStep = 0;
            if (opponent.health <= 0) {
                opponent.currentAction = 'dead';
                player.currentAction = 'winner';
                player.nextStep = 0;
            }
        }
    }
}

function smallHit(playerId) {
    hit(playerId, 1);
}

function bigHit(playerId) {
    hit(playerId, 2);
}

},{"./players/robotAI":4,"./players/robotPlayer":5}],3:[function(require,module,exports){

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
    this.dirty = ['pic', 'position', 'height'];

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
},{"./BasicPlayer":3}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9kYW5pZWwvcHJvamVjdHMvc2t5cHVuY2gvc3JjL2pzL2FjdGlvbnMvYmFzaWNhY3Rpb25zLmpzIiwiL1VzZXJzL2RhbmllbC9wcm9qZWN0cy9za3lwdW5jaC9zcmMvanMvZmFrZV84YWQ4ODRmNS5qcyIsIi9Vc2Vycy9kYW5pZWwvcHJvamVjdHMvc2t5cHVuY2gvc3JjL2pzL3BsYXllcnMvQmFzaWNQbGF5ZXIuanMiLCIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL3NyYy9qcy9wbGF5ZXJzL3JvYm90QUkuanMiLCIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL3NyYy9qcy9wbGF5ZXJzL3JvYm90UGxheWVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbnZhciBhY3Rpb25zID0ge1xuICAgICdnZXRodXJ0TGVmdCc6IHtcbiAgICAgICAgbW92ZU9rYXk6IGZhbHNlLFxuICAgICAgICBmYWxsT2theTogdHJ1ZSxcbiAgICAgICAgZmluYWw6IGZhbHNlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgJ21vdmVMZWZ0JyxcbiAgICAgICAgICAgICdodXJ0UGljJyxcbiAgICAgICAgICAgICdtb3ZlTGVmdCcsICdtb3ZlTGVmdCcsXG4gICAgICAgICAgICAncHVzaGJhY2tQaWMnLFxuICAgICAgICAgICAgJ21vdmVMZWZ0JywgJ21vdmVMZWZ0JyxcbiAgICAgICAgICAgICdub3RoaW5nJywgJ25vdGhpbmcnLCAnbm90aGluZycsXG4gICAgICAgICAgICAnbm9ybWFsUGljJyxcbiAgICAgICAgICAgICdub3RoaW5nJywgJ25vdGhpbmcnLCAnbm90aGluZydcbiAgICAgICAgXVxuICAgIH0sXG4gICAgJ2dldGh1cnRSaWdodCc6IHtcbiAgICAgICAgbW92ZU9rYXk6IGZhbHNlLFxuICAgICAgICBmYWxsT2theTogdHJ1ZSxcbiAgICAgICAgZmluYWw6IGZhbHNlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgJ21vdmVSaWdodCcsXG4gICAgICAgICAgICAnaHVydFBpYycsXG4gICAgICAgICAgICAnbW92ZVJpZ2h0JywgJ21vdmVSaWdodCcsXG4gICAgICAgICAgICAncHVzaGJhY2tQaWMnLFxuICAgICAgICAgICAgJ21vdmVSaWdodCcsICdtb3ZlUmlnaHQnLFxuICAgICAgICAgICAgJ25vdGhpbmcnLCAnbm90aGluZycsICdub3RoaW5nJyxcbiAgICAgICAgICAgICdub3JtYWxQaWMnLFxuICAgICAgICAgICAgJ25vdGhpbmcnLCAnbm90aGluZycsICdub3RoaW5nJ1xuICAgICAgICBdXG4gICAgfSxcbiAgICAnZGVhZCc6IHtcbiAgICAgICAgbW92ZU9rYXk6IGZhbHNlLFxuICAgICAgICBmYWxsT2theTogdHJ1ZSxcbiAgICAgICAgZmluYWw6IHRydWUsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAnZGVhZFBpYydcbiAgICAgICAgXVxuICAgIH0sXG4gICAgJ3dpbm5lcic6IHtcbiAgICAgICAgbW92ZU9rYXk6IGZhbHNlLFxuICAgICAgICBmYWxsT2theTogZmFsc2UsXG4gICAgICAgIGZpbmFsOiB0cnVlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgJ3dpbm5lclBpYycsXG4gICAgICAgICAgICAnbW92ZVVwJywgJ25vdGhpbmcnLFxuICAgICAgICAgICAgJ21vdmVVcCcsICdub3RoaW5nJyxcbiAgICAgICAgICAgICdtb3ZlRG93bicsICdub3RoaW5nJyxcbiAgICAgICAgICAgICdtb3ZlRG93bicsICdub3RoaW5nJyxcbiAgICAgICAgICAgICdub3RoaW5nJywgJ25vdGhpbmcnXG4gICAgICAgIF1cbiAgICB9LFxuICAgICdqdW1wJzoge1xuICAgICAgICBtb3ZlT2theTogdHJ1ZSxcbiAgICAgICAgZmFsbE9rYXk6IGZhbHNlLFxuICAgICAgICBmaW5hbDogZmFsc2UsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAnbW92ZVVwJyxcbiAgICAgICAgICAgICdqdW1wUGljJyxcbiAgICAgICAgICAgICdtb3ZlVXAnLCAnbW92ZVVwJywgJ21vdmVVcCcsICdtb3ZlVXAnLCAnbW92ZVVwJ1xuICAgICAgICBdXG4gICAgfSxcbiAgICAnbGFuZCc6IHtcbiAgICAgICAgbW92ZU9rYXk6IGZhbHNlLFxuICAgICAgICBmYWxsT2theTogdHJ1ZSxcbiAgICAgICAgZmluYWw6IGZhbHNlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgJ2xhbmRpbmdQaWMnLFxuICAgICAgICAgICAgJ25vdGhpbmcnLCAnbm90aGluZycsICdub3RoaW5nJyxcbiAgICAgICAgICAgICdub3JtYWxQaWMnXG4gICAgICAgIF1cbiAgICB9LFxuICAgICdwdW5jaCc6IHtcbiAgICAgICAgbW92ZU9rYXk6IGZhbHNlLFxuICAgICAgICBmYWxsT2theTogdHJ1ZSxcbiAgICAgICAgZmluYWw6IGZhbHNlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgJ21vdmVGb3J3YXJkJyxcbiAgICAgICAgICAgICdwdW5jaFBpYycsXG4gICAgICAgICAgICAnbW92ZUZvcndhcmQnLFxuICAgICAgICAgICAgJ3NtYWxsSGl0JyxcbiAgICAgICAgICAgICdtb3ZlQmFjaycsXG4gICAgICAgICAgICAnbm9ybWFsUGljJyxcbiAgICAgICAgICAgICdub3RoaW5nJywgJ25vdGhpbmcnLCAnbm90aGluZydcbiAgICAgICAgXVxuICAgIH0sXG4gICAgJ2tpY2snOiB7XG4gICAgICAgIG1vdmVPa2F5OiBmYWxzZSxcbiAgICAgICAgZmFsbE9rYXk6IHRydWUsXG4gICAgICAgIGZpbmFsOiBmYWxzZSxcbiAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgICdtb3ZlRm9yd2FyZCcsXG4gICAgICAgICAgICAnbW92ZUZvcndhcmQnLFxuICAgICAgICAgICAgJ2tpY2tQaWMnLFxuICAgICAgICAgICAgJ21vdmVGb3J3YXJkJyxcbiAgICAgICAgICAgICdiaWdIaXQnLFxuICAgICAgICAgICAgJ21vdmVCYWNrJywgJ21vdmVCYWNrJyxcbiAgICAgICAgICAgICdub3JtYWxQaWMnLFxuICAgICAgICAgICAgJ25vdGhpbmcnLCAnbm90aGluZycsICdub3RoaW5nJ1xuICAgICAgICBdXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFjdGlvbnM7XG4iLCJcbnZhciByb2JvdFBsYXllck1ha2VyID0gcmVxdWlyZSgnLi9wbGF5ZXJzL3JvYm90UGxheWVyJyk7XG52YXIgYWlQbGF5ZXJNYWtlciA9IHJlcXVpcmUoJy4vcGxheWVycy9yb2JvdEFJJyk7XG5cbnZhciBrZXlzID0gW107XG52YXIgcGxheWVycyA9IFtdO1xuXG4vLyB0aGlzIGZ1bmN0aW9uIHN0YXJ0cyB0aGUgZ2FtZS4uXG5mdW5jdGlvbiBza3lwdW5jaCgpIHtcblxuICAgIHBsYXllciA9IHJvYm90UGxheWVyTWFrZXIoNSwgODAsIDE1KTtcbiAgICBwbGF5ZXIuc2V0UGxheWVyRG9tKCQoJy5yb2JvdC5wbGF5ZXIwJykpO1xuICAgIHBsYXllci5zZXRIZWFsdGhCYXJEb20oJCgnLmhlYWx0aC5wbGF5ZXIwJykpO1xuICAgIHBsYXllcnMucHVzaChwbGF5ZXIpO1xuXG4gICAgb3Bwb25lbnQgPSBhaVBsYXllck1ha2VyKDUsIDMyMCwgMjApO1xuICAgIG9wcG9uZW50LnNldFBsYXllckRvbSgkKCcucm9ib3QucGxheWVyMScpKTtcbiAgICBvcHBvbmVudC5zZXRIZWFsdGhCYXJEb20oJCgnLmhlYWx0aC5wbGF5ZXIxJykpO1xuICAgIHBsYXllcnMucHVzaChvcHBvbmVudCk7XG5cbiAgICAkKCdib2R5Jykub24oJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIga2V5ID0gZXZlbnQud2hpY2g7XG4gICAgICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA9PSAtMSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoJ2JvZHknKS5vbigna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIga2V5SW5kZXggPSBrZXlzLmluZGV4T2YoZXZlbnQud2hpY2gpO1xuICAgICAgICBpZiAoa2V5SW5kZXggIT0gLTEpIHtcbiAgICAgICAgICAgIGtleXMuc3BsaWNlKGtleUluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2V0SW50ZXJ2YWwodGljaywgNTApO1xufVxuXG53aW5kb3cuc2t5cHVuY2ggPSBza3lwdW5jaDtcblxuLy8gcGVyaW9kaWNhbGx5IHByb2Nlc3MgZXZlbnRzXG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHZhciBwbGF5ZXI7XG4gICAgdmFyIHN0YXRlID0ge1xuICAgICAgICBrZXlzOiBrZXlzLFxuICAgICAgICBwb3NpdGlvbnM6IFtdXG4gICAgfTtcbiAgICB2YXIgaGl0cyA9IFtdO1xuICAgIGZ1bmN0aW9uIHJlY29yZEhpdChwbGF5ZXIsIGRpciwgcG9zLCBoZWlnaHQsIGRhbWFnZSkge1xuICAgICAgICBoaXRzLnB1c2goeyBwbGF5ZXI6cGxheWVyLCBkaXI6ZGlyLCBwb3M6cG9zLCBoZWlnaHQ6aGVpZ2h0LCBkYW1hZ2U6ZGFtYWdlIH0pO1xuICAgIH1cblxuICAgIC8vIGFzc2VtYmxlIHBvc2l0aW9ucyBvZiBwbGF5ZXJzLi5cbiAgICBmb3IgKHBsYXllcklkIGluIHBsYXllcnMpIHtcbiAgICAgICAgcGxheWVyID0gcGxheWVyc1twbGF5ZXJJZF07XG4gICAgICAgIHN0YXRlLnBvc2l0aW9ucy5wdXNoKHBsYXllci5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgLy8gbm93IGdpdmUgZWFjaCBwbGF5ZXIgdGhlIGdhbWUgc3RhdGUgYW5kIHNlZSB3aGF0IHRoZXkgZG9cbiAgICBmb3IgKHBsYXllcklkIGluIHBsYXllcnMpIHtcbiAgICAgICAgcGxheWVyID0gcGxheWVyc1twbGF5ZXJJZF07XG4gICAgICAgIC8vIGxldCB0aGUgcGxheWVyIGRvIGEgdGhpbmdcbiAgICAgICAgcGxheWVyLnRpY2soc3RhdGUsIHtcbiAgICAgICAgICAgIGhpdDogZnVuY3Rpb24oZGlyLCBwb3MsIGhlaWdodCwgZGFtYWdlKSB7IHJlY29yZEhpdChwbGF5ZXIsIGRpciwgcG9zLCBoZWlnaHQsIGRhbWFnZSk7IH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGRyYXcgdGhlIHBvc3NpYmx5LXVwZGF0ZWQgcGxheWVyXG4gICAgICAgIHBsYXllci5kcmF3KCk7XG4gICAgfVxuXG4gICAgdmFyIGhpdCA9IG51bGw7XG5cbiAgICAvLyBub3cgdGVsbCBlYWNoIHBsYXllciBhYm91dCB0aGUgaGl0cyB0aGF0IGhhcHBlbmVkXG4gICAgZm9yIChwbGF5ZXJJZCBpbiBwbGF5ZXJzKSB7XG4gICAgICAgIHBsYXllciA9IHBsYXllcnNbcGxheWVySWRdO1xuICAgICAgICBmb3IgKGhpdElkIGluIGhpdHMpIHtcbiAgICAgICAgICAgIGlmIChwbGF5ZXIgIT09IGhpdHNbaGl0SWRdLnBsYXllcikge1xuICAgICAgICAgICAgICAgIGhpdCA9IGhpdHNbaGl0SWRdO1xuICAgICAgICAgICAgICAgIHBsYXllci5nZXRIaXQoaGl0LmRpcmVjdGlvbiwgaGl0LnBvcywgaGl0LmhlaWdodCwgaGl0LmRhbWFnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGlzIGlzIHRoZSBsYXN0IGxvb3AgdGhyb3VnaCBwbGF5ZXJzLCBzbyBkcmF3XG4gICAgICAgIC8vIHRoZSBwb3NzaWJseS11cGRhdGVkIHBsYXllciBub3cuXG4gICAgICAgIHBsYXllci5kcmF3KCk7XG4gICAgfVxufVxuXG5cbi8vIGhpdHRpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gaGl0KHBsYXllcklkLCBzaXplKSB7XG4gICAgdmFyIHBsYXllciA9IHBsYXllcnNbcGxheWVySWRdO1xuICAgIC8vIGxvb2sgdGhyb3VnaCBvdGhlciBwbGF5ZXJzLCBmaW5kaW5nIHBsYXllcnMgaW4gcmFuZ2VcbiAgICBmb3IgKG9wcG9uZW50SWQgaW4gcGxheWVycykge1xuICAgICAgICBpZiAob3Bwb25lbnRJZCA9PSBwbGF5ZXJJZCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wcG9uZW50ID0gcGxheWVyc1tvcHBvbmVudElkXTtcbiAgICAgICAgdmFyIG5lYXIgPSBwbGF5ZXIucG9zaXRpb24gKyAocGxheWVyLmRpcmVjdGlvbiAqIDEwKTtcbiAgICAgICAgdmFyIGZhciA9IHBsYXllci5wb3NpdGlvbiArIChwbGF5ZXIuZGlyZWN0aW9uICogMTAwKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgKG9wcG9uZW50LnBvc2l0aW9uIDwgTWF0aC5tYXgobmVhciwgZmFyKSlcbiAgICAgICAgICAgICYmIChvcHBvbmVudC5wb3NpdGlvbiA+IE1hdGgubWluKG5lYXIsIGZhcikpXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gaGUncyBpbiByYW5nZSBvZiBvdXIgaGl0XG4gICAgICAgICAgICBvcHBvbmVudC5jdXJyZW50QWN0aW9uID0gJ2dldGh1cnQnICsgKHBsYXllci5kaXJlY3Rpb24gPT0gMSA/ICdSaWdodCcgOiAnTGVmdCcpO1xuICAgICAgICAgICAgb3Bwb25lbnQuaGVhbHRoIC09IHNpemU7XG4gICAgICAgICAgICAkKCcuaGVhbHRoLnBsYXllcicgKyBvcHBvbmVudElkKS5jc3MoJ3dpZHRoJywgKDIwICogb3Bwb25lbnQuaGVhbHRoKSArICdweCcpO1xuICAgICAgICAgICAgb3Bwb25lbnQubmV4dFN0ZXAgPSAwO1xuICAgICAgICAgICAgaWYgKG9wcG9uZW50LmhlYWx0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgb3Bwb25lbnQuY3VycmVudEFjdGlvbiA9ICdkZWFkJztcbiAgICAgICAgICAgICAgICBwbGF5ZXIuY3VycmVudEFjdGlvbiA9ICd3aW5uZXInO1xuICAgICAgICAgICAgICAgIHBsYXllci5uZXh0U3RlcCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNtYWxsSGl0KHBsYXllcklkKSB7XG4gICAgaGl0KHBsYXllcklkLCAxKTtcbn1cblxuZnVuY3Rpb24gYmlnSGl0KHBsYXllcklkKSB7XG4gICAgaGl0KHBsYXllcklkLCAyKTtcbn1cbiIsIlxuYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvYmFzaWNhY3Rpb25zJyk7XG5cbmZ1bmN0aW9uIFBsYXllcih0eXBlLCBoZWFsdGgsIHBvc2l0aW9uLCBoZWlnaHQpIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaGVhbHRoID0gaGVhbHRoIHx8IDU7XG4gICAgdGhpcy5yb2JvdCA9ICdyb2JvdDInO1xuICAgIHRoaXMuZGlyZWN0aW9uID0gMTtcbiAgICB0aGlzLnBpYyA9ICdub3JtYWwnO1xuICAgIHRoaXMuY3VycmVudEFjdGlvbiA9IG51bGw7XG4gICAgdGhpcy5uZXh0U3RlcCA9IDA7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uIHx8IDgwO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0IHx8IDE1O1xuICAgIHRoaXMuaGVhbHRoID0gaGVhbHRoIHx8IDU7XG4gICAgdGhpcy5kaXJ0eSA9IFsncGljJywgJ3Bvc2l0aW9uJywgJ2hlaWdodCddO1xuXG4gICAgdGhpcy5kb20gPSBudWxsO1xufVxuXG5QbGF5ZXIucHJvdG90eXBlID0ge1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBzdHVmZiB5b3Ugc2hvdWxkIG92ZXJyaWRlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAvLyBvdmVycmlkZSB0aGlzIHRvIHBpY2sgdGhlIG5leHQgYWN0aW9uIGR1cmluZyBhIHRpY2tcbiAgICBjaG9vc2VOZXh0QWN0aW9uOiBmdW5jdGlvbiBjaG9vc2VOZXh0QWN0aW9uKHN0YXRlLCBjYWxsYmFja3MpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1N1YmNsYXNzZXMgb2YgUGxheWVyIHNob3VsZCBvdmVycmlkZSBjaG9vc2VOZXh0QWN0aW9uKCkuJyk7XG4gICAgfSxcblxuICAgIC8vIG92ZXJyaWRlIHRoaXMgdG8gcGVyZm9ybSBhIGhpdCBhdCB0aGUgbG9jYXRpb24gdGhhdCBtYXRjaGVzXG4gICAgLy8geW91ciBwaWN0dXJlcywgcHJvYmFibHkgYSBwdW5jaFxuICAgIHNtYWxsSGl0OiBmdW5jdGlvbiBzbWFsbEhpdChzdGF0ZSwgY2FsbGJhY2tzKSB7XG4gICAgICAgIHZhciBhcm1MZW5ndGggPSAyMDsgIC8vIGhvdyBmYXIgaW4gZnJvbnQgb2YgeW91IGFyZSB5b3UgcHVuY2hpbmdcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuZGlyZWN0aW9uOyAvLyAtMSBpcyBsZWZ0LCArMSBpcyByaWdodFxuICAgICAgICB2YXIgaGl0UG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uICsgKGRpcmVjdGlvbiAqIGFybUxlbmd0aCk7XG4gICAgICAgIHZhciBoaXRIZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICAgICAgLy8gbm93IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIGhpdHRpbmcgYXQgdGhhdCBzcG90XG4gICAgICAgIGNhbGxiYWNrcy5oaXQoZGlyZWN0aW9uLCBoaXRQb3NpdGlvbiwgaGl0SGVpZ2h0LCAxKTtcbiAgICB9LFxuXG4gICAgLy8gb3ZlcnJpZGUgdGhpcyB0byBwZXJmb3JtIGEgaGl0IGF0IHRoZSBsb2NhdGlvbiB0aGF0IG1hdGNoZXNcbiAgICAvLyB5b3VyIHBpY3R1cmVzLCBwcm9iYWJseSBhIGtpY2tcbiAgICBiaWdIaXQ6IGZ1bmN0aW9uIGJpZ0hpdChzdGF0ZSwgY2FsbGJhY2tzKSB7XG4gICAgICAgIHZhciBsZWdMZW5ndGggPSAzMDsgIC8vIGhvdyBmYXIgaW4gZnJvbnQgb2YgeW91IGFyZSB5b3Uga2lja2luZ1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5kaXJlY3Rpb247IC8vIC0xIGlzIGxlZnQsICsxIGlzIHJpZ2h0XG4gICAgICAgIHZhciBoaXRQb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gKyAoZGlyZWN0aW9uICogbGVnTGVuZ3RoKTtcbiAgICAgICAgdmFyIGhpdEhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgICAgICAvLyBub3cgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgaGl0dGluZyBhdCB0aGF0IHNwb3RcbiAgICAgICAgY2FsbGJhY2tzLmhpdChkaXJlY3Rpb24sIGhpdFBvc2l0aW9uLCBoaXRIZWlnaHQsIDIpO1xuICAgIH0sXG5cbiAgICAvLyBvdmVycmlkZSB0aGlzIHRvIHdvcmsgb3V0IG9mIHlvdXIgcGxheWVyIGdldHMgaGl0IG9yIG5vdC5cbiAgICAvLyBtYWtlIHN1cmUgeW91IHJldHVybiB0cnVlIGlmIHlvdSBnZXQga2lsbGVkIGJ5IHRoZSBoaXQuXG4gICAgZ2V0SGl0OiBmdW5jdGlvbiBnZXRIaXQoaGl0RGlyZWN0aW9uLCBoaXRQb3MsIGhpdEhlaWdodCwgZGFtYWdlKSB7XG4gICAgICAgIHZhciBwbGF5ZXJXaWR0aCA9IDEwMDsgLy8gaG93IHdpZGUgaXMgeW91ciBjb21iYXRhbnRcbiAgICAgICAgdmFyIHBsYXllckhlaWdodCA9IDI7IC8vIGhvdyB0YWxsIGlzIHlvdXIgY29tYmF0YW50XG5cbiAgICAgICAgdmFyIG1pblBvcyA9IHRoaXMucG9zaXRpb247XG4gICAgICAgIHZhciBtYXhQb3MgPSB0aGlzLnBvc2l0aW9uICsgcGxheWVyV2lkdGg7XG5cbiAgICAgICAgdmFyIG1pbkhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgICAgICB2YXIgbWF4SGVpZ2h0ID0gdGhpcy5oZWlnaHQgKyBwbGF5ZXJIZWlnaHQ7XG5cbiAgICAgICAgLy8gbm93IHdvcmsgb3V0IGlmIHlvdSB3ZXJlIGhpdC4uXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIG1pblBvcyA8PSAgICBoaXRQb3MgJiYgaGl0UG9zICAgIDw9IG1heFBvc1xuICAgICAgICAgICAgJiYgbWluSGVpZ2h0IDw9IGhpdEhlaWdodCAmJiBoaXRIZWlnaHQgPD0gbWF4SGVpZ2h0XG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gd2UncmUgaGl0IVxuICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gJ2dldGh1cnQnICsgKGhpdERpcmVjdGlvbiA9PSAxID8gJ1JpZ2h0JyA6ICdMZWZ0Jyk7XG5cbiAgICAgICAgICAgIHRoaXMuaGVhbHRoIC09IGRhbWFnZTtcbiAgICAgICAgICAgIC8vIHdoZW4geW91IGNoYW5nZSBoZWFsdGgsIG5vdGUgdGhhdCBoZWFsdGggaXMgZGlydHlcbiAgICAgICAgICAgIHRoaXMuZGlydHkucHVzaCgnaGVhbHRoJyk7XG5cbiAgICAgICAgICAgIHRoaXMubmV4dFN0ZXAgPSAwO1xuICAgICAgICAgICAgaWYgKHRoaXMuaGVhbHRoIDw9IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSAnZGVhZCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gYmVsb3cgaGVyZSB5b3Ugd29uJ3QgbmVlZCB0byBvdmVycmlkZSBhbnl0aGluZyB1bmxlc3MgeW91J3JlXG4gICAgLy8gbWFraW5nIHNvbWV0aGluZyBzcGVjaWFsLlxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIGNvbnN0cnVjdG9yOiBQbGF5ZXIsXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzYXlUeXBlOiBmdW5jdGlvbiBzYXlUeXBlKCkge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnR5cGUpO1xuICAgIH0sXG4gICAgLy8gZHJhdyB0aGUgcGxheWVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZXRQbGF5ZXJEb206IGZ1bmN0aW9uIHNldFBsYXllckRvbShlbGVtZW50KSB7XG4gICAgICAgIHRoaXMuZG9tID0gJChlbGVtZW50KTtcbiAgICB9LFxuXG4gICAgc2V0SGVhbHRoQmFyRG9tOiBmdW5jdGlvbiBzZXRIZWFsdGhCYXJEb20oZWxlbWVudCkge1xuICAgICAgICB0aGlzLmhlYWx0aERvbSA9ICQoZWxlbWVudCk7XG4gICAgfSxcblxuICAgIGRyYXc6IGZ1bmN0aW9uIGRyYXcoKSB7XG4gICAgICAgIGlmICh0aGlzLmRvbSkge1xuICAgICAgICAgICAgdmFyIGNzc1VwZGF0ZSA9IHt9XG5cbiAgICAgICAgICAgIHZhciB0b3AgPSAxMzAgLSAodGhpcy5oZWlnaHQgKiAyMCk7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IHRoaXMucG9zaXRpb247XG5cbiAgICAgICAgICAgIC8vIGhlYWx0aCBiYXIgbmVlZCB1cGRhdGluZz9cbiAgICAgICAgICAgIGlmICh0aGlzLmRpcnR5LmluZGV4T2YoJ2hlYWx0aCcpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFsdGhEb20ud2lkdGgodGhpcy5oZWFsdGggKiAyMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHBsYXllciBuZWVkIHVwZGF0aW5nP1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkuaW5kZXhPZigncGljJykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjc3NVcGRhdGUuYmFja2dyb3VuZEltYWdlID0gW1xuICAgICAgICAgICAgICAgICAgICAndXJsKHJvYm90cycsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm9ib3QsXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLmRpcmVjdGlvbiA9PSAxID8gJ3JpZ2h0JyA6ICdsZWZ0JyksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGljICsgJy5zdmcpJyxcbiAgICAgICAgICAgICAgICBdLmpvaW4oJy8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmRpcnR5LmluZGV4T2YoJ3Bvc2l0aW9uJykgIT0gLTEgfHxcbiAgICAgICAgICAgICAgICB0aGlzLmRpcnR5LmluZGV4T2YoJ2hlaWdodCcpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgY3NzVXBkYXRlLmxlZnQgPSB0aGlzLnBvc2l0aW9uO1xuICAgICAgICAgICAgICAgIGNzc1VwZGF0ZS50b3AgPSAoMTMwIC0gKHRoaXMuaGVpZ2h0ICogMjApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGlydHkgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZG9tLmNzcyhjc3NVcGRhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWxlcnQoXCJDYW4ndCBkcmF3IFwiICsgdGhpcy50eXBlICtcbiAgICAgICAgICAgICAgICAgIFwiIHBsYXllciB3aXRob3V0IGEgRE9NIGVsZW1lbnQuIFxcblwiICtcbiAgICAgICAgICAgICAgICAgIFwiQ2FsbCBwbGF5ZXIuc2V0RG9tKGVsZW1lbnQpIHRvIGFzc2lnbiBhbiBlbGVtZW50LlwiXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyBhY3R1YWxseSBkbyB0aGluZ3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHRpY2s6IGZ1bmN0aW9uIHRpY2soc3RhdGUsIGNhbGxiYWNrcykge1xuXG4gICAgICAgIC8vIHBlcmZvcm0gdGhlIGN1cnJlbnQgYWN0aW9uIC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEFjdGlvbikge1xuICAgICAgICAgICAgLy8gaWYgdGhlcmUncyBhIGN1cnJlbnQgYWN0aW9uLCB0YWtlIGl0cyBuZXh0IHN0ZXBcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zW3RoaXMuY3VycmVudEFjdGlvbl07XG4gICAgICAgICAgICB2YXIgc3RlcCA9IGFjdGlvbi5zdGVwc1t0aGlzLm5leHRTdGVwXTtcblxuICAgICAgICAgICAgaWYgKHN0ZXAgJiYgdGhpc1tzdGVwXSkge1xuICAgICAgICAgICAgICAgIHRoaXNbc3RlcF0uY2FsbCh0aGlzLCBzdGF0ZSwgY2FsbGJhY2tzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZ2V0IHJlYWR5IGZvciB0aGUgbmV4dCBzdGVwXG4gICAgICAgICAgICB0aGlzLm5leHRTdGVwICs9IDE7XG4gICAgICAgICAgICBpZiAodGhpcy5uZXh0U3RlcCA+PSBhY3Rpb24uc3RlcHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gZGlkIHRoZSBsYXN0IHN0ZXAuLiBjbGVhciBvZmYgdGhlIGN1cnJlbnRBY3Rpb25cbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dFN0ZXAgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gb2JleSBncmF2aXR5IC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiAodGhpcy5jYW5GYWxsKCkpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZURvd24oKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmhlaWdodCA8IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IDA7XG4gICAgICAgICAgICAgICAgaWYgKCEgdGhpcy5pc0xvY2tlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9ICdsYW5kJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0U3RlcCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVjaWRlIHdoYXQgdG8gZG8gbmV4dCAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiAoISB0aGlzLmN1cnJlbnRBY3Rpb24pIHtcbiAgICAgICAgICAgIC8vIGRvd25zdHJlYW0gc3ViY2xhc3NlcyBzdXBwbHkgdGhpc1xuICAgICAgICAgICAgdGhpcy5jaG9vc2VOZXh0QWN0aW9uKHN0YXRlLCBjYWxsYmFja3MpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIHBpYyBwaWMgc3dpdGNoaW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgc3dpdGNoUGljOiBmdW5jdGlvbiBzd2l0Y2hQaWMobmV3UGljKSB7XG4gICAgICAgIGlmICh0aGlzLnBpYyAhPSBuZXdQaWMpIHtcbiAgICAgICAgICAgIHRoaXMucGljID0gbmV3UGljO1xuICAgICAgICAgICAgdGhpcy5kaXJ0eS5wdXNoKCdwaWMnKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAganVtcFBpYzogZnVuY3Rpb24ganVtcFBpYygpICAgICAgICAgeyB0aGlzLnN3aXRjaFBpYygnanVtcCcpOyB9LFxuICAgIHB1bmNoUGljOiBmdW5jdGlvbiBwdW5jaFBpYygpICAgICAgIHsgdGhpcy5zd2l0Y2hQaWMoJ3B1bmNoJyk7IH0sXG4gICAga2lja1BpYzogZnVuY3Rpb24ga2lja1BpYygpICAgICAgICAgeyB0aGlzLnN3aXRjaFBpYygna2ljaycpOyB9LFxuICAgIG5vcm1hbFBpYzogZnVuY3Rpb24gbm9ybWFsUGljKCkgICAgIHsgdGhpcy5zd2l0Y2hQaWMoJ25vcm1hbCcpOyB9LFxuICAgIGxhbmRpbmdQaWM6IGZ1bmN0aW9uIGxhbmRpbmdQaWMoKSAgIHsgdGhpcy5zd2l0Y2hQaWMoJ2xhbmRpbmcnKTsgfSxcbiAgICBodXJ0UGljOiBmdW5jdGlvbiBodXJ0UGljKCkgICAgICAgICB7IHRoaXMuc3dpdGNoUGljKCdodXJ0Jyk7IH0sXG4gICAgcHVzaGJhY2tQaWM6IGZ1bmN0aW9uIHB1c2hiYWNrUGljKCkgeyB0aGlzLnN3aXRjaFBpYygncHVzaGJhY2snKTsgfSxcbiAgICBkZWFkUGljOiBmdW5jdGlvbiBkZWFkUGljKCkgICAgICAgICB7IHRoaXMuc3dpdGNoUGljKCdkZWFkJyk7IH0sXG4gICAgd2lubmVyUGljOiBmdW5jdGlvbiB3aW5uZXJQaWMoKSAgICAgeyB0aGlzLnN3aXRjaFBpYygnd2lubmVyJyk7IH0sXG5cbiAgICAvLyB0ZXN0cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNhbkZhbGw6IGZ1bmN0aW9uIGNhbkZhbGwoKSB7XG4gICAgICAgIHJldHVybiAoIHRoaXMuaGVpZ2h0ID4gMCAmJiAoXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPT09IG51bGxcbiAgICAgICAgICAgIHx8IGFjdGlvbnNbdGhpcy5jdXJyZW50QWN0aW9uXS5mYWxsT2theVxuICAgICAgICApICAgKVxuICAgIH0sXG5cbiAgICBjYW5Nb3ZlOiBmdW5jdGlvbiBjYW5Nb3ZlKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID09PSBudWxsXG4gICAgICAgICAgICB8fCBhY3Rpb25zW3RoaXMuY3VycmVudEFjdGlvbl0ubW92ZU9rYXlcbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICBpc0xvY2tlZDogZnVuY3Rpb24gaXNMb2NrZWQoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gIT09IG51bGxcbiAgICAgICAgICAgICYmIGFjdGlvbnNbdGhpcy5jdXJyZW50QWN0aW9uXS5pc0ZpbmFsXG4gICAgICAgIClcbiAgICB9LFxuXG4gICAgLy8gZG9pbmcgbm90aGluZy4uLiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBub3RoaW5nOiBmdW5jdGlvbiBub3RoaW5nKCkge1xuICAgICAgICAvLyAuLiBkb2luZyBub3RoaW5nLCBhcyBpbnN0cnVjdGVkXG4gICAgfSxcblxuICAgIC8vIGFic29sdXRlIG1vdmVtZW50IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbW92ZVVwOiBmdW5jdGlvbiBtb3ZlVXAoKSB7XG4gICAgICAgIHRoaXMuaGVpZ2h0Kys7XG4gICAgICAgIHRoaXMuZGlydHkucHVzaCgnaGVpZ2h0Jyk7XG4gICAgfSxcblxuICAgIG1vdmVEb3duOiBmdW5jdGlvbiBtb3ZlRG93bigpIHtcbiAgICAgICAgdGhpcy5oZWlnaHQtLTtcbiAgICAgICAgdGhpcy5kaXJ0eS5wdXNoKCdoZWlnaHQnKTtcbiAgICB9LFxuXG4gICAgbW92ZUxlZnQ6IGZ1bmN0aW9uIG1vdmVMZWZ0KCkge1xuICAgICAgICBpZiAodGhpcy5wb3NpdGlvbiA+IDEwKSB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uIC09IDU7XG4gICAgICAgICAgICB0aGlzLmRpcnR5LnB1c2goJ3Bvc2l0aW9uJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbW92ZVJpZ2h0OiBmdW5jdGlvbiBtb3ZlUmlnaHQoKSB7XG4gICAgICAgIGlmICh0aGlzLnBvc2l0aW9uIDwgMzUwKSB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uICs9IDU7XG4gICAgICAgICAgICB0aGlzLmRpcnR5LnB1c2goJ3Bvc2l0aW9uJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gZGlyZWN0aW9uYWwgbW92ZW1lbnQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmYWNlTGVmdDogZnVuY3Rpb24gZmFjZUxlZnQoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpcmVjdGlvbiAhPSAtMSkge1xuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSAtMTtcbiAgICAgICAgICAgIHRoaXMuZGlydHkucHVzaCgncGljJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZmFjZVJpZ2h0OiBmdW5jdGlvbiBmYWNlUmlnaHQoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpcmVjdGlvbiAhPSAxKSB7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IDE7XG4gICAgICAgICAgICB0aGlzLmRpcnR5LnB1c2goJ3BpYycpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG1vdmVGb3J3YXJkOiBmdW5jdGlvbiBtb3ZlRm9yd2FyZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uID09IDEpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVJpZ2h0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVMZWZ0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbW92ZUJhY2s6IGZ1bmN0aW9uIG1vdmVCYWNrKCkge1xuICAgICAgICBpZiAodGhpcy5kaXJlY3Rpb24gPT0gMSkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlTGVmdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tb3ZlUmlnaHQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIGVuZCBvZiBQbGF5ZXIgcHJvdG90eXBlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyOyIsIkJhc2ljUGxheWVyID0gcmVxdWlyZSgnLi9CYXNpY1BsYXllcicpO1xuXG5haVBsYXllck1ha2VyID0gZnVuY3Rpb24gQWlQbGF5ZXJNYWtlcihoZWFsdGgsIHBvc2l0aW9uLCBoZWlnaHQpIHtcbiAgICB2YXIgcGxheWVyID0gbmV3IEJhc2ljUGxheWVyKCdBSScsIGhlYWx0aCwgcG9zaXRpb24sIGhlaWdodCk7XG5cbiAgICBwbGF5ZXIuY2hvb3NlTmV4dEFjdGlvbiA9IGZ1bmN0aW9uIGNob29zZUFpQWN0aW9uKHN0YXRlLCBjYWxsYmFja3MpIHtcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyAgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUlcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgICAgICAgIF9fL19fL19fL19fLyAgICAgICAgX18vX18vX18vXG4gICAgICAgIC8vICAgICAgICAgIF9fLyAgICAgIF9fLyAgICAgICAgICAgX18vXG4gICAgICAgIC8vICAgICAgICAgX18vX18vX18vX18vICAgICAgICAgICBfXy9cbiAgICAgICAgLy8gICAgICAgIF9fLyAgICAgIF9fLyAgX18vICAgX18vX18vX18vICBfXy9cbiAgICAgICAgLy9cbiAgICAgICAgLy8gIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJIEFJXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gZGVjaWRlIHdoYXQgdG8gZG9cbiAgICAgICAgdmFyIHJhbmQgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgICAgIHZhciBvdGhlclBvcyA9IHN0YXRlLnBvc2l0aW9ucy5maWx0ZXIoIGZ1bmN0aW9uKHBvcykge1xuICAgICAgICAgICAgcmV0dXJuIChwb3MgIT0gdGhpcy5wb3NpdGlvbik7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vIGlzIHRoZSBvcHBvZW50IHRvIG91ciBsZWZ0P1xuICAgICAgICB2YXIgb3Bwb25lbnRJc0xlZnQgPSAob3RoZXJQb3NbMF0gPCB0aGlzLnBvc2l0aW9uKTtcblxuICAgICAgICBpZiAocmFuZCA8IDAuMikge1xuICAgICAgICAgICAgLy8gbW92ZSB0b3dhcmQgdGhlIG90aGVyIHBsYXllclxuICAgICAgICAgICAgaWYgKG9wcG9uZW50SXNMZWZ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWNlTGVmdChwbGF5ZXJJZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjZVJpZ2h0KHBsYXllcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbk1vdmUoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZUZvcndhcmQocGxheWVySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICgwLjIgPCByYW5kICYmIHJhbmQgPCAwLjMpIHtcbiAgICAgICAgICAgIC8vIG1vdmUgQVdBWSBGUk9NIHRoZSBvdGhlciBwbGF5ZXJcbiAgICAgICAgICAgIGlmIChvcHBvbmVudElzTGVmdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjZVJpZ2h0KHBsYXllcklkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWNlTGVmdChwbGF5ZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5jYW5Nb3ZlKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVGb3J3YXJkKHBsYXllcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuY3VycmVudEFjdGlvbiAmJiAwLjMgPCByYW5kICYmIHJhbmQgPCAwLjQpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9ICdwdW5jaCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRBY3Rpb24gJiYgMC40IDwgcmFuZCAmJiByYW5kIDwgMC41KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSAna2ljayc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIXRoaXMuY3VycmVudEFjdGlvbiAmJiAwLjYgPCByYW5kICYmIHJhbmQgPCAwLjdcbiAgICAgICAgICAgICYmIHRoaXMuaGVpZ2h0ID09IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSAnanVtcCc7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQUkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIH1cblxuICAgIHJldHVybiBwbGF5ZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYWlQbGF5ZXJNYWtlcjsiLCJcbkJhc2ljUGxheWVyID0gcmVxdWlyZSgnLi9CYXNpY1BsYXllcicpO1xuXG5mdW5jdGlvbiBpc0luKGtleSwga2V5cykge1xuICAgIHJldHVybiAoa2V5cy5pbmRleE9mKGtleSkgIT0gLTEpO1xufVxuXG5yb2JvdFBsYXllck1ha2VyID0gZnVuY3Rpb24gcm9ib3RQbGF5ZXJNYWtlcihoZWFsdGgsIHBvc2l0aW9uLCBoZWlnaHQpIHtcblxuICAgIHZhciBwbGF5ZXIgPSBuZXcgQmFzaWNQbGF5ZXIoJ3JvYm90JywgaGVhbHRoLCBwb3NpdGlvbiwgaGVpZ2h0KTtcblxuICAgIHBsYXllci5jaG9vc2VOZXh0QWN0aW9uID0gZnVuY3Rpb24gY2hvb3NlQWN0aW9uKHN0YXRlLCBjYWxsYmFja3MpIHtcbiAgICAgICAgaWYgKCEgdGhpcy5jdXJyZW50QWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBubyBjdXJyZW50IGFjdGlvbi4uIGRlY2lkZSB3aGF0J3MgbmV4dFxuICAgICAgICAgICAgaWYgKGlzSW4oNjksIHN0YXRlLmtleXMpKSB7IHRoaXMuY3VycmVudEFjdGlvbiA9ICdwdW5jaCc7IH1cbiAgICAgICAgICAgIGlmIChpc0luKDgyLCBzdGF0ZS5rZXlzKSkgeyB0aGlzLmN1cnJlbnRBY3Rpb24gPSAna2ljayc7IH1cbiAgICAgICAgICAgIGlmIChpc0luKDMyLCBzdGF0ZS5rZXlzKSAmJiB0aGlzLmhlaWdodCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gJ2p1bXAnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICggIXRoaXMuY3VycmVudEFjdGlvbiB8fFxuICAgICAgICAgICAgIGFjdGlvbnNbdGhpcy5jdXJyZW50QWN0aW9uXS5tb3ZlT2theSkge1xuICAgICAgICAgICAgaWYgKGlzSW4oNjUsIHN0YXRlLmtleXMpIHx8IGlzSW4oMzcsIHN0YXRlLmtleXMpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWNlTGVmdChwbGF5ZXJJZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlTGVmdChwbGF5ZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNJbig2OCwgc3RhdGUua2V5cykgfHwgaXNJbigzOSwgc3RhdGUua2V5cykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY2VSaWdodChwbGF5ZXJJZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlUmlnaHQocGxheWVySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gcGxheWVyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJvYm90UGxheWVyTWFrZXI7Il19
