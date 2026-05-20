import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      login(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left side: Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img 
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Bologno Architecture" 
          />
        </div>
        <div className="relative z-10 w-full flex flex-col justify-between p-12 lg:p-24">
          <div className="bg-white p-3 rounded-xl shadow-xl inline-block border border-gray-100 max-w-fit">
            <Link to="/" className="inline-flex items-center">
              <img src={logo} alt="Institute Bologna" className="h-24 w-auto object-contain" />
            </Link>
          </div>
          <div className="mt-auto">
            <h2 className="text-4xl font-serif font-bold text-white mb-6 drop-shadow-lg leading-tight">
              Administrative <br/> Admissions Portal
            </h2>
            <p className="text-lg text-gray-200 max-w-md font-light">
              Securely manage student applications, review candidates, and shape the future of our prestigious institution.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-gray-50 relative overflow-hidden">
        {/* Subtle decorative background for right side */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-uniboRed/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-uniboRed/5 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-md w-full z-10">
          <div className="lg:hidden mb-8 sm:mb-12 flex justify-center">
            <Link to="/" className="inline-flex items-center bg-white p-3 rounded-xl shadow-md border border-gray-100">
              <img src={logo} alt="Institute Bologna" className="h-16 sm:h-20 w-auto object-contain" />
            </Link>
          </div>

          <div className="text-left mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-sm sm:text-base text-gray-500">Please enter your credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed transition-all text-sm outline-none shadow-sm"
                  placeholder="admin@bologno.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed transition-all text-sm outline-none shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg text-sm font-bold uppercase tracking-wide text-white bg-uniboRed hover:bg-uniboDarkRed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uniboRed transition-all duration-300 shadow-md hover:shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'transform hover:-translate-y-0.5'}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating...
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </div>
            
            <div className="text-center mt-8">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-uniboRed transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Return to Public Website
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
