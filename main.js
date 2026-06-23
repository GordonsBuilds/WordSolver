const BOARD_SIZE = 4;

const builtInDictionary = [
  "able","about","above","acorn","act","active","actor","after","again","age","agent","ago","air","alert","alien","all","alone","along","alpha","also","amaze","amber","among","and","angle","animal","answer","apple","apply","arena","arm","art","aster","audio","auto","awake","aware","back","badge","balance","ball","bank","bar","base","basic","beach","beam","bear","beast","beauty","bed","before","begin","below","best","better","between","beyond","big","bird","blank","blend","blue","boat","bold","book","bonus","border","born","bottle","bottom","brain","brand","brave","bread","break","bridge","bright","bring","brother","build","bunch","burn","busy","cable","calm","camera","camp","can","canvas","cap","care","carry","case","catch","cause","cell","center","chain","chair","chalk","chance","change","chart","check","child","circle","city","claim","class","clean","clear","climb","close","cloud","color","combine","come","common","company","compare","complete","cool","corner","count","cover","craft","create","cross","crowd","curve","cycle","dark","data","day","deal","deep","define","delay","desert","design","detail","device","dinner","direct","dog","door","double","dream","drive","drop","earth","east","easy","edge","effect","effort","eight","either","element","elite","empty","end","energy","engine","enjoy","enter","equal","event","ever","every","exact","example","eye","face","fact","fair","family","fancy","fast","father","feel","field","figure","file","fill","final","find","fire","first","fit","flash","flow","focus","follow","food","force","forest","form","found","frame","friend","front","game","garden","gate","general","gentle","gift","glass","glow","goal","gold","good","grade","grain","grand","grass","great","green","grid","group","grow","guard","guide","hand","happy","hard","harbor","heart","heat","hello","help","hero","hidden","hill","hold","home","honest","hope","horse","hour","house","human","idea","image","impact","inside","iron","item","join","journey","joy","keep","key","kind","king","know","label","lake","large","later","layer","learn","leave","level","light","limit","line","link","list","local","logic","long","look","loop","lot","magic","main","make","many","map","mark","market","matter","mean","media","meet","metal","middle","mind","model","modern","moment","more","move","music","name","narrow","near","need","never","night","north","note","number","object","ocean","offer","open","order","other","outer","page","paint","panel","part","path","peace","people","phone","piece","place","plain","plan","plant","play","point","power","press","prime","print","proof","pulse","quick","quiet","race","range","rare","reach","read","ready","real","record","red","river","road","rock","room","round","safe","scale","scene","school","search","season","second","seed","sense","shape","share","shift","shine","ship","short","side","simple","skill","small","smart","smile","solid","sound","south","space","speed","spell","spirit","spot","spring","square","stand","start","stone","story","stream","strong","style","sun","sweet","table","team","text","thank","thin","thing","think","third","time","together","tone","tool","top","tower","track","trade","train","tree","true","turn","type","under","unit","upper","use","value","view","voice","walk","water","whole","wide","wind","window","word","work","world","write","yellow","young"
];

const boardEl = document.querySelector("#board");
const resultsEl = document.querySelector("#results");
const solveBtn = document.querySelector("#solve");
const fillSampleBtn = document.querySelector("#fill-sample");
const clearBtn = document.querySelector("#clear-board");
const dictionaryEl = document.querySelector("#dictionary");
const wordCountEl = document.querySelector("#word-count");
const tileCountEl = document.querySelector("#tile-count");
const showPathsEl = document.querySelector("#show-paths");

const sampleBoard = [
  "c","a","t","s",
  "l","i","n","e",
  "d","o","g","s",
  "w","o","r","d"
];

const size = BOARD_SIZE * BOARD_SIZE;
const inputs = [];

function focusFirstEmptyTile() {
  const firstEmpty = inputs.find((input) => input.value === "");
  (firstEmpty || inputs[0])?.focus();
}

function createBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < size; i += 1) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.autocomplete = "off";
    input.autocapitalize = "characters";
    input.autocorrect = "off";
    input.spellcheck = false;
    input.inputMode = "text";
    input.enterKeyHint = "next";
    input.setAttribute("aria-label", `Row ${Math.floor(i / BOARD_SIZE) + 1}, column ${(i % BOARD_SIZE) + 1}`);
    input.addEventListener("focus", () => {
      requestAnimationFrame(() => {
        input.select();
      });
    });
    input.addEventListener("pointerdown", () => {
      requestAnimationFrame(() => {
        input.focus();
        input.select();
      });
    });
    input.addEventListener("beforeinput", (event) => {
      if (event.inputType === "deleteContentBackward") {
        if (input.value === "" && i > 0) {
          event.preventDefault();
          const previous = inputs[i - 1];
          previous.value = "";
          previous.focus();
          previous.select();
        }
        return;
      }

      const text = event.data?.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase();
      if (!text) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      input.value = text;
      if (i < inputs.length - 1) {
        inputs[i + 1].focus();
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && input.value !== "") {
        input.value = "";
        event.preventDefault();
      }
    });
    boardEl.appendChild(input);
    inputs.push(input);
  }
}

