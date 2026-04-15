import { getRandomListItem } from './lib/utils.js';

console.clear();

let dictionary, gameWords; //targetWord
let gameboard = document.querySelector('.gameboard');
let keyboard = document.querySelector('.keyboard');
// For Assignment 5 implement the gameState
let gameState = {
  date: '',
  solution: '',
  status: 'in_progress',
  guesses: []
};

async function getData() {
  try {
    let dictionaryResponse = await fetch('/data/dictionary.json');
    let gameWordsResponse = await fetch('/data/game_words.json');
    let dictionaryObject = await dictionaryResponse.json();
    let gameWordsObject = await gameWordsResponse.json();

    dictionary = [...dictionaryObject];
    gameWords = [...gameWordsObject];

    return true;
  } catch (err) {
    console.error('getData function error: ', err);
    return false;
  }
}

async function initGame() {
  try {
    let dataIsLoaded = await getData();
    if (dataIsLoaded) {
      //if game exists in localStorage and the date is the same as today's date, load that gameState instead of starting a new game
      if (localStorage.gameState && JSON.parse(localStorage.gameState).date === new Date().toLocaleDateString()) {
        gameState = JSON.parse(localStorage.gameState);
        console.log('Loaded gameState from localStorage: ', gameState);
        console.log(gameState.guesses);
        renderGuesses(gameState.guesses);
        if (gameState.status !== 'in_progress') {
          alert(`You have already ${gameState.status} today's game! The solution was : ${gameState.solution} \n Play again on ${new Date(Date.now() + 86400000).toLocaleDateString()}`);
          return;
        }
        startGame();
        return;
      }

      // Assign a random targetWord from our data
      // targetWord = getRandomListItem(gameWords);

      gameState.solution = getRandomListItem(gameWords);
      console.log(`Solution: ${gameState.solution}`);

      //my Code
      gameState.date = new Date().toLocaleDateString();
      gameState.status = 'in_progress';


      startGame();
    } else {
      alert('There was a problem, please refresh the page to try again.')
    }
  } catch(err) {
    console.error('initGame function error: ', err);
  }
}

initGame();

function startGame() {
  if (!localStorage.gameState) {
    saveGameState();
  }
  keyboard.addEventListener('click', clickHandler);
  document.addEventListener('keyup', keypressHandler);
}

function endGame() {
  saveGameState();
  keyboard.removeEventListener('click', clickHandler);
  document.removeEventListener('keyup', keypressHandler);
}

function clickHandler(event) {
  // detect virual keyboard click on buttons a-z
  let letterKey = event.target.dataset.key;
  // detect the 'Delete' button which will remove letters from the gameboard
  let deleteKey = event.target.dataset.delete;
  // detect the 'Enter' button which will submit a word guess
  let enterKey = event.target.dataset.enter;

  if (letterKey) {
    addLetter(letterKey);
  }
  if (deleteKey) {
    removeLetter();
  }
  if (enterKey) {
    submitGuess();
  }
}

function keypressHandler(event) {
  // detect only keys a-z on the physical keyboard
  if (event.key.match(/^[a-z]$/i)) {
    let letter = event.key.toLowerCase();
    addLetter(letter)
  }

  // detect 'Backspace' and 'Delete' keys
  if (event.key === 'Backspace' || event.key === 'Delete') {
    removeLetter();
  }

  // detect the 'Enter' key
  if (event.key === 'Enter') {
    submitGuess();
  }
}

function addLetter(letter) {
  let tilesWithLetters = gameboard.querySelectorAll('div.tile[data-state="has-letter"]');

  if (tilesWithLetters.length === gameState.solution.length) {
    return false;
  }

  let nextEmptyTile = gameboard.querySelector('div.tile:not([data-state])');
  nextEmptyTile.dataset.letter = letter;
  nextEmptyTile.dataset.state = 'has-letter';
  nextEmptyTile.innerText = letter;
}

function removeLetter() {
  let tilesWithLetters = gameboard.querySelectorAll('div.tile[data-state="has-letter"]');
  
  if (tilesWithLetters.length === 0) {
    return false;
  }

  let lastLetterIndex = tilesWithLetters.length - 1;
  let lastTileWithLetter = tilesWithLetters[lastLetterIndex];
  lastTileWithLetter.removeAttribute('data-letter');
  lastTileWithLetter.removeAttribute('data-state');
  lastTileWithLetter.innerText = '';
}

function submitGuess() {
  let tilesWithLetters = gameboard.querySelectorAll('div.tile[data-state="has-letter"]');

  let wordGuess = '';
  tilesWithLetters.forEach(function(tile) {
    wordGuess += tile.dataset.letter;
  });

  if (wordGuess.length !== gameState.solution.length) {
    return alert('Your guess must be 5 letters long!');
  }
  if (!dictionary.includes(wordGuess)) {
    return alert('Your guess is not a valid 5 letter word in the English Dictionary! Try again...');
  }
  if (gameState.guesses.includes(wordGuess)) {
    return alert('You already guessed that word! Try again...');
  }

  // check the state of each letter against the gameState.solution
  tilesWithLetters.forEach(function(tile, index, nodeList) {
    checkLetterState(tile, index, nodeList, wordGuess)
  })

  //my code
  gameState.guesses.push(wordGuess);
  console.log(gameState);
  saveGameState();
  

}


function checkLetterState(tile, index, tilesWithLetter, wordGuess) {
  let currentLetter = tile.dataset.letter;
  let virtualKey = keyboard.querySelector(`button[data-key="${currentLetter}"]`);
  let newState = '';

  if (gameState.solution[index] === currentLetter) {
    newState = 'correct';
  } else if (gameState.solution.includes(currentLetter)) {
    newState = 'found';
  } else {
    newState = 'wrong';
  }

  tile.dataset.state = newState;
  if (virtualKey.dataset.state !== 'correct') {
    virtualKey.dataset.state = newState;
  }

  if (index === tilesWithLetter.length - 1) {
    checkGameResult(wordGuess);
  }
  
}

function checkGameResult(wordGuess) {
  if (wordGuess === gameState.solution) {
    setTimeout(function() {
      alert(`You WON! The correct solution was : ${gameState.solution}`);
    }, 200);

    //my code
    gameState.status = 'won';
    //save
    return endGame();
  }

  let remainingEmptyTiles = gameboard.querySelectorAll('div.tile:not([data-state])');
  if (remainingEmptyTiles.length === 0) {
    setTimeout(function() {
      alert(`You LOST! The correct solution was : ${gameState.solution}`);
    }, 200);

    //my code
    gameState.status = 'lost';
    console.log(gameState);

    return endGame();
  }
}

function saveGameState() {
  localStorage.setItem('gameState', JSON.stringify(gameState));
  console.log('Saved gameState to localStorage');
}

function renderGuesses(guesses) {
  guesses.forEach(function(wordGuess) {
    let tiles = gameboard.querySelectorAll('div.tile:not([data-state])');

    for (let i = 0; i < wordGuess.length; i++) {
      let tile = tiles[i];
      tile.dataset.letter = wordGuess[i];
      tile.dataset.state = 'has-letter';
      tile.innerText = wordGuess[i];
    }

    let filledTiles = gameboard.querySelectorAll('div.tile[data-state="has-letter"]');

    filledTiles.forEach(function(tile, index, nodeList) {
      checkLetterState(tile, index, nodeList, wordGuess);
    });
  });
}
