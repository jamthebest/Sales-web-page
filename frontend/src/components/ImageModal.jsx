import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const ImageModal = ({ isOpen, onClose, imageUrl, alt, onNext, onPrev, showNavigation }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Reset state when modal opens or image changes
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e) => {
                if (e.key === 'ArrowRight' && onNext) onNext();
                if (e.key === 'ArrowLeft' && onPrev) onPrev();
                if (e.key === 'Escape') onClose();
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = 'unset';
                window.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen, imageUrl, onNext, onPrev, onClose]);

    if (!isOpen || !imageUrl) return null;

    const handleZoomToggle = (e) => {
        e.stopPropagation();
        if (scale > 1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        } else {
            setScale(2.5);
        }
    };

    const handleMouseMove = (e) => {
        if (scale === 1) return;

        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;

        // Calculate percentage from center (-0.5 to 0.5)
        const xPct = (x / width) - 0.5;
        const yPct = (y / height) - 0.5;

        // Max translation allowed
        const maxTranslateX = (width * (scale - 1)) / 2;
        const maxTranslateY = (height * (scale - 1)) / 2;

        // Move image opposite to mouse direction to reveal hidden parts
        const translateX = -xPct * 2 * maxTranslateX;
        const translateY = -yPct * 2 * maxTranslateY;

        setPosition({ x: translateX, y: translateY });
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full z-[110] transition-colors"
            >
                <X className="w-8 h-8" />
            </button>

            <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                onMouseMove={handleMouseMove}
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt={alt || 'Product full view'}
                    className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        cursor: scale > 1 ? 'zoom-out' : 'zoom-in'
                    }}
                    onClick={handleZoomToggle}
                />
            </div>

            {/* Hint text */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm pointer-events-none z-[110]">
                {scale === 1 ? 'Click para hacer zoom' : 'Mueve el mouse para explorar • Click para alejar'}
            </div>

            {/* Navigation Buttons */}
            {showNavigation && (
                <>
                    <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none z-[110]">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrev && onPrev();
                            }}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
                        >
                            <ChevronLeft className="w-10 h-10" />
                        </button>
                    </div>
                    <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none z-[110]">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNext && onNext();
                            }}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
                        >
                            <ChevronRight className="w-10 h-10" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageModal;
