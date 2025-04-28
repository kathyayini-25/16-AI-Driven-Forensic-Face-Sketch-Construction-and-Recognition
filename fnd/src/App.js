import './App.css';
import {Route,Routes} from 'react-router-dom'
// import Home from './pages/Home.js'
import About from './pages/About.js'
import Contact from './pages/Contact.js'
import NotFound from './pages/NotFound.js'
import Construction from './pages/Construction.js';
import Retrieval from './pages/Retrieval.js';
import Login from './pages/Login.js';
import Generate from './pages/Generate.js';
import ImageUpload from './myfolder/ImageUpload.jsx';

function App() {
  return (
    <div className="App">
      <Routes>
      <Route path="/" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/upload" element={<ImageUpload />} />
        
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/construction" element={<Construction />} />
        <Route path="/retrieve" element={<Retrieval />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="*" element={<NotFound />} />

      </Routes>
      
    </div>
  );
}

export default App;
