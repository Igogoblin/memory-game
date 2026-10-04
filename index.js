// Константы (объявляем ОДИН раз)
const CARD_ICONS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
const STORAGE_KEY = 'rs_memory_game_settings';

// Вспомогательная функция создания DOM-элементов
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
let cards = []; // Глобальный массив текущих карточек

// Обработчик клика по карточке (объявляем ДО вызова createBoard)
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

  // Переворачиваем карточку
  card.isFlipped = true;
  card.element.classList.add('card--flipped');
  flippedCards.push(card);

  if (flippedCards.length < 2) return;

  // Если открыты 2 карточки — считаем ход
  moves++;
  movesValue.textContent = String(moves);

  const [firstCard, secondCard] = flippedCards;

  // Проверяем совпадение
  if (firstCard.icon === secondCard.icon) {
    firstCard.isMatched = true;
    secondCard.isMatched = true;

    firstCard.element.classList.add('card--matched');
    secondCard.element.classList.add('card--matched');

    matchedPairs++;
    pairsValue.textContent = `${matchedPairs} / ${CARD_ICONS.length}`;

    flippedCards = [];

    if (matchedPairs === CARD_ICONS.length) {
      setTimeout(() => alert(`Победа! Вы нашли все пары за ${moves} ходов.`), 300);
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

// Функция создания игрового поля
function createBoard(icons, onCardClick) {
  const cardsData = [...icons, ...icons].sort(() => Math.random() - 0.5);

  const board = createElement('div', { className: 'board' });
  const localCards = [];

  for (let i = 0; i < cardsData.length; i++) {
    const icon = cardsData[i];

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

// Хедер и элементы UI
const title = createElement('h1', { className: 'header__title' }, 'Memory Game');
const newGameBtn = createElement('button', { className: 'btn btn--primary', 'aria-label': 'Новая игра' }, 'Новая игра');
const leaderboardBtn = createElement('button', { className: 'btn btn--secondary', 'aria-label': 'Таблица лидеров' }, 'Таблица лидеров');

const headerControls = createElement('div', { className: 'header__controls' }, newGameBtn, leaderboardBtn);
const header = createElement('header', { className: 'header' }, title, headerControls);

// Статистика
const movesValue = createElement('span', { className: 'stats__value' }, '0');
const movesBlock = createElement('div', { className: 'stats__item' }, 'Ходы: ', movesValue);

const pairsValue = createElement('span', { className: 'stats__value' }, '0 / 8');
const pairsBlock = createElement('div', { className: 'stats__item' }, 'Найдено пар: ', pairsValue);

const stats = createElement('div', { className: 'stats' }, movesBlock, pairsBlock);

// Создание поля и монтирование ТОЛЬКО внутри DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const boardData = createBoard(CARD_ICONS, handleCardClick);
  cards = boardData.cards; // Записываем созданные карточки в глобальную переменную

  const mainContainer = createElement('main', { className: 'main-container' }, stats, boardData.boardElement);

  document.body.appendChild(header);
  document.body.appendChild(mainContainer);
});