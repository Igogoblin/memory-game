const CARD_ICONS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

function createElement(tag, props = {}, ...children) {
  const element = document.createElement(tag);

  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataVal]) => {
        element.dataset[dataKey] = dataVal;
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

class ModalManager {
  static createModal({ titleText, bodyElement, buttons = [] }) {
    const dialog = createElement('dialog', { className: 'dialog' });

    const closeDialog = () => {
      dialog.close();
      dialog.remove();
      document.body.style.overflow = '';
    };

    const header = createElement('div', { className: 'modal__header' },
      createElement('h3', { className: 'modal__title' }, titleText)
    );

    const body = createElement('div', { className: 'modal__body' }, bodyElement);

    const footerButtons = buttons.map(btn => {
      const b = createElement('button', {
        className: `btn ${btn.primary ? 'btn--primary' : 'btn--secondary'}`,
        onClick: (e) => {
          btn.onClick(e, closeDialog);
        }
      }, btn.text);
      return b;
    });

    const footer = createElement('div', { className: 'modal__footer' }, ...footerButtons);

    const modalContainer = createElement('div', { className: 'modal' }, header, body, footer);
    dialog.appendChild(modalContainer);

    // Close on overlay click
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeDialog();
      }
    });

    // Handle Escape key naturally
    dialog.addEventListener('close', () => {
      closeDialog();
    });

    document.body.appendChild(dialog);
    document.body.style.overflow = 'hidden';
    dialog.showModal();

    return closeDialog;
  }
}