function loadSampleBoard() {
  inputs.forEach((input, index) => {
    input.value = sampleBoard[index] ? sampleBoard[index].toUpperCase() : "";
  });
  focusFirstEmptyTile();
}

function clearBoard() {
  inputs.forEach((input) => {
    input.value = "";
  });
  resultsEl.innerHTML = '<p class="empty-state">No results yet. Enter letters and solve the board.</p>';
  wordCountEl.textContent = "0 words found";
  focusFirstEmptyTile();
}

function normalizeDictionary(rawText) {
  const words = rawText
    .split(/[\s,]+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => /^[a-z]+$/.test(word) && word.length >= 3);
  return [...new Set(words)];
}

function buildTrie(words) {
  const root = { children: new Map(), word: null };

  for (const word of words) {
    let node = root;
    for (const letter of word) {
      if (!node.children.has(letter)) {
        node.children.set(letter, { children: new Map(), word: null });
      }
      node = node.children.get(letter);
    }
    node.word = word;
  }

  return root;
}

function getBoardLetters() {
  return inputs.map((input) => input.value.trim().toLowerCase());
}

function getNeighbors(index) {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  const neighbors = [];

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        neighbors.push(r * BOARD_SIZE + c);
      }
    }
  }

  return neighbors;
}

function solveBoard(letters, trieRoot) {
  const results = new Map();
  const visited = new Array(size).fill(false);
  const neighbors = Array.from({ length: size }, (_, index) => getNeighbors(index));

  function dfs(index, trieNode, path) {
    const letter = letters[index];
    const nextNode = trieNode.children.get(letter);
    if (!nextNode) return;

    const nextPath = [...path, index];
    if (nextNode.word) {
      const existing = results.get(nextNode.word);
      if (!existing || existing.path.length > nextPath.length) {
        results.set(nextNode.word, { word: nextNode.word, path: nextPath.slice() });
      }
    }

    visited[index] = true;
    for (const neighbor of neighbors[index]) {
      if (!visited[neighbor] && letters[neighbor]) {
        dfs(neighbor, nextNode, nextPath);
      }
    }
    visited[index] = false;
  }

  for (let i = 0; i < size; i += 1) {
    if (letters[i]) {
      dfs(i, trieRoot, []);
    }
  }

  return [...results.values()].sort((a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word));
}

function renderResults(words) {
  if (!words.length) {
    resultsEl.innerHTML = '<p class="empty-state">No words found for the current board.</p>';
    wordCountEl.textContent = "0 words found";
    return;
  }

  wordCountEl.textContent = `${words.length} word${words.length === 1 ? "" : "s"} found`;
  resultsEl.innerHTML = "";

  for (const entry of words) {
    const item = document.createElement("article");
    item.className = "result-item";

    const header = document.createElement("div");
    header.className = "result-header";
    const word = document.createElement("h3");
    word.textContent = entry.word;
    const length = document.createElement("span");
    length.textContent = `${entry.word.length}`;
    header.append(word, length);

    item.appendChild(header);

    if (showPathsEl.checked) {
      const path = document.createElement("p");
      path.className = "path";
      path.textContent = entry.path.map((index) => `(${Math.floor(index / BOARD_SIZE) + 1},${(index % BOARD_SIZE) + 1})`).join(" -> ");
      item.appendChild(path);
    }

    resultsEl.appendChild(item);
  }
}

function solveCurrentBoard() {
  const letters = getBoardLetters();
  const dictionary = normalizeDictionary(dictionaryEl.value);
  const trie = buildTrie(dictionary);
  const words = solveBoard(letters, trie);
  renderResults(words);
}

createBoard();
dictionaryEl.value = builtInDictionary.join("\n");
tileCountEl.textContent = `${size} tiles`;

solveBtn.addEventListener("click", solveCurrentBoard);
fillSampleBtn.addEventListener("click", () => {
  loadSampleBoard();
  solveCurrentBoard();
});
clearBtn.addEventListener("click", clearBoard);
showPathsEl.addEventListener("change", solveCurrentBoard);
dictionaryEl.addEventListener("input", () => {
  if (resultsEl.querySelector(".result-item")) {
    solveCurrentBoard();
  }
});

loadSampleBoard();
solveCurrentBoard();
focusFirstEmptyTile();
