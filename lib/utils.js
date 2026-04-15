/**
 * Utility function(s) we want to be able to use this code in our application code
 */

// returns a random list/array item
export function getRandomListItem(list = []) {
  if (list.length > 0) {
    let randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }

  return;
}
