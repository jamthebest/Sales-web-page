# E-Commerce App - TiendaApp

Aplicación de e-commerce completa con sistema de solicitudes de compra, gestión de inventario, y editor de imágenes interactivo.

## Características

- 🛍️ Catálogo de productos con búsqueda en tiempo real
- 📱 Sistema de solicitudes sin necesidad de verificación telefónica
- 🎨 Editor de imágenes interactivo para productos
- 🌓 Modo oscuro completo
- 📦 Panel de administración para gestión de productos y solicitudes
- 🇭🇳 Preconfigurado para Honduras (+504)

## Tecnologías

- **Frontend**: React 19, TailwindCSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Base de datos**: MongoDB
- **Estilos**: TailwindCSS con soporte de modo oscuro

## Requisitos Previos

- Node.js (v16 o superior)
- Python (v3.9 o superior)
- MongoDB (v4.4 o superior)
- Yarn (package manager)

## Configuración de la Base de Datos

### MongoDB

Esta aplicación utiliza MongoDB. No se requieren consultas SQL.

#### 1. Instalar MongoDB

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
```

**macOS (con Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Windows:**
Descarga el instalador desde [mongodb.com](https://www.mongodb.com/try/download/community)

#### 2. Iniciar MongoDB

```bash
# Ubuntu/Debian/macOS
sudo systemctl start mongodb
# o
mongod --dbpath /path/to/data/directory
```

#### 3. Crear Base de Datos

MongoDB crea la base de datos automáticamente al insertar el primer documento. Sin embargo, puedes verificar la conexión:

```bash
mongosh
> use ecommerce_db
> show collections
```

### Estructura de Colecciones

La aplicación crea automáticamente las siguientes colecciones:

1. **products**: Productos del catálogo
   - Campos: id, name, description, price, stock, image_url, image_transform, images, category, created_at

2. **users**: Usuarios del sistema
   - Campos: id, email, name, created_at

3. **user_sessions**: Sesiones de usuario
   - Campos: user_id, session_token, expires_at, created_at

4. **purchase_requests**: Solicitudes de compra
   - Campos: id, user_email, user_name, user_phone, product_id, product_name, quantity, price, status, created_at

5. **out_of_stock_requests**: Solicitudes de productos sin stock
   - Campos: id, product_id, product_name, phone, quantity, verified, status, created_at

6. **custom_requests**: Solicitudes de artículos personalizados
   - Campos: id, phone, description, quantity, verified, status, created_at

#### Datos de Prueba (Opcional)

Si deseas insertar productos de prueba:

```javascript
// Conecta a MongoDB
mongosh

// Selecciona la base de datos
use ecommerce_db

// Inserta productos de prueba
db.products.insertMany([
  {
    id: "prod-001",
    name: "Laptop Dell XPS 15",
    description: "Laptop profesional con procesador Intel i7, 16GB RAM, SSD 512GB",
    price: 1299.99,
    stock: 14,
    image_url: "https://example.com/laptop.jpg",
    image_transform: { scale: 1, x: 50, y: 50 },
    images: [],
    category: "Electrónica",
    created_at: new Date().toISOString()
  },
  {
    id: "prod-002",
    name: "iPhone 14 Pro",
    description: "Smartphone Apple con pantalla OLED, 256GB",
    price: 1099.99,
    stock: 2,
    image_url: "https://example.com/iphone.jpg",
    image_transform: { scale: 1, x: 50, y: 50 },
    images: [],
    category: "Smartphones",
    created_at: new Date().toISOString()
  }
])
```

## Instalación y Ejecución Local

### Backend (FastAPI)

1. **Navega al directorio del backend:**
```bash
cd backend
```

2. **Crea un entorno virtual (recomendado):**
```bash
python -m venv venv

# Activa el entorno virtual
# En Linux/macOS:
source venv/bin/activate
# En Windows:
venv\Scripts\activate
```

3. **Instala las dependencias:**
```bash
pip install -r requirements.txt
```

4. **Configura las variables de entorno:**

Crea un archivo `.env` en el directorio `backend/`:

```env
MONGO_URL=mongodb://localhost:27017/ecommerce_db
PORT=8001
```

5. **Ejecuta el servidor:**
```bash
# Opción 1: Con uvicorn directamente
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Opción 2: Con el script de Python
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

El backend estará disponible en: `http://localhost:8001`

**Documentación de la API:**
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Frontend (React)

