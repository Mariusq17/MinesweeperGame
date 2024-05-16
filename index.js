// Variabile DOM
const tilesContainer = document.getElementById("tilesContainer");
const selectDifficulty = document.getElementsByClassName("selectDifficulty");
const selectNewGame = document.getElementsByClassName("selectNewGame")[0];
const restartCurrentGameBtn = document.getElementById("restartCurrentGame");

const selectDifficultyCustomMenu = document.getElementById(
  "selectDifficultyCustomMenu"
);
const selectDifficultyCustomMenuCloseBtn =
  selectDifficultyCustomMenu.querySelector("#closeMenu");
const selectDifficultyCustomBtn = document.getElementById(
  "selectDifficultyCustom"
);
const selectOptionsOfCustomGameBtn = document.getElementById(
  "selectOptionsOfCustomGame"
);
const inputSelectionGroup = document.querySelectorAll("input");

// Variabile auxiliare
let difficultyLevel, numberOfColumns, numberOfRows, numberOfBombs;
let rowsInput, colsInput, bombsInput;
let levelSelected, timeSpend;
let gameStarted, gameLost; //tine loc de bool
let numberOfTilesShowed, numberOfBombsInitial;

let bombMatrix = [],
  auxX,
  auxY; // matricea de bombe, vecini si casute goale

let flagPositions = [],
  bombPositions = [];

//Interval de timp:
let timer, numberOfClicks;

//Apelare functii:
InitialUpdate();

// DOM events
//Nivele de dificultate meniu:
for (let i = 0; i < selectDifficulty.length; i++) {
  const div = selectDifficulty[i];
  div.addEventListener("click", () => {
    if (
      !div.classList.contains("selectDifficultyCustom") &&
      !selectDifficultyCustomMenu.classList.contains("show")
    ) {
      //Ultima marca:
      let mark = selectDifficulty[levelSelected].querySelector(".mark");
      mark.innerHTML = "";

      //Marca curenta
      levelSelected = difficultyLevel = i;
      mark = div.querySelector(".mark");
      mark.innerHTML = `<i class="fa-solid fa-check"></i>`;

      updateTilesByDiff(difficultyLevel);
    }
    clearInterval(timer);
  });
}

selectDifficultyCustomBtn.addEventListener("click", () => {
  selectDifficultyCustomMenu.classList.add("show");
});
selectDifficultyCustomMenuCloseBtn.addEventListener("click", () => {
  selectDifficultyCustomMenu.classList.remove("show");
  if (gameStarted) {
    timer = setInterval(function () {
      updateTimer(timeSpend);
    }, 1000);
  }
});

for (let i = 0; i < inputSelectionGroup.length; i++) {
  const input = inputSelectionGroup[i];
  input.addEventListener("focusout", () => {
    let inputValue = parseInt(input.value);
    inputValue = Math.min(inputValue, input.max);
    inputValue = Math.max(inputValue, input.min);
    input.value = inputValue;

    const rowsInput = parseInt(document.getElementById("rowsInput").value);
    const colsInput = parseInt(document.getElementById("columnsInput").value);
    if (!isNaN(rowsInput) && !isNaN(colsInput)) {
      document
        .getElementById("bombsInput")
        .setAttribute(
          "min",
          Math.max(parseInt(rowsInput * colsInput * (5 / 100)), 1)
        );
      document
        .getElementById("bombsInput")
        .setAttribute("max", parseInt(rowsInput * colsInput * (80 / 100)));

      document.getElementById("bombRange").innerText = `Range: ${
        document.getElementById("bombsInput").min
      } - ${document.getElementById("bombsInput").max}`;

      let inputValue = parseInt(document.getElementById("bombsInput").value);
      inputValue = Math.min(
        inputValue,
        document.getElementById("bombsInput").max
      );
      inputValue = Math.max(
        inputValue,
        document.getElementById("bombsInput").min
      );
      document.getElementById("bombsInput").value = inputValue;
    }

    console.log(
      document.getElementById("bombsInput").max +
        " " +
        document.getElementById("bombsInput").min
    );
  });
}

