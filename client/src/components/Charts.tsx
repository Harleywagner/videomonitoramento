import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface BarChartProps {
  title: string;
  data: Record<string, number>;
  colors?: string[];
}

interface PieChartProps {
  title: string;
  data: Record<string, number>;
  colors?: string[];
}

export function BarChart({ title, data, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const entries = Object.entries(data).filter(([_, v]) => v > 0);
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = 250;

    if (entries.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados registrados', canvas.width / 2, canvas.height / 2);
      return;
    }

    const max = Math.max(...entries.map(([_, v]) => v));
    const pad = 40;
    const bW = (canvas.width - pad * 2) / entries.length - 10;

    entries.forEach(([lbl, val], i) => {
      const h = (val / max) * (canvas.height - pad * 2);
      const x = pad + i * (bW + 10);
      const y = canvas.height - pad - h;

      // Draw bar
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, y, bW, h);

      // Draw value
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + bW / 2, y - 10);

      // Draw label
      ctx.fillStyle = '#64748b';
      ctx.font = '600 9px sans-serif';
      const sLbl = lbl.length > 10 ? lbl.substring(0, 8) + '..' : lbl;
      ctx.fillText(sLbl, x + bW / 2, canvas.height - pad + 18);
    });
  }, [data, colors]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <canvas ref={canvasRef} className="w-full" />
    </Card>
  );
}

export function PieChart({ title, data, colors = ['#10b981', '#ef4444', '#f59e0b'] }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const entries = Object.entries(data);
    const total = entries.reduce((sum, [_, v]) => sum + v, 0);

    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = 250;

    if (total === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados de câmeras', canvas.width / 2, canvas.height / 2);
      return;
    }

    const centerX = canvas.width / 2 - 60;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 30;

    let startAngle = -Math.PI / 2;

    entries.forEach(([lbl, val], i) => {
      if (val === 0) return;

      const sliceAngle = (2 * Math.PI * val) / total;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // Draw legend
      const legendX = centerX + radius + 40;
      const legendY = (canvas.height / 2 - 40) + i * 30;

      ctx.fillRect(legendX, legendY, 14, 14);
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${lbl}: ${val} (${Math.round((val / total) * 100)}%)`,
        legendX + 24,
        legendY + 12
      );

      startAngle += sliceAngle;
    });
  }, [data, colors]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <canvas ref={canvasRef} className="w-full" />
    </Card>
  );
}
