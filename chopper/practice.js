var game = {
  gameState: {
    bunnyMove: true,
    score: 0,
    inProgress: true,
  },
  bunnyMove: function() {
    // make the bunny do a random move

    //at end of move
    game.bunnyMove = false;
  },
  playerMove: function() {
    // the player makes his move
  },
  start: function() {
    // While the game is in progress do this
    while(inProgress === true) {
      if(game.bunnyMove == true) {
        game.bunnyMove();
      } else {
        game.playerMove();
      }
    }
    

  }
}

game.start();