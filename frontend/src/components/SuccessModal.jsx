import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuccessModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
    const navigate = useNavigate();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-none shadow-2xl">
                <div className="flex flex-col items-center text-center p-6 space-y-6">
                    {/* Icon Animation Container */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-full">
                            <CheckCircle2 className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {title || '¡Solicitud Exitosa!'}
                        </DialogTitle>
                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                            {message}
                        </p>
                    </div>

                    <div className="w-full space-y-3 pt-4">
                        <Button
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Entendido
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                onClose();
                                navigate('/');
                            }}
                            className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Seguir Comprando
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SuccessModal;
