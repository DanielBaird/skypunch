
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