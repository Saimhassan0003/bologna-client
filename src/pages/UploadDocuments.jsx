import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import logo from '../assets/logo.png';

const UploadDocuments = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [alreadyUploaded, setAlreadyUploaded] = useState(false);

  // Files
  const [profilePicture, setProfilePicture] = useState(null);
  const [passportCopy, setPassportCopy] = useState(null);
  const [resume, setResume] = useState(null);
  const [transcript1, setTranscript1] = useState(null);
  const [transcript2, setTranscript2] = useState(null);
  const [transcript3, setTranscript3] = useState(null);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, expired: false });

  // Fetch application details to check deadline
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/applications/${applicationId}`);
        setApplication(response.data);
      } catch (err) {
        console.error('Failed to load application:', err);
        if (err.response?.status === 400 && err.response?.data?.message?.includes('already')) {
          setAlreadyUploaded(true);
        }
        setErrorMsg(err.response?.data?.message || 'Application not found or server error.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [applicationId]);

  // Timer effect for pending documents
  useEffect(() => {
    if (!application || isSuccess) return;

    // Use documentDeadline from the backend if available, otherwise calculate 2 months from submissionDate
    let deadline;
    if (application.documentDeadline) {
      deadline = new Date(application.documentDeadline);
    } else if (application.submissionDate) {
      deadline = new Date(application.submissionDate);
      deadline.setMonth(deadline.getMonth() + 2);
    } else {
      return;
    }

    const update = () => {
      const now = Date.now();
      const diff = deadline.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      setTimeLeft({ days, hours, minutes, expired: false });
    };

    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [application, isSuccess]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      const file = files[0];
      if (name === 'profilePicture') setProfilePicture(file);
      if (name === 'passportCopy') setPassportCopy(file);
      if (name === 'resume') setResume(file);
      if (name === 'transcript1') setTranscript1(file);
      if (name === 'transcript2') setTranscript2(file);
      if (name === 'transcript3') setTranscript3(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Enforce that all missing documents must be uploaded
    const missing = application.missingDocuments || [];
    const missingUploads = [];
    if (missing.includes('profilePicture') && !profilePicture) missingUploads.push('Profile Picture');
    if (missing.includes('passportCopy') && !passportCopy) missingUploads.push('Passport Copy');
    if (missing.includes('resume') && !resume) missingUploads.push('Resume / CV');
    if (missing.includes('transcript1') && !transcript1) missingUploads.push('Transcript 1');
    if (missing.includes('transcript2') && !transcript2) missingUploads.push('Transcript 2');
    if (missing.includes('transcript3') && !transcript3) missingUploads.push('Transcript 3');

    if (missingUploads.length > 0) {
      setErrorMsg(`Please upload all missing files. Required: ${missingUploads.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    const data = new FormData();
    if (profilePicture) data.append('profilePicture', profilePicture);
    if (passportCopy) data.append('passportCopy', passportCopy);
    if (resume) data.append('resume', resume);
    if (transcript1) data.append('transcript1', transcript1);
    if (transcript2) data.append('transcript2', transcript2);
    if (transcript3) data.append('transcript3', transcript3);

    try {
      await axios.post(`${API_URL}/api/applications/${applicationId}/documents`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsSuccess(true);
      // Redirect after brief delay
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Document upload failed', error);
      setErrorMsg(error.response?.data?.message || 'Failed to upload documents. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-uniboRed/20 border-t-uniboRed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (alreadyUploaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow py-12 px-4 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Documents Already Uploaded</h2>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">{errorMsg}</p>
          <div className="pt-4">
            <Link to="/" className="inline-block bg-uniboRed hover:bg-uniboDarkRed text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow">
              Go to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow py-12 px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Application Not Found</h2>
          <p className="text-gray-500 mt-2">{errorMsg}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative Skewed Banner */}
        <div className="absolute top-0 left-0 w-full h-40 sm:h-80 bg-uniboRed transform -skew-y-3 origin-top-left -z-10 shadow-lg"></div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 relative">
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 sm:p-8 md:p-10 border-b-4 border-uniboRed flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/" className="bg-white rounded-lg p-1.5 h-12 flex items-center shadow-lg border border-gray-800">
                <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
              </Link>
              <div>
                <p className="text-gray-400 text-xs mt-0.5">Academic Admission Portal</p>
                <h1 className="text-lg font-bold">Document Upload</h1>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8 md:p-10">
            {isSuccess ? (
              <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in-up">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-900">Documents Uploaded Successfully!</h3>
                <p className="text-sm text-gray-500 max-w-md">Your files have been saved to your application.</p>
                <p className="text-xs text-gray-400 mt-6">Redirecting to Home page...</p>
              </div>
            ) : isSubmitting ? (
              <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-uniboRed/20 border-t-uniboRed rounded-full animate-spin"></div>
                  <div className="absolute w-12 h-12 bg-uniboRed/10 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-bold text-gray-900">Uploading Documents</h3>
                  <p className="text-sm text-gray-500">Please wait while we process your files...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {errorMsg && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                    <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
                  </div>
                )}

                {/* Deadline Timer */}
                <div className="w-full max-w-md mx-auto bg-[#0d1b2a] text-white p-4 rounded-lg shadow-inner">
                  {timeLeft.expired ? (
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-400">❌ Deadline Expired</div>
                      <div className="text-sm mt-2">Please contact support for assistance.</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#0d1b2a] text-[#f97316] px-4 py-3 rounded-lg text-center">
                          <div className="text-2xl font-bold">{timeLeft.days}</div>
                          <div className="text-xs">Days</div>
                        </div>
                        <div className="bg-[#0d1b2a] text-[#f97316] px-4 py-3 rounded-lg text-center">
                          <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                          <div className="text-xs">Hours</div>
                        </div>
                        <div className="bg-[#0d1b2a] text-[#f97316] px-4 py-3 rounded-lg text-center">
                          <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                          <div className="text-xs">Minutes</div>
                        </div>
                      </div>
                      <div className="text-sm mt-3 text-[#fce8dc]">
                        Upload deadline: {application.documentDeadline ? new Date(application.documentDeadline).toLocaleDateString() : (application.submissionDate ? new Date(new Date(application.submissionDate).setMonth(new Date(application.submissionDate).getMonth() + 2)).toLocaleDateString() : '')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">Upload Missing Documents</h3>
                    <p className="text-xs text-gray-500">Max file size: 10MB per document.</p>
                  </div>                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {application.missingDocuments?.includes('profilePicture') && (
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Profile Picture <span className="text-uniboRed">*</span></label>
                        <input type="file" name="profilePicture" required accept="image/*" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white cursor-pointer" />
                        {profilePicture && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {profilePicture.name}</p>}
                      </div>
                    )}

                    {application.missingDocuments?.includes('passportCopy') && (
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Copy of ID / Passport <span className="text-uniboRed">*</span></label>
                        <input type="file" name="passportCopy" required accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white cursor-pointer" />
                        {passportCopy && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {passportCopy.name}</p>}
                      </div>
                    )}

                    {application.missingDocuments?.includes('resume') && (
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Resume / CV <span className="text-uniboRed">*</span></label>
                        <input type="file" name="resume" required accept=".pdf,.doc,.docx" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white cursor-pointer" />
                        {resume && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {resume.name}</p>}
                      </div>
                    )}

                    {application.missingDocuments?.includes('transcript1') && (
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Transcript 1 <span className="text-uniboRed">*</span></label>
                        <input type="file" name="transcript1" required accept="image/*,application/pdf,.doc,.docx" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white cursor-pointer" />
                        {transcript1 && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {transcript1.name}</p>}
                      </div>
                    )}

                    {application.missingDocuments?.includes('transcript2') && (
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Transcript 2 <span className="text-uniboRed">*</span></label>
                        <input type="file" name="transcript2" required accept="image/*,application/pdf,.doc,.docx" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white cursor-pointer" />
                        {transcript2 && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {transcript2.name}</p>}
                      </div>
                    )}

                    {application.missingDocuments?.includes('transcript3') && (
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Transcript 3 <span className="text-uniboRed">*</span></label>
                        <input type="file" name="transcript3" required accept="image/*,application/pdf,.doc,.docx" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white cursor-pointer" />
                        {transcript3 && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {transcript3.name}</p>}
                      </div>
                    )}
                  </div>        </div>

                  <div className="pt-6 border-t border-gray-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || timeLeft.expired}
                      className={`px-8 py-3 text-white font-bold uppercase rounded-lg shadow-md transition-all ${
                        isSubmitting || timeLeft.expired
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-uniboRed hover:bg-uniboDarkRed'
                      }`}
                    >
                      Upload Documents
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UploadDocuments;
