'use client';

import Link from 'next/link';
import { IntentLogger } from '@/components/IntentLogger';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <Link href="/" className="hover:underline decoration-gray-400 underline-offset-4">
            <h1 className="text-3xl font-bold text-gray-900 inline-block">Intent Logger</h1>
          </Link>
          <p className="text-gray-600 mt-1">Track what you&apos;re working on</p>
        </header>

        <IntentLogger />
      </div>
    </div>
  );
}
