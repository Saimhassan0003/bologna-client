import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CountdownTimer from '../components/CountdownTimer';
import PostalStatusBadge from '../components/PostalStatusBadge';
import PostalDocumentUpload from '../components/PostalDocumentUpload';

// ─── Document label map ───────────────────────────────────────────────────────
const DOC_LABELS = {
  identityProof:      'Identity Proof (Passport / CNIC)',
  addressProof:       'Address Proof (Utility Bill)',
  academicTranscript: 'Certified Academic Transcript'
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Spinner while loading */
const LoadingState = () => (
  <div className="flex flex-col items-center gap-4 py-20">
    <div className="w-14 h-14 border-4 border-red-100 border-t-red-700 rounded-full animate-spin" />
    <p className="text-sm text-gray-400 font-medium">Loading your application...</p>
  </div>
);

/** Application not found / no application */
const NoApplication = () => (
  <div className="max-w-lg mx-auto text-center py-16 px-4">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
      📭
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2 font-serif">No Application Found</h2>
    <p className="text-sm text-gray-500 mb-6">
      No postal request was found for this email address. Would you like to submit a new one?
    </p>
    <Link
      to="/postal-request"
      className="inline-block px-6 py-3 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all"
    >
      📬 Submit Postal Request
    </Link>
  </div>
);

/** Info row in the detail grid */
const InfoRow = ({ label, value }) => (
  <div>
    <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">{label}</span>
    <span className="text-sm font-semibold text-gray-800 break-all">{value || '—'}</span>
  </div>
);

// ─── Email Lookup Form ────────────────────────────────────────────────────────
const EmailLookupForm = ({ onSearch, isSearching }) => {
  const [email, setEmail] = useState('');
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📋</div>
      <h2 className="text-xl font-bold text-gray-900 font-serif mb-1">Check Application Status</h2>
      <p className="text-xs text-gray-500 mb-6">Enter your student email to view your postal request status.</p>
      <form onSubmit={(e) => { e.preventDefault(); onSearch(email.trim()); }} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@university.edu"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
        />
        <button
          type="submit"
          disabled={isSearching || !email}
          className="w-full py-3 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
        >
          {isSearching ? 'Searching...' : 'Find My Application'}
        </button>
      </form>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link to="/postal-request" className="text-xs text-red-600 hover:text-red-800 font-semibold">
          📬 Submit a new request →
        </Link>
      </div>
    </div>
  );
};

