import React from 'react';
import { HardDrive } from 'lucide-react';

export default function Banner() {
  return (
    <div className="bg-emerald-50 text-emerald-700 text-sm font-medium text-center py-2 px-4">
      <HardDrive className="inline w-4 h-4 mr-1.5 -mt-0.5" />
      Tus datos se guardan en este dispositivo.
    </div>
  );
}
