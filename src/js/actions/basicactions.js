
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
