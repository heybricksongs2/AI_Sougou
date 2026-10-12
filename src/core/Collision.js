/**
 * src/core/Collision.js
 * Pure Mathematical Collision Detection Utilities
 * Zero DOM dependencies.
 */

/**
 * @typedef {Object} Box
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} Circle
 * @property {number} x Center X
 * @property {number} y Center Y
 * @property {number} radius
 */

/**
 * Computes an inner contracted hitbox by insetting margins.
 * @param {Box} box Original bounding box
 * @param {number} insetX Horizontal inset per side
 * @param {number} insetY Vertical inset per side
 * @returns {Box} Contracted box
 */
export function getContractedBox(box, insetX = 0, insetY = 0) {
  return {
    x: box.x + insetX,
    y: box.y + insetY,
    width: Math.max(0, box.width - 2 * insetX),
    height: Math.max(0, box.height - 2 * insetY)
  };
}

/**
 * Pure mathematical Axis-Aligned Bounding Box (AABB) intersection.
 * Supports optional per-box contraction margins.
 * 
 * Invariants:
 * - Symmetry: checkAABBCollision(A, B) === checkAABBCollision(B, A)
 * - Touching edges without overlap return false.
 * 
 * @param {Box} boxA First box
 * @param {Box} boxB Second box
 * @param {Object} [options]
 * @param {{ x: number, y: number }} [options.marginA] Inset for boxA
 * @param {{ x: number, y: number }} [options.marginB] Inset for boxB
 * @returns {boolean} True if boxes overlap
 */
export function checkAABBCollision(boxA, boxB, options = {}) {
  const mA = options.marginA || { x: 0, y: 0 };
  const mB = options.marginB || { x: 0, y: 0 };

  const aX = boxA.x + mA.x;
  const aY = boxA.y + mA.y;
  const aW = Math.max(0, boxA.width - 2 * mA.x);
  const aH = Math.max(0, boxA.height - 2 * mA.y);

  const bX = boxB.x + mB.x;
  const bY = boxB.y + mB.y;
  const bW = Math.max(0, boxB.width - 2 * mB.x);
  const bH = Math.max(0, boxB.height - 2 * mB.y);

  if (aW <= 0 || aH <= 0 || bW <= 0 || bH <= 0) {
    return false;
  }

  return (
    aX < bX + bW &&
    aX + aW > bX &&
    aY < bY + bH &&
    aY + aH > bY
  );
}

/**
 * Continuous Swept AABB intersection to prevent high-speed tunneling.
 * Tests if boxB moving with relative velocity (relVx, relVy) intersects boxA during dt.
 * 
 * @param {Box} boxA Static box (e.g. Player)
 * @param {Box} boxB Moving box (e.g. Obstacle)
 * @param {number} relVx Horizontal velocity of boxB relative to boxA (px/s)
 * @param {number} relVy Vertical velocity of boxB relative to boxA (px/s)
 * @param {number} dt Delta time in seconds
 * @param {Object} [options] Contraction margins
 * @returns {boolean} True if collision occurs during time interval [0, dt]
 */
export function checkSweptAABB(boxA, boxB, relVx, relVy, dt, options = {}) {
  // 1. Check instant discrete collision at t = 0
  if (checkAABBCollision(boxA, boxB, options)) {
    return true;
  }

  if (dt <= 0 || (relVx === 0 && relVy === 0)) {
    return false;
  }

  const mA = options.marginA || { x: 0, y: 0 };
  const mB = options.marginB || { x: 0, y: 0 };

  const a = getContractedBox(boxA, mA.x, mA.y);
  const b = getContractedBox(boxB, mB.x, mB.y);

  // 2. Compute swept bounding envelope of moving box B
  const dx = relVx * dt;
  const dy = relVy * dt;

  const sweptB = {
    x: Math.min(b.x, b.x + dx),
    y: Math.min(b.y, b.y + dy),
    width: b.width + Math.abs(dx),
    height: b.height + Math.abs(dy)
  };

  // If the broadphase envelope doesn't intersect box A, collision is impossible
  if (!checkAABBCollision(a, sweptB)) {
    return false;
  }

  // 3. Precise 1D Interval Ray Cast on Minkowski sum
  const minX = a.x - b.width;
  const maxX = a.x + a.width;
  const minY = a.y - b.height;
  const maxY = a.y + a.height;

  let tEnterX = dx > 0 ? (minX - b.x) / dx : dx < 0 ? (maxX - b.x) / dx : -Infinity;
  let tExitX = dx > 0 ? (maxX - b.x) / dx : dx < 0 ? (minX - b.x) / dx : Infinity;

  let tEnterY = dy > 0 ? (minY - b.y) / dy : dy < 0 ? (maxY - b.y) / dy : -Infinity;
  let tExitY = dy > 0 ? (maxY - b.y) / dy : dy < 0 ? (minY - b.y) / dy : Infinity;

  if (dx === 0) {
    if (b.x < minX || b.x > maxX) return false;
    tEnterX = 0;
    tExitX = 1;
  }
  if (dy === 0) {
    if (b.y < minY || b.y > maxY) return false;
    tEnterY = 0;
    tExitY = 1;
  }

  const tEntry = Math.max(tEnterX, tEnterY);
  const tExit = Math.min(tExitX, tExitY);

  return tEntry <= tExit && tEntry <= 1 && tExit >= 0;
}

/**
 * Exact Euclidean Circle-to-AABB intersection for collectible items.
 * Avoids Math.sqrt for maximum performance.
 * 
 * @param {Circle} circle Circle with { x, y, radius }
 * @param {Box} box Box with { x, y, width, height }
 * @param {number} [extraRadius=0] Generous collection bonus
 * @returns {boolean} True if circle intersects box
 */
export function checkCircleAABBCollision(circle, box, extraRadius = 0) {
  const r = circle.radius + extraRadius;

  // Find closest point on box to circle center
  const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

  const distX = circle.x - closestX;
  const distY = circle.y - closestY;
  const distanceSq = distX * distX + distY * distY;

  return distanceSq < r * r;
}
