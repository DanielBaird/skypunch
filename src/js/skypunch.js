
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
