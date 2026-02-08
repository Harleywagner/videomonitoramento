import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
  const [period, setPeriod] = useState('all');

  const occurrencesQuery = trpc.occurrences.list.useQuery();
  const cameraStatsQuery = trpc.cameras.stats.useQuery();

  const occurrences = occurrencesQuery.data || [];
  const cameraStats = cameraStatsQuery.data || { total: 0, online: 0, offline: 0, defective: 0 };

  const filterOccurrencesByPeriod = () => {
    const now = new Date();
    return occurrences.filter((occ: any) => {
      const [y, m, d] = occ.occurrenceDate.split('-').map(Number);
      const occDate = new Date(y, m - 1, d);

      switch (period) {
        case 'today':
          return occDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return occDate >= weekAgo;
        case 'month':
          return occDate.getMonth() === now.getMonth() && occDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  const filteredOccurrences = filterOccurrencesByPeriod();

  const generatePDF = () => {
    const now = new Date();
    const resolved = filteredOccurrences.filter((o: any) => o.classification === 'Encerrada').length;
    const total = filteredOccurrences.length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Monitoramento</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
          .header { border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { color: #1e40af; margin: 0; font-size: 24px; }
          .header-right { text-align: right; }
          .header-right h2 { margin: 0; font-size: 18px; }
          .header-right p { margin: 0; font-size: 12px; color: #64748b; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-box { padding: 15px; border-radius: 8px; text-align: center; }
          .stat-box p { margin: 0; font-size: 12px; color: #64748b; }
          .stat-box .value { font-size: 28px; font-weight: bold; margin: 10px 0; }
          .stat-1 { background: #eff6ff; color: #1e40af; }
          .stat-2 { background: #f0fdf4; color: #16a34a; }
          .stat-3 { background: #fef3c7; color: #d97706; }
          .stat-4 { background: #f3e8ff; color: #7c3aed; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1e40af; color: white; padding: 12px; text-align: left; font-size: 12px; font-weight: bold; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>RELATÓRIO DE MONITORAMENTO</h1>
            <p>Filtro: ${period.toUpperCase()} | Gerado em: ${now.toLocaleString('pt-BR')}</p>
          </div>
          <div class="header-right">
            <h2>HUC / ISGH</h2>
            <p>Segurança Eletrônica</p>
          </div>
        </div>

        <div class="stats">
          <div class="stat-box stat-1">
            <p>Ocorrências</p>
            <div class="value">${total}</div>
          </div>
          <div class="stat-box stat-2">
            <p>Online</p>
            <div class="value">${cameraStats.online}</div>
          </div>
          <div class="stat-box stat-3">
            <p>Offline</p>
            <div class="value">${cameraStats.offline}</div>
          </div>
          <div class="stat-box stat-4">
            <p>Defeito</p>
            <div class="value">${cameraStats.defective}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Local</th>
              <th>Câmera</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Operador</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOccurrences.map((occ: any) => `
              <tr>
                <td>${occ.occurrenceDate}</td>
                <td>${occ.startTime} - ${occ.endTime}</td>
                <td>${occ.location}</td>
                <td>${occ.camera}</td>
                <td>${occ.type}</td>
                <td>${occ.classification}</td>
                <td>${occ.operator}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Relatório gerado automaticamente pelo Sistema de Videomonitoramento HUC</p>
          <p>Todos os dados são confidenciais e de uso restrito</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${period}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Relatório gerado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  const resolved = filteredOccurrences.filter((o: any) => o.classification === 'Encerrada').length;
  const total = filteredOccurrences.length;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Gerar Relatório</h3>
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">Período</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Mês Atual</SelectItem>
                <SelectItem value="all">Todos os Períodos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generatePDF} className="gap-2 bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4" />
            Baixar PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </Card>

      {/* Report Preview */}
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">RELATÓRIO DE MONITORAMENTO</h2>
              <p className="text-sm text-gray-600 mt-1">
                Filtro: {period === 'today' ? 'Hoje' : period === 'week' ? 'Última Semana' : period === 'month' ? 'Mês Atual' : 'Todos os Períodos'} | 
                Gerado em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold">HUC / ISGH</h3>
              <p className="text-xs text-gray-600">Segurança Eletrônica</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-xs text-gray-600 mb-2">Ocorrências</p>
              <p className="text-3xl font-bold text-blue-900">{total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-xs text-gray-600 mb-2">Online</p>
              <p className="text-3xl font-bold text-green-900">{cameraStats.online}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-xs text-gray-600 mb-2">Offline</p>
              <p className="text-3xl font-bold text-yellow-900">{cameraStats.offline}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-xs text-gray-600 mb-2">Defeito</p>
              <p className="text-3xl font-bold text-purple-900">{cameraStats.defective}</p>
            </div>
          </div>
        </div>

        {/* Occurrences Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Hora</th>
                <th className="px-4 py-3 text-left">Local</th>
                <th className="px-4 py-3 text-left">Câmera</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOccurrences.length > 0 ? (
                filteredOccurrences.map((occ: any) => (
                  <tr key={occ.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{occ.occurrenceDate}</td>
                    <td className="px-4 py-3">{occ.startTime} - {occ.endTime}</td>
                    <td className="px-4 py-3">{occ.location}</td>
                    <td className="px-4 py-3">{occ.camera}</td>
                    <td className="px-4 py-3">{occ.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        occ.classification === 'Encerrada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {occ.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3">{occ.operator}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma ocorrência registrada para este período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-6 border-t text-center text-xs text-gray-600">
          <p>Relatório gerado automaticamente pelo Sistema de Videomonitoramento HUC</p>
          <p>Todos os dados são confidenciais e de uso restrito</p>
        </div>
      </Card>
    </div>
  );
}
