import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, Shield, Zap, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const Landing = ({ user, logout }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);
  const PRODUCTS_PER_PAGE = 6;

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      loadMoreProducts();
    }
  }, [products, page]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading]);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const loadMoreProducts = () => {
    if (loading) return;
    
    setLoading(true);
    const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const newProducts = products.slice(startIndex, endIndex);
    
    if (newProducts.length > 0) {
      setTimeout(() => {
        setDisplayedProducts(prev => [...prev, ...newProducts]);
        setLoading(false);
        if (endIndex >= products.length) {
          setHasMore(false);
        }
      }, 300);
    } else {
      setHasMore(false);
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/`;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent leading-tight" data-testid="hero-title">
            Tu Tienda de Confianza
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Encuentra los mejores productos y realiza solicitudes de compra de manera rápida y segura
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid="feature-easy">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Rápido y Fácil</h3>
            <p className="text-gray-600">Realiza solicitudes de compra en segundos sin complicaciones de pago</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid="feature-inventory">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Inventario en Tiempo Real</h3>
            <p className="text-gray-600">Conoce la disponibilidad exacta de cada producto al instante</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid="feature-secure">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Verificación Segura</h3>
            <p className="text-gray-600">Verifica tu teléfono una vez y realiza múltiples solicitudes</p>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent" data-testid="products-section-title">
              Nuestros Productos
            </h2>
            <Button
              onClick={() => navigate('/custom-request')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="custom-request-cta-btn"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Solicitar Artículo Personalizado
            </Button>
          </div>

          {displayedProducts.length === 0 && !loading ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">No hay productos disponibles</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
                {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 cursor-pointer group"
                    onClick={() => navigate(`/products/${product.id}`)}
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="aspect-square bg-gradient-to-br from-sky-100 to-emerald-100 relative overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-20 h-20 text-sky-300" />
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Agotado
                        </div>
                      )}
                      {product.stock > 0 && product.stock < 10 && (
                        <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Últimas {product.stock} unidades
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      {product.category && (
                        <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold mb-2">
                          {product.category}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-gray-800 mb-2" data-testid={`product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-sky-600" data-testid={`product-price-${product.id}`}>
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500" data-testid={`product-stock-${product.id}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Observer target */}
              <div ref={observerTarget} className="h-4" />

              {!hasMore && displayedProducts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Has visto todos los productos</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Custom Request CTA */}
        <div className="mt-16 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-3xl p-8 text-white text-center shadow-2xl">
          <Sparkles className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4">¿No encuentras lo que buscas?</h3>
          <p className="text-lg mb-6 opacity-90">Solicita cualquier artículo que necesites y te contactaremos</p>
          <Button
            onClick={() => navigate('/custom-request')}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-lg"
            data-testid="custom-request-bottom-btn"
          >
            Solicitar Artículo Personalizado
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
