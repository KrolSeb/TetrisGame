let canvas = document.getElementById('tetrisBoard');
const canvasBackgroundColor = '#040405';

let context = canvas.getContext('2d');
const mobileScreenWidth = window.matchMedia("(max-width: 767px)");

let isGamePaused = false;
let pauseOverlay = document.getElementById("pauseOverlay");

let columnPointsCount = document.getElementById('columnPointsCount');
let columnLinesCount = document.getElementById('columnLinesCount');
let navbarPointsCount = document.getElementById('navbarPointsCount');
let sidebarPointsCount = document.getElementById('sidebarPointsCount');
let sidebarLinesCount = document.getElementById('sidebarLinesCount');

let playPauseGameButton = document.getElementById("buttonPlayPauseGame");
let playPauseImage = document.getElementById("playPauseImage");

let sidebarLaunchButton = document.getElementById("sidebarLaunch");
let sidebarCloseButton = document.getElementById("sidebarClose");
let isSidebarOpened = false;

let gameContainer = document.getElementById("gameContainer");
let isControlsActivated = false;

let timeCountdownCounter = document.getElementById("timeCountdownCounter");
let timeInSeconds;
let formattedTime;
let ticker;

let gameLoadingCountdownCounter = 3;
let gameLoadingView = document.getElementById("gameLoadingView");
let gameLoadingCountdownCircle = document.getElementById('gameLoadingCountdownCircle');
let gameLoadingCountdownNumber = document.getElementById('gameLoadingCountdownNumber');

let endGameView = document.getElementById("endGameView");
let endGameStatus = document.getElementById("endGameStatus");
let endGameDetails = document.getElementById("endGameDetails");
let status;
let details;
let isGameUpdateStopped = false;
let playAgainButton = document.getElementById("playAgain");
let changeGameModeButton = document.getElementById("changeGameMode");

let welcomeView = document.getElementById("welcomeView");
const gameTimeInMinutes = [0, 5, 15];
let choosenTimeInMinutes;
let fiveMinutesGameButton = document.getElementById("fiveMinutesGameButton");
let infiniteGameButton = document.getElementById("infiniteGameButton");
let fifteenMinutesGameButton = document.getElementById("fifteenMinutesGameButton");

function setCanvasProperties() {
  canvas.height = 800;
  canvas.width = 480;
}

function setContextProperties() {
  context.scale(40, 40);
  context.imageSmoothingEnabled = true;
}

function initializeCanvasSizeChangeListener() {
  window.addEventListener('load', resize, false);
  window.addEventListener('resize', resize, false);
}

function resize() {
  let height = window.innerHeight;
  let ratio = canvas.width / canvas.height;
  let width = height * ratio;
  canvas.style.width = width * getCanvasScale() + 'px';
  pauseOverlay.style.width = width * getCanvasScale() + 'px';
}

function getCanvasScale() {
  if (mobileScreenWidth.matches) {
    return 0.63;
  }
  else {
    return 0.75;
  }
}

function createPiece(type) {
  if (type === 'T') {
    return [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
  }
  else if (type === 'J') {
    return [
      [0, 2, 0],
      [0, 2, 0],
      [2, 2, 0],
    ];
  }
  else if (type === 'L') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3],
    ];
  }
  else if (type === 'O') {
    return [
      [4, 4],
      [4, 4],
    ];
  }
  else if (type === 'S') {
    return [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ];
  }
  else if (type === 'Z') {
    return [
      [6, 6, 0],
      [0, 6, 6],
      [0, 0, 0],
    ];
  }
  else if (type === 'I') {
    return [
      [0, 7, 0, 0],
      [0, 7, 0, 0],
      [0, 7, 0, 0],
      [0, 7, 0, 0],
    ];
  }
}

function createMatrix(width, height) {
  const matrix = [];
  while (height--) {
    matrix.push(new Array(width).fill(0));
  }
  return matrix;
}

function draw() {
  clearMatrix();
  drawMatrix(arena, {x: 0, y: 0});
  drawMatrix(player.matrix, player.position);
}

function clearMatrix() {
  context.fillStyle = canvasBackgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function playerDrop() {
  player.position.y++;
  if (collide(arena, player)) {
    player.position.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    updateLines();
  }
  dropCounter = 0;
}

function collide(arena, player) {
  const matrix = player.matrix;
  const playerPosition = player.position;
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < matrix[y].length; ++x) {
      if (matrix[y][x] !== 0 && (arena[y + playerPosition.y] && arena[y + playerPosition.y][x + playerPosition.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

//Copying player position into game arena
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.position.y][x + player.position.x] = value;
      }
    });
  });
}

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.position.y = 0;
  player.position.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) {
    actionOnLoseGame();
  }
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 20;
    player.lines += rowCount;
  }
}

function playerMove(offset) {
  player.position.x += offset;
  if (collide(arena, player)) {
    player.position.x -= offset;
  }
}

function rotate(matrix, direction) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }

  if (direction > 0) {
    matrix.forEach(row => row.reverse());
  }
  else {
    matrix.reverse();
  }
}

