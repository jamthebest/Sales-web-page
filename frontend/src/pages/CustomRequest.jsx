import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingBag, Upload, Sparkles, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

const CustomRequest = ({ user, logout }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    quantity: 1,
    phone: ''
  });
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [mockCode, setMockCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/custom-request`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleRequestVerification = async () => {
    if (!formData.phone) {
      toast.error('Ingresa tu número de teléfono');
      return;
    }

    try {
      const response = await axiosInstance.post('/requests/verify-phone', { phone: formData.phone });
      
      if (response.data.already_verified) {
        setIsVerified(true);
        await submitRequest();
        return;
      }

      setMockCode(response.data.mock_code);
      setShowVerification(true);
      toast.success('Código enviado (revisa los logs del servidor)');
    } catch (error) {
      toast.error('Error al enviar código');
    }
  };

  const handleVerifyCode = async () => {
    try {
      await axiosInstance.post('/requests/validate-code', {
        phone: formData.phone,
        code: verificationCode
      });

      setIsVerified(true);
      setShowVerification(false);
      toast.success('Teléfono verificado');
      await submitRequest();
    } catch (error) {
      toast.error('Código inválido');
    }
  };

  const submitRequest = async () => {
    if (!formData.name) {
      toast.error('Ingresa el nombre del artículo');
      return;
    }

    try {
      await axiosInstance.post('/requests/custom', {
        phone: formData.phone,
        description: `${formData.name}${formData.description ? ' - ' + formData.description : ''}${formData.image_url ? ' | Imagen: ' + formData.image_url : ''}`,
        quantity: formData.quantity
      });

      toast.success('¡Solicitud enviada! Te contactaremos pronto');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al enviar solicitud');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('El nombre del artículo es requerido');
      return;
    }

    if (!formData.phone) {
      toast.error('El teléfono es requerido');
      return;
    }

    if (!isVerified) {
      await handleRequestVerification();
    } else {
      await submitRequest();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Navbar */}
      <nav className="backdrop-blur-md bg-white/70 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <ShoppingBag className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">TiendaApp</span>
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
                <Button onClick={handleLogin} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="login-btn">
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4" data-testid="custom-request-title">
            Solicitar Artículo Personalizado
          </h1>
          <p className="text-lg text-gray-600">
            ¿No encuentras lo que buscas? Déjanos saber qué necesitas y te contactaremos
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Nombre del Artículo *
              </label>
              <Input
                type="text"
                placeholder="Ej: Laptop Gaming RTX 4090"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-base py-6 border-2 border-gray-200 focus:border-purple-500"
                data-testid="custom-name-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Descripción (Opcional)
              </label>
              <Textarea
                placeholder="Describe las características, especificaciones o cualquier detalle importante..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="text-base border-2 border-gray-200 focus:border-purple-500"
                data-testid="custom-description-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                URL de Imagen (Opcional)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="text-base py-6 border-2 border-gray-200 focus:border-purple-500"
                    data-testid="custom-image-input"
                  />
                </div>
                <Button type="button" variant="outline" className="px-6" disabled>
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Proporciona una URL de imagen de referencia</p>
              {formData.image_url && (
                <div className="mt-4 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      toast.error('No se pudo cargar la imagen');
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Cantidad *
              </label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  data-testid="decrease-quantity-btn"
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-3xl font-bold w-16 text-center" data-testid="quantity-display">{formData.quantity}</span>
                <Button
                  type="button"
                  onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  data-testid="increase-quantity-btn"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Teléfono de Contacto *
              </label>
              <Input
                type="tel"
                placeholder="+52 123 456 7890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-base py-6 border-2 border-gray-200 focus:border-purple-500"
                data-testid="custom-phone-input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Se enviará un código de verificación</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6 text-lg rounded-full shadow-lg"
              data-testid="submit-custom-request-btn"
            >
              Enviar Solicitud
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            data-testid="back-to-home-btn"
          >
            Volver al inicio
          </Button>
        </div>
      </div>

      {/* Verification Dialog */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent data-testid="verification-dialog">
          <DialogHeader>
            <DialogTitle>Verificar Teléfono</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Hemos enviado un código de verificación al número {formData.phone}
            </p>
            {mockCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800">MOCK: Código de prueba</p>
                <p className="text-2xl font-bold text-yellow-900 mt-2">{mockCode}</p>
                <p className="text-xs text-yellow-700 mt-1">También visible en los logs del servidor</p>
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

export default CustomRequest;
