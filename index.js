const CARD_ICONS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
const STORAGE_KEY = 'rs_memory_game_state';

// функция создания DOM-элементов
function createElement(tag, props = {}, ...children) {
  const element = document.createElement(tag);

  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([k, v]) => {
        element.dataset[k] = v;
      });
    } else {
      element.setAttribute(key, value);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof HTMLElement || child instanceof SVGElement) {
      element.appendChild(child);
    }
  });

  return element;
}

// Состояние игры
let moves = 0;
let matchedPairs = 0;
let flippedCards = [];
let isBoardLocked = false;
let cards = [];

// Таймер
let timerInterval = null;
let secondsElapsed = 0;
let isTimerStarted = false;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
  if (isTimerStarted) return;
  isTimerStarted = true;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    timeValue.textContent = formatTime(secondsElapsed);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isTimerStarted = false;
}

function resetTimer() {
  stopTimer();
  secondsElapsed = 0;
  timeValue.textContent = '00:00';
}

// Обработчик клика по карточке
function handleCardClick(index) {
  const card = cards[index];

  if (
    isBoardLocked ||
    card.isFlipped ||
    card.isMatched ||
    flippedCards.includes(card)
  ) {
    return;
  }

  // Запуск таймера при первом ходе
  startTimer();

  card.isFlipped = true;
  card.element.classList.add('card--flipped');
  flippedCards.push(card);

  if (flippedCards.length < 2) return;

  moves++;
  movesValue.textContent = String(moves);

  const [firstCard, secondCard] = flippedCards;

  if (firstCard.icon === secondCard.icon) {
    firstCard.isMatched = true;
    secondCard.isMatched = true;

    firstCard.element.classList.add('card--matched');
    secondCard.element.classList.add('card--matched');

    matchedPairs++;
    pairsValue.textContent = `${matchedPairs} / ${CARD_ICONS.length}`;

    flippedCards = [];

    if (matchedPairs === CARD_ICONS.length) {
      stopTimer();
      setTimeout(() => {
        alert(`Победа! Время: ${formatTime(secondsElapsed)}, Ходов: ${moves}`);
      }, 300);
    }
  } else {
    isBoardLocked = true;

    setTimeout(() => {
      firstCard.isFlipped = false;
      secondCard.isFlipped = false;

      firstCard.element.classList.remove('card--flipped');
      secondCard.element.classList.remove('card--flipped');

      flippedCards = [];
      isBoardLocked = false;
    }, 1000);
  }
}

// создания игрового поля
function createBoard(iconsData, onCardClick) {
  const board = createElement('div', { className: 'board' });
  const localCards = [];

  for (let i = 0; i < iconsData.length; i++) {
    const icon = iconsData[i];

    const card = createElement('button', {
      className: 'card',
      type: 'button',
      'aria-label': `Карточка ${i + 1}`,
      onClick: () => onCardClick(i)
    },
      createElement('div', { className: 'card__inner' },
        createElement('div', { className: 'card__face card__face--front' }, '❓'),
        createElement('div', { className: 'card__face card__face--back' }, icon)
      )
    );

    board.appendChild(card);

    localCards.push({
      id: i,
      icon: icon,
      isFlipped: false,
      isMatched: false,
      element: card
    });
  }

  return { boardElement: board, cards: localCards };
}

// Элементы UI
const title = createElement('h1', { className: 'header__title' }, 'Memory Game');
const newGameBtn = createElement('button', { className: 'btn btn--primary' }, 'Новая игра');
const resetProgressBtn = createElement('button', { className: 'btn btn--secondary' }, 'Сбросить прогресс');

const headerControls = createElement('div', { className: 'header__controls' }, newGameBtn, resetProgressBtn);
const header = createElement('header', { className: 'header' }, title, headerControls);

// Статистика (Ходы, Найдено пар, Время)
const movesValue = createElement('span', { className: 'stats__value' }, '0');
const movesBlock = createElement('div', { className: 'stats__item' }, 'Ходы: ', movesValue);

const pairsValue = createElement('span', { className: 'stats__value' }, `0 / ${CARD_ICONS.length}`);
const pairsBlock = createElement('div', { className: 'stats__item' }, 'Найдено пар: ', pairsValue);

const timeValue = createElement('span', { className: 'stats__value' }, '00:00');
const timeBlock = createElement('div', { className: 'stats__item' }, 'Время: ', timeValue);

const stats = createElement('div', { className: 'stats' }, movesBlock, pairsBlock, timeBlock);

// Функция полной перезагрузки/пересоздания игры
function startNewGame() {
  resetTimer();
  moves = 0;
  matchedPairs = 0;
  flippedCards = [];
  isBoardLocked = false;

  movesValue.textContent = '0';
  pairsValue.textContent = `0 / ${CARD_ICONS.length}`;

  // Перетасовываем новые иконки
  const shuffledIcons = [...CARD_ICONS, ...CARD_ICONS].sort(() => Math.random() - 0.5);
  
  const boardData = createBoard(shuffledIcons, handleCardClick);
  cards = boardData.cards;

  const oldBoard = document.querySelector('.board');
  if (oldBoard) {
    oldBoard.replaceWith(boardData.boardElement);
  }

  localStorage.removeItem(STORAGE_KEY);
}

// Сохранение и Загрузка из localStorage
function saveGameState() {
  const state = {
    moves,
    matchedPairs,
    secondsElapsed,
    cards: cards.map(c => ({
      icon: c.icon,
      isFlipped: c.isFlipped,
      isMatched: c.isMatched
    }))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGameState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;

  try {
    const state = JSON.parse(saved);
    moves = state.moves || 0;
    matchedPairs = state.matchedPairs || 0;
    secondsElapsed = state.secondsElapsed || 0;

    movesValue.textContent = String(moves);
    pairsValue.textContent = `${matchedPairs} / ${CARD_ICONS.length}`;
    timeValue.textContent = formatTime(secondsElapsed);

    const iconsData = state.cards.map(c => c.icon);
    const boardData = createBoard(iconsData, handleCardClick);
    cards = boardData.cards;

    // Восстанавливаем состояние переворотов
    state.cards.forEach((savedCard, idx) => {
      cards[idx].isFlipped = savedCard.isFlipped;
      cards[idx].isMatched = savedCard.isMatched;

      if (savedCard.isFlipped) cards[idx].element.classList.add('card--flipped');
      if (savedCard.isMatched) cards[idx].element.classList.add('card--matched');
    });

    return boardData.boardElement;
  } catch (e) {
    return false;
  }
}

// Инициализация и обработчики
document.addEventListener('DOMContentLoaded', () => {
  const restoredBoard = loadGameState();
  
  let boardElement;
  if (restoredBoard) {
    boardElement = restoredBoard;
  } else {
    const initialIcons = [...CARD_ICONS, ...CARD_ICONS].sort(() => Math.random() - 0.5);
    const boardData = createBoard(initialIcons, handleCardClick);
    cards = boardData.cards;
    boardElement = boardData.boardElement;
  }

  const mainContainer = createElement('main', { className: 'main-container' }, stats, boardElement);

  document.body.appendChild(header);
  document.body.appendChild(mainContainer);
});

newGameBtn.addEventListener('click', startNewGame);

resetProgressBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  startNewGame();
});

window.addEventListener('beforeunload', () => {
  // Сохраняем только если игра в процессе и не выиграна
  if (matchedPairs < CARD_ICONS.length && moves > 0) {
    saveGameState();
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
});

// добавляем 