'use client';

export default function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 4, 6]} intensity={1} distance={14} decay={2} />
      <pointLight position={[0, 4, -8]} intensity={0.8} distance={14} decay={2} />
      <pointLight position={[0, 4, -22]} intensity={0.8} distance={14} decay={2} />
      <pointLight position={[0, 4, -36]} intensity={0.8} distance={14} decay={2} />
    </>
  );
}