1. **Navega al directorio del frontend:**
```bash
cd frontend
```

2. **Instala las dependencias:**
```bash
yarn install
```

3. **Configura las variables de entorno:**

Crea un archivo `.env` en el directorio `frontend/`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=0
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

4. **Ejecuta el servidor de desarrollo:**
```bash
yarn start
```

El frontend estará disponible en: `http://localhost:3000`

### Ejecución en Producción

#### Backend

```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

#### Frontend

```bash
cd frontend
yarn build
# Servir los archivos estáticos con un servidor como nginx o usar serve
npx serve -s build -l 3000
```

## Estructura del Proyecto

```
/app
├── backend/
│   ├── server.py           # Servidor FastAPI principal
│   ├── requirements.txt    # Dependencias de Python
│   └── .env               # Variables de entorno (crear)
├── frontend/
│   ├── public/            # Archivos estáticos
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   └── ui/       # Componentes de Shadcn/UI
│   │   ├── pages/        # Páginas de la aplicación
│   │   │   ├── Landing.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.js        # Componente principal
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json      # Dependencias de Node.js
│   ├── tailwind.config.js
│   └── .env             # Variables de entorno (crear)
└── README.md            # Este archivo
```

## Uso de la Aplicación

### Usuario Final

1. **Navegar productos**: Página principal con búsqueda en tiempo real
2. **Ver detalles**: Click en cualquier producto
3. **Solicitar compra**: Ingresar teléfono y cantidad (sin login requerido)
4. **Solicitud personalizada**: Click en "Solicitar Artículo Personalizado"

### Administrador

1. **Acceso**: `/admin` (requiere login con Google)
2. **Gestión de productos**: Crear, editar, eliminar productos
3. **Editor de imágenes**: Ajustar zoom y posición de imágenes de productos
4. **Ver solicitudes**: Panel con todas las solicitudes recibidas

## Características Técnicas

### Frontend

- **React Hooks**: `useState`, `useEffect`, `useRef`
- **Routing**: React Router v6
- **Estilos**: TailwindCSS con modo oscuro
- **Componentes UI**: Shadcn/UI
- **Lazy Loading**: Productos con IntersectionObserver
- **Debouncing**: Búsqueda optimizada

### Backend

- **Framework**: FastAPI con async/await
- **Validación**: Pydantic models
- **Base de datos**: Motor (driver async de MongoDB)
- **CORS**: Configurado para desarrollo
- **Logging**: Configuración personalizada

### Seguridad

- Validación de datos con Pydantic
- CORS configurado
- Sesiones con cookies HttpOnly
- Sin contraseñas en código (usar variables de entorno)

## Solución de Problemas

### Backend no se conecta a MongoDB

**Error**: `pymongo.errors.ServerSelectionTimeoutError`

**Solución**:
```bash
# Verifica que MongoDB esté ejecutándose
sudo systemctl status mongodb

# Verifica la URL de conexión en .env
cat backend/.env
```

### Frontend no se conecta al Backend

**Error**: `Network Error` o `CORS Error`

**Solución**:
1. Verifica que el backend esté ejecutándose: `http://localhost:8001`
2. Verifica REACT_APP_BACKEND_URL en `frontend/.env`
3. Verifica la configuración de CORS en `server.py`

### Dependencias no se instalan

**Python**:
```bash
# Actualiza pip
pip install --upgrade pip

# Instala de nuevo
pip install -r requirements.txt --force-reinstall
```

**Node.js**:
```bash
# Limpia caché de yarn
yarn cache clean

# Elimina node_modules y reinstala
rm -rf node_modules
yarn install
```

## Scripts Útiles

### Backend

```bash
# Verificar sintaxis
python -m py_compile server.py

# Ver logs
tail -f logs/app.log

# Reiniciar servicio (si usas systemd)
sudo systemctl restart backend
```

### Frontend

```bash
# Limpiar build
yarn clean

# Build de producción
yarn build

# Analizar bundle
yarn build --stats
```

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Contacto

Para soporte o consultas, contacta a través del panel de administración.

## Notas Adicionales

- Esta aplicación está optimizada para Honduras (código de país +504)
- El sistema no requiere verificación telefónica
- Todas las solicitudes se guardan automáticamente en MongoDB
- El editor de imágenes permite control preciso de zoom y posición
- El modo oscuro se activa con el toggle en el navbar
