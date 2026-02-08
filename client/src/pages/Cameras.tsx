import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function Cameras() {
  const [currentNvr, setCurrentNvr] = useState(1);
  const [selectedCamera, setSelectedCamera] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState('Online');
  const [modalObs, setModalObs] = useState('');

  // Fetch cameras for current NVR
  const camerasQuery = trpc.cameras.getByNvr.useQuery(currentNvr, {
    refetchInterval: 5000,
  });

  const updateMutation = trpc.cameras.update.useMutation({
    onSuccess: () => {
      toast.success('Câmera atualizada com sucesso!');
      camerasQuery.refetch();
      setShowModal(false);
      setSelectedCamera(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar câmera: ' + error.message);
    },
  });

  const handleCameraClick = (camera: any) => {
    setSelectedCamera(camera);
    setModalStatus(camera.status);
    setModalObs(camera.obs || '');
    setShowModal(true);
  };

  const handleUpdateCamera = () => {
    if (!selectedCamera) return;

    updateMutation.mutate({
      id: selectedCamera.id,
      data: {
        status: modalStatus as any,
        obs: modalObs,
      },
    });
  };

  const cameras = camerasQuery.data || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Online':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'Offline':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'Defeito':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online':
        return 'border-green-500 bg-green-50';
      case 'Offline':
        return 'border-red-500 bg-red-50';
      case 'Defeito':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* NVR Selector */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Selecione um NVR</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((nvr) => (
            <Button
              key={nvr}
              onClick={() => setCurrentNvr(nvr)}
              variant={currentNvr === nvr ? 'default' : 'outline'}
              className={currentNvr === nvr ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              NVR {nvr}
            </Button>
          ))}
        </div>
      </Card>

      {/* Camera Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Câmeras do NVR {currentNvr}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {cameras.map((camera: any) => (
            <button
              key={camera.id}
              onClick={() => handleCameraClick(camera)}
              className={`p-4 border-2 rounded-lg transition-all hover:shadow-md cursor-pointer ${getStatusColor(camera.status)}`}
            >
              <div className="flex flex-col items-center gap-2">
                {getStatusIcon(camera.status)}
                <span className="text-sm font-semibold text-gray-900">{camera.id}</span>
                <span className="text-xs text-gray-600">{camera.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resumo do NVR {currentNvr}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Online</p>
            <p className="text-2xl font-bold text-green-600">
              {cameras.filter((c: any) => c.status === 'Online').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Offline</p>
            <p className="text-2xl font-bold text-red-600">
              {cameras.filter((c: any) => c.status === 'Offline').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Defeito</p>
            <p className="text-2xl font-bold text-yellow-600">
              {cameras.filter((c: any) => c.status === 'Defeito').length}
            </p>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {showModal && selectedCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Configurar {selectedCamera.id}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status da Câmera</label>
                  <Select value={modalStatus} onValueChange={setModalStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                      <SelectItem value="Defeito">Defeito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Observações Técnicas</label>
                  <Textarea
                    value={modalObs}
                    onChange={(e) => setModalObs(e.target.value)}
                    placeholder="Descreva o problema ou manutenção realizada..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedCamera(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateCamera}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Atualizar Câmera
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