selectOptionsOfCustomGameBtn.addEventListener("click", () => {
  rowsInput = parseInt(document.getElementById("rowsInput").value);
  colsInput = parseInt(document.getElementById("columnsInput").value);
  bombsInput = parseInt(document.getElementById("bombsInput").value);
  if (isNaN(rowsInput) || isNaN(colsInput) || isNaN(bombsInput)) {
    selectDifficultyCustomMenu.querySelector(".errorMsg").classList.add("show");
    return;
  }

  // Daca valorile introduse sunt valide se face generarea custom a tablei de joc
  selectDifficultyCustomMenu
    .querySelector(".errorMsg")
    .classList.remove("show");

  // Actualizarea meniului
  //Ultima marca:
  let mark = selectDifficulty[levelSelected].querySelector(".mark");
  mark.innerHTML = "";

  //Marca curenta
  levelSelected = difficultyLevel = 3;
  mark = selectDifficulty[selectDifficulty.length - 1].querySelector(".mark");
  mark.innerHTML = `<i class="fa-solid fa-check"></i>`;

  //Actualizarea tablei
  updateTilesByDiff(difficultyLevel);

  for (let i = 0; i < inputSelectionGroup.length; i++) {
    const input = inputSelectionGroup[i];
    input.value = "";
  }
  selectDifficultyCustomMenu.classList.remove("show");
});

selectNewGame.addEventListener("click", () => {
  if (!selectDifficultyCustomMenu.classList.contains("show"))
    updateTilesByDiff(difficultyLevel);
});

restartCurrentGameBtn.addEventListener("click", () => {
  restartCurrentGameBtn.classList.remove("gameWon");
  restartCurrentGameBtn.classList.remove("gameLost");

  if (!selectDifficultyCustomMenu.classList.contains("show"))
    updateTilesByDiff(difficultyLevel);
});
// Functii:

