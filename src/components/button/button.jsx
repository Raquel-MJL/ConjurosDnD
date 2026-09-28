import {React} from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Setter del modal que está abierto ahora mismo; se usa para cerrarlo al abrir otro y que solo haya uno a la vez.
let closeActiveModal = null;

const ModalButton = ({
  icon,
  title, 
  modalContent, 
  buttonClassName = "", 
  backgroundColor =backgroundColor,
  modalTitle = title,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef(null);

  // Con el modal abierto la página de fondo no debe moverse: se bloquea su scroll y se compensa el ancho de la barra para que no salte el contenido.
  useEffect(() => {
    if (!isModalOpen) return;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (closeActiveModal === setIsModalOpen) closeActiveModal = null;
  };
  const openModal = () => {
    if (closeActiveModal && closeActiveModal !== setIsModalOpen) closeActiveModal(false);
    closeActiveModal = setIsModalOpen;
    setIsModalOpen(true);
  };
  
  // Clic fuera del modal
  const handleOverlayClick = (e) => {
    // Si el clic fue en el overlay (no en el contenido del modal)
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      closeModal();
    }
  };

  return (
    <>
      {/* Botón con icono y título */}
      <button
        onClick={openModal}
        style={{backgroundColor:backgroundColor}}
        className={`spell-btn flex items-center gap-3 px-3 py-2 text-black text-left ${buttonClassName}`}
        type="button"
      >
        {icon && <span className="spell-icon">{icon}</span>} {/*Estilos del Botón*/}
        <span>{title}</span>
      </button>

      {/* Modal: se monta en el body para que ninguna tarjeta con animación o filtro (containing block) lo recorte */}
      {isModalOpen && createPortal(
  <div
    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    onClick={handleOverlayClick} 
  >
    <div 
      ref={modalRef} 
      className="modal-box bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh] overflow-hidden" // Ajustado aquí
    >
      {/* Modal header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="modal-title">
            {modalTitle || title}
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Modal body */}
      <div className="px-6 py-4 modal-content overflow-y-auto overscroll-contain flex-grow">
        {modalContent}
      </div>
      
      {/* Modal footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end flex-shrink-0">
        <button
          onClick={closeModal}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
    </>
  );
};

export {ModalButton};