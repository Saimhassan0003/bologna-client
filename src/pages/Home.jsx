import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  const navigate = useNavigate();

  const handleApplyClick = () => {
    navigate('/apply');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gray-900 min-h-[250px] sm:min-h-[300px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
              alt="University students collaborating"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-6 sm:mt-12">
            <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 sm:mb-8 font-serif leading-tight text-white drop-shadow-lg">
              Developing people with <span className="text-uniboRed drop-shadow-md">skills</span> and <span className="text-uniboRed drop-shadow-md">knowledge</span> that equip them for current and future employment
            </h1>
            
            <div className="mt-6 sm:mt-10 flex justify-center px-4">
              <button 
                onClick={handleApplyClick}
                className="group relative inline-flex items-center justify-center px-6 sm:px-10 py-2.5 sm:py-4 text-sm sm:text-base font-bold text-white uppercase tracking-wider bg-uniboRed overflow-hidden rounded-md shadow-2xl transition-all duration-300 hover:bg-uniboDarkRed hover:shadow-[0_0_20px_rgba(165,0,33,0.5)] transform hover:-translate-y-1"
              >
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                <span className="relative flex items-center gap-2">
                  Application Form
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Section placeholder to make the page feel complete */}
        <div className="py-12 sm:py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">Why Choose Institute UTAMED?</h2>
              <div className="w-24 h-1 bg-uniboRed mx-auto mt-4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-10">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Historic Excellence</h3>
                <p className="text-sm sm:text-base text-gray-600">Founded in 1088, we are the oldest university in continuous operation, offering unparalleled academic heritage.</p>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Global Community</h3>
                <p className="text-sm sm:text-base text-gray-600">Join a vibrant community of students and researchers from all over the world in an inclusive environment.</p>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Future Ready</h3>
                <p className="text-sm sm:text-base text-gray-600">Our programs are constantly updated to meet the demands of the modern workforce and emerging technologies.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