//generarea patratelelor in pozitia initiala:
function createTile() {
  const tile = document.createElement("div");
  tile.classList.add("border");
  tile.classList.add("tile");

  // Adaugarea eventului de right-click pentru stegulete
  tile.addEventListener("contextmenu", (e) => {
    numberOfClicks++;
    e.preventDefault();

    if (gameLost) return;

    gameStarted = true;
    if (gameStarted && numberOfClicks == 1) {
      //Generarea bombelor in functie de patratelul pe care am apasat initial:
      //astfel incat sa nu se poata apasa niciodata din prima pe bomba
      bombGeneration(numberOfRows, numberOfColumns, numberOfBombs);

      //contorizarea vecinilor cu bombe
      bombCounting(bombMatrix);

      //+ de adaugat contorizarea bombelor si actualizarea astfel incat sa
      // fie sigur ca nu incepe cu bomba
      timer = setInterval(function () {
        updateTimer(timeSpend);
      }, 1000);
    }

    let x, y;
    x = parseInt(tile.getAttribute("poz-x"));
    y = parseInt(tile.getAttribute("poz-y"));

    // Adaugarea steguletelor doar daca patartelelor sunt in stadiul
    // de default si daca mai sunt bombe disponibile nemarcate
    if (tile.classList.contains("default")) {
      if (!tile.classList.contains("addFlag") && numberOfBombs > 0) {
        tile.classList.add("addFlag");
        numberOfBombs--;

        //Adauga pozitia steguletului in vector
        flagPositions.push([x, y]);
      } else if (tile.classList.contains("addFlag")) {
        tile.classList.remove("addFlag");
        numberOfBombs++;

        //Sterge pozitia steguletului din vector
        flagPositions.splice(
          flagPositions.findIndex(function (arrayOfPosition) {
            return arrayOfPosition[0] == x && arrayOfPosition[1] == y;
          }),
          1
        );
      }
    }
    updateBombDisplay(numberOfBombs);

    if (numberOfBombs == 0) {
      //Verific daca s-au marcat toate bombele

      for (let i = 0; i < flagPositions.length; i++)
        if (bombMatrix[flagPositions[i][0]][flagPositions[i][1]] != 100) return;

      //Daca s-au marcat toate, dau gameOver de win
      // alert("Felicitari! Ai castigat jocul!");
      // gameOverWin();
    }
  });
  // Adaugarea eventului de click pentru celelalte statements
  tile.addEventListener("click", () => {
    if (gameLost) return;
    numberOfClicks++;
    gameStarted = true;
    if (gameStarted && numberOfClicks == 1) {
      //Generarea bombelor in functie de patratelul pe care am apasat initial:
      //astfel incat sa nu se poata apasa niciodata din prima pe bomba
      bombGeneration(numberOfRows, numberOfColumns, numberOfBombs);

      let x, y;
      x = parseInt(tile.getAttribute("poz-x"));
      y = parseInt(tile.getAttribute("poz-y"));

      //verificarea primului patratel si contorizarea cu nr de vecini bombe
      if (bombMatrix[x][y] == 100) {
        //in cazul in care utilizatorul a apasat prima data pe o bomba, mut bomba
        //pe pozitiile auxX si auxY salvate anterior in urma generarii
        bombMatrix[x][y] = 0;
        bombMatrix[auxX][auxY] = 100;
        bombPositions.push([auxX, auxY]);
      }
      //contorizarea vecinilor cu bombe
      bombCounting(bombMatrix);

      //pornirea cronometrului
      timer = setInterval(function () {
        updateTimer(timeSpend);
      }, 1000);
    }

    //actualizarea vizuala a casutelor
    if (
      tile.classList.contains("addFlag") ||
      !tile.classList.contains("default") ||
      !tile.classList.contains("border")
    )
      return;
    let x, y;
    x = parseInt(tile.getAttribute("poz-x"));
    y = parseInt(tile.getAttribute("poz-y"));

    if (bombMatrix[x][y] == 100 && tile.classList.contains("border")) {
      gameOverLost(x, y);
      return;
    }

    if (bombMatrix[x][y] != 0) {
      showTile(
        x,
        y,
        `url("./assets/images/imageDesign2/bombAndNumbers/${bombMatrix[x][y]}.png")`
      );
      numberOfTilesShowed++;
      bombMatrix[x][y] = -bombMatrix[x][y];
    } else fillBlankTiles(x, y);

    //gameOver verification
    if (
      numberOfTilesShowed ==
      numberOfColumns * numberOfRows - numberOfBombsInitial
    ) {
      console.log(numberOfTilesShowed);

      gameOverWin();
      return;
    }
  });

  tile.addEventListener("dblclick", (e) => {
    let x, y;
    x = parseInt(tile.getAttribute("poz-x"));
    y = parseInt(tile.getAttribute("poz-y"));

    if (-bombMatrix[x][y] < 0 || tile.classList.contains("addFlag")) {
      console.log("invalid");
      return;
    }

    const dx = [-1, -1, -1, 0, 0, 1, 1, 1];
    const dy = [-1, 0, 1, -1, 1, -1, 0, 1];

    let cntFlags, k;
    cntFlags = 0;

    for (k = 0; k < 8; k++)
      if (!isOutOfBorder(x + dx[k], y + dy[k], numberOfRows, numberOfColumns)) {
        let currentTile = document.querySelector(
          `[poz-x="${x + dx[k]}"][poz-y="${y + dy[k]}"]`
        );
        if (currentTile.classList.contains("addFlag")) cntFlags++;
      }
    //In cazul in care nu sunt suficiente steaguri marcate
    if (cntFlags != -bombMatrix[x][y]) return;

    // Prima data fac verificarea de steaguri puse gresit
    for (k = 0; k < 8; k++)
      if (!isOutOfBorder(x + dx[k], y + dy[k], numberOfRows, numberOfColumns)) {
        let currentTile = document.querySelector(
          `[poz-x="${x + dx[k]}"][poz-y="${y + dy[k]}"]`
        );
        if (
          currentTile.classList.contains("default") &&
          !currentTile.classList.contains("addFlag")
        ) {
          if (bombMatrix[x + dx[k]][y + dy[k]] == 100) {
            // gameOver
            gameOverLost(x + dx[k], y + dy[k]);
            return;
          }
        }
      }

    //Daca steagurile au fost puse bine, pot sa afisez casutele vecine
    for (k = 0; k < 8; k++)
      if (!isOutOfBorder(x + dx[k], y + dy[k], numberOfRows, numberOfColumns)) {
        let currentTile = document.querySelector(
          `[poz-x="${x + dx[k]}"][poz-y="${y + dy[k]}"]`
        );
        if (
          currentTile.classList.contains("default") &&
          !currentTile.classList.contains("addFlag")
        ) {
          if (bombMatrix[x + dx[k]][y + dy[k]] == 0) {
            //Aceasta este casuta goala, asa ca voi face fill din
            //pozitia aceasta.
            fillBlankTiles(x + dx[k], y + dy[k]);
          } else {
            //Afisez casuta
            showTile(
              x + dx[k],
              y + dy[k],
              `url("./assets/images/imageDesign2/bombAndNumbers/${
                bombMatrix[x + dx[k]][y + dy[k]]
              }.png")`
            );
            //O marchez cu valoarea sa negativa, pentru o urmatoare
            //verificare (double click).
            bombMatrix[x + dx[k]][y + dy[k]] =
              -bombMatrix[x + dx[k]][y + dy[k]];

            //Cresc numarul de casute afisate
            numberOfTilesShowed++;
          }
          //gameOver verification
          if (
            numberOfTilesShowed ==
            numberOfColumns * numberOfRows - numberOfBombsInitial
          ) {
            console.log(numberOfTilesShowed);

            gameOverWin();
            return;
          }
        }
      }
  });

  return tile;
}

