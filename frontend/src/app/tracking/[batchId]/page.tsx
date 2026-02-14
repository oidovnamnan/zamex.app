'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Truck, Clock, Navigation } from 'lucide-react';
import { api } from '@/lib/api';

export default function GpsTrackingPage() {
  const router = useRouter();
  const { batchId } = useParams();
  const [points, setPoints] = useState<any[]>([]);
  const [batch, setBatch] = useState<any>(null);

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [batchId]);

  const load = async () => {
    try {
      const [gps, b] = await Promise.all([
        api.get(`/batches/${batchId}/gps?limit=200`),
        api.get(`/batches?limit=50`),
      ]);
      setPoints(gps.data.data.points);
      const found = b.data.data.batches.find((x: any) => x.id === batchId);
      if (found) setBatch(found);
    } catch {}
  };

  const latest = points[0];

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost btn-sm -ml-2"><ArrowLeft className="w-4.5 h-4.5" /></button>
          <div>
            <h1 className="text-sm font-semibold text-surface-900">GPS Tracking</h1>
            {batch && <p className="text-xs text-surface-400 font-mono">{batch.batchCode}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Map placeholder */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-blue-100 to-emerald-50 h-72 flex items-center justify-center relative">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-zamex-600 mx-auto mb-2" />
              <p className="text-sm text-surface-600 font-medium">Газрын зураг</p>
              <p className="text-xs text-surface-400">Google Maps / Mapbox integration</p>
            </div>

            {/* Route line visualization */}
            {points.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 backdrop-blur rounded-xl p-3 flex items-center gap-3">
                  <Navigation className="w-5 h-5 text-zamex-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-surface-600">Эрээн</span>
                      <div className="flex-1 h-0.5 bg-surface-200 mx-1">
                        <div className="h-full bg-zamex-500 rounded" style={{ width: `${Math.min(points.length / 2, 100)}%` }} />
                      </div>
                      <span className="text-xs text-surface-600">Улаанбаатар</span>
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Location */}
        {latest && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-surface-900 mb-3">Одоогийн байршил</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Координат</span>
                <span className="font-mono text-surface-700">{Number(latest.latitude).toFixed(5)}, {Number(latest.longitude).toFixed(5)}</span>
              </div>
              {latest.speed && (
                <div className="flex justify-between">
                  <span className="text-surface-500">Хурд</span>
                  <span className="font-medium">{Number(latest.speed).toFixed(0)} км/ц</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-surface-500">Шинэчлэгдсэн</span>
                <span className="text-surface-700">{new Date(latest.createdAt).toLocaleString('mn-MN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Batch Info */}
        {batch && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-surface-900 mb-3">Batch мэдээлэл</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-surface-500">Код</span><span className="font-mono">{batch.batchCode}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Бараа тоо</span><span className="font-medium">{batch.totalPackages}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Жин</span><span className="font-medium">{Number(batch.totalWeight).toFixed(1)} кг</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Төлөв</span><span className="badge-yellow">{batch.status}</span></div>
              {batch.departedAt && <div className="flex justify-between"><span className="text-surface-500">Гарсан</span><span>{new Date(batch.departedAt).toLocaleString('mn-MN')}</span></div>}
            </div>
          </div>
        )}

        {/* GPS History */}
        {points.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-surface-900 mb-3">Байршлын түүх ({points.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {points.slice(0, 20).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 text-xs">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-surface-300'}`} />
                  <span className="text-surface-400 w-16">{new Date(p.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-mono text-surface-600">{Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}</span>
                  {p.speed && <span className="text-surface-400">{Number(p.speed).toFixed(0)}км/ц</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {points.length === 0 && (
          <div className="card p-8 text-center">
            <Truck className="w-10 h-10 text-surface-200 mx-auto mb-2" />
            <p className="text-sm text-surface-400">GPS мэдээлэл алга</p>
          </div>
        )}
      </main>
    </div>
  );
}
