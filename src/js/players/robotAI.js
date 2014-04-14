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