function gameOverWin() {
  //Marcheaza toate patratele ramase cu steaguri
  for (let i = 0; i < bombPositions.length; i++) {
    let x, y;
    x = parseInt(bombPositions[i][0]);
    y = parseInt(bombPositions[i][1]);

    const tile = tilesContainer.querySelector(
      `[poz-x = "${x}"][poz-y = "${y}"]`
    );
    // Adaugarea steguletelor doar daca patartelelor sunt in stadiul
    // de default si daca mai sunt bombe disponibile nemarcate
    if (tile.classList.contains("default")) {
      if (!tile.classList.contains("addFlag") && numberOfBombs > 0) {
        tile.classList.add("addFlag");
        numberOfBombs--;
      }
    }
  }
  updateBombDisplay(numberOfBombs);
  //.timerContainer .SmileyFace
  restartCurrentGameBtn.classList.add("gameWon");

  alert("Felicitari ai castigat!");
  clearInterval(timer);
}

function gameOverLost(x, y) {
  gameLost = true;
  //Afiseaza bomba explodata
  const bomb = tilesContainer.querySelector(`[poz-x = "${x}"][poz-y = "${y}"]`);
  bomb.classList.add("bombExploded");

  //Sterge pozitia bombei din vector
  bombPositions.splice(
    bombPositions.findIndex(function (arrayOfPosition) {
      return arrayOfPosition[0] == x && arrayOfPosition[1] == y;
    }),
    1
  );

  //Afisarea tuturor bombelor ramase nedescoperite
  for (let i = 0; i < bombPositions.length; i++) {
    let x, y;
    x = parseInt(bombPositions[i][0]);
    y = parseInt(bombPositions[i][1]);

    const tile = tilesContainer.querySelector(
      `[poz-x = "${x}"][poz-y = "${y}"]`
    );
    if (tile.classList.contains("default")) {
      if (!tile.classList.contains("addFlag") && numberOfBombs > 0) {
        tile.classList.add("bomb");
      }
    }
  }

  //Afisarea steagurilor amplasate gresit
  for (let i = 0; i < flagPositions.length; i++) {
    let x, y;
    x = parseInt(flagPositions[i][0]);
    y = parseInt(flagPositions[i][1]);

    const tile = tilesContainer.querySelector(
      `[poz-x = "${x}"][poz-y = "${y}"]`
    );

    if (tile.classList.contains("addFlag") && bombMatrix[x][y] != 100) {
      tile.classList.remove("addFlag");
      tile.classList.add("addRedFlag");
    }
  }

  //Afisare SmileyFace Mort
  restartCurrentGameBtn.classList.add("gameLost");

  //Oprirea timerului
  clearInterval(timer);

  //Marcarea jocului ca fiind oprit
  gameStarted = false;
}

