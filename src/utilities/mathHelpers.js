
export const toDegrees = (p_Angle) => ((p_Angle === undefined) ? undefined : p_Angle * 180 / Math.PI);
export const toRadians = (p_Angle) => ((p_Angle === undefined) ? undefined : p_Angle * Math.PI / 180);
export const angleToPoint = (p_Angle, p_Radius) => ({ x: (p_Radius || 1) * Math.cos(toRadians(p_Angle)), y: (p_Radius || 1) * Math.sin(toRadians(p_Angle)) });
export const pointToAngle = (p_Vector) => ((p_Vector.x === 0 && p_Vector.y === 0) ? 0 : (p_Vector.x === 0) ? (p_Vector.y > 0) ? 90 : -90 : (p_Vector.y === 0) ? (p_Vector.x > 0) ? 0 : 180 : (p_Vector.x > 0) ? toDegrees(Math.atan(p_Vector.y / p_Vector.x)) : 180 + toDegrees(Math.atan(p_Vector.y / p_Vector.x)));
export const vectorLength = (p_Vector) => Math.sqrt((p_Vector.x * p_Vector.x) + (p_Vector.y * p_Vector.y) + ((p_Vector.z || 0) * (p_Vector.z || 0)));
export const vectorSqrLength = (p_Vector) => (p_Vector.x * p_Vector.x) + (p_Vector.y * p_Vector.y) + ((p_Vector.z || 0) * (p_Vector.z || 0));
export const vectorSubtract = (p_Vector1, p_Vector2) => ({ x: p_Vector1.x - p_Vector2.x, y: p_Vector1.y - p_Vector2.y, z: (p_Vector1.z || 0) - (p_Vector2.z || 0) });
export const vectorAdd = (p_Vector1, p_Vector2) => ({ x: p_Vector1.x + p_Vector2.x, y: p_Vector1.y + p_Vector2.y, z: (p_Vector1.z || 0) + (p_Vector2.z || 0) });
export const vectorMultiply = (p_Vector, p_Multiplier) => ({ x: p_Vector.x * p_Multiplier, y: p_Vector.x * p_Multiplier, z: (p_Vector.z || 0) * p_Multiplier });
export const crossProduct = (p_Vector1, p_Vector2) => ({ x: (p_Vector1.y * p_Vector2.z) - (p_Vector1.z * p_Vector2.y), y: (p_Vector1.z * p_Vector2.x) - (p_Vector1.x * p_Vector2.z), z: (p_Vector1.x * p_Vector2.y) - (p_Vector1.y * p_Vector2.x) });
export const dotProduct = (p_Vector1, p_Vector2) => (p_Vector1.x * p_Vector2.x) + (p_Vector1.y * p_Vector2.y) + ((p_Vector1.z || 0) * (p_Vector2.z || 0));
export const unitVector = (p_Vector) => { const length = vectorLength(p_Vector); return { x: p_Vector.x / length, y: p_Vector.y / length, z: p_Vector.z / length }; };