// ─── DOCUMENT PENDING State ───────────────────────────────────────────────────
const PendingState = ({ request, onRefresh }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main panel */}
    <div className="lg:col-span-2 space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
        <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-amber-100 uppercase tracking-widest">Application</p>
            <h2 className="text-xl font-extrabold text-white font-serif">{request.applicationNumber}</h2>
          </div>
          <PostalStatusBadge status={request.status} />
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
            <p className="text-sm font-semibold text-amber-800 leading-relaxed">
              ⚠️ Your postal request has been submitted successfully. Some required documents are still pending.
              Please upload them before the countdown timer expires.
            </p>
          </div>

          {/* Personal info grid */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
            <InfoRow label="Student Email"  value={request.studentId} />
            <InfoRow label="Full Name"      value={request.formData?.fullName} />
            <InfoRow label="Phone"          value={request.formData?.phone} />
            <InfoRow label="Program"        value={request.formData?.programName} />
            <InfoRow label="Roll Number"    value={request.formData?.rollNumber} />
            <InfoRow label="Submitted"      value={new Date(request.createdAt).toLocaleString()} />
          </div>

          {/* Document checklist — full list showing ✓ and ✗ */}
          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">
              Document Checklist
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {Object.entries(DOC_LABELS).map(([key, label]) => {
                const uploaded = request.documents.some(d => d.name === key);
                return (
                  <div key={key} className="flex items-center justify-between px-4 py-3 bg-white text-sm">
                    <span className="font-medium text-gray-700">{label}</span>
                    {uploaded
                      ? <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">✅ Uploaded</span>
                      : <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 animate-pulse">⚠️ Missing</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Sidebar */}
    <div className="space-y-4">
      {/* Countdown timer */}
      {request.documentDeadline && (
        <CountdownTimer
          deadline={request.documentDeadline}
          onExpire={onRefresh}
        />
      )}

      {/* Upload form — only missing docs */}
      <PostalDocumentUpload
        requestId={request._id}
        missingDocuments={request.missingDocuments}
        uploadedDocs={request.documents}
        status={request.status}
        onUploadSuccess={onRefresh}
      />
    </div>
  </div>
);

// ─── SUBMITTED State ──────────────────────────────────────────────────────────
const SubmittedState = ({ request }) => (
  <div className="max-w-2xl mx-auto space-y-4">
    <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
      <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold text-green-100 uppercase tracking-widest">Application</p>
          <h2 className="text-xl font-extrabold text-white font-serif">{request.applicationNumber}</h2>
        </div>
        <PostalStatusBadge status={request.status} />
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
          <p className="text-sm font-semibold text-green-800 leading-relaxed">
            ✅ Your postal request has been submitted successfully with all required documents.
            The Registry Office will process your request and contact you if needed.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <InfoRow label="Student Email" value={request.studentId} />
          <InfoRow label="Full Name"     value={request.formData?.fullName} />
          <InfoRow label="Program"       value={request.formData?.programName} />
          <InfoRow label="Roll Number"   value={request.formData?.rollNumber} />
          <InfoRow label="Submitted At"  value={request.submittedAt ? new Date(request.submittedAt).toLocaleString() : '—'} />
          <InfoRow label="Phone"         value={request.formData?.phone} />
        </div>

        {/* All docs uploaded */}
        <div>
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">
            Documents Received
          </h3>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {Object.entries(DOC_LABELS).map(([key, label]) => {
              const doc = request.documents.find(d => d.name === key);
              return (
                <div key={key} className="flex items-center justify-between px-4 py-3 bg-white text-sm">
                  <div>
                    <p className="font-medium text-gray-700">{label}</p>
                    {doc && <p className="text-[10px] text-gray-400 mt-0.5">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>}
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                    ✅ Received
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    <div className="text-center">
      <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
        ← Back to Home
      </Link>
    </div>
  </div>
);

// ─── EXPIRED State ────────────────────────────────────────────────────────────
const ExpiredState = ({ request }) => (
  <div className="max-w-2xl mx-auto space-y-4">
    <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
      <div className="bg-red-700 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold text-red-200 uppercase tracking-widest">Application</p>
          <h2 className="text-xl font-extrabold text-white font-serif">{request.applicationNumber}</h2>
        </div>
        <PostalStatusBadge status={request.status} />
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
          <p className="text-sm font-semibold text-red-800 leading-relaxed">
            🛑 <strong>Deadline expired.</strong> This application has expired because the required documents were not uploaded within
            the 5-minute window. No further uploads are permitted.
          </p>
          <p className="text-xs text-red-600 mt-2 font-medium">
            Please contact the Registry Office for further assistance, or submit a new postal request.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <InfoRow label="Student Email" value={request.studentId} />
          <InfoRow label="Full Name"     value={request.formData?.fullName} />
          <InfoRow label="Submitted"     value={new Date(request.createdAt).toLocaleString()} />
          <InfoRow label="Expired At"    value={request.expiredAt ? new Date(request.expiredAt).toLocaleString() : '—'} />
        </div>

        {/* Missing docs that were never uploaded */}
        {request.missingDocuments?.length > 0 && (
          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">
              Documents Not Uploaded
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {Object.entries(DOC_LABELS).map(([key, label]) => {
                const uploaded = request.documents.some(d => d.name === key);
                const missing  = request.missingDocuments.includes(key);
                return (
                  <div key={key} className="flex items-center justify-between px-4 py-3 bg-white text-sm">
                    <span className="font-medium text-gray-700">{label}</span>
                    {uploaded
                      ? <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">✅ Uploaded</span>
                      : <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">❌ Not Uploaded</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            to="/postal-request"
            className="inline-block px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all"
          >
            Submit New Request
          </Link>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Status Page ─────────────────────────────────────────────────────────
const PostalRequestStatus = () => {
  const [searchParams] = useSearchParams();
  const prefilledEmail  = searchParams.get('email') || '';

  const [email,       setEmail]       = useState(prefilledEmail);
  const [request,     setRequest]     = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [notFound,    setNotFound]    = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  const lookupApplication = useCallback(async (emailToSearch) => {
    if (!emailToSearch) return;
    setIsLoading(true);
    setErrorMsg('');
    setNotFound(false);

    try {
      const { data } = await axios.get(
        `${API_URL}/api/postal-requests/my/${encodeURIComponent(emailToSearch.toLowerCase())}`
      );
      setHasSearched(true);
      if (data.exists && data.request) {
        setRequest(data.request);
        setNotFound(false);
      } else {
        setRequest(null);
        setNotFound(true);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch application. Please try again.');
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-lookup if email came from query param (post-submission redirect)
  useEffect(() => {
    if (prefilledEmail) {
      lookupApplication(prefilledEmail);
    }
  }, [prefilledEmail, lookupApplication]);

  const handleSearch = (em) => {
    setEmail(em);
    lookupApplication(em);
  };

  // When the deadline expires or docs are uploaded, re-fetch
  const handleRefresh = () => {
    if (email) lookupApplication(email);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative header band */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-gray-900 to-gray-700 -skew-y-2 origin-top-left -z-10 shadow-xl" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Page header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                Postal Request
              </span>
              <h1 className="text-2xl font-extrabold text-white font-serif mt-0.5">
                Application Status
              </h1>
            </div>
            <div className="flex gap-3">
              {request && (
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase rounded-full border border-white/20 transition-all"
                >
                  🔄 Refresh
                </button>
              )}
              <Link
                to="/postal-request"
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-full transition-all"
              >
                New Request
              </Link>
            </div>
          </div>

          {/* Lookup bar (always visible when application is showing) */}
          {hasSearched && !isLoading && (
            <div className="mb-6 bg-white rounded-xl shadow border border-gray-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium shrink-0">
                🔍 Showing results for:
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSearch(email); }}
                className="flex flex-1 gap-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Search another email..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-400 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-gray-700 transition-all"
                >
                  Search
                </button>
              </form>
            </div>
          )}

          {/* Error banner */}
          {errorMsg && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <p className="text-xs text-red-700 font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && <LoadingState />}

          {/* Not searched yet — show email lookup form */}
          {!isLoading && !hasSearched && (
            <EmailLookupForm onSearch={handleSearch} isSearching={isLoading} />
          )}

          {/* No application found */}
          {!isLoading && hasSearched && notFound && <NoApplication />}

          {/* Application states */}
          {!isLoading && request && (
            <>
              {request.status === 'DOCUMENT_PENDING' && (
                <PendingState request={request} onRefresh={handleRefresh} />
              )}
              {request.status === 'SUBMITTED' && (
                <SubmittedState request={request} />
              )}
              {request.status === 'EXPIRED' && (
                <ExpiredState request={request} />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostalRequestStatus;
