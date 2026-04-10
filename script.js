import { getRandomListItem } from './lib/utils.js';

console.clear();

let dictionary, gameWords, targetWord;
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
      // Assign a random targetWord from our data
      targetWord = getRandomListItem(gameWords);
      console.log(`Solution: ${targetWord}`);
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
  keyboard.addEventListener('click', clickHandler);
  document.addEventListener('keyup', keypressHandler);
}

function endGame() {
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

  if (tilesWithLetters.length === targetWord.length) {
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

  if (wordGuess.length !== targetWord.length) {
    return alert('Your guess must be 5 letters long!');
  }
  if (!dictionary.includes(wordGuess)) {
    return alert('Your guess is not a valid 5 letter word in the English Dictionary! Try again...');
  }

  // check the state of each letter against the targetWord
  tilesWithLetters.forEach(function(tile, index, nodeList) {
    checkLetterState(tile, index, nodeList, wordGuess)
  })
}


function checkLetterState(tile, index, tilesWithLetter, wordGuess) {
  let currentLetter = tile.dataset.letter;
  let virtualKey = keyboard.querySelector(`button[data-key="${currentLetter}"]`);
  let newState = '';

  if (targetWord[index] === currentLetter) {
    newState = 'correct';
  } else if (targetWord.includes(currentLetter)) {
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
  if (wordGuess === targetWord) {
    setTimeout(function() {
      alert(`You WON! The correct solution was : ${targetWord}`);
    }, 200);

    return endGame();
  }

  let remainingEmptyTiles = gameboard.querySelectorAll('div.tile:not([data-state])');
  if (remainingEmptyTiles.length === 0) {
    setTimeout(function() {
      alert(`You LOST! The correct solution was : ${targetWord}`);
    }, 200);

    return endGame();
  }
}