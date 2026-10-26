"use strict";

const dictionary = document.getElementById("dictionary");
dictionary.onchange = function(){
  ChangeDictionary(dictionary.value);
};

const activateButton = document.getElementById("activateButton");
activateButton.onclick = function(){
  GetAnagrams2();
};

const cancelButton = document.getElementById("cancelButton");
cancelButton.onclick = function(){
  CancelSearch();
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

let worker = undefined;
let requestId = 0;
let dictionaryReady = false;
let searching = false;
let lastDictionaryPath = "./1000.txt";

function StartWorker()
{
  if(worker) worker.terminate();
  worker = new Worker(new URL("./anagram-worker.js", import.meta.url), { type: "module" });
  worker.onmessage = HandleWorkerMessage;
  worker.onerror = function(){ FinishSearch("The search worker failed."); };
}

function SetSearching(value)
{
  searching = value;
  cancelButton.hidden = !value;
  activateButton.disabled = value;
}

function FinishSearch(message)
{
  SetSearching(false);
  anagramSearchStatus.textContent = message;
}

function HandleWorkerMessage({ data })
{
  if(data.id !== requestId) return;

  if(data.type == "loaded")
  {
    dictionaryReady = true;
    anagramSearchStatus.textContent = "";
  }
  else if(data.type == "words")
  {
    variations = data.words;
    PresentWords(variations);
    anagramSearchStatus.textContent = `Found ${variations.length.toLocaleString()} words. Searching for exact sets...`;
  }
  else if(data.type == "progress")
  {
    anagramSearchStatus.textContent = `Searching for exact sets: ${data.visitedNodes.toLocaleString()} of ${data.maxNodes.toLocaleString()} nodes, ${data.sets.toLocaleString()} sets so far...`;
  }
  else if(data.type == "sets")
  {
    anagramSets = data.sets;
    let message = "";
    if(data.truncated)
    {
      const reason = data.timedOut ? "hit the time limit" : "reached the search limit";
      message = `Showing the first ${anagramSets.length} exact sets; the search ${reason} after ${data.visitedNodes.toLocaleString()} nodes. Refine the input to see more.`;
    }
    PresentWords2(anagramSets);
    FinishSearch(message);
  }
  else if(data.type == "error")
  {
    FinishSearch(`Search failed: ${data.message}`);
  }
}

function CancelSearch()
{
  if(!searching) return;
  // Terminating the worker is the only way to interrupt synchronous work.
  requestId++;
  StartWorker();
  dictionaryReady = false;
  worker.postMessage({ type: "load", path: new URL(lastDictionaryPath, document.baseURI).href, id: requestId });
  FinishSearch("Search cancelled.");
}

function ChangeDictionary(value)
{ 
  let path = "./1000.txt";

  if(value == 0) path = "./1000.txt";
  if(value == 1) path = "./10000.txt";
  if(value == 2) path = "./20000.txt";
  if(value == 3) path = "./english1.txt";
  if(value == 4) path = "./english2.txt";
  if(value == 5) path = "./allwords.txt";

  lastDictionaryPath = path;
  dictionaryReady = false;
  SetSearching(false);
  requestId++;
  StartWorker();
  anagramSearchStatus.textContent = "Loading dictionary...";
  worker.postMessage({ type: "load", path: new URL(path, document.baseURI).href, id: requestId });
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

function GetAnagrams2()
{
  stringToAnagram = anagramText.value.trim();

  if(stringToAnagram.length == 0) return;
  if(!dictionaryReady || searching) return;

  variations = [];
  anagramSets = [];
  SetSearching(true);
  anagramSearchStatus.textContent = "Searching...";
  worker.postMessage({ type: "search", target: stringToAnagram, id: requestId });
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

document.addEventListener("DOMContentLoaded", function(){ ChangeDictionary(0); });
