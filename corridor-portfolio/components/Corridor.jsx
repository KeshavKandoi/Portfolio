'use client';

const WIDTH = 6;
const HEIGHT = 5;
const LENGTH = 120;

export default function Corridor() {
  return (
    <group position={[0, 0, -LENGTH / 2 + 8]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[WIDTH, LENGTH]} />
        <meshStandardMaterial color="#8a8a8a" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HEIGHT, 0]}>
        <planeGeometry args={[WIDTH, LENGTH]} />
        <meshStandardMaterial color="#555555" />
      </mesh>

      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-WIDTH / 2, HEIGHT / 2, 0]}>
        <planeGeometry args={[LENGTH, HEIGHT]} />
        <meshStandardMaterial color="#6f6f6f" />
      </mesh>

      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[WIDTH / 2, HEIGHT / 2, 0]}>
        <planeGeometry args={[LENGTH, HEIGHT]} />
        <meshStandardMaterial color="#6f6f6f" />
      </mesh>
    </group>
  );
}
