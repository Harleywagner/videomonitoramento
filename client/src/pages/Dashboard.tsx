import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Activity, CheckCircle, Clock, Percent, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { BarChart, PieChart } from '@/components/Charts';

export default function Dashboard() {
  const [refreshInterval, setRefreshInterval] = useState(0);

  // Fetch statistics
  const occurrenceStats = trpc.occurrences.stats.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const cameraStats = trpc.cameras.stats.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Auto-refresh trigger
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshInterval(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = occurrenceStats.data || { total: 0, resolved: 0, pending: 0, rate: 0 };
  const cameras = cameraStats.data || { total: 0, online: 0, offline: 0, defective: 0 };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Occurrence Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas de Ocorrências</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Total de Ocorrências"
            value={stats.total}
            color="text-blue-600"
          />
          <StatCard
            icon={CheckCircle}
            label="Ocorrências Resolvidas"
            value={stats.resolved}
            color="text-green-600"
          />
          <StatCard
            icon={Clock}
            label="Ocorrências Pendentes"
            value={stats.pending}
            color="text-orange-600"
          />
          <StatCard
            icon={Percent}
            label="Taxa de Resolução"
            value={`${stats.rate}%`}
            color="text-purple-600"
          />
        </div>
      </div>

      {/* Camera Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas de Câmeras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Total de Câmeras"
            value={cameras.total}
            color="text-gray-600"
          />
          <StatCard
            icon={Wifi}
            label="Câmeras Online"
            value={cameras.online}
            color="text-green-600"
          />
          <StatCard
            icon={WifiOff}
            label="Câmeras Offline"
            value={cameras.offline}
            color="text-red-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Câmeras com Defeito"
            value={cameras.defective}
            color="text-yellow-600"
          />
        </div>
      </div>

      {/* Status Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Taxa de Operação</p>
            <p className="text-2xl font-bold text-blue-600">
              {cameras.total > 0 ? Math.round((cameras.online / cameras.total) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {cameras.online} de {cameras.total} câmeras operacionais
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Ocorrências Ativas</p>
            <p className="text-2xl font-bold text-green-600">{stats.pending}</p>
            <p className="text-xs text-gray-500 mt-1">
              Aguardando resolução ou encerramento
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Eficiência</p>
            <p className="text-2xl font-bold text-purple-600">{stats.rate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              De ocorrências resolvidas
            </p>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          title="Status das Câmeras"
          data={{
            'Online': cameras.online,
            'Offline': cameras.offline,
            'Defeito': cameras.defective,
          }}
          colors={['#10b981', '#ef4444', '#f59e0b']}
        />
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        <p>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</p>
        <p>Dados sincronizados em tempo real entre todos os operadores</p>
      </div>
    </div>
  );
}
