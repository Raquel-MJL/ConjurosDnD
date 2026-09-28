import { useState } from 'react';
import './App.css';
import React from 'react';
import {Section} from './sections/section';
import {Hechizos} from './data/sectionData';

function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <div className="mx-auto px-4 py-8">
        <h1 className="webTitle text-center mb-8">Conjuros de D&D</h1>
        
        <div className="mx-auto">
          {Hechizos.map((sectionData) => (
            <Section 
              key={sectionData.id}
              title={sectionData.nivel}
              conjuros={sectionData.conjuros}
              backgroundColor={sectionData.backgroundColor}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default App