import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const Products = ({ user, logout, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products');
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar user={user} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 dark:from-sky-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4" data-testid="products-title">
            Nuestros Productos
          </h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 text-base rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-sky-400"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="inline-block w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20" data-testid="no-products">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-500 dark:text-gray-400">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
            {filteredProducts.map((product) => (
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
        )}
      </div>
    </div>
  );
};

export default Products;
