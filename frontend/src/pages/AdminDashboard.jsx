import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Package, Plus, Edit, Trash2, Mail, Phone, ShoppingCart, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState(null);
  const [config, setConfig] = useState({ email: '', phone: '' });
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    category: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchRequests();
    fetchConfig();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axiosInstance.get('/requests');
      setRequests(response.data);
    } catch (error) {
      toast.error('Error al cargar solicitudes');
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axiosInstance.get('/config');
      setConfig(response.data);
    } catch (error) {
      console.error('Error al cargar configuración');
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      image_url: '',
      category: ''
    });
    setShowProductDialog(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image_url: product.image_url || '',
      category: product.category || ''
    });
    setShowProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.stock) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const data = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        image_url: productForm.image_url || null,
        category: productForm.category || null
      };

      if (editingProduct) {
        await axiosInstance.put(`/products/${editingProduct.id}`, data);
        toast.success('Producto actualizado');
      } else {
        await axiosInstance.post('/products', data);
        toast.success('Producto creado');
      }

      setShowProductDialog(false);
      fetchProducts();
    } catch (error) {
      toast.error('Error al guardar producto');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/products/${productId}`);
      toast.success('Producto eliminado');
      fetchProducts();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await axiosInstance.put('/config', config);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar configuración');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Navbar */}
      <nav className="backdrop-blur-md bg-white/70 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <ShoppingBag className="w-8 h-8 text-sky-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">TiendaApp Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Hola, {user.name}</span>
              <Button onClick={() => navigate('/products')} variant="outline" data-testid="nav-products-btn">
                Ver Tienda
              </Button>
              <Button onClick={logout} variant="ghost" data-testid="logout-btn">Cerrar Sesión</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent mb-8" data-testid="admin-title">
          Panel de Administración
        </h1>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="products" data-testid="products-tab">Inventario</TabsTrigger>
            <TabsTrigger value="requests" data-testid="requests-tab">Solicitudes</TabsTrigger>
            <TabsTrigger value="config" data-testid="config-tab">Configuración</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
              <Button 
                onClick={handleCreateProduct}
                className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
                data-testid="create-product-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="admin-products-grid">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden" data-testid={`admin-product-card-${product.id}`}>
                  <div className="aspect-square bg-gradient-to-br from-sky-100 to-emerald-100 relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-sky-300" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-1" data-testid={`admin-product-name-${product.id}`}>{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-sky-600" data-testid={`admin-product-price-${product.id}`}>${product.price.toFixed(2)}</span>
                      <span className="text-sm font-semibold" data-testid={`admin-product-stock-${product.id}`}>
                        Stock: <span className={product.stock < 10 ? 'text-red-600' : 'text-emerald-600'}>{product.stock}</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleEditProduct(product)} 
                        variant="outline" 
                        className="flex-1"
                        data-testid={`edit-product-btn-${product.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        onClick={() => handleDeleteProduct(product.id)} 
                        variant="outline" 
                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                        data-testid={`delete-product-btn-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {requests && (
              <>
                {/* Purchase Requests */}
                <Card data-testid="purchase-requests-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Solicitudes de Compra ({requests.purchase_requests?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requests.purchase_requests?.length > 0 ? (
                      <div className="space-y-4">
                        {requests.purchase_requests.map((req) => (
                          <div key={req.id} className="bg-white p-4 rounded-lg border border-gray-200" data-testid={`purchase-request-${req.id}`}>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="font-semibold">Cliente:</span> {req.user_name}</div>
                              <div><span className="font-semibold">Email:</span> {req.user_email}</div>
                              <div><span className="font-semibold">Teléfono:</span> {req.user_phone}</div>
                              <div><span className="font-semibold">Producto:</span> {req.product_name}</div>
                              <div><span className="font-semibold">Cantidad:</span> {req.quantity}</div>
                              <div><span className="font-semibold">Total:</span> ${req.total_price.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No hay solicitudes de compra</p>
                    )}
                  </CardContent>
                </Card>

                {/* Out of Stock Requests */}
                <Card data-testid="outofstock-requests-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Solicitudes de Artículos Sin Stock ({requests.out_of_stock_requests?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requests.out_of_stock_requests?.length > 0 ? (
                      <div className="space-y-4">
                        {requests.out_of_stock_requests.map((req) => (
                          <div key={req.id} className="bg-white p-4 rounded-lg border border-orange-200" data-testid={`outofstock-request-${req.id}`}>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="font-semibold">Producto:</span> {req.product_name}</div>
                              <div><span className="font-semibold">Teléfono:</span> {req.phone}</div>
                              <div><span className="font-semibold">Cantidad:</span> {req.quantity}</div>
                              <div><span className="font-semibold">Verificado:</span> {req.verified ? '✅ Sí' : '❌ No'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No hay solicitudes de artículos sin stock</p>
                    )}
                  </CardContent>
                </Card>

                {/* Custom Requests */}
                <Card data-testid="custom-requests-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Solicitudes Personalizadas ({requests.custom_requests?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requests.custom_requests?.length > 0 ? (
                      <div className="space-y-4">
                        {requests.custom_requests.map((req) => (
                          <div key={req.id} className="bg-white p-4 rounded-lg border border-blue-200" data-testid={`custom-request-${req.id}`}>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-semibold">Descripción:</span> {req.description}</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><span className="font-semibold">Teléfono:</span> {req.phone}</div>
                                <div><span className="font-semibold">Cantidad:</span> {req.quantity}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No hay solicitudes personalizadas</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card data-testid="config-card">
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email para notificaciones
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@tienda.com"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    data-testid="config-email-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono para notificaciones WhatsApp
                  </label>
                  <Input
                    type="tel"
                    placeholder="+52 123 456 7890"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    data-testid="config-phone-input"
                  />
                </div>
                <Button 
                  onClick={handleSaveConfig}
                  className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
                  data-testid="save-config-btn"
                >
                  Guardar Configuración
                </Button>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm font-semibold text-yellow-800">Modo Mock Activado</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Las notificaciones actualmente se muestran en los logs del servidor. 
                    Puedes configurar email y teléfono para cuando integres servicios reales.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Nombre del producto"
                data-testid="product-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Descripción del producto"
                rows={3}
                data-testid="product-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="0.00"
                  data-testid="product-price-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
                <Input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  placeholder="0"
                  data-testid="product-stock-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
              <Input
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="Electrónica, Ropa, etc."
                data-testid="product-category-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL de Imagen</label>
              <Input
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
                data-testid="product-image-input"
              />
            </div>
            <Button
              onClick={handleSaveProduct}
              className="w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
              data-testid="save-product-btn"
            >
              {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
