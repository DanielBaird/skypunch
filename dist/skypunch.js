(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports=require(1)
},{}],3:[function(require,module,exports){

var player = require('./players/robotPlayer');
var opponent = require('./players/robotAI');

var actions = {
    'gethurtLeft': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            moveLeft,
            hurtPic,
            moveLeft, moveLeft,
            pushbackPic,
            moveLeft, moveLeft,
            null, null, null,
            normalPic,
            null, null, null
        ]
    },
    'gethurtRight': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            moveRight,
            hurtPic,
            moveRight, moveRight,
            pushbackPic,
            moveRight, moveRight,
            null, null, null,
            normalPic,
            null, null, null
        ]
    },
    'dead': {
        moveOkay: false,
        fallOkay: true,
        final: true,
        steps: [
            deadPic
        ]
    },
    'winner': {
        moveOkay: false,
        fallOkay: false,
        final: true,
        steps: [
            winnerPic,
            moveUp, null, moveUp, null,
            moveDown, null, moveDown, null
        ]
    },
    'jump': {
        moveOkay: true,
        fallOkay: false,
        final: false,
        steps: [
            moveUp,
            jumpPic,
            moveUp, moveUp, moveUp, moveUp, moveUp
        ]
    },
    'land': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            landingPic,
            null, null, null,
            normalPic
        ]
    },
    'punch': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            moveForward,
            punchPic,
            moveForward,
            smallHit,
            moveBack,
            normalPic,
            null, null, null
        ]
    },
    'kick': {
        moveOkay: false,
        fallOkay: true,
        final: false,
        steps: [
            moveForward,
            moveForward,
            kickPic,
            moveForward,
            bigHit,
            moveBack, moveBack,
            normalPic,
            null, null, null
        ]
    }
}

var keys = [];
var currentAction = null;
var nextStep = 0;

var players = [
    {
        robot: 'robot2',
        direction: 1,
        state: 'normal',
        currentAction: null,
        nextStep: 0,
        position: 80,
        height: 15,
        health: 5,
        dirty: ['state', 'position', 'height']
    },
    {
        robot: 'robot2',
        direction: -1,
        state: 'normal',
        currentAction: null,
        nextStep: 0,
        position: 320,
        height: 20,
        health: 5,
        dirty: ['state', 'position', 'height']
    }
]

function inKeys(key) {
    return (keys.indexOf(key) != -1);
}

function go() {
    console.log('go function is running');

    setInterval(tick, 50);

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
}

function tick() {
    for (playerId in players) {
        var player = players[playerId];

        // perform the current action -----------------------
        if (player.currentAction) {
            // action is an array of steps

            var action = actions[player.currentAction];
            var step = action.steps[player.nextStep++];
            if (step) {
                step.call(this, playerId);
            }
            if (player.nextStep >= action.steps.length) {
                if (!action.final) {
                    player.currentAction = null;
                }
                player.nextStep = 0;
            }
        }

        // fall down ----------------------------------------
        if (
            player.height > 0 && (
                !player.currentAction ||
                actions[player.currentAction].fallOkay
            )
        ) {
            moveDown(playerId);
            if (player.height < 1) {
                player.height = 0;
                if (
                    !player.currentAction ||
                    actions[player.currentAction].final == false
                ) {
                    player.currentAction = 'land';
                    player.nextStep = 0;
                }
            }
        }

        // what to do next ----------------------------------
        if (playerId == 0) {
            if (!player.currentAction) {
                // no current action.. decide what's next
                if (inKeys(69)) { player.currentAction = 'punch'; }
                if (inKeys(82)) { player.currentAction = 'kick'; }
                if (inKeys(32) && player.height == 0) {
                    player.currentAction = 'jump';
                }
            }
            if ( !player.currentAction ||
                 actions[player.currentAction].moveOkay) {
                if (inKeys( 65) || inKeys(37)) {
                    faceLeft(playerId);
                    moveLeft(playerId);
                }
                if (inKeys( 68) || inKeys(39)) {
                    faceRight(playerId);
                    moveRight(playerId);
                }
            }
        } else {
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
            // decide what the opponent should do
            var rand = Math.random();
            if (rand < 0.2) {
                // move toward the other player
                var opponent = players[0]
                if (player.position > opponent.position) {
                    faceLeft(playerId);
                }
                if (player.position < opponent.position) {
                    faceRight(playerId);
                }
                if ( !player.currentAction ||
                     actions[player.currentAction].moveOkay) {
                    moveForward(playerId);
                }
            }
            if (0.2 < rand && rand < 0.3) {
                // move away from other player
                if ( !player.currentAction ||
                     actions[player.currentAction].moveOkay) {
                    faceRight(playerId);
                    moveRight(playerId);
                }
            }
            if (!player.currentAction && 0.3 < rand && rand < 0.4) {
                player.currentAction = 'punch';
            }
            if (!player.currentAction && 0.4 < rand && rand < 0.5) {
                player.currentAction = 'kick';
            }
            if (
                !player.currentAction && 0.6 < rand && rand < 0.7
                && player.height == 0
            ) {
                player.currentAction = 'jump';
            }
            // AI -------------------------------------------
        }

        drawPlayer(playerId);
    }
}

