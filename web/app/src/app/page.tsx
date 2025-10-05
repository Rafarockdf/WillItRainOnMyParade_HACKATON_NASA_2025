'use client';

import { useEffect, useState } from 'react';
import { CloudRain } from 'lucide-react';
import ForecastForm from '@/components/ForecastForm';

function cx(...c: Array<string | false | null | undefined>) { return c.filter(Boolean).join(' '); }

export default function Home() {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowForm(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 pb-20">
      {/* Hero */}
      <div
        className={cx(
          'absolute left-1/2 top-1/4 w-full -translate-x-1/2 -translate-y-1/2 transform transition-all duration-700 ease-in-out',
          showForm ? 'pointer-events-none -translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
        )}
        style={{ width: '100%', zIndex: 10 }}
      >
        <div className="text-center space-y-4 justify-items-center transition-opacity duration-700 ease-in-out">
          <CloudRain className="h-20 w-20 text-[var(--foreground)] mx-auto" aria-hidden="true" />
          <p className="text-2xl">Will the weather cooperate with your event???</p>
          <h1 className="text-4xl font-bold">Find out with Accurate Forecast</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Scroll down to reveal the form</p>
        </div>
      </div>

      {/* Form */}
      <div
        className={cx(
          'absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform transition-all duration-700 ease-in-out',
          showForm ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
        style={{ zIndex: 20 }}
      >
        <ForecastForm onSuccess={() => { window.location.href = '/forecast'; }} />
      </div>
    </div>
  );
}
