import React from 'react'
import { useNavigate } from 'react-router-dom'

function Home() {
    const navigate=useNavigate();
    const handleClick=()=>{
        navigate('/construction');
    }
  return (
    <div>
        <div>
            <button onClick={handleClick}> Open </button>
        </div>
        
    </div>
  )
}

export default Home