import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Server, 
  Database, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface ApiConnectionStatus {
  isConnected: boolean;
  latency?: number;
  error?: string;
  lastChecked?: Date;
}

export function ApiConfiguration() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
  const [enableMock, setEnableMock] = useState(import.meta.env.VITE_ENABLE_MOCK_DATA === 'true');
  const [connectionStatus, setConnectionStatus] = useState<ApiConnectionStatus>({ isConnected: false });
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        setConnectionStatus({
          isConnected: true,
          latency,
          lastChecked: new Date()
        });
      } else {
        setConnectionStatus({
          isConnected: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          lastChecked: new Date()
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        isConnected: false,
        error: error.message || 'Error de conexión',
        lastChecked: new Date()
      });
    } finally {
      setIsChecking(false);
    }
  };

  const saveConfiguration = () => {
    // En un entorno real, esto se guardaría en un archivo de configuración
    // o en el localStorage para desarrollo
    localStorage.setItem('api_url', apiUrl);
    localStorage.setItem('enable_mock_data', enableMock.toString());
    
    // Recargar la página para aplicar los cambios
    window.location.reload();
  };

  useEffect(() => {
    // Cargar configuración guardada
    const savedApiUrl = localStorage.getItem('api_url');
    const savedEnableMock = localStorage.getItem('enable_mock_data');
    
    if (savedApiUrl) setApiUrl(savedApiUrl);
    if (savedEnableMock) setEnableMock(savedEnableMock === 'true');
    
    // Verificar conexión al cargar si no está en modo mock
    if (!enableMock) {
      checkConnection();
    }
  }, [enableMock]);

  const getStatusIcon = () => {
    if (enableMock) {
      return <Database className="h-5 w-5 text-blue-500" />;
    }
    
    if (isChecking) {
      return <RefreshCw className="h-5 w-5 text-gray-500 animate-spin" />;
    }
    
    if (connectionStatus.isConnected) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (enableMock) {
      return 'Datos Mock Activos';
    }
    
    if (isChecking) {
      return 'Verificando conexión...';
    }
    
    if (connectionStatus.isConnected) {
      return `Conectado ${connectionStatus.latency ? `(${connectionStatus.latency}ms)` : ''}`;
    }
    
    return 'Sin conexión';
  };

  const getStatusColor = () => {
    if (enableMock) return 'bg-blue-500';
    if (connectionStatus.isConnected) return 'bg-green-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de API
          </CardTitle>
          <CardDescription>
            Configura la conexión al backend o usa datos de prueba para desarrollo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado de conexión */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">{getStatusText()}</p>
                {connectionStatus.lastChecked && (
                  <p className="text-sm text-gray-500">
                    Última verificación: {connectionStatus.lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-white ${getStatusColor()}`}>
                {enableMock ? 'MOCK' : connectionStatus.isConnected ? 'ONLINE' : 'OFFLINE'}
              </Badge>
              {!enableMock && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkConnection}
                  disabled={isChecking}
                >
                  <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>

          {/* Modo de datos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="mock-mode" className="text-base font-medium">
                  Modo de datos de prueba
                </Label>
                <p className="text-sm text-gray-500">
                  Usar datos simulados en lugar del backend real
                </p>
              </div>
              <Switch
                id="mock-mode"
                checked={enableMock}
                onCheckedChange={setEnableMock}
              />
            </div>
          </div>

          {/* URL del API */}
          {!enableMock && (
            <div className="space-y-2">
              <Label htmlFor="api-url" className="text-base font-medium">
                URL del Backend
              </Label>
              <div className="flex gap-2">
                <Input
                  id="api-url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:3000/api"
                  className="flex-1"
                />
                <Button variant="outline" onClick={checkConnection} disabled={isChecking}>
                  <Wifi className="h-4 w-4" />
                </Button>
              </div>
              {connectionStatus.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{connectionStatus.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Información del entorno */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-gray-900">Variables de entorno</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">VITE_API_URL:</span>
                <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
                  {import.meta.env.VITE_API_URL || 'No definida'}
                </code>
              </div>
              <div>
                <span className="text-gray-500">VITE_ENABLE_MOCK_DATA:</span>
                <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
                  {import.meta.env.VITE_ENABLE_MOCK_DATA || 'false'}
                </code>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={saveConfiguration} className="flex-1">
              Aplicar Configuración
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Recargar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h5 className="font-medium">Frontend</h5>
              <p><span className="text-gray-500">Versión:</span> 1.0.0</p>
              <p><span className="text-gray-500">Entorno:</span> {import.meta.env.MODE}</p>
              <p><span className="text-gray-500">Build:</span> {import.meta.env.VITE_BUILD_DATE || 'Desarrollo'}</p>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium">Backend</h5>
              <p><span className="text-gray-500">Estado:</span> {connectionStatus.isConnected ? 'Disponible' : 'No disponible'}</p>
              <p><span className="text-gray-500">Modo:</span> {enableMock ? 'Mock Data' : 'API Real'}</p>
              <p><span className="text-gray-500">Timeout:</span> 5000ms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
