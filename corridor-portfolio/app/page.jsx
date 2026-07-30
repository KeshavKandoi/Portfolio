'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import IntroScreen from '@/components/IntroScreen';

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

export default function Home() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return <IntroScreen onEnter={() => setEntered(true)} />;
  }

  return <Scene />;
}
