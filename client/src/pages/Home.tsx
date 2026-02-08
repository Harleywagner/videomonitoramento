import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, LogOut, Activity, Camera, BarChart3, FileText } from 'lucide-react';
import Dashboard from './Dashboard';
import Occurrences from './Occurrences';
import Cameras from './Cameras';
import Reports from './Reports';

const CREDENTIALS = {
  username: 'HUCprevenção',
  password: 'operadorTAJ',
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const logoutMutation = trpc.auth.logout.useMutation();
  const initializeCamerasMutation = trpc.cameras.initialize.useMutation();

  // Initialize cameras on first load
  useEffect(() => {
    if (isLoggedIn) {
      initializeCamerasMutation.mutate();
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
    } else {
      setLoginError('Usuário ou senha incorretos');
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      setIsLoggedIn(false);
      setActiveTab('dashboard');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-blue-900" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Videomonitoramento HUC</h1>
              <p className="text-sm text-gray-500 mt-2">Sistema Operacional</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Usuário
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Usuário"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Senha"
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
              >
                Acessar Sistema
              </Button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-6">
              Sistema restrito para operadores autorizados
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Videomonitoramento HUC</h1>
              <p className="text-xs text-gray-500">Sistema Operacional</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {CREDENTIALS.username}
              </p>
              <p className="text-xs text-gray-500">{new Date().toLocaleString('pt-BR')}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="occurrences" className="gap-2">
              <Activity className="w-4 h-4" />
              Ocorrências
            </TabsTrigger>
            <TabsTrigger value="cameras" className="gap-2">
              <Camera className="w-4 h-4" />
              Câmeras
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="occurrences" className="space-y-6">
            <Occurrences />
          </TabsContent>

          <TabsContent value="cameras" className="space-y-6">
            <Cameras />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Reports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
