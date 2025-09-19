# 🏢 Sistema de Gestión de Terceros - EURO

Sistema integral para la gestión de terceros (proveedores, empleados, etc.) desarrollado con React + TypeScript y Django REST Framework.

## 🚀 Estado del Proyecto

**✅ LISTO PARA PRODUCCIÓN**
- ✅ Integración completa con Django REST Framework
- ✅ Autenticación JWT funcional
- ✅ Dashboard en tiempo real
- ✅ CRUD de terceros completo
- ✅ Componentes de testing removidos

## 🔧 Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** + **shadcn/ui** para styling
- **Tanstack Query** para manejo de estado servidor
- **React Router** para navegación
- **Axios** para HTTP requests

### Backend
- **Django REST Framework**
- **JWT Authentication**
- **PostgreSQL** / **SQLite** (configurable)

## 🏗️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Backend Django ejecutándose en `http://127.0.0.1:8000`

### Instalación
```bash
# Clonar el repositorio
git clone [repository-url]
cd EURO_FRONTEND

# Instalar dependencias
npm install

# Configurar variables de entorno (seleccionar según entorno)
# Para desarrollo local usar .env.local
# Para producción usar .env.production
cp .env.local .env  # Para desarrollo
# O
cp .env.production .env  # Para producción
```

### Configuración de Entorno

#### 🔧 Variables de Entorno Importantes

**Para Desarrollo (usar .env.local como base):**
- `VITE_API_URL=/api` - Usa proxy de Vite para llamadas API
- `VITE_PROXY_TARGET=http://127.0.0.1:8000` - Backend Django
- `VITE_PORT=8080` - Puerto del frontend

**Para Producción (usar .env.production como base):**
- `VITE_API_URL=http://66.23.233.50:8020/api` - URL directa al backend
- `VITE_APP_URL=http://66.23.233.50:8020` - URL pública del frontend

#### ⚠️ Solución de Problemas Comunes

**Error 404 en /auth/login/:**
El backend Django requiere que las rutas de autenticación estén bajo `/api/auth/login/`. 
Asegúrate de que:
1. `VITE_API_URL` esté configurado correctamente
2. En desarrollo use `/api` para aprovechar el proxy de Vite
3. En producción use la URL completa con `/api` incluido

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev

# El frontend estará disponible en http://localhost:8081
```

### Producción
```bash
# Construir para producción
npm run build:production

# Vista previa de la build
npm run preview
```

## 🔐 Credenciales de Acceso

**Usuario de prueba:**
- Usuario: `superadmin`
- Contraseña: `admin123`
- Rol: `procesos`

## 📱 Funcionalidades Principales

### 🏠 Dashboard
- Métricas en tiempo real de terceros
- Auto-refresh cada 5 minutos
- Estadísticas por estado y tipo
- Indicadores de rendimiento

### 👥 Gestión de Terceros
- Lista completa con filtros
- Creación de nuevos terceros
- Estados de aprobación
- Documentos y validaciones

### 🔒 Autenticación
- Login JWT seguro
- Protección de rutas
- Manejo automático de tokens
- Logout con limpieza de sesión

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/login/` - Iniciar sesión
- `GET /api/auth/me/` - Obtener usuario actual
- `POST /api/auth/refresh/` - Renovar token

### Terceros
- `GET /api/terceros/` - Lista de terceros
- `POST /api/terceros/` - Crear tercero
- `GET /api/terceros/{id}/` - Detalle de tercero
- `PUT /api/terceros/{id}/` - Actualizar tercero
- `GET /api/terceros/stats/` - Estadísticas

## 📂 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── auth/            # Autenticación
│   ├── dashboard/       # Dashboard
│   ├── terceros/        # Gestión de terceros
│   └── ui/              # Componentes UI base
├── hooks/               # Custom hooks
├── lib/                 # Utilidades y configuración
├── pages/               # Páginas principales
├── services/            # Servicios API
├── types/               # Definiciones TypeScript
└── context/             # Context providers
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build:production` - Build para producción
- `npm run preview` - Vista previa de la build
- `npm run type-check` - Verificación de TypeScript
- `npm run lint` - Linter ESLint

## 🚀 Despliegue

### Variables de Entorno de Producción
```env
VITE_API_URL=https://api.yourdomain.com
```

### Consideraciones de Despliegue
1. Configurar CORS en Django para el dominio de producción
2. Configurar HTTPS/SSL
3. Optimizar images y assets
4. Configurar CDN si es necesario

## 📈 Monitoreo y Métricas

El sistema incluye:
- Dashboard con métricas en tiempo real
- Indicadores de estado del sistema
- Conexión con API backend
- Auto-refresh de datos

## 🛡️ Seguridad

- JWT tokens con expiración
- Refresh tokens automático
- Protección CSRF
- Validación de entrada
- Sanitización de datos

## 📝 Changelog

### v1.0.0 (Agosto 2025)
- ✅ Integración completa Django + React
- ✅ Sistema de autenticación JWT
- ✅ Dashboard en tiempo real
- ✅ CRUD de terceros funcional
- ✅ Componentes de testing removidos
- ✅ Proyecto listo para producción

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Proyecto privado - EURO Supermercados

---

**Desarrollado con ❤️ para EURO Supermercados**
