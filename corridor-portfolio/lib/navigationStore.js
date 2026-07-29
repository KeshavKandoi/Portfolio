'use client';

export const navState = {
  state: 'IDLE', // IDLE | HOVER | ENTERING | ROOM | EXITING
  activeDoor: null, // { index, position, rotationY, label }
  listeners: new Set(),
};

function notify() {
  navState.listeners.forEach((fn) => fn(navState));
}

export function subscribeNav(fn) {
  navState.listeners.add(fn);
  return () => navState.listeners.delete(fn);
}

export function requestEnterDoor(door) {
  if (navState.state !== 'IDLE' && navState.state !== 'HOVER') return;
  navState.activeDoor = door;
  navState.state = 'ENTERING';
  notify();
}

export function setRoomState() {
  navState.state = 'ROOM';
  notify();
}

export function requestExitRoom() {
  if (navState.state !== 'ROOM') return;
  navState.state = 'EXITING';
  notify();
}

export function returnToIdle() {
  navState.state = 'IDLE';
  navState.activeDoor = null;
  notify();
}