function playerRotate(direction) {
  const position = player.position.x;
  let offset = 1;
  rotate(player.matrix, direction);

  while (collide(arena, player)) {
    player.position.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -direction);
      player.position.x = position;
      return;
    }
  }
}

let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {
  if (isGamePaused || isGameUpdateStopped) return;

  const dropInterval = 1000;
  const deltaTime = time - lastTime;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  lastTime = time;

  draw();
  requestAnimationFrame(update);
}

function updateScore() {
  columnPointsCount.innerText = player.score;
  navbarPointsCount.innerText = player.score;
  sidebarPointsCount.innerText = player.score;
}

function updateLines() {
  columnLinesCount.innerText = player.lines;
  sidebarLinesCount.innerText = player.lines;
}

function pauseGame() {
  isGamePaused = !isGamePaused;
  if (isGamePaused) {
    pauseOverlay.style.visibility = "visible";
    playPauseGameButton.classList.add('pause-button');
    playPauseGameButton.classList.remove('play-button');
    playPauseImage.src = "assets/img/pause.svg";
    if (isTimeChoosen) {
      clearInterval(ticker);
    }
  }
  else {
    pauseOverlay.style.visibility = "hidden";
    playPauseGameButton.classList.add('play-button');
    playPauseGameButton.classList.remove('pause-button');
    playPauseImage.src = "assets/img/play.svg";
    update();
    if (isTimeChoosen) {
      ticker = setInterval("tick()", 1000);
    }
  }
}

function activateControls() {
  activateGameKeycodes();
  activateGameButtons();
  isControlsActivated = true;
}

function activateGameKeycodes() {
  document.addEventListener('keydown', event => {
    if (event.keyCode === 80) {
      pauseGame();
    }
    executeGameActionUsingKeyboard();
  });
}

function executeGameActionUsingKeyboard() {
  if (!isGamePaused) {
    switch (event.keyCode) {
      case 37:
        playerMove(-1);
        break;
      case 39:
        playerMove(1);
        break;
      case 40:
        playerDrop();
        break;
      case 81:
        playerRotate(-1);
        break;
      case 87:
        playerRotate(1);
        break;
    }
  }
}

function activateGameButtons() {
  moveLeftOnButtonClick();
  moveRightOnButtonClick();
  moveDownOnButtonClick();
  rotateLeftOnButtonClick();
  rotateRightOnButtonClick();
  togglePlayPauseButton();
}

function moveLeftOnButtonClick() {
  const leftArrowButton = document.getElementById("buttonLeftArrow");
  leftArrowButton.onclick = function () {
    if (!isGamePaused) {
      playerMove(-1);
    }
  };
}

function moveRightOnButtonClick() {
  const rightArrowButton = document.getElementById("buttonRightArrow");
  rightArrowButton.onclick = function () {
    if (!isGamePaused) {
      playerMove(1);
    }
  };
}

function moveDownOnButtonClick() {
  const downArrowButton = document.getElementById("buttonDownArrow");
  downArrowButton.onclick = function () {
    if (!isGamePaused) {
      playerDrop();
    }
  };
}

function rotateLeftOnButtonClick() {
  const rotateLeftButton = document.getElementById("buttonRotateLeft");
  rotateLeftButton.onclick = function () {
    if (!isGamePaused) {
      playerRotate(-1);
    }
  };
}

function rotateRightOnButtonClick() {
  const rotateRightButton = document.getElementById("buttonRotateRight");
  rotateRightButton.onclick = function () {
    if (!isGamePaused) {
      playerRotate(1);
    }
  };
}

function togglePlayPauseButton() {
  playPauseGameButton.onclick = function () {
    pauseGame();
  };
}

function enableSidebarToggle() {
  toggleSidebar();
}

function toggleSidebar() {
  openSidebar();
  closeSidebar();
}

function openSidebar() {
  sidebarLaunchButton.onclick = function () {
    isGamePaused = false;
    isSidebarOpened = true;
    gameContainer.classList.add("menuDisplayed");
    pauseGame();

    if (mobileScreenWidth.matches) {
      pauseOverlay.style.visibility = "hidden";
    }
  };
}

function closeSidebar() {
  sidebarCloseButton.onclick = function () {
    isSidebarOpened = false;
    isGamePaused = true;
    gameContainer.classList.remove("menuDisplayed");
    pauseGame();
  };
}

function startTimer(seconds) {
  timeInSeconds = parseInt(seconds);
  formatTime(seconds);
  updateTime();
  ticker = setInterval("tick()", 1000);
}

function tick() {
  if (timeInSeconds > 0) {
    timeInSeconds--;
  }
  else {
    clearInterval(ticker);
    actionOnTimeElapse();
  }

  formatTime(timeInSeconds);
  updateTime();
}

function formatTime(seconds) {
  let hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  let minutes = Math.floor(seconds / 60);
  seconds %= 60;

  if (hours < 1) {
    formattedTime = ((minutes < 10) ? "0" : "") + minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;
  }
  else {
    formattedTime = ((hours < 10) ? "0" : "") + hours + ":" + ((minutes < 10) ? "0" : "") + minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;
  }
}

