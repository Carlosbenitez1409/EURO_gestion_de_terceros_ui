import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../lib/api.client';

interface EndpointTest {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  status: 'loading' | 'success' | 'error' | 'not-tested';
  response?: any;
  error?: any;
}

export default function EndpointDebug() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [endpoints, setEndpoints] = useState<EndpointTest[]>([
    { name: 'Nuevo: Lista Usuarios', url: '/api/user-management/', method: 'GET', status: 'not-tested' },
    { name: 'Anterior: Lista Usuarios', url: '/api/accounts/users/', method: 'GET', status: 'not-tested' },
    { name: 'Nuevo: Toggle Status', url: '/api/user-management/1/toggle_status/', method: 'POST', status: 'not-tested' },
    { name: 'Anterior: Update User', url: '/api/accounts/users/1/', method: 'PATCH', status: 'not-tested' },
  ]);

  const testEndpoint = async (index: number) => {
    const endpoint = endpoints[index];
    setEndpoints(prev => prev.map((ep, i) => 
      i === index ? { ...ep, status: 'loading' } : ep
    ));

    try {
      let response;
      if (endpoint.method === 'GET') {
        response = await apiRequest.get(endpoint.url);
      } else if (endpoint.method === 'POST') {
        response = await apiRequest.post(endpoint.url, {});
      } else if (endpoint.method === 'PATCH') {
        response = await apiRequest.patch(endpoint.url, { estado_empleado: 'activo' });
      }

      setEndpoints(prev => prev.map((ep, i) => 
        i === index ? { ...ep, status: 'success', response } : ep
      ));
    } catch (error) {
      setEndpoints(prev => prev.map((ep, i) => 
        i === index ? { ...ep, status: 'error', error } : ep
      ));
    }
  };

  const testAllEndpoints = async () => {
    for (let i = 0; i < endpoints.length; i++) {
      await testEndpoint(i);
      // Esperar un poco entre pruebas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <AppLayout
      userRole={user?.role || 'administrador'}
      userName={user?.full_name || 'Usuario'}
      currentPath={location.pathname}
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Debug de Endpoints</h1>
            <p className="text-muted-foreground">
              Verificar disponibilidad de endpoints del sistema de gestión de usuarios
            </p>
          </div>
          <Button onClick={testAllEndpoints}>
            Probar Todos los Endpoints
          </Button>
        </div>

        <div className="grid gap-4">
          {endpoints.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`text-white ${getStatusColor(endpoint.status)}`}
                    >
                      {endpoint.status.toUpperCase()}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => testEndpoint(index)}
                      disabled={endpoint.status === 'loading'}
                    >
                      Probar
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {endpoint.method} {endpoint.url}
                </CardDescription>
              </CardHeader>
              {(endpoint.response || endpoint.error) && (
                <CardContent>
                  {endpoint.status === 'success' && (
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Respuesta Exitosa:</h4>
                      <pre className="bg-green-50 p-3 rounded text-sm overflow-auto max-h-40">
                        {JSON.stringify(endpoint.response, null, 2)}
                      </pre>
                    </div>
                  )}
                  {endpoint.status === 'error' && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">Error:</h4>
                      <pre className="bg-red-50 p-3 rounded text-sm overflow-auto max-h-40">
                        {JSON.stringify(endpoint.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/empleados/lista')}
          >
            ← Volver a Lista de Empleados
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
