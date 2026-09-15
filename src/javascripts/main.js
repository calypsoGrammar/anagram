"use strict";

import { findExactAnagramSets } from "./anagram-search.js";

class AnagramSet{
  constructor(anagramWords, lettersRemaining) {
    this.anagramWords = anagramWords;
    this.lettersRemaining = lettersRemaining;
  }
}

class LetterCount{
  constructor(letter, count) {
    this.letter = letter;
    this.count = count;
  }
}

const dictionary = document.getElementById("dictionary");
dictionary.onchange = function(){
  ChangeDictionary(dictionary.value);
};

const activateButton = document.getElementById("activateButton");
activateButton.onclick = function(){
  GetAnagrams2();
};

const anagramText = document.getElementById("anagramText");
const resultDiv = document.getElementById("resultDiv");
const resultDiv2 = document.getElementById("resultDiv2");
const anagramSearchStatus = document.getElementById("anagramSearchStatus");

const filterWords = document.getElementById("filterWords");
filterWords.onkeyup = function(){
  FilterWords();
};
const wordLengths = document.getElementById("wordLengths");
wordLengths.onchange = function(){
  FilterWordsbyLength(wordLengths.value);
};
const filterSets = document.getElementById("filterSets");
filterSets.onkeyup = function(){
  FilterSets();
};
const setLengths = document.getElementById("setLengths");
setLengths.onchange = function(){
  FilterSetsbyLength(setLengths.value);
};

const searchButton = document.getElementById("searchButton");

let stringToAnagram = "";

let wordStore = [];
let variations = [];
let anagramSets = [];

let wOptions = [];
let sOptions = [];

let timeOut = undefined;

function ChangeDictionary(value)
{ 
  let path = "./1000.txt";

  if(value == 0) path = "./1000.txt";
  if(value == 1) path = "./10000.txt";
  if(value == 2) path = "./20000.txt";
  if(value == 3) path = "./english1.txt";
  if(value == 4) path = "./english2.txt";
  if(value == 5) path = "./allwords.txt";

  $.get(path, function (data)
  {
    wordStore = data.split("\n");
    for(let i = 0; i < wordStore.length; i++)
    {
      wordStore[i] = wordStore[i].replace("\n", "");
      wordStore[i] = wordStore[i].replace(" ", "");
      wordStore[i] = wordStore[i].replace(/\s/g, '');
    }
  });
}

async function PresentWords(array)
{
  resultDiv.innerHTML = "";
  
  wOptions.length = 0;
  
  for(let i = 0; i < array.length; i++)
  {
    let newDiv = document.createElement("DIV");
    newDiv.className = "wordDiv text-center";
    newDiv.id = "w" + i;
    newDiv.dataset.length = array[i].length;
    newDiv.innerHTML = array[i];
    resultDiv.appendChild(newDiv);
    
    if(!wOptions.includes(array[i].length)) wOptions.push(array[i].length);
  }
  
  while (wordLengths.options.length) {
    wordLengths.remove(0);
  }
  
  let opt1 = new Option("-");
  wordLengths.options.add(opt1);
  
  for(let i = 0; i < wOptions.length; i++)
  {
    let opt = new Option(wOptions[i]);
    wordLengths.options.add(opt);
  }
}

async function PresentWords2(array)
{
  resultDiv2.innerHTML = "";
  
  sOptions.length = 0;
  
  for(let i = 0; i < array.length; i++)
  {
    if(array[i].length == 0) continue;
    let newDiv = document.createElement("DIV");
    newDiv.className = "setDiv text-center";
    newDiv.id = "s" + i;
    newDiv.dataset.length = array[i].length;
    for(let c = 0; c < array[i].length; c++)
    {
      newDiv.innerHTML += array[i][c] + ', ';
    }
    resultDiv2.appendChild(newDiv);
    
    if(!sOptions.includes(array[i].length)) sOptions.push(array[i].length);
  }
  
  while (setLengths.options.length) {
    setLengths.remove(0);
  }
  
  let opt1 = new Option("-");
  setLengths.options.add(opt1);
  
  for(let i = 0; i < sOptions.length; i++)
  {
    let opt = new Option(sOptions[i]);
    setLengths.options.add(opt);
  }
}

