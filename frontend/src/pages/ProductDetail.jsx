import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, ArrowLeft, Minus, Plus, Edit, Video } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import SuccessModal from '@/components/SuccessModal';
import ImageModal from '@/components/ImageModal';
import ReactMarkdown from 'react-markdown';

const ProductDetail = ({ user, logout, darkMode, toggleDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState(localStorage.getItem('user_phone') || '');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      setSuccessMessage('¡Solicitud de compra creada exitosamente!');
      setShowSuccessModal(true);
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
        user_email: user?.email || 'invitado@ejemplo.com',
        user_name: user?.name || 'Invitado',
        product_id: product.id,
        phone: fullPhone,
        quantity
      });

      setSuccessMessage('¡Solicitud creada exitosamente! Te contactaremos cuando haya stock');
      setShowSuccessModal(true);
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

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    const backendUrl = axiosInstance.defaults.baseURL.replace('/api', '');
    return `${backendUrl}${url}`;
  };

  const getAllImages = () => {
    if (!product) return [];
    const images = [];
    if (product.image_url) {
      images.push({
        url: product.image_url,
        description: null,
        transform: product.image_transform || { scale: 1, x: 50, y: 50 }
      });
    }
    if (product.images && product.images.length > 0) {
      images.push(...product.images);
    }
    return images;
  };

  const allImages = getAllImages();
  const currentImage = allImages[selectedImageIndex];

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

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
              {currentImage ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  {currentImage.type === 'video' ? (
                    <video
                      src={getFullUrl(currentImage.url)}
                      controls
                      autoPlay
                      className="max-w-full max-h-full cursor-pointer"
                      style={{
                        transform: `scale(${currentImage.transform?.scale || 1})`,
                        transformOrigin: `${currentImage.transform?.x || 50}% ${currentImage.transform?.y || 50}%`
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsModalOpen(true);
                      }}
                    />
                  ) : (
                    <img
                      src={getFullUrl(currentImage.url)}
                      alt={currentImage.description || product.name}
                      className="max-w-full max-h-full object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                      style={{
                        transform: `scale(${currentImage.transform?.scale || 1})`,
                        transformOrigin: `${currentImage.transform?.x || 50}% ${currentImage.transform?.y || 50}%`
                      }}
                      onClick={() => setIsModalOpen(true)}
                      data-testid="product-image"
                    />
                  )}
                  {currentImage.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white p-4">
                      <p className="text-sm">{currentImage.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-32 h-32 text-sky-300 dark:text-sky-600" />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                      ? 'border-sky-500 dark:border-sky-400 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-600'
                      }`}
                  >
                    {img.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                    ) : (
                      <img
                        src={getFullUrl(img.url)}
                        alt={`Vista ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
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
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400" data-testid="product-detail-description">
              <ReactMarkdown>{product.description}</ReactMarkdown>
            </div>
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
                      className="flex-1 text-base py-6 dark:bg-gray-700"
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
                      className="flex-1 text-base py-6 dark:bg-gray-700"
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

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {currentImage && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageUrl={getFullUrl(currentImage.url)}
          alt={currentImage.description || product.name}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          showNavigation={allImages.length > 1}
          type={currentImage.type}
        />
      )}
    </div>
  );
};

export default ProductDetail;
