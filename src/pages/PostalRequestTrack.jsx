import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PostalRequestTrack = () => {
  const [studentId, setStudentId] = useState('');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/postal-requests/track`, {
        studentId: studentId.trim(),
        applicationNumber: applicationNumber.trim()
      });
      const request = response.data;
      navigate(`/postal-request/dashboard/${request._id}`);
    } catch (err) {
      console.error('Tracking failed', err);
      setErrorMsg(err.response?.data?.message || 'No matching request found. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Skewed decorative banner */}
        <div className="absolute top-0 left-0 w-full h-40 sm:h-80 bg-uniboRed transform -skew-y-3 origin-top-left -z-10 shadow-lg"></div>

        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 sm:p-10 z-10 relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">Track Postal Request</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">Enter your credentials to load your countdown dashboard and upload documents.</p>
          </div>

          <form onSubmit={handleTrackSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                <p className="text-xs text-red-700 font-semibold">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Student Email ID <span className="text-uniboRed">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. student@domain.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Application Number <span className="text-uniboRed">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={applicationNumber}
                  onChange={(e) => setApplicationNumber(e.target.value)}
                  placeholder="e.g. PR-20260623-1234"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 bg-uniboRed hover:bg-uniboDarkRed text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? 'Searching...' : 'Track Request'}
            </button>

            <div className="text-center mt-6">
              <Link to="/postal-request" className="text-xs font-semibold text-gray-500 hover:text-uniboRed transition-colors">
                Need to submit a new request? Click here.
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostalRequestTrack;
