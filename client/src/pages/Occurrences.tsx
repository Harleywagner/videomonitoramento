import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const OCCURRENCE_TYPES = [
  'Movimento suspeito',
  'Acesso não autorizado',
  'Tentativa de furto',
  'Furto consumado',
  'Vandalismo',
  'Violação de perímetro',
  'Alarme disparado',
  'Falha de equipamento',
  'Apoio operacional',
  'Acidente',
  'Confusão',
  'Outros',
];

const OPERATORS = ['Wagner', 'Ernesto', 'Glaucia', 'Arnaldo'];

export default function Occurrences() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    registrationDate: new Date().toISOString().split('T')[0],
    occurrenceDate: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endTime: '00:00',
    location: '',
    camera: '',
    type: '',
    classification: 'Em andamento' as const,
    operator: '',
    shift: 'Diurno' as const,
    technicalDescription: '',
    actionTaken: '',
    agenciesContacted: '',
  });

  // Fetch occurrences
  const occurrencesQuery = trpc.occurrences.list.useQuery(
    {
      search: searchTerm,
      type: filterType || undefined,
      classification: filterStatus || undefined,
    },
    { refetchInterval: 5000 }
  );

  const createMutation = trpc.occurrences.create.useMutation({
    onSuccess: () => {
      toast.success('Ocorrência registrada com sucesso!');
      occurrencesQuery.refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao registrar ocorrência: ' + error.message);
    },
  });

  const updateMutation = trpc.occurrences.update.useMutation({
    onSuccess: () => {
      toast.success('Ocorrência atualizada com sucesso!');
      occurrencesQuery.refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao atualizar ocorrência: ' + error.message);
    },
  });

  const deleteMutation = trpc.occurrences.delete.useMutation({
    onSuccess: () => {
      toast.success('Ocorrência removida com sucesso!');
      occurrencesQuery.refetch();
    },
    onError: (error) => {
      toast.error('Erro ao remover ocorrência: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      registrationDate: new Date().toISOString().split('T')[0],
      occurrenceDate: new Date().toISOString().split('T')[0],
      startTime: '00:00',
      endTime: '00:00',
      location: '',
      camera: '',
      type: '',
      classification: 'Em andamento',
      operator: '',
      shift: 'Diurno',
      technicalDescription: '',
      actionTaken: '',
      agenciesContacted: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.location || !formData.camera || !formData.type || !formData.operator || !formData.technicalDescription || !formData.actionTaken) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (occurrence: any) => {
    setFormData(occurrence);
    setEditingId(occurrence.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este registro?')) {
      deleteMutation.mutate(id);
    }
  };

  const occurrences = occurrencesQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Filters and Add Button */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Buscar por local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              {OCCURRENCE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="Encerrada">Encerrada</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova Ocorrência
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Ocorrência' : 'Registrar Nova Ocorrência'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data de Registro</label>
                <Input
                  type="date"
                  value={formData.registrationDate}
                  onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data de Ocorrência</label>
                <Input
                  type="date"
                  value={formData.occurrenceDate}
                  onChange={(e) => setFormData({ ...formData, occurrenceDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora Inicial</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora Final</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Local</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Estacionamento A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Câmera</label>
                <Input
                  value={formData.camera}
                  onChange={(e) => setFormData({ ...formData, camera: e.target.value })}
                  placeholder="Ex: NVR1-CAM01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCURRENCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={formData.classification} onValueChange={(value: any) => setFormData({ ...formData, classification: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Encerrada">Encerrada</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Operador</label>
                <Select value={formData.operator} onValueChange={(value) => setFormData({ ...formData, operator: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Turno</label>
                <Select value={formData.shift} onValueChange={(value: any) => setFormData({ ...formData, shift: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diurno">Diurno</SelectItem>
                    <SelectItem value="Noturno">Noturno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Órgãos Acionados</label>
                <Input
                  value={formData.agenciesContacted}
                  onChange={(e) => setFormData({ ...formData, agenciesContacted: e.target.value })}
                  placeholder="Ex: Polícia Militar, SAMU"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descrição Técnica</label>
                <Textarea
                  value={formData.technicalDescription}
                  onChange={(e) => setFormData({ ...formData, technicalDescription: e.target.value })}
                  placeholder="Descreva os fatos observados..."
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ação Tomada</label>
                <Textarea
                  value={formData.actionTaken}
                  onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                  placeholder="Quais medidas foram adotadas?"
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingId ? 'Atualizar' : 'Registrar'} Ocorrência
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Occurrences List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Local</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Operador</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {occurrences.map((occ: any) => (
                <tbody key={occ.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 text-sm text-gray-900">{occ.occurrenceDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{occ.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{occ.type}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        occ.classification === 'Encerrada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {occ.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{occ.operator}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(occ)}
                          className="gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(occ.id)}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedId(expandedId === occ.id ? null : occ.id)}
                          className="gap-1"
                        >
                          {expandedId === occ.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === occ.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-semibold text-gray-900">Descrição Técnica:</p>
                            <p className="text-gray-600">{occ.technicalDescription}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Ação Tomada:</p>
                            <p className="text-gray-600">{occ.actionTaken}</p>
                          </div>
                          {occ.agenciesContacted && (
                            <div>
                              <p className="font-semibold text-gray-900">Órgãos Acionados:</p>
                              <p className="text-gray-600">{occ.agenciesContacted}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </tbody>
          </table>
        </div>
        {occurrences.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhuma ocorrência registrada
          </div>
        )}
      </Card>
    </div>
  );
}
