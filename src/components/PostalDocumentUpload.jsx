import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

// Document metadata — labels and hints
const DOC_CONFIG = {
  identityProof: {
    label: 'Identity Proof',
    hint:  'Passport copy or CNIC — PDF, JPG, PNG. Max 10 MB.'
  },
  addressProof: {
    label: 'Address Proof',
    hint:  'Utility bill or official address document — PDF, JPG, PNG. Max 10 MB.'
  },
  academicTranscript: {
    label: 'Certified Academic Transcript',
    hint:  'Official transcript issued by your institution — PDF, JPG, PNG. Max 10 MB.'
  }
};

/**
 * PostalDocumentUpload
 *
 * Renders an upload form showing ONLY the documents that are still missing.
 * Props:
 *   - requestId        (string)   MongoDB _id of the PostalRequest
 *   - missingDocuments (string[]) Array of doc keys still missing e.g. ['addressProof']
 *   - uploadedDocs     (array)    Array of already-uploaded doc objects
 *   - status           (string)   Current request status
 *   - onUploadSuccess  (fn)       Called with the updated request after upload
 */
const PostalDocumentUpload = ({
  requestId,
  missingDocuments = [],
  uploadedDocs     = [],
  status,
  onUploadSuccess
}) => {
  const [files,       setFiles]       = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  // ── Guard states ─────────────────────────────────────────────────────────────
  if (status === 'EXPIRED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
        <div className="text-2xl mb-2">🛑</div>
        <p className="text-sm font-bold text-red-700">Upload Disabled</p>
        <p className="text-xs text-red-500 mt-1 leading-relaxed">
          This request has expired. No further document uploads are permitted.
        </p>
      </div>
    );
  }

  if (status === 'SUBMITTED' || missingDocuments.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center shadow-sm">
        <div className="text-2xl mb-2">✅</div>
        <p className="text-sm font-bold text-green-700">All Documents Received</p>
        <p className="text-xs text-green-600 mt-1 leading-relaxed">
          Your postal request is complete and is under review.
        </p>
      </div>
    );
  }

  // ── File change handler ───────────────────────────────────────────────────────
  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 10 MB.');
      return;
    }
    setErrorMsg('');
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  // ── Submit handler ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedKeys = Object.keys(files).filter(k => files[k] && missingDocuments.includes(k));
    if (selectedKeys.length === 0) {
      setErrorMsg('Please select at least one document to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const fd = new FormData();
    selectedKeys.forEach(key => fd.append(key, files[key]));

    try {
      const { data } = await axios.post(
        `${API_URL}/api/postal-requests/${requestId}/upload`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setSuccessMsg(data.message);
      setFiles({});

      if (onUploadSuccess) {
        onUploadSuccess(data.request);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = missingDocuments.length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-3.5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-amber-900">Upload Missing Documents</h3>
          <p className="text-[11px] text-amber-600 mt-0.5">
            {pendingCount} document{pendingCount > 1 ? 's' : ''} still required
          </p>
        </div>
        <span className="w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
          {pendingCount}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Feedback messages */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
            <p className="text-xs text-red-700 font-semibold">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-lg">
            <p className="text-xs text-green-700 font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Only render the MISSING document fields */}
        <div className="space-y-3">
          {missingDocuments.map(key => {
            const config    = DOC_CONFIG[key];
            const hasFile   = !!files[key];
            if (!config) return null;
            return (
              <div
                key={key}
                className={`rounded-xl border-2 transition-all p-4
                  ${hasFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-dashed border-amber-200 bg-amber-50/40 hover:border-amber-400'
                  }`}
              >
                <p className="text-xs font-bold text-gray-800 mb-1">{config.label}</p>
                {hasFile
                  ? <p className="text-[11px] text-green-600 font-medium mb-2">✅ {files[key].name}</p>
                  : <p className="text-[11px] text-gray-400 mb-2">{config.hint}</p>
                }
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold
                  bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-600 transition-all shadow-sm">
                  📎 {hasFile ? 'Change File' : 'Choose File'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, key)}
                  />
                </label>
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isUploading || Object.keys(files).filter(k => files[k]).length === 0}
          className={`w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all
            ${isUploading || Object.keys(files).filter(k => files[k]).length === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-amber-200'
            }`}
        >
          {isUploading
            ? <span className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Uploading...
              </span>
            : '📤 Submit Documents'
          }
        </button>
      </form>
    </div>
  );
};

export default PostalDocumentUpload;
