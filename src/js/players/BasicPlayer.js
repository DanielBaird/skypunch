
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