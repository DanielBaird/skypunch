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
function go() {

    player = robotPlayerMaker(5, 80, 15);
    player.setPlayerDom($('.robot.player0'));
    player.setHealthBarDom($('.health.player0'));
    players.push(player);

    opponent = aiPlayerMaker(5, 320, 20);
    opponent.setPlayerDom($('.robot.player1'));
    opponent.setHealthBarDom($('.health.player1'));
    players.push(opponent);

    console.log(players);

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

// now kick it all off..
$( go );
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9kYW5pZWwvcHJvamVjdHMvc2t5cHVuY2gvc3JjL2pzL2FjdGlvbnMvYmFzaWNhY3Rpb25zLmpzIiwiL1VzZXJzL2RhbmllbC9wcm9qZWN0cy9za3lwdW5jaC9zcmMvanMvZmFrZV9hZWEyNzZjNy5qcyIsIi9Vc2Vycy9kYW5pZWwvcHJvamVjdHMvc2t5cHVuY2gvc3JjL2pzL3BsYXllcnMvQmFzaWNQbGF5ZXIuanMiLCIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL3NyYy9qcy9wbGF5ZXJzL3JvYm90QUkuanMiLCIvVXNlcnMvZGFuaWVsL3Byb2plY3RzL3NreXB1bmNoL3NyYy9qcy9wbGF5ZXJzL3JvYm90UGxheWVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG52YXIgYWN0aW9ucyA9IHtcbiAgICAnZ2V0aHVydExlZnQnOiB7XG4gICAgICAgIG1vdmVPa2F5OiBmYWxzZSxcbiAgICAgICAgZmFsbE9rYXk6IHRydWUsXG4gICAgICAgIGZpbmFsOiBmYWxzZSxcbiAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgICdtb3ZlTGVmdCcsXG4gICAgICAgICAgICAnaHVydFBpYycsXG4gICAgICAgICAgICAnbW92ZUxlZnQnLCAnbW92ZUxlZnQnLFxuICAgICAgICAgICAgJ3B1c2hiYWNrUGljJyxcbiAgICAgICAgICAgICdtb3ZlTGVmdCcsICdtb3ZlTGVmdCcsXG4gICAgICAgICAgICAnbm90aGluZycsICdub3RoaW5nJywgJ25vdGhpbmcnLFxuICAgICAgICAgICAgJ25vcm1hbFBpYycsXG4gICAgICAgICAgICAnbm90aGluZycsICdub3RoaW5nJywgJ25vdGhpbmcnXG4gICAgICAgIF1cbiAgICB9LFxuICAgICdnZXRodXJ0UmlnaHQnOiB7XG4gICAgICAgIG1vdmVPa2F5OiBmYWxzZSxcbiAgICAgICAgZmFsbE9rYXk6IHRydWUsXG4gICAgICAgIGZpbmFsOiBmYWxzZSxcbiAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgICdtb3ZlUmlnaHQnLFxuICAgICAgICAgICAgJ2h1cnRQaWMnLFxuICAgICAgICAgICAgJ21vdmVSaWdodCcsICdtb3ZlUmlnaHQnLFxuICAgICAgICAgICAgJ3B1c2hiYWNrUGljJyxcbiAgICAgICAgICAgICdtb3ZlUmlnaHQnLCAnbW92ZVJpZ2h0JyxcbiAgICAgICAgICAgICdub3RoaW5nJywgJ25vdGhpbmcnLCAnbm90aGluZycsXG4gICAgICAgICAgICAnbm9ybWFsUGljJyxcbiAgICAgICAgICAgICdub3RoaW5nJywgJ25vdGhpbmcnLCAnbm90aGluZydcbiAgICAgICAgXVxuICAgIH0sXG4gICAgJ2RlYWQnOiB7XG4gICAgICAgIG1vdmVPa2F5OiBmYWxzZSxcbiAgICAgICAgZmFsbE9rYXk6IHRydWUsXG4gICAgICAgIGZpbmFsOiB0cnVlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgJ2RlYWRQaWMnXG4gICAgICAgIF1cbiAgICB9LFxuICAgICd3aW5uZXInOiB7XG4gICAgICAgIG1vdmVPa2F5OiBmYWxzZSxcbiAgICAgICAgZmFsbE9rYXk6IGZhbHNlLFxuICAgICAgICBmaW5hbDogdHJ1ZSxcbiAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgICd3aW5uZXJQaWMnLFxuICAgICAgICAgICAgJ21vdmVVcCcsICdub3RoaW5nJyxcbiAgICAgICAgICAgICdtb3ZlVXAnLCAnbm90aGluZycsXG4gICAgICAgICAgICAnbW92ZURvd24nLCAnbm90aGluZycsXG4gICAgICAgICAgICAnbW92ZURvd24nLCAnbm90aGluZycsXG4gICAgICAgICAgICAnbm90aGluZycsICdub3RoaW5nJ1xuICAgICAgICBdXG4gICAgfSxcbiAgICAnanVtcCc6IHtcbiAgICAgICAgbW92ZU9rYXk6IHRydWUsXG4gICAgICAgIGZhbGxPa2F5OiBmYWxzZSxcbiAgICAgICAgZmluYWw6IGZhbHNlLFxuICAgICAgICBzdGVwczogW1xuICAgICAgICAgICAgJ21vdmVVcCcsXG4gICAgICAgICAgICAnanVtcFBpYycsXG4gICAgICAgICAgICAnbW92ZVVwJywgJ21vdmVVcCcsICdtb3ZlVXAnLCAnbW92ZVVwJywgJ21vdmVVcCdcbiAgICAgICAgXVxuICAgIH0sXG4gICAgJ2xhbmQnOiB7XG4gICAgICAgIG1vdmVPa2F5OiBmYWxzZSxcbiAgICAgICAgZmFsbE9rYXk6IHRydWUsXG4gICAgICAgIGZpbmFsOiBmYWxzZSxcbiAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgICdsYW5kaW5nUGljJyxcbiAgICAgICAgICAgICdub3RoaW5nJywgJ25vdGhpbmcnLCAnbm90aGluZycsXG4gICAgICAgICAgICAnbm9ybWFsUGljJ1xuICAgICAgICBdXG4gICAgfSxcbiAgICAncHVuY2gnOiB7XG4gICAgICAgIG1vdmVPa2F5OiBmYWxzZSxcbiAgICAgICAgZmFsbE9rYXk6IHRydWUsXG4gICAgICAgIGZpbmFsOiBmYWxzZSxcbiAgICAgICAgc3RlcHM6IFtcbiAgICAgICAgICAgICdtb3ZlRm9yd2FyZCcsXG4gICAgICAgICAgICAncHVuY2hQaWMnLFxuICAgICAgICAgICAgJ21vdmVGb3J3YXJkJyxcbiAgICAgICAgICAgICdzbWFsbEhpdCcsXG4gICAgICAgICAgICAnbW92ZUJhY2snLFxuICAgICAgICAgICAgJ25vcm1hbFBpYycsXG4gICAgICAgICAgICAnbm90aGluZycsICdub3RoaW5nJywgJ25vdGhpbmcnXG4gICAgICAgIF1cbiAgICB9LFxuICAgICdraWNrJzoge1xuICAgICAgICBtb3ZlT2theTogZmFsc2UsXG4gICAgICAgIGZhbGxPa2F5OiB0cnVlLFxuICAgICAgICBmaW5hbDogZmFsc2UsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAnbW92ZUZvcndhcmQnLFxuICAgICAgICAgICAgJ21vdmVGb3J3YXJkJyxcbiAgICAgICAgICAgICdraWNrUGljJyxcbiAgICAgICAgICAgICdtb3ZlRm9yd2FyZCcsXG4gICAgICAgICAgICAnYmlnSGl0JyxcbiAgICAgICAgICAgICdtb3ZlQmFjaycsICdtb3ZlQmFjaycsXG4gICAgICAgICAgICAnbm9ybWFsUGljJyxcbiAgICAgICAgICAgICdub3RoaW5nJywgJ25vdGhpbmcnLCAnbm90aGluZydcbiAgICAgICAgXVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhY3Rpb25zO1xuIiwiXG52YXIgcm9ib3RQbGF5ZXJNYWtlciA9IHJlcXVpcmUoJy4vcGxheWVycy9yb2JvdFBsYXllcicpO1xudmFyIGFpUGxheWVyTWFrZXIgPSByZXF1aXJlKCcuL3BsYXllcnMvcm9ib3RBSScpO1xuXG52YXIga2V5cyA9IFtdO1xudmFyIHBsYXllcnMgPSBbXTtcblxuLy8gdGhpcyBmdW5jdGlvbiBzdGFydHMgdGhlIGdhbWUuLlxuZnVuY3Rpb24gZ28oKSB7XG5cbiAgICBwbGF5ZXIgPSByb2JvdFBsYXllck1ha2VyKDUsIDgwLCAxNSk7XG4gICAgcGxheWVyLnNldFBsYXllckRvbSgkKCcucm9ib3QucGxheWVyMCcpKTtcbiAgICBwbGF5ZXIuc2V0SGVhbHRoQmFyRG9tKCQoJy5oZWFsdGgucGxheWVyMCcpKTtcbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyKTtcblxuICAgIG9wcG9uZW50ID0gYWlQbGF5ZXJNYWtlcig1LCAzMjAsIDIwKTtcbiAgICBvcHBvbmVudC5zZXRQbGF5ZXJEb20oJCgnLnJvYm90LnBsYXllcjEnKSk7XG4gICAgb3Bwb25lbnQuc2V0SGVhbHRoQmFyRG9tKCQoJy5oZWFsdGgucGxheWVyMScpKTtcbiAgICBwbGF5ZXJzLnB1c2gob3Bwb25lbnQpO1xuXG4gICAgY29uc29sZS5sb2cocGxheWVycyk7XG5cbiAgICAkKCdib2R5Jykub24oJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIga2V5ID0gZXZlbnQud2hpY2g7XG4gICAgICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA9PSAtMSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoJ2JvZHknKS5vbigna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIga2V5SW5kZXggPSBrZXlzLmluZGV4T2YoZXZlbnQud2hpY2gpO1xuICAgICAgICBpZiAoa2V5SW5kZXggIT0gLTEpIHtcbiAgICAgICAgICAgIGtleXMuc3BsaWNlKGtleUluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2V0SW50ZXJ2YWwodGljaywgNTApO1xufVxuXG4vLyBwZXJpb2RpY2FsbHkgcHJvY2VzcyBldmVudHNcbmZ1bmN0aW9uIHRpY2soKSB7XG4gICAgdmFyIHBsYXllcjtcbiAgICB2YXIgc3RhdGUgPSB7XG4gICAgICAgIGtleXM6IGtleXMsXG4gICAgICAgIHBvc2l0aW9uczogW11cbiAgICB9O1xuICAgIHZhciBoaXRzID0gW107XG4gICAgZnVuY3Rpb24gcmVjb3JkSGl0KHBsYXllciwgZGlyLCBwb3MsIGhlaWdodCwgZGFtYWdlKSB7XG4gICAgICAgIGhpdHMucHVzaCh7IHBsYXllcjpwbGF5ZXIsIGRpcjpkaXIsIHBvczpwb3MsIGhlaWdodDpoZWlnaHQsIGRhbWFnZTpkYW1hZ2UgfSk7XG4gICAgfVxuXG4gICAgLy8gYXNzZW1ibGUgcG9zaXRpb25zIG9mIHBsYXllcnMuLlxuICAgIGZvciAocGxheWVySWQgaW4gcGxheWVycykge1xuICAgICAgICBwbGF5ZXIgPSBwbGF5ZXJzW3BsYXllcklkXTtcbiAgICAgICAgc3RhdGUucG9zaXRpb25zLnB1c2gocGxheWVyLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICAvLyBub3cgZ2l2ZSBlYWNoIHBsYXllciB0aGUgZ2FtZSBzdGF0ZSBhbmQgc2VlIHdoYXQgdGhleSBkb1xuICAgIGZvciAocGxheWVySWQgaW4gcGxheWVycykge1xuICAgICAgICBwbGF5ZXIgPSBwbGF5ZXJzW3BsYXllcklkXTtcbiAgICAgICAgLy8gbGV0IHRoZSBwbGF5ZXIgZG8gYSB0aGluZ1xuICAgICAgICBwbGF5ZXIudGljayhzdGF0ZSwge1xuICAgICAgICAgICAgaGl0OiBmdW5jdGlvbihkaXIsIHBvcywgaGVpZ2h0LCBkYW1hZ2UpIHsgcmVjb3JkSGl0KHBsYXllciwgZGlyLCBwb3MsIGhlaWdodCwgZGFtYWdlKTsgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gZHJhdyB0aGUgcG9zc2libHktdXBkYXRlZCBwbGF5ZXJcbiAgICAgICAgcGxheWVyLmRyYXcoKTtcbiAgICB9XG5cbiAgICB2YXIgaGl0ID0gbnVsbDtcblxuICAgIC8vIG5vdyB0ZWxsIGVhY2ggcGxheWVyIGFib3V0IHRoZSBoaXRzIHRoYXQgaGFwcGVuZWRcbiAgICBmb3IgKHBsYXllcklkIGluIHBsYXllcnMpIHtcbiAgICAgICAgcGxheWVyID0gcGxheWVyc1twbGF5ZXJJZF07XG4gICAgICAgIGZvciAoaGl0SWQgaW4gaGl0cykge1xuICAgICAgICAgICAgaWYgKHBsYXllciAhPT0gaGl0c1toaXRJZF0ucGxheWVyKSB7XG4gICAgICAgICAgICAgICAgaGl0ID0gaGl0c1toaXRJZF07XG4gICAgICAgICAgICAgICAgcGxheWVyLmdldEhpdChoaXQuZGlyZWN0aW9uLCBoaXQucG9zLCBoaXQuaGVpZ2h0LCBoaXQuZGFtYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIGxhc3QgbG9vcCB0aHJvdWdoIHBsYXllcnMsIHNvIGRyYXdcbiAgICAgICAgLy8gdGhlIHBvc3NpYmx5LXVwZGF0ZWQgcGxheWVyIG5vdy5cbiAgICAgICAgcGxheWVyLmRyYXcoKTtcbiAgICB9XG59XG5cblxuLy8gaGl0dGluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBoaXQocGxheWVySWQsIHNpemUpIHtcbiAgICB2YXIgcGxheWVyID0gcGxheWVyc1twbGF5ZXJJZF07XG4gICAgLy8gbG9vayB0aHJvdWdoIG90aGVyIHBsYXllcnMsIGZpbmRpbmcgcGxheWVycyBpbiByYW5nZVxuICAgIGZvciAob3Bwb25lbnRJZCBpbiBwbGF5ZXJzKSB7XG4gICAgICAgIGlmIChvcHBvbmVudElkID09IHBsYXllcklkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3Bwb25lbnQgPSBwbGF5ZXJzW29wcG9uZW50SWRdO1xuICAgICAgICB2YXIgbmVhciA9IHBsYXllci5wb3NpdGlvbiArIChwbGF5ZXIuZGlyZWN0aW9uICogMTApO1xuICAgICAgICB2YXIgZmFyID0gcGxheWVyLnBvc2l0aW9uICsgKHBsYXllci5kaXJlY3Rpb24gKiAxMDApO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAob3Bwb25lbnQucG9zaXRpb24gPCBNYXRoLm1heChuZWFyLCBmYXIpKVxuICAgICAgICAgICAgJiYgKG9wcG9uZW50LnBvc2l0aW9uID4gTWF0aC5taW4obmVhciwgZmFyKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBoZSdzIGluIHJhbmdlIG9mIG91ciBoaXRcbiAgICAgICAgICAgIG9wcG9uZW50LmN1cnJlbnRBY3Rpb24gPSAnZ2V0aHVydCcgKyAocGxheWVyLmRpcmVjdGlvbiA9PSAxID8gJ1JpZ2h0JyA6ICdMZWZ0Jyk7XG4gICAgICAgICAgICBvcHBvbmVudC5oZWFsdGggLT0gc2l6ZTtcbiAgICAgICAgICAgICQoJy5oZWFsdGgucGxheWVyJyArIG9wcG9uZW50SWQpLmNzcygnd2lkdGgnLCAoMjAgKiBvcHBvbmVudC5oZWFsdGgpICsgJ3B4Jyk7XG4gICAgICAgICAgICBvcHBvbmVudC5uZXh0U3RlcCA9IDA7XG4gICAgICAgICAgICBpZiAob3Bwb25lbnQuaGVhbHRoIDw9IDApIHtcbiAgICAgICAgICAgICAgICBvcHBvbmVudC5jdXJyZW50QWN0aW9uID0gJ2RlYWQnO1xuICAgICAgICAgICAgICAgIHBsYXllci5jdXJyZW50QWN0aW9uID0gJ3dpbm5lcic7XG4gICAgICAgICAgICAgICAgcGxheWVyLm5leHRTdGVwID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc21hbGxIaXQocGxheWVySWQpIHtcbiAgICBoaXQocGxheWVySWQsIDEpO1xufVxuXG5mdW5jdGlvbiBiaWdIaXQocGxheWVySWQpIHtcbiAgICBoaXQocGxheWVySWQsIDIpO1xufVxuXG4vLyBub3cga2ljayBpdCBhbGwgb2ZmLi5cbiQoIGdvICk7IiwiXG5hY3Rpb25zID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9iYXNpY2FjdGlvbnMnKTtcblxuZnVuY3Rpb24gUGxheWVyKHR5cGUsIGhlYWx0aCwgcG9zaXRpb24sIGhlaWdodCkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5oZWFsdGggPSBoZWFsdGggfHwgNTtcbiAgICB0aGlzLnJvYm90ID0gJ3JvYm90Mic7XG4gICAgdGhpcy5kaXJlY3Rpb24gPSAxO1xuICAgIHRoaXMucGljID0gJ25vcm1hbCc7XG4gICAgdGhpcy5jdXJyZW50QWN0aW9uID0gbnVsbDtcbiAgICB0aGlzLm5leHRTdGVwID0gMDtcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24gfHwgODA7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgfHwgMTU7XG4gICAgdGhpcy5oZWFsdGggPSBoZWFsdGggfHwgNTtcbiAgICB0aGlzLmRpcnR5ID0gWydwaWMnLCAncG9zaXRpb24nLCAnaGVpZ2h0J107XG5cbiAgICB0aGlzLmRvbSA9IG51bGw7XG59XG5cblBsYXllci5wcm90b3R5cGUgPSB7XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIHN0dWZmIHlvdSBzaG91bGQgb3ZlcnJpZGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8vIG92ZXJyaWRlIHRoaXMgdG8gcGljayB0aGUgbmV4dCBhY3Rpb24gZHVyaW5nIGEgdGlja1xuICAgIGNob29zZU5leHRBY3Rpb246IGZ1bmN0aW9uIGNob29zZU5leHRBY3Rpb24oc3RhdGUsIGNhbGxiYWNrcykge1xuICAgICAgICBjb25zb2xlLmxvZygnU3ViY2xhc3NlcyBvZiBQbGF5ZXIgc2hvdWxkIG92ZXJyaWRlIGNob29zZU5leHRBY3Rpb24oKS4nKTtcbiAgICB9LFxuXG4gICAgLy8gb3ZlcnJpZGUgdGhpcyB0byBwZXJmb3JtIGEgaGl0IGF0IHRoZSBsb2NhdGlvbiB0aGF0IG1hdGNoZXNcbiAgICAvLyB5b3VyIHBpY3R1cmVzLCBwcm9iYWJseSBhIHB1bmNoXG4gICAgc21hbGxIaXQ6IGZ1bmN0aW9uIHNtYWxsSGl0KHN0YXRlLCBjYWxsYmFja3MpIHtcbiAgICAgICAgdmFyIGFybUxlbmd0aCA9IDIwOyAgLy8gaG93IGZhciBpbiBmcm9udCBvZiB5b3UgYXJlIHlvdSBwdW5jaGluZ1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5kaXJlY3Rpb247IC8vIC0xIGlzIGxlZnQsICsxIGlzIHJpZ2h0XG4gICAgICAgIHZhciBoaXRQb3NpdGlvbiA9IHRoaXMucG9zaXRpb24gKyAoZGlyZWN0aW9uICogYXJtTGVuZ3RoKTtcbiAgICAgICAgdmFyIGhpdEhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgICAgICAvLyBub3cgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgaGl0dGluZyBhdCB0aGF0IHNwb3RcbiAgICAgICAgY2FsbGJhY2tzLmhpdChkaXJlY3Rpb24sIGhpdFBvc2l0aW9uLCBoaXRIZWlnaHQsIDEpO1xuICAgIH0sXG5cbiAgICAvLyBvdmVycmlkZSB0aGlzIHRvIHBlcmZvcm0gYSBoaXQgYXQgdGhlIGxvY2F0aW9uIHRoYXQgbWF0Y2hlc1xuICAgIC8vIHlvdXIgcGljdHVyZXMsIHByb2JhYmx5IGEga2lja1xuICAgIGJpZ0hpdDogZnVuY3Rpb24gYmlnSGl0KHN0YXRlLCBjYWxsYmFja3MpIHtcbiAgICAgICAgdmFyIGxlZ0xlbmd0aCA9IDMwOyAgLy8gaG93IGZhciBpbiBmcm9udCBvZiB5b3UgYXJlIHlvdSBraWNraW5nXG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLmRpcmVjdGlvbjsgLy8gLTEgaXMgbGVmdCwgKzEgaXMgcmlnaHRcbiAgICAgICAgdmFyIGhpdFBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbiArIChkaXJlY3Rpb24gKiBsZWdMZW5ndGgpO1xuICAgICAgICB2YXIgaGl0SGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgICAgIC8vIG5vdyBpbnZva2UgdGhlIGNhbGxiYWNrIGZvciBoaXR0aW5nIGF0IHRoYXQgc3BvdFxuICAgICAgICBjYWxsYmFja3MuaGl0KGRpcmVjdGlvbiwgaGl0UG9zaXRpb24sIGhpdEhlaWdodCwgMik7XG4gICAgfSxcblxuICAgIC8vIG92ZXJyaWRlIHRoaXMgdG8gd29yayBvdXQgb2YgeW91ciBwbGF5ZXIgZ2V0cyBoaXQgb3Igbm90LlxuICAgIC8vIG1ha2Ugc3VyZSB5b3UgcmV0dXJuIHRydWUgaWYgeW91IGdldCBraWxsZWQgYnkgdGhlIGhpdC5cbiAgICBnZXRIaXQ6IGZ1bmN0aW9uIGdldEhpdChoaXREaXJlY3Rpb24sIGhpdFBvcywgaGl0SGVpZ2h0LCBkYW1hZ2UpIHtcbiAgICAgICAgdmFyIHBsYXllcldpZHRoID0gMTAwOyAvLyBob3cgd2lkZSBpcyB5b3VyIGNvbWJhdGFudFxuICAgICAgICB2YXIgcGxheWVySGVpZ2h0ID0gMjsgLy8gaG93IHRhbGwgaXMgeW91ciBjb21iYXRhbnRcblxuICAgICAgICB2YXIgbWluUG9zID0gdGhpcy5wb3NpdGlvbjtcbiAgICAgICAgdmFyIG1heFBvcyA9IHRoaXMucG9zaXRpb24gKyBwbGF5ZXJXaWR0aDtcblxuICAgICAgICB2YXIgbWluSGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgICAgIHZhciBtYXhIZWlnaHQgPSB0aGlzLmhlaWdodCArIHBsYXllckhlaWdodDtcblxuICAgICAgICAvLyBub3cgd29yayBvdXQgaWYgeW91IHdlcmUgaGl0Li5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgbWluUG9zIDw9ICAgIGhpdFBvcyAmJiBoaXRQb3MgICAgPD0gbWF4UG9zXG4gICAgICAgICAgICAmJiBtaW5IZWlnaHQgPD0gaGl0SGVpZ2h0ICYmIGhpdEhlaWdodCA8PSBtYXhIZWlnaHRcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyB3ZSdyZSBoaXQhXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSAnZ2V0aHVydCcgKyAoaGl0RGlyZWN0aW9uID09IDEgPyAnUmlnaHQnIDogJ0xlZnQnKTtcblxuICAgICAgICAgICAgdGhpcy5oZWFsdGggLT0gZGFtYWdlO1xuICAgICAgICAgICAgLy8gd2hlbiB5b3UgY2hhbmdlIGhlYWx0aCwgbm90ZSB0aGF0IGhlYWx0aCBpcyBkaXJ0eVxuICAgICAgICAgICAgdGhpcy5kaXJ0eS5wdXNoKCdoZWFsdGgnKTtcblxuICAgICAgICAgICAgdGhpcy5uZXh0U3RlcCA9IDA7XG4gICAgICAgICAgICBpZiAodGhpcy5oZWFsdGggPD0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9ICdkZWFkJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBiZWxvdyBoZXJlIHlvdSB3b24ndCBuZWVkIHRvIG92ZXJyaWRlIGFueXRoaW5nIHVubGVzcyB5b3UncmVcbiAgICAvLyBtYWtpbmcgc29tZXRoaW5nIHNwZWNpYWwuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgY29uc3RydWN0b3I6IFBsYXllcixcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNheVR5cGU6IGZ1bmN0aW9uIHNheVR5cGUoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMudHlwZSk7XG4gICAgfSxcbiAgICAvLyBkcmF3IHRoZSBwbGF5ZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldFBsYXllckRvbTogZnVuY3Rpb24gc2V0UGxheWVyRG9tKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5kb20gPSAkKGVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICBzZXRIZWFsdGhCYXJEb206IGZ1bmN0aW9uIHNldEhlYWx0aEJhckRvbShlbGVtZW50KSB7XG4gICAgICAgIHRoaXMuaGVhbHRoRG9tID0gJChlbGVtZW50KTtcbiAgICB9LFxuXG4gICAgZHJhdzogZnVuY3Rpb24gZHJhdygpIHtcbiAgICAgICAgaWYgKHRoaXMuZG9tKSB7XG4gICAgICAgICAgICB2YXIgY3NzVXBkYXRlID0ge31cblxuICAgICAgICAgICAgdmFyIHRvcCA9IDEzMCAtICh0aGlzLmhlaWdodCAqIDIwKTtcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gdGhpcy5wb3NpdGlvbjtcblxuICAgICAgICAgICAgLy8gaGVhbHRoIGJhciBuZWVkIHVwZGF0aW5nP1xuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkuaW5kZXhPZignaGVhbHRoJykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhlYWx0aERvbS53aWR0aCh0aGlzLmhlYWx0aCAqIDIwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGxheWVyIG5lZWQgdXBkYXRpbmc/XG4gICAgICAgICAgICBpZiAodGhpcy5kaXJ0eS5pbmRleE9mKCdwaWMnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIGNzc1VwZGF0ZS5iYWNrZ3JvdW5kSW1hZ2UgPSBbXG4gICAgICAgICAgICAgICAgICAgICd1cmwocm9ib3RzJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yb2JvdCxcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMuZGlyZWN0aW9uID09IDEgPyAncmlnaHQnIDogJ2xlZnQnKSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waWMgKyAnLnN2ZyknLFxuICAgICAgICAgICAgICAgIF0uam9pbignLycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZGlydHkuaW5kZXhPZigncG9zaXRpb24nKSAhPSAtMSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZGlydHkuaW5kZXhPZignaGVpZ2h0JykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjc3NVcGRhdGUubGVmdCA9IHRoaXMucG9zaXRpb247XG4gICAgICAgICAgICAgICAgY3NzVXBkYXRlLnRvcCA9ICgxMzAgLSAodGhpcy5oZWlnaHQgKiAyMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5kb20uY3NzKGNzc1VwZGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbGVydChcIkNhbid0IGRyYXcgXCIgKyB0aGlzLnR5cGUgK1xuICAgICAgICAgICAgICAgICAgXCIgcGxheWVyIHdpdGhvdXQgYSBET00gZWxlbWVudC4gXFxuXCIgK1xuICAgICAgICAgICAgICAgICAgXCJDYWxsIHBsYXllci5zZXREb20oZWxlbWVudCkgdG8gYXNzaWduIGFuIGVsZW1lbnQuXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8vIGFjdHVhbGx5IGRvIHRoaW5ncyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGljazogZnVuY3Rpb24gdGljayhzdGF0ZSwgY2FsbGJhY2tzKSB7XG5cbiAgICAgICAgLy8gcGVyZm9ybSB0aGUgY3VycmVudCBhY3Rpb24gLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiAodGhpcy5jdXJyZW50QWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGVyZSdzIGEgY3VycmVudCBhY3Rpb24sIHRha2UgaXRzIG5leHQgc3RlcFxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGFjdGlvbnNbdGhpcy5jdXJyZW50QWN0aW9uXTtcbiAgICAgICAgICAgIHZhciBzdGVwID0gYWN0aW9uLnN0ZXBzW3RoaXMubmV4dFN0ZXBdO1xuXG4gICAgICAgICAgICBpZiAoc3RlcCAmJiB0aGlzW3N0ZXBdKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzdGVwXS5jYWxsKHRoaXMsIHN0YXRlLCBjYWxsYmFja3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBnZXQgcmVhZHkgZm9yIHRoZSBuZXh0IHN0ZXBcbiAgICAgICAgICAgIHRoaXMubmV4dFN0ZXAgKz0gMTtcbiAgICAgICAgICAgIGlmICh0aGlzLm5leHRTdGVwID49IGFjdGlvbi5zdGVwcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBkaWQgdGhlIGxhc3Qgc3RlcC4uIGNsZWFyIG9mZiB0aGUgY3VycmVudEFjdGlvblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0U3RlcCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBvYmV5IGdyYXZpdHkgLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmICh0aGlzLmNhbkZhbGwoKSkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlRG93bigpO1xuICAgICAgICAgICAgaWYgKHRoaXMuaGVpZ2h0IDwgMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gMDtcbiAgICAgICAgICAgICAgICBpZiAoISB0aGlzLmlzTG9ja2VkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gJ2xhbmQnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRTdGVwID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWNpZGUgd2hhdCB0byBkbyBuZXh0IC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmICghIHRoaXMuY3VycmVudEFjdGlvbikge1xuICAgICAgICAgICAgLy8gZG93bnN0cmVhbSBzdWJjbGFzc2VzIHN1cHBseSB0aGlzXG4gICAgICAgICAgICB0aGlzLmNob29zZU5leHRBY3Rpb24oc3RhdGUsIGNhbGxiYWNrcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gcGljIHBpYyBzd2l0Y2hpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzd2l0Y2hQaWM6IGZ1bmN0aW9uIHN3aXRjaFBpYyhuZXdQaWMpIHtcbiAgICAgICAgaWYgKHRoaXMucGljICE9IG5ld1BpYykge1xuICAgICAgICAgICAgdGhpcy5waWMgPSBuZXdQaWM7XG4gICAgICAgICAgICB0aGlzLmRpcnR5LnB1c2goJ3BpYycpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBqdW1wUGljOiBmdW5jdGlvbiBqdW1wUGljKCkgICAgICAgICB7IHRoaXMuc3dpdGNoUGljKCdqdW1wJyk7IH0sXG4gICAgcHVuY2hQaWM6IGZ1bmN0aW9uIHB1bmNoUGljKCkgICAgICAgeyB0aGlzLnN3aXRjaFBpYygncHVuY2gnKTsgfSxcbiAgICBraWNrUGljOiBmdW5jdGlvbiBraWNrUGljKCkgICAgICAgICB7IHRoaXMuc3dpdGNoUGljKCdraWNrJyk7IH0sXG4gICAgbm9ybWFsUGljOiBmdW5jdGlvbiBub3JtYWxQaWMoKSAgICAgeyB0aGlzLnN3aXRjaFBpYygnbm9ybWFsJyk7IH0sXG4gICAgbGFuZGluZ1BpYzogZnVuY3Rpb24gbGFuZGluZ1BpYygpICAgeyB0aGlzLnN3aXRjaFBpYygnbGFuZGluZycpOyB9LFxuICAgIGh1cnRQaWM6IGZ1bmN0aW9uIGh1cnRQaWMoKSAgICAgICAgIHsgdGhpcy5zd2l0Y2hQaWMoJ2h1cnQnKTsgfSxcbiAgICBwdXNoYmFja1BpYzogZnVuY3Rpb24gcHVzaGJhY2tQaWMoKSB7IHRoaXMuc3dpdGNoUGljKCdwdXNoYmFjaycpOyB9LFxuICAgIGRlYWRQaWM6IGZ1bmN0aW9uIGRlYWRQaWMoKSAgICAgICAgIHsgdGhpcy5zd2l0Y2hQaWMoJ2RlYWQnKTsgfSxcbiAgICB3aW5uZXJQaWM6IGZ1bmN0aW9uIHdpbm5lclBpYygpICAgICB7IHRoaXMuc3dpdGNoUGljKCd3aW5uZXInKTsgfSxcblxuICAgIC8vIHRlc3RzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY2FuRmFsbDogZnVuY3Rpb24gY2FuRmFsbCgpIHtcbiAgICAgICAgcmV0dXJuICggdGhpcy5oZWlnaHQgPiAwICYmIChcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9PT0gbnVsbFxuICAgICAgICAgICAgfHwgYWN0aW9uc1t0aGlzLmN1cnJlbnRBY3Rpb25dLmZhbGxPa2F5XG4gICAgICAgICkgICApXG4gICAgfSxcblxuICAgIGNhbk1vdmU6IGZ1bmN0aW9uIGNhbk1vdmUoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPT09IG51bGxcbiAgICAgICAgICAgIHx8IGFjdGlvbnNbdGhpcy5jdXJyZW50QWN0aW9uXS5tb3ZlT2theVxuICAgICAgICApXG4gICAgfSxcblxuICAgIGlzTG9ja2VkOiBmdW5jdGlvbiBpc0xvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiAhPT0gbnVsbFxuICAgICAgICAgICAgJiYgYWN0aW9uc1t0aGlzLmN1cnJlbnRBY3Rpb25dLmlzRmluYWxcbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICAvLyBkb2luZyBub3RoaW5nLi4uIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIG5vdGhpbmc6IGZ1bmN0aW9uIG5vdGhpbmcoKSB7XG4gICAgICAgIC8vIC4uIGRvaW5nIG5vdGhpbmcsIGFzIGluc3RydWN0ZWRcbiAgICB9LFxuXG4gICAgLy8gYWJzb2x1dGUgbW92ZW1lbnQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBtb3ZlVXA6IGZ1bmN0aW9uIG1vdmVVcCgpIHtcbiAgICAgICAgdGhpcy5oZWlnaHQrKztcbiAgICAgICAgdGhpcy5kaXJ0eS5wdXNoKCdoZWlnaHQnKTtcbiAgICB9LFxuXG4gICAgbW92ZURvd246IGZ1bmN0aW9uIG1vdmVEb3duKCkge1xuICAgICAgICB0aGlzLmhlaWdodC0tO1xuICAgICAgICB0aGlzLmRpcnR5LnB1c2goJ2hlaWdodCcpO1xuICAgIH0sXG5cbiAgICBtb3ZlTGVmdDogZnVuY3Rpb24gbW92ZUxlZnQoKSB7XG4gICAgICAgIGlmICh0aGlzLnBvc2l0aW9uID4gMTApIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gLT0gNTtcbiAgICAgICAgICAgIHRoaXMuZGlydHkucHVzaCgncG9zaXRpb24nKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBtb3ZlUmlnaHQ6IGZ1bmN0aW9uIG1vdmVSaWdodCgpIHtcbiAgICAgICAgaWYgKHRoaXMucG9zaXRpb24gPCAzNTApIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gKz0gNTtcbiAgICAgICAgICAgIHRoaXMuZGlydHkucHVzaCgncG9zaXRpb24nKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBkaXJlY3Rpb25hbCBtb3ZlbWVudCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGZhY2VMZWZ0OiBmdW5jdGlvbiBmYWNlTGVmdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uICE9IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IC0xO1xuICAgICAgICAgICAgdGhpcy5kaXJ0eS5wdXNoKCdwaWMnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBmYWNlUmlnaHQ6IGZ1bmN0aW9uIGZhY2VSaWdodCgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uICE9IDEpIHtcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgIHRoaXMuZGlydHkucHVzaCgncGljJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbW92ZUZvcndhcmQ6IGZ1bmN0aW9uIG1vdmVGb3J3YXJkKCkge1xuICAgICAgICBpZiAodGhpcy5kaXJlY3Rpb24gPT0gMSkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlUmlnaHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubW92ZUxlZnQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBtb3ZlQmFjazogZnVuY3Rpb24gbW92ZUJhY2soKSB7XG4gICAgICAgIGlmICh0aGlzLmRpcmVjdGlvbiA9PSAxKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVMZWZ0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVSaWdodCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gZW5kIG9mIFBsYXllciBwcm90b3R5cGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7IiwiQmFzaWNQbGF5ZXIgPSByZXF1aXJlKCcuL0Jhc2ljUGxheWVyJyk7XG5cbmFpUGxheWVyTWFrZXIgPSBmdW5jdGlvbiBBaVBsYXllck1ha2VyKGhlYWx0aCwgcG9zaXRpb24sIGhlaWdodCkge1xuICAgIHZhciBwbGF5ZXIgPSBuZXcgQmFzaWNQbGF5ZXIoJ0FJJywgaGVhbHRoLCBwb3NpdGlvbiwgaGVpZ2h0KTtcblxuICAgIHBsYXllci5jaG9vc2VOZXh0QWN0aW9uID0gZnVuY3Rpb24gY2hvb3NlQWlBY3Rpb24oc3RhdGUsIGNhbGxiYWNrcykge1xuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vICBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSSBBSVxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgICAgICAgX18vX18vX18vX18vICAgICAgICBfXy9fXy9fXy9cbiAgICAgICAgLy8gICAgICAgICAgX18vICAgICAgX18vICAgICAgICAgICBfXy9cbiAgICAgICAgLy8gICAgICAgICBfXy9fXy9fXy9fXy8gICAgICAgICAgIF9fL1xuICAgICAgICAvLyAgICAgICAgX18vICAgICAgX18vICBfXy8gICBfXy9fXy9fXy8gIF9fL1xuICAgICAgICAvL1xuICAgICAgICAvLyAgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUkgQUlcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyBkZWNpZGUgd2hhdCB0byBkb1xuICAgICAgICB2YXIgcmFuZCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICAgICAgdmFyIG90aGVyUG9zID0gc3RhdGUucG9zaXRpb25zLmZpbHRlciggZnVuY3Rpb24ocG9zKSB7XG4gICAgICAgICAgICByZXR1cm4gKHBvcyAhPSB0aGlzLnBvc2l0aW9uKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gaXMgdGhlIG9wcG9lbnQgdG8gb3VyIGxlZnQ/XG4gICAgICAgIHZhciBvcHBvbmVudElzTGVmdCA9IChvdGhlclBvc1swXSA8IHRoaXMucG9zaXRpb24pO1xuXG4gICAgICAgIGlmIChyYW5kIDwgMC4yKSB7XG4gICAgICAgICAgICAvLyBtb3ZlIHRvd2FyZCB0aGUgb3RoZXIgcGxheWVyXG4gICAgICAgICAgICBpZiAob3Bwb25lbnRJc0xlZnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY2VMZWZ0KHBsYXllcklkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWNlUmlnaHQocGxheWVySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuY2FuTW92ZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlRm9yd2FyZChwbGF5ZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKDAuMiA8IHJhbmQgJiYgcmFuZCA8IDAuMykge1xuICAgICAgICAgICAgLy8gbW92ZSBBV0FZIEZST00gdGhlIG90aGVyIHBsYXllclxuICAgICAgICAgICAgaWYgKG9wcG9uZW50SXNMZWZ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWNlUmlnaHQocGxheWVySWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY2VMZWZ0KHBsYXllcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmNhbk1vdmUoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZUZvcndhcmQocGxheWVySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5jdXJyZW50QWN0aW9uICYmIDAuMyA8IHJhbmQgJiYgcmFuZCA8IDAuNCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gJ3B1bmNoJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuY3VycmVudEFjdGlvbiAmJiAwLjQgPCByYW5kICYmIHJhbmQgPCAwLjUpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9ICdraWNrJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhdGhpcy5jdXJyZW50QWN0aW9uICYmIDAuNiA8IHJhbmQgJiYgcmFuZCA8IDAuN1xuICAgICAgICAgICAgJiYgdGhpcy5oZWlnaHQgPT0gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9ICdqdW1wJztcbiAgICAgICAgfVxuICAgICAgICAvLyBBSSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgfVxuXG4gICAgcmV0dXJuIHBsYXllcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhaVBsYXllck1ha2VyOyIsIlxuQmFzaWNQbGF5ZXIgPSByZXF1aXJlKCcuL0Jhc2ljUGxheWVyJyk7XG5cbmZ1bmN0aW9uIGlzSW4oa2V5LCBrZXlzKSB7XG4gICAgcmV0dXJuIChrZXlzLmluZGV4T2Yoa2V5KSAhPSAtMSk7XG59XG5cbnJvYm90UGxheWVyTWFrZXIgPSBmdW5jdGlvbiByb2JvdFBsYXllck1ha2VyKGhlYWx0aCwgcG9zaXRpb24sIGhlaWdodCkge1xuXG4gICAgdmFyIHBsYXllciA9IG5ldyBCYXNpY1BsYXllcigncm9ib3QnLCBoZWFsdGgsIHBvc2l0aW9uLCBoZWlnaHQpO1xuXG4gICAgcGxheWVyLmNob29zZU5leHRBY3Rpb24gPSBmdW5jdGlvbiBjaG9vc2VBY3Rpb24oc3RhdGUsIGNhbGxiYWNrcykge1xuICAgICAgICBpZiAoISB0aGlzLmN1cnJlbnRBY3Rpb24pIHtcbiAgICAgICAgICAgIC8vIG5vIGN1cnJlbnQgYWN0aW9uLi4gZGVjaWRlIHdoYXQncyBuZXh0XG4gICAgICAgICAgICBpZiAoaXNJbig2OSwgc3RhdGUua2V5cykpIHsgdGhpcy5jdXJyZW50QWN0aW9uID0gJ3B1bmNoJzsgfVxuICAgICAgICAgICAgaWYgKGlzSW4oODIsIHN0YXRlLmtleXMpKSB7IHRoaXMuY3VycmVudEFjdGlvbiA9ICdraWNrJzsgfVxuICAgICAgICAgICAgaWYgKGlzSW4oMzIsIHN0YXRlLmtleXMpICYmIHRoaXMuaGVpZ2h0ID09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSAnanVtcCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCAhdGhpcy5jdXJyZW50QWN0aW9uIHx8XG4gICAgICAgICAgICAgYWN0aW9uc1t0aGlzLmN1cnJlbnRBY3Rpb25dLm1vdmVPa2F5KSB7XG4gICAgICAgICAgICBpZiAoaXNJbig2NSwgc3RhdGUua2V5cykgfHwgaXNJbigzNywgc3RhdGUua2V5cykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZhY2VMZWZ0KHBsYXllcklkKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVMZWZ0KHBsYXllcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc0luKDY4LCBzdGF0ZS5rZXlzKSB8fCBpc0luKDM5LCBzdGF0ZS5rZXlzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFjZVJpZ2h0KHBsYXllcklkKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVSaWdodChwbGF5ZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiBwbGF5ZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcm9ib3RQbGF5ZXJNYWtlcjsiXX0=
