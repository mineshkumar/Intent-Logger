'use client';

import Link from 'next/link';
import { IntentLogger } from '@/components/IntentLogger';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <IntentLogger />
    </div>
  );
}
