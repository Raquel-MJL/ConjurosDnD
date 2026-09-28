import { ModalButton } from '../components/button/button';
import {React} from 'react';
import './section.css';



const Section = ({ title, conjuros, backgroundColor = [] }) => {
    return (
    <section className="section-card mx-auto" style={{ backgroundColor: backgroundColor }}>
        <h2 className="sectionTitle text-left mb-4 flex items-center gap-3">
            {title}
        </h2>
            <div className="section-panel">
                {conjuros.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {conjuros.map((conjuro, index) => (
                            <ModalButton 
                                key={conjuro.texto}
                                title={conjuro.texto}
                                backgroundColor={backgroundColor}
                                icon={conjuro.icono && <img src={conjuro.icono} alt="" className="w-full h-full object-contain" />}
                                modalContent={
                                    <div className="modal-content">
                                    <>
                                    <p><strong>Escuela:</strong> {conjuro.escuela}</p>
                                    <p><strong>Componentes:</strong> {conjuro.componentes}</p>
                                    <p><strong>Tiempo de Lanzamiento:</strong> {conjuro.tiempoDeLanzamiento}</p>
                                    <p><strong>Alcance:</strong> {conjuro.alcance}</p>
                                    <p><strong>Duración:</strong> {conjuro.duracion}</p>
                                    <p><strong>Ataque:</strong> {conjuro.ataque}</p>
                                    <p><strong>Clases:</strong> {conjuro.clases}</p>
                                    <div> {/*Incluye dos saltos de línea por cada * en el apartado "información" del archivo sectionData.js*/}
                                        <strong>Información:</strong>
                                        {conjuro.informacion.split('*').map((line, index) => (
                                            <>
                                                <p key={index}>{line}</p>
                                                <br /> 
                                            </>
                                        ))}
                                    </div>
                                    </>
                                    </div>
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No hay conjuros disponibles para este nivel.</p>
                )}
            </div>
        </section>
    );
};

export { Section }