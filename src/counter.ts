/**
 * Transforms a button into an interactive counter
 * @param element - Button element that will display and increment counter
 * @param config - Optional settings for initial value and increment step
 */
export function setupCounter(
  element: HTMLButtonElement,
  config: { initialValue?: number; incrementStep?: number } = {}
): () => void {
  const { initialValue = 0, incrementStep = 1 } = config;
  let counter = initialValue;

  const updateDisplay = (): void => {
    element.innerHTML = `count is ${counter}`;
  };

  const handleClick = (): void => {
    counter += incrementStep;
    updateDisplay();
  };

  element.addEventListener('click', handleClick);
  updateDisplay();

  // Return cleanup function
  return () => element.removeEventListener('click', handleClick);
}