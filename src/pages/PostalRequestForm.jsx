import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ─── Document field definitions ───────────────────────────────────────────────
const DOC_FIELDS = [
  {
    key:   'identityProof',
    label: 'Identity Proof',
    hint:  'Passport copy or CNIC — PDF, JPG, PNG. Max 10 MB.'
  },
  {
    key:   'addressProof',
    label: 'Address Proof',
    hint:  'Utility bill or official address document — PDF, JPG, PNG. Max 10 MB.'
  },
  {
    key:   'academicTranscript',
    label: 'Certified Academic Transcript',
    hint:  'Official transcript issued by your institution — PDF, JPG, PNG. Max 10 MB.'
  }
];

// ─── Reusable file drop zone ──────────────────────────────────────────────────
const FileInput = ({ field, file, onChange }) => (
  <div className={`rounded-xl border-2 transition-all p-4
    ${file ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/30'}`}>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">{field.label}</p>
        {file
          ? <p className="text-xs text-green-600 font-medium mt-0.5">✅ {file.name}</p>
          : <p className="text-xs text-gray-400 mt-0.5">{field.hint}</p>
        }
      </div>
      <label className="shrink-0 cursor-pointer px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide
        bg-white border border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 transition-all shadow-sm">
        {file ? 'Change' : 'Choose File'}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => onChange(e, field.key)}
        />
      </label>
    </div>
  </div>
);

// ─── Form section heading ─────────────────────────────────────────────────────
const SectionHeading = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-5">
    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0 text-sm">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PostalRequestForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    studentId:      '',
    fullName:       '',
    fatherName:     '',
    phone:          '',
    address:        '',
    passportOrCnic: '',
    programName:    '',
    rollNumber:     ''
  });

  const [files, setFiles] = useState({
    identityProof:      null,
    addressProof:       null,
    academicTranscript: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 10 MB per file.');
      return;
    }
    setErrorMsg('');
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId.trim()) {
      setErrorMsg('Student email is required.');
      return;
    }
    if (!form.fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const fd = new FormData();
    // Append all form fields
    Object.keys(form).forEach(key => fd.append(key, form[key].trim()));
    // Append files (optional)
    if (files.identityProof)      fd.append('identityProof',      files.identityProof);
    if (files.addressProof)       fd.append('addressProof',       files.addressProof);
    if (files.academicTranscript) fd.append('academicTranscript', files.academicTranscript);

    try {
      await axios.post(`${API_URL}/api/postal-requests`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Redirect to status page — student enters email there to see their status
      navigate(`/postal-request/status?email=${encodeURIComponent(form.studentId.trim().toLowerCase())}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      // If already submitted, redirect to status page
      if (err.response?.status === 409) {
        navigate(`/postal-request/status?email=${encodeURIComponent(form.studentId.trim().toLowerCase())}`);
        return;
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadedCount = Object.values(files).filter(Boolean).length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative header band */}
        <div className="absolute top-0 left-0 w-full h-56 bg-gradient-to-br from-red-800 to-red-600 -skew-y-2 origin-top-left -z-10 shadow-xl" />

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Page header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold text-red-200 uppercase tracking-widest">
                Registry Office
              </span>
              <h1 className="text-2xl font-extrabold text-white font-serif mt-1">
                Postal Request Application
              </h1>
              <p className="text-red-200 text-xs mt-1">
                Fill in your details and upload any available documents. Missing documents can be uploaded later.
              </p>
            </div>
            <Link
              to="/postal-request/status"
              className="shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold uppercase rounded-full border border-white/30 transition-all"
            >
              Check Status
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* Progress indicator */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
              <span>Documents uploaded: <strong className={uploadedCount === 3 ? 'text-green-600' : 'text-amber-600'}>{uploadedCount}/3</strong></span>
              <span className="text-gray-400">All fields marked <span className="text-red-500">*</span> are required</span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">

              {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="text-xs text-red-700 font-semibold">{errorMsg}</p>
                </div>
              )}

              {/* ── Section 1: Personal Info ── */}
              <section>
                <SectionHeading icon="👤" title="Personal Information" subtitle="Enter your personal details exactly as they appear on your ID." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Student Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="studentId"
                      required
                      value={form.studentId}
                      onChange={handleChange}
                      placeholder="e.g. student@university.edu"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      This email is your unique ID and will be used for all status updates and tracking.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Muhammad Ali Khan"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={form.fatherName}
                      onChange={handleChange}
                      placeholder="e.g. Ahmad Khan"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Passport / CNIC Number
                    </label>
                    <input
                      type="text"
                      name="passportOrCnic"
                      value={form.passportOrCnic}
                      onChange={handleChange}
                      placeholder="e.g. 42101-1234567-1"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Mailing Address
                    </label>
                    <textarea
                      name="address"
                      rows={2}
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Full mailing address where documents should be posted..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* ── Section 2: Academic Info ── */}
              <section>
                <SectionHeading icon="🎓" title="Academic Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Program / Degree Name
                    </label>
                    <input
                      type="text"
                      name="programName"
                      value={form.programName}
                      onChange={handleChange}
                      placeholder="e.g. BSc Computer Science"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Roll / Student Number
                    </label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={form.rollNumber}
                      onChange={handleChange}
                      placeholder="e.g. CS-2021-001"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* ── Section 3: Documents ── */}
              <section>
                <SectionHeading
                  icon="📄"
                  title="Supporting Documents"
                  subtitle="Documents are optional at this stage. You can upload missing ones later within 5 minutes."
                />
                <div className="space-y-3">
                  {DOC_FIELDS.map(field => (
                    <FileInput
                      key={field.key}
                      field={field}
                      file={files[field.key]}
                      onChange={handleFileChange}
                    />
                  ))}
                </div>

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold">ℹ️ Note:</span> You can submit this form without uploading all documents.
                  If any documents are missing, you will have <strong>5 minutes</strong> to upload them after submission.
                  After the deadline, the application will expire automatically.
                </div>
              </section>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl text-white font-bold uppercase tracking-widest text-sm shadow-lg transition-all
                  ${isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-700 hover:bg-red-800 hover:shadow-red-200 hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
              >
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Submitting...
                    </span>
                  : '📬 Submit Postal Request'
                }
              </button>

            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostalRequestForm;