function drawPlayer(playerId) {
    var player = players[playerId];

    var top = 130 - (player.height * 20);
    var left = player.position;

    var cssUpdate = {}
    if (player.dirty.indexOf('state') != -1) {
        cssUpdate.backgroundImage = [
            'url(robots',
            player.robot,
            (player.direction == 1 ? 'right' : 'left'),
            player.state + '.svg)',
        ].join('/');
    }
    if (player.dirty.indexOf('position') != -1 ||
        player.dirty.indexOf('height') != -1) {
        cssUpdate.left = player.position;
        cssUpdate.top = (130 - (player.height * 20));
    }
    player.dirty = [];
    $('.robot.player' + playerId).css(cssUpdate);
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

// switching states -----------------------------------------

function jumpPic(playerId) {
    players[playerId].state = 'jump';
    players[playerId].dirty.push('state');
}

function punchPic(playerId) {
    players[playerId].state = 'punch';
    players[playerId].dirty.push('state');
}

function kickPic(playerId) {
    players[playerId].state = 'kick';
    players[playerId].dirty.push('state');
}

function normalPic(playerId) {
    players[playerId].state = 'normal';
    players[playerId].dirty.push('state');
}

function landingPic(playerId) {
    players[playerId].state = 'landing';
    players[playerId].dirty.push('state');
}

function hurtPic(playerId) {
    players[playerId].state = 'hurt';
    players[playerId].dirty.push('state');
}

function pushbackPic(playerId) {
    players[playerId].state = 'pushback';
    players[playerId].dirty.push('state');
}

function deadPic(playerId) {
    if (players[playerId].state != 'dead') {
        players[playerId].state = 'dead';
        players[playerId].dirty.push('state');
    }
}

function winnerPic(playerId) {
    if (players[playerId].state != 'winner') {
        players[playerId].state = 'winner';
        players[playerId].dirty.push('state');
    }
}

// movement -------------------------------------------------

function moveUp(playerId) {
    players[playerId].height++;
    players[playerId].dirty.push('height');
}

function moveDown(playerId) {
    players[playerId].height--;
    players[playerId].dirty.push('height');
}

function faceLeft(playerId) {
    var player = players[playerId];
    if (player.direction != -1) {
        player.direction = -1;
        player.dirty.push('state');
    }
}

function faceRight(playerId) {
    var player = players[playerId];
    if (player.direction != 1) {
        player.direction = 1;
        player.dirty.push('state');
    }
}

function moveLeft(playerId) {
    if (players[playerId].position > 10) {
        players[playerId].position -= 5;
        players[playerId].dirty.push('position');
    }
}

function moveRight(playerId) {
    if (players[playerId].position < 350) {
        players[playerId].position += 5;
        players[playerId].dirty.push('position');
    }
}

function moveForward(playerId) {
    if (players[playerId].direction == 1) {
        moveRight(playerId);
    } else {
        moveLeft(playerId);
    }
}

function moveBack(playerId) {
    if (players[playerId].direction == 1) {
        moveLeft(playerId);
    } else {
        moveRight(playerId);
    }
}

// now kick it all off..
$( go );
},{"./players/robotAI":1,"./players/robotPlayer":2}]},{},[3])