function updateTimer(timeSpendNow) {
  //OMG timeSpend era local pana acum
  timeSpend++; //timeSpend Global
  timeSpendNow = timeSpendNow % 1000;
  let copie = timeSpendNow,
    nrOfDigits = 0,
    imageDigit;
  if (timeSpendNow == 0) {
    while (nrOfDigits <= 3) {
      nrOfDigits++;
      if (nrOfDigits <= 3) {
        imageDigit = document.querySelector(`[data-timer-${nrOfDigits}]`);
        imageDigit.setAttribute(
          "src",
          `./assets/images/imageDesign2/timerDigits/0.png`
        );
      }
    }
    return;
  }
  while (copie > 0) {
    nrOfDigits++;
    imageDigit = document.querySelector(`[data-timer-${nrOfDigits}]`);
    imageDigit.setAttribute(
      "src",
      `./assets/images/imageDesign2/timerDigits/${copie % 10}.png`
    );
    copie = parseInt(copie / 10); //OMG parseInt()
  }
  while (nrOfDigits <= 3) {
    nrOfDigits++;
    if (nrOfDigits <= 3) {
      imageDigit = document.querySelector(`[data-timer-${nrOfDigits}]`);
      imageDigit.setAttribute(
        "src",
        `./assets/images/imageDesign2/timerDigits/0.png`
      );
    }
  }
}

function updateBombDisplay(numberOfBombsNow) {
  numberOfBombsNow = numberOfBombsNow % 1000;
  let copie = numberOfBombsNow,
    nrOfDigits = 0,
    imageDigit;
  if (numberOfBombsNow == 0) {
    while (nrOfDigits <= 3) {
      nrOfDigits++;
      if (nrOfDigits <= 3) {
        imageDigit = document.querySelector(`[data-bombs-${nrOfDigits}]`);
        imageDigit.setAttribute(
          "src",
          `./assets/images/imageDesign2/timerDigits/0.png`
        );
      }
    }
    return;
  }
  while (copie > 0) {
    nrOfDigits++;
    imageDigit = document.querySelector(`[data-bombs-${nrOfDigits}]`);
    imageDigit.setAttribute(
      "src",
      `./assets/images/imageDesign2/timerDigits/${copie % 10}.png`
    );
    copie = parseInt(copie / 10); //OMG parseInt()
  }
  while (nrOfDigits <= 3) {
    nrOfDigits++;
    if (nrOfDigits <= 3) {
      imageDigit = document.querySelector(`[data-bombs-${nrOfDigits}]`);
      imageDigit.setAttribute(
        "src",
        `./assets/images/imageDesign2/timerDigits/0.png`
      );
    }
  }
}