function updateTime() {
  timeCountdownCounter.innerText = formattedTime;
}

function showGameLoadingAnimation(){
  gameLoadingView.style.opacity = '1';
  gameLoadingView.style.visibility = 'visible';
  gameLoadingCountdownNumber.textContent = gameLoadingCountdownCounter;
  gameLoadingCountdownCircle.style.animation = 'countdown 3s linear forwards';
}

function resetGameLoadingAnimation() {
  gameLoadingCountdownCounter = 3;
  gameLoadingCountdownCircle.style.animation = 'none';
}

function hideGameLoadingAnimation(){
  gameLoadingView.style.opacity = '0';
  gameLoadingView.style.visibility = 'hidden';
}

function showGameView() {
  gameContainer.style.opacity = '1';
  gameContainer.style.visibility = 'visible';
}

function hideGameView() {
  gameContainer.style.opacity = '0';
  gameContainer.style.visibility = 'hidden';
}

function countdownTimeToGame() {
  let timer = setInterval(function () {
    gameLoadingCountdownCounter--;
    gameLoadingCountdownNumber.textContent = gameLoadingCountdownCounter;
    if (gameLoadingCountdownCounter === 0) {
      clearInterval(timer);
      hideGameLoadingAnimation();
      resetGameLoadingAnimation();
      launchGame();
    }
  }, 1000);
}

function launchGame() {
  showGameView();
  checkChoosenGameMode();
  enableSidebarToggle();
  playerReset();
  updateScore();
  updateLines();
  enableUpdate();
  update();
  if (!isControlsActivated) {
    activateControls();
  }
}

function showEndGameView(status, details) {
  endGameStatus.innerText = status;
  endGameDetails.innerText = details;
  endGameView.style.opacity = '1';
  endGameView.style.visibility = 'visible';
  onPlayAgainButtonClick();
  onChangeGameModeButtonClick();
}

function hideEndGameView() {
  endGameView.style.opacity = '0';
  endGameView.style.visibility = 'hidden';
}

function onPlayAgainButtonClick() {
  playAgainButton.onclick = function () {
    hideEndGameView();
    showGameLoadingAnimation();
    countdownTimeToGame();
  }
}

function onChangeGameModeButtonClick() {
  changeGameModeButton.onclick = function () {
    hideEndGameView();
    showWelcomeView();
  }
}

function actionOnLoseGame() {
  disableUpdate();
  status = "Game over!";
  details = "You scored " + player.score + " points";
  clearInterval(ticker);
  resetGameData();
  hideGameView();
  showEndGameView(status, details);
}

function actionOnTimeElapse() {
  disableUpdate();
  status = "Time elapsed!";
  details = "You scored " + player.score + " points";
  resetGameData();
  hideGameView();
  showEndGameView(status, details);
}

function enableUpdate() {
  isGameUpdateStopped = false;
}

function disableUpdate() {
  isGameUpdateStopped = true;
}

function resetGameData() {
  arena.forEach(row => row.fill(0));
  player.score = 0;
  player.lines = 0;
  updateScore();
  updateLines();
}

function showWelcomeView(){
  welcomeView.style.opacity = '1';
  welcomeView.style.visibility = 'visible';
  onFiveMinutesGameButtonClick();
  onInfiniteGameButtonClick();
  onFifteenMinutesGameButtonClick();
}

function hideWelcomeView(){
  welcomeView.style.opacity = '0';
  welcomeView.style.visibility = 'hidden';
}

function onGameModeButtonClick() {
  hideWelcomeView();
  showGameLoadingAnimation();
  countdownTimeToGame();
}

function onFiveMinutesGameButtonClick() {
  fiveMinutesGameButton.onclick = function () {
    choosenTimeInMinutes = 5;
    onGameModeButtonClick();
  }
}

function onInfiniteGameButtonClick() {
  infiniteGameButton.onclick = function () {
    choosenTimeInMinutes = 0;
    onGameModeButtonClick();
  }
}

function onFifteenMinutesGameButtonClick() {
  fifteenMinutesGameButton.onclick = function () {
    choosenTimeInMinutes = 15;
    onGameModeButtonClick();
  }
}

function checkChoosenGameMode() {
  if (choosenTimeInMinutes !== gameTimeInMinutes[0]) {
    let gameTimeInSeconds = choosenTimeInMinutes * 60;
    isTimeChoosen(true);
    formatTime(gameTimeInSeconds);
    updateTime();
    timeCountdownCounter.style.visibility = "visible";
    startTimer(gameTimeInSeconds);
  }
  else {
    isTimeChoosen(false);
    timeCountdownCounter.style.visibility = "hidden";
  }
}

function isTimeChoosen(choice) {
  return choice;
}

const colors = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
  position: {x: 0, y: 0},
  matrix: null,
  score: 0,
  lines: 0
};

setCanvasProperties();
setContextProperties();
initializeCanvasSizeChangeListener();
showWelcomeView();
