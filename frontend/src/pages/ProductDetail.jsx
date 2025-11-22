import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, ArrowLeft, Minus, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const ProductDetail = ({ user, logout, darkMode, toggleDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState(localStorage.getItem('user_phone') || '');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Error al cargar producto');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseRequest = async () => {
    if (!phone) {
      toast.error('Ingresa tu número de teléfono');
      return;
    }

    try {
      const fullPhone = `+504${phone}`;
      
      await axiosInstance.post('/requests/purchase', {
        user_email: user?.email || 'invitado@ejemplo.com',
        user_name: user?.name || 'Invitado',
        user_phone: fullPhone,
        product_id: product.id,
        quantity
      });

      toast.success('¡Solicitud de compra creada exitosamente!');
      localStorage.setItem('user_phone', phone);
      fetchProduct();
      setQuantity(1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al enviar solicitud');
    }
  };

  const handleOutOfStockRequest = async () => {
    if (!phone) {
      toast.error('Ingresa tu número de teléfono');
      return;
    }

    try {
      const fullPhone = `+504${phone}`;
      
      await axiosInstance.post('/requests/out-of-stock', {
        product_id: product.id,
        phone: fullPhone,
        quantity
      });

      toast.success('¡Solicitud creada exitosamente! Te contactaremos cuando haya stock');
      localStorage.setItem('user_phone', phone);
      setQuantity(1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al enviar solicitud');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="inline-block w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar user={user} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a productos
          </Button>
          {user && user.role === 'admin' && (
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              data-testid="edit-product-btn"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Producto
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-sky-100 to-emerald-100 dark:from-gray-700 dark:to-gray-600">
              {(() => {
                const allImages = [];
                if (product.image_url) allImages.push({ 
                  url: product.image_url, 
                  description: null,
                  transform: product.image_transform || { scale: 1, x: 50, y: 50 }
                });
                if (product.images && product.images.length > 0) allImages.push(...product.images);
                
                const currentImage = allImages[selectedImageIndex];
                
                if (currentImage) {
                  const transform = currentImage.transform || { scale: 1, x: 50, y: 50 };
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src={currentImage.url} 
                        alt={currentImage.description || product.name} 
                        className="max-w-full max-h-full object-contain"
                        style={{
                          transform: `scale(${transform.scale})`,
                          transformOrigin: `${transform.x}% ${transform.y}%`
                        }}
                        data-testid="product-image"
                      />
                      {currentImage.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white p-4">
                          <p className="text-sm">{currentImage.description}</p>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-32 h-32 text-sky-300 dark:text-sky-600" />
                    </div>
                  );
                }
              })()}
            </div>

            {/* Thumbnail Gallery */}
            {(() => {
              const allImages = [];
              if (product.image_url) allImages.push({ url: product.image_url, description: null });
              if (product.images && product.images.length > 0) allImages.push(...product.images);
              
              if (allImages.length > 1) {
                return (
                  <div className="grid grid-cols-4 gap-3">
                    {allImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index 
                            ? 'border-sky-500 dark:border-sky-400 shadow-lg' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-600'
                        }`}
                      >
                        <img 
                          src={img.url} 
                          alt={`Vista ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.category && (
              <span className="inline-block px-4 py-2 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-full text-sm font-semibold">
                {product.category}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 dark:text-white" data-testid="product-detail-name">
              {product.name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400" data-testid="product-detail-description">
              {product.description}
            </p>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold text-sky-600 dark:text-sky-400" data-testid="product-detail-price">
                Lps {product.price.toFixed(2)}
              </span>
              <span className={`text-lg font-semibold ${product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} data-testid="product-detail-stock">
                {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
              </span>
            </div>

            {/* Purchase Form */}
            {product.stock > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-4" data-testid="purchase-form">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Solicitar Compra</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      data-testid="decrease-quantity-btn"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center dark:text-white" data-testid="quantity-display">{quantity}</span>
                    <Button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      data-testid="increase-quantity-btn"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Teléfono</label>
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 text-base py-6"
                      data-testid="phone-input"
                    />
                  </div>
                </div>

                <Button
                  onClick={handlePurchaseRequest}
                  className="w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 py-6 text-lg rounded-full"
                  data-testid="purchase-request-btn"
                >
                  Enviar Solicitud
                </Button>
              </div>
            )}

            {/* Out of Stock Request */}
            {product.stock === 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-4" data-testid="outofstock-form">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Solicitar cuando haya stock</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cantidad deseada</label>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center dark:text-white">{quantity}</span>
                    <Button
                      onClick={() => setQuantity(quantity + 1)}
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Teléfono</label>
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 text-base py-6"
                      data-testid="outofstock-phone-input"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleOutOfStockRequest}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 py-6 text-lg rounded-full"
                  data-testid="outofstock-request-btn"
                >
                  Solicitar Artículo
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