function tilesContainerInit(numberOfColumns, numberOfRows) {
  //Golirea containerului de butoane
  tilesContainer.innerHTML = "";
  for (let i = 0; i < numberOfRows; i++)
    for (let j = 0; j < numberOfColumns; j++) {
      const div = new createTile();
      div.classList.add("default");
      div.setAttribute("poz-x", i);
      div.setAttribute("poz-y", j);
      tilesContainer.appendChild(div);
    }
  tilesContainer.style.gridTemplateColumns =
    "repeat(" +
    numberOfColumns +
    ", calc(var(--tile-scale) * var(--icon-size)))";
  tilesContainer.style.gridTemplateRows =
    "repeat(" + numberOfRows + ", calc(var(--tile-scale) * var(--icon-size)))";
  document.documentElement.style.setProperty(
    "--tilesContainer-width",
    "calc( var(--tile-scale) * " +
      numberOfColumns +
      " * var(--icon-size) + 2 * var(--padding) + 2 * var(--border-width))"
  );
}
function updateTilesByDiff(difficultyLevel) {
  switch (difficultyLevel) {
    case 0: {
      numberOfColumns = numberOfRows = 9;
      numberOfBombs = numberOfBombsInitial = 10;
      break;
    }
    case 1: {
      numberOfColumns = numberOfRows = 16;
      numberOfBombs = numberOfBombsInitial = 40;
      break;
    }
    case 2: {
      numberOfColumns = 30;
      numberOfRows = 16;
      numberOfBombs = numberOfBombsInitial = 99;
      break;
    }
    default:
      numberOfColumns = colsInput;
      numberOfRows = rowsInput;
      numberOfBombs = numberOfBombsInitial = bombsInput;
      break;
  }

  timeSpend = 0;
  numberOfClicks = 0;
  numberOfTilesShowed = 0;
  gameStarted = false;
  gameLost = false;

  while (flagPositions.length > 0) flagPositions.pop();

  while (bombPositions.length > 0) bombPositions.pop();

  tilesContainerInit(numberOfColumns, numberOfRows);

  updateBombDisplay(numberOfBombs);

  if (timer != undefined) clearInterval(timer);
  updateTimer(timeSpend);

  restartCurrentGameBtn.classList.remove("gameWon");
  restartCurrentGameBtn.classList.remove("gameLost");
}
function bombGeneration(numberOfRows, numberOfColumns, numberOfBombs) {
  let a = [],
    b = []; // vectori auxiliari pentru suffle
  let i, j, x, bombCellRaport;
  bombCellRaport = numberOfBombs / (numberOfRows * numberOfColumns); //raport < 1

  //reinitializarea matricei si pregatirea celor 2 vectori a, b
  while (bombMatrix.length > 0) bombMatrix.pop();
  for (i = 0; i < numberOfRows; i++) {
    bombMatrix.push([]);
    for (j = 0; j < numberOfColumns; j++) {
      bombMatrix[i].push(0);
      x = Math.random();
      if (x <= bombCellRaport) a.push([x, i, j]);
      else b.push([x, i, j]);
    }
  }

  //Plasarea bombelor in matrice
  if (numberOfBombs > a.length) {
    for (i = 0; i < a.length; i++) {
      //pozitiilor din vectorul a le vor corespunde bombe in matrice
      bombMatrix[a[i][1]][a[i][2]] = 100;
      bombPositions.push([a[i][1], a[i][2]]);
    }
    //sortez in ordine crescatoare vectorul b si adaug
    //pe primele numberOfBombs - a.length pozitii bombe in matrice
    b.sort((a, b) => a[0] - b[0]);
    for (i = 0; i < b.length && i < numberOfBombs - a.length; i++) {
      bombMatrix[b[i][1]][b[i][2]] = 100;
      bombPositions.push([b[i][1], b[i][2]]);
    }

    // auxX si auxY vor fi folosite in cazul in care utilizatorul a
    // apasat prima data pe o bomba (urmand sa schimb bomba pe pozitia asta)
    auxX = b[b.length - 1][1];
    auxY = b[b.length - 1][2];
  } else {
    //sortez aleator vectorul a si iau primele numberOfBombs pozitii si le marchez
    //pentru o distributie mai uniforma a bombelor
    //algoritm de sortare aleatorie Fisher-Yates
    a = shuffleArray(a);
    for (i = 0; i < a.length && i < numberOfBombs; i++) {
      bombMatrix[a[i][1]][a[i][2]] = 100;
      bombPositions.push([a[i][1], a[i][2]]);
    }

    // auxX si auxY vor fi folosite in cazul in care utilizatorul a
    // apasat prima data pe o bomba (urmand sa schimb bomba pe pozitia asta)
    if (a.length > numberOfBombs) {
      auxX = a[a.length - 1][1];
      auxY = a[a.length - 1][2];
    } else {
      auxX = b[b.length - 1][1];
      auxY = b[b.length - 1][2];
    }
  }
}

