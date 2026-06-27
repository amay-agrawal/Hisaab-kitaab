import { useEffect } from "react";

/**
 * useKeyboardShortcut — fires callback when the given key is pressed
 * (ignores when focus is inside an input/textarea/select)
 *
 * @param {string}   key       - e.g. "n", "Escape"
 * @param {Function} callback  - function to call
 */
export default function useKeyboardShortcut(key, callback) {
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      if (e.key?.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback]);
}
