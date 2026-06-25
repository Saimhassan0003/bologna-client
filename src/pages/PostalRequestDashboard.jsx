import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CountdownTimer from '../components/CountdownTimer';
import PostalStatusBadge from '../components/PostalStatusBadge';
import PostalDocumentUpload from '../components/PostalDocumentUpload';

const PostalRequestDashboard = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRequestDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/postal-requests/${id}`);
      setRequest(response.data);
      setErrorMsg('');
    } catch (err) {
      console.error('Failed to load request details', err);
      setErrorMsg(err.response?.data?.message || 'Could not fetch request details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const handleDeadlineExpired = () => {
    // Re-fetch request details to load the updated status ('EXPIRED')
    fetchRequestDetails();
  };

  const handleUploadSuccess = (updatedRequest) => {
    setRequest(updatedRequest);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-uniboRed/20 border-t-uniboRed rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-gray-500">Loading Dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (errorMsg || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-serif">Error Loading Dashboard</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">{errorMsg || 'Postal request not found.'}</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link to="/postal-request/track" className="px-4 py-2 bg-gray-950 text-white text-xs font-bold uppercase rounded-lg shadow-md">Track Another</Link>
              <Link to="/postal-request" className="px-4 py-2 bg-uniboRed text-white text-xs font-bold uppercase rounded-lg shadow-md">Submit New</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Skewed decorative banner background */}
        <div className="absolute top-0 left-0 w-full h-40 sm:h-80 bg-uniboRed transform -skew-y-3 origin-top-left -z-10 shadow-lg"></div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 z-10 relative">
          
          {/* Main Request Status & Details Panel */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Postal Request Portal</span>
                  <h1 className="text-2xl font-extrabold text-gray-900 font-serif mt-1">{request.applicationNumber}</h1>
                </div>
                <div>
                  <PostalStatusBadge status={request.status} />
                </div>
              </div>

              {/* Notice Banner */}
              {request.status === 'DOCUMENT_PENDING' && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-xs sm:text-sm text-amber-800 font-semibold leading-relaxed">
                    ⚠️ Your application has been received. Please upload the required documents within the countdown deadline shown on the right.
                  </p>
                </div>
              )}

              {request.status === 'EXPIRED' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="text-xs sm:text-sm text-red-800 font-semibold leading-relaxed">
                    🛑 Expiration Warning: This application expired on {new Date(request.expiredAt).toLocaleString()} because documents were not uploaded before the deadline.
                  </p>
                </div>
              )}

              {request.status === 'SUBMITTED' && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <p className="text-xs sm:text-sm text-green-800 font-semibold leading-relaxed">
                    ✅ Success: All required documents have been received. Your request was submitted on {new Date(request.submittedAt).toLocaleString()} and is under review.
                  </p>
                </div>
              )}

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-5 border border-gray-150 text-sm">
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Student Email</span>
                  <span className="font-semibold text-gray-800 break-all">{request.studentId}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Created At</span>
                  <span className="font-semibold text-gray-800">{new Date(request.createdAt).toLocaleString()}</span>
                </div>
                {request.submittedAt && (
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted At</span>
                    <span className="font-semibold text-gray-800">{new Date(request.submittedAt).toLocaleString()}</span>
                  </div>
                )}
                {request.expiredAt && (
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Expired At</span>
                    <span className="font-semibold text-gray-800">{new Date(request.expiredAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* List of documents */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Document Audit Checklist</h3>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
                  {[
                    { key: 'identityProof', label: 'Identity Proof (Passport/ID)' },
                    { key: 'addressProof', label: 'Address Proof (Utility Bill)' },
                    { key: 'academicTranscript', label: 'Certified Academic Transcript' }
                  ].map(({ key, label }) => {
                    const doc = request.documents.find(d => d.name === key);
                    return (
                      <div key={key} className="flex justify-between items-center p-4 text-sm bg-white hover:bg-gray-50/50 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-800">{label}</p>
                          {doc && (
                            <p className="text-[10px] text-gray-400 mt-0.5">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>
                          )}
                        </div>
                        <div>
                          {doc ? (
                            <span className="inline-flex items-center text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">
                              Pending Upload
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Widgets (Countdown & upload components) */}
          <div className="space-y-6">
            
            {/* Live Countdown Card */}
            {request.status === 'DOCUMENT_PENDING' && request.documentDeadline && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col gap-4 text-center">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Live Status Tracker</h3>
                <CountdownTimer 
                  deadline={request.documentDeadline} 
                  onExpire={handleDeadlineExpired} 
                />
              </div>
            )}

            {/* Document Upload Widget */}
            {request.status === 'DOCUMENT_PENDING' && (
              <PostalDocumentUpload
                requestId={request._id}
                uploadedDocs={request.documents}
                status={request.status}
                onUploadSuccess={handleUploadSuccess}
              />
            )}

            {/* Expired Widget Info */}
            {request.status === 'EXPIRED' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-md font-bold text-gray-900 font-serif">Workflow Expired</h3>
                <p className="text-xs text-gray-500 leading-relaxed">The 1-minute window to submit documents has closed. Please submit a new postal request to restart the workflow.</p>
                <Link to="/postal-request" className="block w-full py-2.5 bg-uniboRed hover:bg-uniboDarkRed text-white text-xs font-bold uppercase rounded-lg shadow-sm">Start New Request</Link>
              </div>
            )}

            {/* Submitted Widget Info */}
            {request.status === 'SUBMITTED' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-md font-bold text-gray-900 font-serif">Workflow Complete</h3>
                <p className="text-xs text-gray-500 leading-relaxed">We have received all required documents and your request has been logged successfully for registry processing.</p>
                <Link to="/" className="block w-full py-2.5 bg-gray-950 text-white text-xs font-bold uppercase rounded-lg shadow-sm">Back to Home</Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostalRequestDashboard;
