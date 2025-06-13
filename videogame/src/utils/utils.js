/**
 * Utility functions collection
 * Common helper functions used throughout the game
 */

/**
 * Check if two rectangular boxes overlap
 * @param {Object} box1 - First box with x, y, width, height properties
 * @param {Object} box2 - Second box with x, y, width, height properties
 * @returns {boolean} True if boxes overlap
 */
export function boxOverlap(box1, box2) {
  return (
    box1.position.x + box1.width > box2.position.x &&
    box1.position.x < box2.position.x + box2.width &&
    box1.position.y + box1.height > box2.position.y &&
    box1.position.y < box2.position.y + box2.height
  );
}