async function GetAnagrams2()
{
  stringToAnagram = anagramText.value;
  stringToAnagram = stringToAnagram.trim();
  let sLength = stringToAnagram.length;
  
  if(sLength == 0) return;
  if(wordStore.length == 0) return;
  
  variations = [];
  
  let anagramLetterCount = [];
  
  for(let i = 0; i < sLength; i++)
  {
    let isLogged = false;
    for(let v = 0; v < anagramLetterCount.length; v++)
    {
      if(anagramLetterCount[v].letter == stringToAnagram[i])
      {
        anagramLetterCount[v].count++;
        isLogged = true;
      }
    }
    if(isLogged === false)
    {
      let newLog = new LetterCount();
      newLog.letter = stringToAnagram[i];
      newLog.count = 1;
      anagramLetterCount.push(newLog);
    }
  }
 
  for(let i = 0; i < wordStore.length; i++)
  {
    // if word is longer than anagram can't be allowed
    if(wordStore[i].length > sLength) continue;
    
    let checkInWord = true;
    
    let uniqueLetters = [];
    
    for(let c = 0; c < wordStore[i].length; c++)
    {
      // check that there are no words outside the target string
      if(!stringToAnagram.includes(wordStore[i][c]))
      {
        checkInWord = false;
        continue;
      }
      // count the unique letters in the word to check once completed
      let isLogged = false;
      for(let v = 0; v < uniqueLetters.length; v++)
      {
        if(uniqueLetters[v].letter == wordStore[i][c])
        {
          uniqueLetters[v].count++;
          isLogged = true;
        }
      }
      if(isLogged === false)
      {
        let newLog = new LetterCount();
        newLog.letter = wordStore[i][c];
        newLog.count = 1;
        uniqueLetters.push(newLog);
      }
    }
    
    // check that word doesn't contain more unique letters than anagram
    for(let v = 0; v < uniqueLetters.length; v++)
    {
      for(let c = 0; c < anagramLetterCount.length; c++)
      {
        if(uniqueLetters[v].letter === anagramLetterCount[c].letter)
        {
          // have to have the same number of each letter
          if(uniqueLetters[v].count > anagramLetterCount[c].count) checkInWord = false;
        }
      }
    }
    
    if(checkInWord == false) continue;
    
    variations.push(wordStore[i]);
  }
  
  variations.sort(function(a, b){
  // ASC  -> a.length - b.length
  // DESC -> b.length - a.length
  return b.length - a.length;
  });
  
  variations = variations.map(JSON.stringify).reverse() // convert to JSON string the array content, then reverse it (to check from end to begining)
  .filter(function(item, index, variations){ return variations.indexOf(item, index + 1) === -1; }) // check if there is any occurence of the item in whole array
  .reverse().map(JSON.parse) // revert it to original state
  
  PresentWords(variations);
  FilterAnagrams();
}

async function FilterAnagrams()
{
  anagramSets.length = 0;
  anagramSearchStatus.textContent = "";
  if(variations.length == 0) {
    PresentWords2(anagramSets);
    return;
  }

  const result = findExactAnagramSets(stringToAnagram, variations);
  anagramSets = result.sets;
  if(result.truncated) {
    anagramSearchStatus.textContent = `Showing the first ${anagramSets.length} exact sets after searching ${result.visitedNodes.toLocaleString()} nodes. Refine the input to see more.`;
  }

  PresentWords2(anagramSets);
}

function FilterWords()
{	
  let input, filter, a, i;
  input = document.getElementById('filterWords');
  filter = input.value.toUpperCase();
  let allDiv = document.getElementsByClassName('wordDiv');
  allDiv = Array.prototype.slice.call(allDiv, 0);
  for (i = 0; i < allDiv.length; i++)
  {
    a = allDiv[i].innerHTML;
    if (a.toUpperCase().indexOf(filter) > -1)
    {
      allDiv[i].style.display = "";
    }
    else
    {
      allDiv[i].style.display = "none";
    }
  }
  wordLengths.options.selectedIndex = 0;
}

function FilterSets()
{
	let input, filter, a, i;
  input = document.getElementById('filterSets');
  filter = input.value.toUpperCase();
  let allDiv = document.getElementsByClassName('setDiv');
  allDiv = Array.prototype.slice.call(allDiv, 0);
  for (i = 0; i < allDiv.length; i++)
  {
    a = allDiv[i].innerHTML;
    if (a.toUpperCase().indexOf(filter) > -1)
    {
      allDiv[i].style.display = "";
    }
    else
    {
      allDiv[i].style.display = "none";
    }
  }
  setLengths.options.selectedIndex = 0;
}

function FilterWordsbyLength(value)
{
  let len, i;
  let allDiv = document.getElementsByClassName('wordDiv');
  allDiv = Array.prototype.slice.call(allDiv, 0);
  for (i = 0; i < allDiv.length; i++)
  {
    if(value === "-")
    {
      allDiv[i].style.display = "";
      continue;
    }
    len = allDiv[i].dataset.length;
    if(len === value)
    {
      allDiv[i].style.display = "";
    }
    else
    {
      allDiv[i].style.display = "none";
    }
  }
  filterWords.value = "";
}

function FilterSetsbyLength(value)
{
  let len, i;
  let allDiv = document.getElementsByClassName('setDiv');
  allDiv = Array.prototype.slice.call(allDiv, 0);
  for (i = 0; i < allDiv.length; i++)
  {
    if(value === "-")
    {
      allDiv[i].style.display = "";
      continue;
    }
    len = allDiv[i].dataset.length;
    if(len === value)
    {
      allDiv[i].style.display = "";
    } 
    else
    {
      allDiv[i].style.display = "none";
    }
  }
  filterSets.value = "";
}

anagramText.onkeydown = function(event)
{
  if(event.keyCode == 13 || event.which == 13)
  {
    GetAnagrams2();
  }
};

document.addEventListener("DOMContentLoaded", ChangeDictionary(0));
