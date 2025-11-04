import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, Shield, Zap } from 'lucide-react';

const Landing = ({ user, logout }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/products`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Navbar */}
      <nav className="backdrop-blur-md bg-white/70 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-sky-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">TiendaApp</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Hola, {user.name}</span>
                  <Button onClick={() => navigate('/products')} variant="outline" data-testid="nav-products-btn">
                    Ver Productos
                  </Button>
                  {user.role === 'admin' && (
                    <Button onClick={() => navigate('/admin')} variant="outline" data-testid="nav-admin-btn">
                      Admin
                    </Button>
                  )}
                  <Button onClick={logout} variant="ghost" data-testid="logout-btn">Cerrar Sesión</Button>
                </>
              ) : (
                <Button onClick={handleLogin} className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700" data-testid="login-btn">
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent leading-tight" data-testid="hero-title">
            Tu Tienda de Confianza
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Encuentra los mejores productos y realiza solicitudes de compra de manera rápida y segura
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              onClick={() => navigate('/products')} 
              size="lg" 
              className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
              data-testid="explore-products-btn"
            >
              Explorar Productos
            </Button>
            {!user && (
              <Button 
                onClick={handleLogin} 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 rounded-full border-2 border-sky-600 text-sky-600 hover:bg-sky-50"
                data-testid="get-started-btn"
              >
                Comenzar
              </Button>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid="feature-easy">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Rápido y Fácil</h3>
            <p className="text-gray-600">Realiza solicitudes de compra en segundos sin complicaciones de pago</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid="feature-inventory">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Inventario en Tiempo Real</h3>
            <p className="text-gray-600">Conoce la disponibilidad exacta de cada producto al instante</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid="feature-secure">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Verificación Segura</h3>
            <p className="text-gray-600">Verifica tu teléfono una vez y realiza múltiples solicitudes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
