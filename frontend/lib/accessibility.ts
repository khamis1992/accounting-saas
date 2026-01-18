/**
 * Accessibility Utilities - WCAG 2.1 AA Compliance
 *
 * Helper functions and utilities for accessibility
 */

/**
 * Announces message to screen readers
 *
 * @param message - The message to announce
 * @param priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  // Remove existing live regions
  const existingRegion = document.getElementById("sr-announcer");
  if (existingRegion) {
    existingRegion.remove();
  }

  // Create new live region
  const announcer = document.createElement("div");
  announcer.id = "sr-announcer";
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", priority);
  announcer.setAttribute("aria-atomic", "true");

  // Hide visually but keep available to screen readers
  announcer.className = "sr-only";
  announcer.textContent = message;

  document.body.appendChild(announcer);

  // Remove after announcement
  setTimeout(() => {
    announcer.remove();
  }, 1000);
}

/**
 * Sets page title
 *
 * @param title - The page title
 * @param appName - Optional app name to append
 */
export function setPageTitle(title: string, appName?: string) {
  if (appName) {
    document.title = `${title} - ${appName}`;
  } else {
    document.title = title;
  }
}

/**
 * Traps focus in a container
 *
 * @param container - The container element
 * @returns Cleanup function
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  document.addEventListener("keydown", handleTab);

  // Focus first element
  firstElement?.focus();

  return () => {
    document.removeEventListener("keydown", handleTab);
  };
}

/**
 * Returns focus to previous element
 *
 * @returns Function to restore focus
 */
export function returnFocus(): () => void {
  const previousElement = document.activeElement as HTMLElement;

  return () => {
    previousElement?.focus();
  };
}

/**
 * Checks if element is focusable
 *
 * @param element - The element to check
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ];

  return focusableSelectors.some((selector) => element.matches(selector));
}

/**
 * Gets all focusable elements in a container
 *
 * @param container - The container element
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ];

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(", ")));
}

/**
 * Sets focus to first focusable element
 *
 * @param container - The container element
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

/**
 * Generates unique ID for accessibility attributes
 *
 * @param prefix - Optional prefix for the ID
 */
export function generateAriaId(prefix = "aria"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Visually hidden class for screen readers only
 */
export const srOnlyClassName = `
  sr-only
`;

/**
 * Generates aria-describedby string from multiple IDs
 *
 * @param ids - Array of IDs to join
 */
export function ariaDescribeBy(...ids: (string | undefined | null)[]): string | undefined {
  const validIds = ids.filter(Boolean) as string[];
  return validIds.length > 0 ? validIds.join(" ") : undefined;
}
