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
const choices = document.querySelectorAll('.choice');
let player = 'player1';

function game() {
  makeBoard();
}

function makeBoard() {
  for(let row = 0; row < 6; row++) {
    const rowEl = document.createElement('div');
    rowEl.classList.add('row');
    board.appendChild(rowEl);
    for(let col = 0; col < 7; col++) {
      const colEl = document.createElement('div');
      colEl.classList.add(`column${col}`);
      document.querySelectorAll('.row')[row].appendChild(colEl);
    }
  }
}

choices.forEach((choice) => choice.addEventListener('click', function(){
  makeMove(this, player);
  player = (player === 'player1') ? 'player2' : 'player1';
}));

function makeMove(col, player) {
  const colNum = Number(col.id[col.id.length - 1]);
  const columns = document.querySelectorAll(`.column${colNum}`);
  for(let i = columns.length - 1; i >= 0; i--) {
    if(columns[i].classList[1] !== "taken") {
      columns[i].classList.add("taken", player);
      break;
    }
  }
}

game();