function shuffleArray(array) {
  //shuffle Fisher-Yates
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function bombCounting(bombMatrix) {
  const dx = [-1, -1, -1, 0, 0, 1, 1, 1];
  const dy = [-1, 0, 1, -1, 1, -1, 0, 1];
  let i, j, k;
  for (i = 0; i < bombMatrix.length; i++)
    for (j = 0; j < bombMatrix[i].length; j++) {
      if (bombMatrix[i][j] != 100)
        for (k = 0; k < 8; k++)
          if (
            !isOutOfBorder(
              i + dx[k],
              j + dy[k],
              numberOfRows,
              numberOfColumns
            ) &&
            bombMatrix[i + dx[k]][j + dy[k]] == 100
          )
            bombMatrix[i][j] += 1;
    }
}

function showTile(x, y, imageSource) {
  let tile = document.querySelector(`[poz-x="${x}"][poz-y="${y}"]`);
  tile.classList.remove("default");
  tile.classList.remove("border");

  if (tile.classList.contains("addFlag")) {
    tile.classList.remove("addFlag");
    numberOfBombs++;
    updateBombDisplay(numberOfBombs);
  }

  tile.style.backgroundImage = imageSource;
}

function showAllTiles() {
  let i, j;
  for (i = 0; i < numberOfRows; i++)
    for (j = 0; j < numberOfColumns; j++) {
      if (bombMatrix[i][j] == 10)
        showTile(i, j, `url("./assets/images/imageDesign2/tile/Default.png")`);
      else if (bombMatrix[i][j] > 0)
        showTile(
          i,
          j,
          `url("./assets/images/imageDesign2/bombAndNumbers/${bombMatrix[i][j]}.png")`
        );
    }
}

function isOutOfBorder(i, j, numOfRows, numOfCols) {
  if (i < 0 || i >= numOfRows) return true;
  if (j < 0 || j >= numOfCols) return true;
  return false;
}

function fillBlankTiles(i, j) {
  if (!isOutOfBorder(i, j, numberOfRows, numberOfColumns)) {
    if (bombMatrix[i][j] == 0) {
      numberOfTilesShowed++;
      bombMatrix[i][j] = 10; //trecut prin casuta goala
      showTile(i, j, `url("./assets/images/imageDesign2/tile/Default.png")`);
      fillBlankTiles(i, j - 1);
      fillBlankTiles(i, j + 1);
      fillBlankTiles(i - 1, j);
      fillBlankTiles(i + 1, j);
      fillBlankTiles(i + 1, j + 1);
      fillBlankTiles(i + 1, j - 1);
      fillBlankTiles(i - 1, j + 1);
      fillBlankTiles(i - 1, j - 1);
    } else if (bombMatrix[i][j] > 0 && bombMatrix[i][j] < 10) {
      //^- casuta cu numar
      numberOfTilesShowed++;
      showTile(
        i,
        j,
        `url("./assets/images/imageDesign2/bombAndNumbers/${bombMatrix[i][j]}.png")`
      );

      bombMatrix[i][j] = -bombMatrix[i][j]; //trecut prin casuta cu numar
    }
  }
}

function InitialUpdate() {
  /*
  difficultyLevel:
    - 0 pentru nivel begginer
    - 1 pentru nivel intermediate
    - 2 pentru nivel expert
    - 3 pentru nivel custom

    difficultyLevel:
    - difficultyLevel 0 -> user selecteaza 
      numberOfColumns, numberOfRows, numberOfBombs
    - difficultyLevel 1 -> numberOfColumns = numberOfRows = 9
    , numberOfBombs = 10
    - difficultyLevel 2 -> numberOfColumns = numberOfRows = 16
    , numberOfBombs = 40
    - difficultyLevel 3 -> numberOfColumns = 16,
      numberOfRows = 30
    , numberOfBombs = 99

    levelSelected: (pentru meniu)
    - 0 pentru nivel begginer
    - 1 pentru nivel intermediate
    - 2 pentru nivel expert
    - 3 pentru nivel custom

    Marchez bombele cu valoarea "100" din necesitati tehnice, 
    iar casutele goale vor deveni "10", astfel incat casutele
    cu numere prin care s-a trecut sa aiba valoarea acestora 
    negativa pentru o ulterioara prelucrare la eventul de 
    double click. (Astfel nu voi pierde valoarea ce-mi specifica
    numarul de vecini bombe, fara a mai salva odata acestea intr-o
    matrice noua). 
    ** Verificarea se va face astfel incat valoarea opusa (-x) din matrice
    sa fie mai mare decat 0 (10, 100 vor fi astfel -10, -100, iar cele negative
    vor fi verificate ca fiind pozitive)
  */

  gameLost = false;
  difficultyLevel = levelSelected = 0;
  numberOfColumns = numberOfRows = 9;
  numberOfBombs = 10;
  gameStarted = false;
  timeSpend = 0;
  numberOfClicks = 0;
  numberOfTilesShowed = 0;
  updateTimer(timeSpend);
  updateBombDisplay(numberOfBombs);
  //gameStarted devine true in momentul in care se apasa prima patratica
  updateTilesByDiff(difficultyLevel);
}
