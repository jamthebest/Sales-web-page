import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Plus, Sparkles, Upload, Minus, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const Landing = ({ user, logout, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const observerTarget = useRef(null);
  const stickyHeaderRef = useRef(null);
  const bottomBannerRef = useRef(null);
  const debounceTimer = useRef(null);
  const headerSentinelRef = useRef(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    description: '',
    image_url: '',
    image_file: null,
    quantity: 1,
    phone: ''
  });
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [mockCode, setMockCode] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isHeaderStuck, setIsHeaderStuck] = useState(false);
  const PRODUCTS_PER_PAGE = 6;

  useEffect(() => {
    fetchProducts();
  }, []);

  // Debounce effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 600);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
      setDisplayedProducts([]);
      setPage(1);
      setHasMore(true);
    } else {
      setFilteredProducts(products);
      setDisplayedProducts([]);
      setPage(1);
      setHasMore(true);
    }
  }, [debouncedSearchTerm, products]);

  useEffect(() => {
    const productsToDisplay = debouncedSearchTerm ? filteredProducts : products;
    if (productsToDisplay.length > 0) {
      loadMoreProducts();
    }
  }, [filteredProducts, products, page]);

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

  // Sticky header logic - detect when header is stuck
  useEffect(() => {
    const sentinel = headerSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not visible, header is stuck
        setIsHeaderStuck(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-65px 0px 0px 0px' } // 64px navbar + 1px
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, []);

  // Logic for bottom banner
  useEffect(() => {
    const handleScroll = () => {
      if (stickyHeaderRef.current && bottomBannerRef.current) {
        const bannerRect = bottomBannerRef.current.getBoundingClientRect();
        const headerHeight = stickyHeaderRef.current.offsetHeight;
        
        if (bannerRect.top <= headerHeight + 64) { // 64px is navbar height
          stickyHeaderRef.current.style.position = 'relative';
        } else {
          stickyHeaderRef.current.style.position = 'sticky';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    const productsToDisplay = debouncedSearchTerm ? filteredProducts : products;
    const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const newProducts = productsToDisplay.slice(startIndex, endIndex);
    
    if (newProducts.length > 0) {
      setTimeout(() => {
        setDisplayedProducts(prev => {
          // Si es la primera página después de buscar, resetear
          if (page === 1 && debouncedSearchTerm) {
            return newProducts;
          }
          return [...prev, ...newProducts];
        });
        setLoading(false);
        if (endIndex >= productsToDisplay.length) {
          setHasMore(false);
        }
      }, 300);
    } else {
      setHasMore(false);
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setCustomForm({ ...customForm, image_file: file, image_url: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const submitCustomRequest = async () => {
    if (!customForm.name) {
      toast.error('Ingresa el nombre del artículo');
      return;
    }

    if (!customForm.phone) {
      toast.error('Ingresa tu número de teléfono');
      return;
    }

    try {
      let imageInfo = '';
      if (imagePreview) {
        imageInfo = customForm.image_file ? ' | Imagen adjunta' : ` | Imagen: ${customForm.image_url}`;
      }

      const fullPhone = `+504${customForm.phone}`;

      await axiosInstance.post('/requests/custom', {
        phone: fullPhone,
        description: `${customForm.name}${customForm.description ? ' - ' + customForm.description : ''}${imageInfo}`,
        quantity: customForm.quantity
      });

      toast.success('¡Solicitud creada exitosamente! Te contactaremos pronto');
      setShowCustomModal(false);
      resetCustomForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al enviar solicitud');
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    await handleRequestVerification();
  };

  const resetCustomForm = () => {
    setCustomForm({
      name: '',
      description: '',
      image_url: '',
      image_file: null,
      quantity: 1,
      phone: ''
    });
    setImagePreview('');
    setVerificationCode('');
    setMockCode('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <Navbar user={user} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-emerald-600 dark:from-sky-400 dark:via-blue-400 dark:to-emerald-400 bg-clip-text text-transparent leading-tight" data-testid="hero-title">
            Tu Tienda de Confianza
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Encuentra los mejores productos y realiza solicitudes de compra de manera rápida y segura
          </p>
        </div>

        {/* Sentinel element for intersection observer */}
        <div ref={headerSentinelRef} className="h-1" />

        {/* Sticky Products Header */}
        <div 
          ref={stickyHeaderRef}
          className={`sticky top-16 z-40 py-6 mb-6 transition-all duration-300 ${
            isHeaderStuck 
              ? 'backdrop-blur-md bg-gradient-to-br from-sky-50/90 via-white/90 to-emerald-50/90 dark:from-gray-900/90 dark:via-gray-800/90 dark:to-gray-900/90 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm' 
              : 'bg-transparent'
          }`}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 dark:from-sky-400 dark:to-emerald-400 bg-clip-text text-transparent flex-shrink-0" data-testid="products-section-title">
              Nuestros Productos
            </h2>
            
            {/* Search Bar - Center */}
            <div className="relative w-full max-w-xl flex items-center">
              <Search className="absolute left-3 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-12 py-6 text-base rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-sky-400"
                data-testid="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  data-testid="clear-search-btn"
                  type="button"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>

            {/* Custom Request Button */}
            <Button
              onClick={() => setShowCustomModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 whitespace-nowrap flex-shrink-0"
              data-testid="custom-request-cta-btn"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Solicitar Artículo Personalizado</span>
              <span className="sm:hidden">Solicitar Artículo</span>
            </Button>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          {displayedProducts.length === 0 && !loading ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              {debouncedSearchTerm ? (
                <>
                  <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">No se encontraron productos</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Intenta con otros términos de búsqueda</p>
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="mt-4"
                    data-testid="clear-search-empty-btn"
                  >
                    Limpiar búsqueda
                  </Button>
                </>
              ) : (
                <p className="text-xl text-gray-500 dark:text-gray-400">No hay productos disponibles</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
                {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer group"
                    onClick={() => navigate(`/products/${product.id}`)}
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="aspect-square bg-gradient-to-br from-sky-100 to-emerald-100 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-20 h-20 text-sky-300 dark:text-sky-600" />
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
                        <span className="inline-block px-3 py-1 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-full text-xs font-semibold mb-2">
                          {product.category}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2" data-testid={`product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-sky-600 dark:text-sky-400" data-testid={`product-price-${product.id}`}>
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400" data-testid={`product-stock-${product.id}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              <div ref={observerTarget} className="h-4" />

              {!hasMore && displayedProducts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Has visto todos los productos</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Custom Request CTA Banner */}
        <div ref={bottomBannerRef} className="mt-16 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-3xl p-8 text-white text-center shadow-2xl">
          <Sparkles className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4">¿No encuentras lo que buscas?</h3>
          <p className="text-lg mb-6 opacity-90">Solicita cualquier artículo que necesites y te contactaremos</p>
          <Button
            onClick={() => setShowCustomModal(true)}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-lg"
            data-testid="custom-request-bottom-btn"
          >
            Solicitar Artículo Personalizado
          </Button>
        </div>
      </div>

      {/* Custom Request Modal */}
      <Dialog open={showCustomModal} onOpenChange={(open) => {
        setShowCustomModal(open);
        if (!open) resetCustomForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800" data-testid="custom-request-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Solicitar Artículo Personalizado
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Nombre del Artículo *
              </label>
              <Input
                type="text"
                placeholder="Ej: Laptop Gaming RTX 4090"
                value={customForm.name}
                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                className="text-base py-6 border-2"
                data-testid="custom-name-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Descripción (Opcional)
              </label>
              <Textarea
                placeholder="Describe las características, especificaciones..."
                value={customForm.description}
                onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                rows={3}
                className="text-base border-2"
                data-testid="custom-description-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Imagen del Artículo (Opcional)
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="URL de imagen: https://ejemplo.com/imagen.jpg"
                    value={customForm.image_url}
                    onChange={(e) => {
                      setCustomForm({ ...customForm, image_url: e.target.value, image_file: null });
                      setImagePreview(e.target.value);
                    }}
                    className="flex-1"
                    data-testid="custom-image-url-input"
                  />
                </div>
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm">o</div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    data-testid="custom-image-file-input"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Imagen (máx 5MB)
                      </span>
                    </Button>
                  </label>
                </div>
                {imagePreview && (
                  <div className="relative mt-4 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview('');
                        setCustomForm({ ...customForm, image_url: '', image_file: null });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Cantidad *
              </label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  onClick={() => setCustomForm({ ...customForm, quantity: Math.max(1, customForm.quantity - 1) })}
                  variant="outline"
                  size="icon"
                  className="rounded-full w-10 h-10"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center">{customForm.quantity}</span>
                <Button
                  type="button"
                  onClick={() => setCustomForm({ ...customForm, quantity: customForm.quantity + 1 })}
                  variant="outline"
                  size="icon"
                  className="rounded-full w-10 h-10"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Teléfono de Contacto *
              </label>
              <div className="flex gap-2">
                <select 
                  disabled
                  className="w-28 px-3 py-3 text-base border-2 border-gray-200 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value="+504"
                >
                  <option value="+504">🇭🇳 +504</option>
                </select>
                <Input
                  type="tel"
                  placeholder="1234 5678"
                  value={customForm.phone}
                  onChange={(e) => setCustomForm({ ...customForm, phone: e.target.value.replace(/\D/g, '') })}
                  className="flex-1 text-base py-6 border-2"
                  data-testid="custom-phone-input"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa tu número de teléfono de Honduras</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6 text-lg"
              data-testid="submit-custom-request-btn"
            >
              Enviar Solicitud
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="dark:bg-gray-800" data-testid="verification-dialog">
          <DialogHeader>
            <DialogTitle>Verificar Teléfono</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hemos enviado un código de verificación al número {customForm.phone}
            </p>
            {mockCode && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">MOCK: Código de prueba</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200 mt-2">{mockCode}</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">También visible en los logs del servidor</p>
              </div>
            )}
            <Input
              type="text"
              placeholder="Ingresa el código"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="text-center text-2xl tracking-widest"
              data-testid="verification-code-input"
            />
            <Button
              onClick={handleVerifyCode}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="verify-code-btn"
            >
              Verificar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
