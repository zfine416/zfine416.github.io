// Whiteboarding:
// First we need to make the board
// Then player1 makes a selection
  // check if its a winning move
  // else
// Player 2 makes a selection
  //check if its a winning move

// Things we know:
// The board is 7 columns and 6 rows
// x x x x x x x
// x x x x x x x
// x x x x x x x
// x x x x x x x
// x x x x x x x
// x x x x x x x
// Players switch off moves
// after each move we need to check for winner
// There are only 7 * 6 total moves
'use strict';

const board = document.getElementById('board');

const connectFour = {
  gameState: {
    currentPlayer: 'player1',
    moveCount: 0,
    inProgress: true,
  },
  makeMove: function(col) {
    // get the column number selected
    const colNum = Number(col.id[col.id.length - 1]);
    // select the appropriate column elements
    const cols = document.querySelectorAll(`.column${colNum}`);
    if(this.gameState.inProgress) {
      for(let i = cols.length - 1; i >= 0; i--) {
        if(cols[i].classList[1] !== 'taken') {
          cols[i].classList.add('taken', this.gameState.currentPlayer);
          this.gameState.lastMove = cols[i];
          this.gameState.moveCount++;
          break;
        }
      }
    }
    this.gameState.currentPlayer = (this.gameState.currentPlayer === 'player1') ? 'player2' : 'player1';
  },
  checkWinner: function() {
    this.gameState.inProgress = (this.verticalWin() || this.horizontalWin() || this.diagonalWin()) ? false : true;
  },
  verticalWin: function() {
    debugger;
  },
  horizontalWin: function() {
    debugger;
  },
  diagonalWin: function() {
    debugger;
  }
}

function game() {
  makeBoard();
}

function makeBoard() {
  for(let row = 0; row < 6; row++) {
    const rowEl = document.createElement('div');
    rowEl.classList.add(`row`);
    board.appendChild(rowEl);
    for(let col = 0; col < 7; col++) {
      const colEl = document.createElement('div');
      colEl.classList.add(`column${col}`);
      document.querySelectorAll('.row')[row].appendChild(colEl);
    }
  }
}

const choices = document.querySelectorAll('.choice');

choices.forEach((choice) => choice.addEventListener('click', function(){
  connectFour.makeMove(this);
  connectFour.checkWinner();
}));

game();