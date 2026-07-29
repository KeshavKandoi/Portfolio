export function getRoomTransform(door, depth = 3.0) {
  if (!door) return { position: [0, 0, 0], rotationY: 0 };
  const [dx, , dz] = door.position;
  const rotY = door.rotationY;
  return {
    // subtract, not add — moves the room away from the corridor, through the wall
    position: [dx - Math.sin(rotY) * depth, 0, dz - Math.cos(rotY) * depth],
    rotationY: rotY,
  };
}
