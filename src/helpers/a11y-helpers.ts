/**
 * Transform the tag of an element to another tag, e.g. <p> to <h2>.
 *
 * @param {Element} element     The element to transform
 * @param {string}  transformTo Tag to transform to (e.g. 'h2')
 * @return {Element|null} Transformed element
 */
export const transformTag = (element: Element, transformTo: string) => {
  if (!element) return null;

  const transformedElement: Element = document.createElement(transformTo);

  transformedElement.innerHTML = element.innerHTML;

  for (let i = 0; i < element.attributes.length; i++) {
    transformedElement.setAttribute(
      element.attributes[i].name,
      element.attributes[i].value
    );
  }

  if (!element.parentNode) return transformedElement;

  element.parentNode.replaceChild(transformedElement, element);

  return transformedElement;
};

/**
 * Wait for an element to appear in the DOM and resolve with the element.
 *
 * @param {string} selector The CSS selector for the element to wait for
 * @param {number} maxTimeToSearch  The maximum time to wait for the element, in milliseconds
 * @return {Promise<NodeListOf<Element> | Element>} A promise that resolves with the element when it appears in the DOM
 * @throws {string} If the element does not appear in the DOM before the timeout is reached
 */
export const waitForElement = (
  selector: string,
  maxTimeToSearch: number = 5000
): Promise<NodeListOf<Element> | Element> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elements = document.querySelectorAll(selector);

      if (elements.length > 0) {
        clearInterval(interval);
        if (elements.length === 1) {
          resolve(elements[0]);
        } else {
          resolve(elements);
        }
      } else if (Date.now() - startTime >= maxTimeToSearch) {
        clearInterval(interval);
        reject(`Timeout exceeded. Element '${selector}' not found.`);
      }
    }, 100);
  });
};

/**
 * The element has visibility: hidden, which makes it initially un-focusable, creating an error.
 * This ensures an wait until it can activate the trap.
 */
export const checkCanFocusTrap = (elements: Element[]) => {
  const results = elements.map((element): Promise<void> => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (getComputedStyle(element).visibility !== 'hidden') {
          resolve();
          clearInterval(interval);
        }
      }, 5);
    });
  });
  return Promise.all(results);
};
