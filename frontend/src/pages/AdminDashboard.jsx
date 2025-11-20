import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, Edit, Trash2, Mail, Phone, ShoppingCart, AlertCircle, FileText, TrendingUp, Inbox, ShoppingBag, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const AdminDashboard = ({ user, logout, darkMode, toggleDarkMode }) => {
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
    category: '',
    images: []
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

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
    setImagePreview('');
    setImageFile(null);
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
    setImagePreview(product.image_url || '');
    setImageFile(null);
    setShowProductDialog(true);
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
        setImageFile(file);
        setProductForm({ ...productForm, image_url: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setImageFile(null);
    setProductForm({ ...productForm, image_url: '' });
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || productForm.stock === '') {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      // Si hay imagen preview (base64) y no hay URL, usar el preview
      let imageUrl = productForm.image_url;
      if (imagePreview && !productForm.image_url) {
        imageUrl = imagePreview; // Guardar el base64 directamente
      } else if (imagePreview && imagePreview.startsWith('data:')) {
        imageUrl = imagePreview; // Si es base64, usar el preview
      }

      const data = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        image_url: imageUrl || null,
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
      setImagePreview('');
      setImageFile(null);
      fetchProducts();
    } catch (error) {
      toast.error('Error al guardar producto');
    }
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await axiosInstance.delete(`/products/${productToDelete.id}`);
      toast.success('Producto eliminado');
      setShowDeleteDialog(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const handleOpenStockDialog = (product) => {
    setStockProduct(product);
    setStockAmount('');
    setShowStockDialog(true);
  };

  const handleUpdateStock = async () => {
    if (!stockAmount || isNaN(stockAmount)) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    try {
      const newStock = stockProduct.stock + parseInt(stockAmount);
      if (newStock < 0) {
        toast.error('El stock no puede ser negativo');
        return;
      }

      await axiosInstance.put(`/products/${stockProduct.id}`, { stock: newStock });
      toast.success('Stock actualizado');
      setShowStockDialog(false);
      fetchProducts();
    } catch (error) {
      toast.error('Error al actualizar stock');
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

  const lowStockProducts = products.filter(p => p.stock < 10 && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar user={user} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} title="TiendaApp Admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 dark:from-sky-400 dark:to-emerald-400 bg-clip-text text-transparent mb-8" data-testid="admin-title">
          Panel de Administración
        </h1>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="inventory" data-testid="inventory-tab">Inventario</TabsTrigger>
            <TabsTrigger value="stock" data-testid="stock-tab">Gestión Stock</TabsTrigger>
            <TabsTrigger value="requests" data-testid="requests-tab">Solicitudes</TabsTrigger>
            <TabsTrigger value="custom" data-testid="custom-tab">Solicitudes Especiales</TabsTrigger>
            <TabsTrigger value="config" data-testid="config-tab">Configuración</TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
                <p className="text-gray-600">Total: {products.length} productos</p>
              </div>
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
                        Stock: <span className={product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : 'text-emerald-600'}>{product.stock}</span>
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
                        onClick={() => handleDeleteProduct(product)} 
                        variant="outline" 
                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
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

          {/* Stock Management Tab */}
          <TabsContent value="stock" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Gestión de Existencias</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Actualiza el stock de tus productos y agrega nuevos</p>
            </div>

            {/* Alerts */}
            {outOfStockProducts.length > 0 && (
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <CardHeader>
                  <CardTitle className="text-red-800 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Productos Agotados ({outOfStockProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outOfStockProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <span className="font-semibold dark:text-white">{p.name}</span>
                        <Button 
                          onClick={() => handleOpenStockDialog(p)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Agregar Stock
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {lowStockProducts.length > 0 && (
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                <CardHeader>
                  <CardTitle className="text-orange-800 dark:text-orange-300 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Stock Bajo ({lowStockProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div>
                          <span className="font-semibold dark:text-white">{p.name}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">Stock: {p.stock}</span>
                        </div>
                        <Button 
                          onClick={() => handleOpenStockDialog(p)}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Reabastecer
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Products Stock */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Todos los Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-sky-100 to-emerald-100 dark:from-gray-600 dark:to-gray-500">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-sky-300 dark:text-sky-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-white">{product.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{product.category || 'Sin categoría'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{product.stock}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">unidades</p>
                        </div>
                        <Button
                          onClick={() => handleOpenStockDialog(product)}
                          variant="outline"
                          data-testid={`update-stock-btn-${product.id}`}
                        >
                          Actualizar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleCreateProduct}
              className="w-full py-6 text-lg bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agregar Nuevo Producto
            </Button>
          </TabsContent>

          {/* Purchase Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Solicitudes de Compra</h2>
              <p className="text-gray-600 dark:text-gray-400">Revisa todas las solicitudes realizadas por los clientes</p>
            </div>

            {requests && (
              <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="purchase-requests-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <ShoppingCart className="w-5 h-5" />
                    Solicitudes de Compra ({requests.purchase_requests?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {requests.purchase_requests?.length > 0 ? (
                    <div className="space-y-4">
                      {requests.purchase_requests.map((req) => (
                        <div key={req.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-sky-300 dark:hover:border-sky-500 transition-colors" data-testid={`purchase-request-${req.id}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-lg text-gray-800 dark:text-white">{req.product_name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(req.created_at).toLocaleString('es-MX')}</p>
                            </div>
                            <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-full text-sm font-semibold">
                              {req.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm dark:text-gray-300">
                            <div><span className="font-semibold">Cliente:</span> {req.user_name}</div>
                            <div><span className="font-semibold">Email:</span> {req.user_email}</div>
                            <div><span className="font-semibold">Teléfono:</span> {req.user_phone}</div>
                            <div><span className="font-semibold">Cantidad:</span> {req.quantity}</div>
                            <div className="col-span-2">
                              <span className="font-semibold">Total:</span> 
                              <span className="text-xl font-bold text-sky-600 dark:text-sky-400 ml-2">${req.total_price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No hay solicitudes de compra</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Custom & Out of Stock Requests Tab */}
          <TabsContent value="custom" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Solicitudes Especiales</h2>
              <p className="text-gray-600 dark:text-gray-400">Productos sin stock y solicitudes personalizadas</p>
            </div>

            {requests && (
              <>
                {/* Out of Stock Requests */}
                <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="outofstock-requests-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      Solicitudes de Artículos Sin Stock ({requests.out_of_stock_requests?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requests.out_of_stock_requests?.length > 0 ? (
                      <div className="space-y-4">
                        {requests.out_of_stock_requests.map((req) => (
                          <div key={req.id} className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-2 border-orange-200 dark:border-orange-800" data-testid={`outofstock-request-${req.id}`}>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-lg text-gray-800 dark:text-white">{req.product_name}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(req.created_at).toLocaleString('es-MX')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm dark:text-gray-300">
                              <div><span className="font-semibold">Teléfono:</span> {req.phone}</div>
                              <div><span className="font-semibold">Cantidad:</span> {req.quantity}</div>
                              <div><span className="font-semibold">Verificado:</span> {req.verified ? '✅ Sí' : '❌ No'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No hay solicitudes de artículos sin stock</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Custom Requests */}
                <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="custom-requests-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Solicitudes Personalizadas ({requests.custom_requests?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requests.custom_requests?.length > 0 ? (
                      <div className="space-y-4">
                        {requests.custom_requests.map((req) => (
                          <div key={req.id} className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800" data-testid={`custom-request-${req.id}`}>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(req.created_at).toLocaleString('es-MX')}</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="bg-white dark:bg-gray-700 p-3 rounded">
                                <span className="font-semibold block mb-1 dark:text-white">Descripción:</span>
                                <p className="text-gray-700 dark:text-gray-300">{req.description}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 dark:text-gray-300">
                                <div><span className="font-semibold">Teléfono:</span> {req.phone}</div>
                                <div><span className="font-semibold">Cantidad:</span> {req.quantity}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No hay solicitudes personalizadas</p>
                      </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre *</label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Nombre del producto"
                data-testid="product-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Precio *</label>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Stock *</label>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
              <Input
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="Electrónica, Ropa, etc."
                data-testid="product-category-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Imagen del Producto (Opcional)
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="URL de imagen: https://ejemplo.com/imagen.jpg"
                    value={productForm.image_url}
                    onChange={(e) => {
                      setProductForm({ ...productForm, image_url: e.target.value });
                      if (e.target.value) {
                        setImagePreview(e.target.value);
                        setImageFile(null);
                      }
                    }}
                    className="flex-1"
                    data-testid="product-image-url-input"
                  />
                </div>
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm">o</div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                    data-testid="product-image-file-input"
                  />
                  <label htmlFor="product-image-upload">
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
                      onError={() => {
                        toast.error('No se pudo cargar la imagen');
                        setImagePreview('');
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={clearImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
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

      {/* Stock Update Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="dark:bg-gray-800" data-testid="stock-dialog">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Actualizar Stock</DialogTitle>
          </DialogHeader>
          {stockProduct && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-lg dark:text-white">{stockProduct.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stock actual: {stockProduct.stock} unidades</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad a agregar/restar
                </label>
                <Input
                  type="number"
                  placeholder="Ej: +10 o -5"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  data-testid="stock-amount-input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Nuevo stock: {stockProduct.stock + (parseInt(stockAmount) || 0)}
                </p>
              </div>
              <Button
                onClick={handleUpdateStock}
                className="w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
                data-testid="confirm-stock-update-btn"
              >
                Actualizar Stock
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="dark:bg-gray-800" data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          {productToDelete && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-sky-100 to-emerald-100 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
                  {productToDelete.image_url ? (
                    <img src={productToDelete.image_url} alt={productToDelete.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-sky-300 dark:text-sky-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg dark:text-white">{productToDelete.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stock: {productToDelete.stock} unidades</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Precio: ${productToDelete.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-300 font-semibold">⚠️ Esta acción no se puede deshacer</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  El producto será eliminado permanentemente del sistema.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setProductToDelete(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  data-testid="cancel-delete-btn"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDeleteProduct}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  data-testid="confirm-delete-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Producto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
