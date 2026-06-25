import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import logo from '../assets/logo.png';
import countries from '../data/countries.json';

const phoneCodes = [
  { code: 'PK', name: 'Pakistan', dial_code: '+92', flag: '🇵🇰' },
  { code: 'AF', name: 'Afghanistan', dial_code: '+93', flag: '🇦🇫' },
  { code: 'IT', name: 'Italy', dial_code: '+39', flag: '🇮🇹' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { code: 'AE', name: 'United Arab Emirates', dial_code: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial_code: '+966', flag: '🇸🇦' },
  { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳' },
  { code: 'BD', name: 'Bangladesh', dial_code: '+880', flag: '🇧🇩' },
  { code: 'OM', name: 'Oman', dial_code: '+968', flag: '🇴🇲' },
  { code: 'QA', name: 'Qatar', dial_code: '+974', flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain', dial_code: '+973', flag: '🇧🇭' },
  { code: 'KW', name: 'Kuwait', dial_code: '+965', flag: '🇰🇼' },
  { code: 'DE', name: 'Germany', dial_code: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial_code: '+33', flag: '🇫🇷' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
  { code: 'MY', name: 'Malaysia', dial_code: '+60', flag: '🇲🇾' },
  { code: 'TR', name: 'Turkey', dial_code: '+90', flag: '🇹🇷' },
  { code: 'CA', name: 'Canada', dial_code: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
];

const Apply = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal
    firstName: '',
    lastName: '',
    certificateName: '',
    dob: '',
    gender: '',

    // Step 2: Contact & Identification
    email: '',
    phone: '',
    passportNumber: '',
    country: '',
    address: '',

    // Step 3: Academic Info
    department: '',
    programme: '',
    courseStartDate: '',
    courseEndDate: '',
    intake: '',
    creditHours: '',
    price: '',
    highestQualification: '',

    // Step 4: Approved Centre Info
    registrationViaCentre: '',
    centreEmail: '',
    centrePhone: '',
    centreName: '',
  });

  // Files
  const [profilePicture, setProfilePicture] = useState(null);
  const [passportCopy, setPassportCopy] = useState(null);
  const [resume, setResume] = useState(null);
  const [transcript1, setTranscript1] = useState(null);
  const [transcript2, setTranscript2] = useState(null);
  const [transcript3, setTranscript3] = useState(null);

  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [docsUploaded, setDocsUploaded] = useState(false);
  const [submissionTime, setSubmissionTime] = useState(null);
  const [submittedAppId, setSubmittedAppId] = useState(null); // MongoDB _id of the submitted application
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, expired: false });
  const [errorMsg, setErrorMsg] = useState('');

  const [phonePrefix, setPhonePrefix] = useState('+92');
  const [phoneBody, setPhoneBody] = useState('');

  // Sync phone code prefix and body to main phone field
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      phone: phoneBody ? `${phonePrefix} ${phoneBody}`.trim() : ''
    }));
  }, [phonePrefix, phoneBody]);

  // Academic Options from DB
  const [departments, setDepartments] = useState([]);
  const [allProgrammes, setAllProgrammes] = useState([]); // [{department, programme, creditHours, price}]
  const [allIntakes, setAllIntakes] = useState([]);       // [{department, programme, intake}]

  // Centres list
  const [centres, setCentres] = useState([]);

  useEffect(() => {
    const fetchAcademicOptions = async (attempt = 1) => {
      try {
        const response = await axios.get(`${API_URL}/api/options`);
        if (response.data) {
          const { departments: dbDeps, programmes: dbProgs, intakes: dbIntakes } = response.data;
          if (dbDeps?.length > 0) setDepartments(dbDeps);
          if (dbProgs?.length > 0) setAllProgrammes(dbProgs);
          if (dbIntakes?.length > 0) setAllIntakes(dbIntakes);
        }
      } catch (err) {
        console.error(`Failed to load academic options (attempt ${attempt}):`, err);
        if (attempt < 4) {
          setTimeout(() => fetchAcademicOptions(attempt + 1), attempt * 2000);
        }
      }
    };

    const fetchCentres = async (attempt = 1) => {
      try {
        const response = await axios.get(`${API_URL}/api/centres/public`);
        if (response.data) setCentres(response.data);
      } catch (err) {
        console.error(`Failed to load centres (attempt ${attempt}):`, err);
        if (attempt < 4) {
          setTimeout(() => fetchCentres(attempt + 1), attempt * 2000);
        }
      }
    };

    fetchAcademicOptions();
    fetchCentres();
  }, []);


  // Filtered programmes based on selected department (Programme type)
  const filteredProgrammes = allProgrammes
    .filter(p => p.department === formData.department)
    .map(p => p.programme)
    .filter(Boolean);
  const uniqueProgrammes = Array.from(new Set(filteredProgrammes));

  // Extract start and end dates based on selected programme
  const selectedProgObj = allProgrammes.find(
    p => p.department === formData.department && p.programme === formData.programme
  );
  const startDates = selectedProgObj?.courseStartDate
    ? selectedProgObj.courseStartDate.split(',').map(d => d.trim()).filter(Boolean)
    : [];
  const endDates = selectedProgObj?.courseEndDate
    ? selectedProgObj.courseEndDate.split(',').map(d => d.trim()).filter(Boolean)
    : [];

  // Filtered intakes based on selected department + programme
  const filteredIntakes = allIntakes
    .filter(i => i.department === formData.department && i.programme === formData.programme)
    .map(i => i.intake)
    .filter(Boolean);

  // Per-step completion check — drives button disabled state
  const isStepComplete = (() => {
    if (step === 1)
      return !!(formData.firstName && formData.lastName && formData.certificateName && formData.dob && formData.gender);
    if (step === 2)
      return !!(formData.email && formData.phone && formData.passportNumber && formData.country && formData.address);
    if (step === 3)
      return !!(formData.department && formData.programme && formData.courseStartDate && formData.courseEndDate && formData.highestQualification);
    if (step === 4) {
      if (!formData.registrationViaCentre) return false;
      if (formData.registrationViaCentre === 'Yes') return !!(formData.centreName && formData.centreEmail);
      return true;
    }
    if (step === 5)
      return !!privacyConsent; // Documents are optional - only privacy consent is required
    return true; // step 6 review — always enabled
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'department') {
      // Reset programme, intake, creditHours, price, dates when department changes
      setFormData(prev => ({
        ...prev,
        department: value,
        programme: '',
        courseStartDate: '',
        courseEndDate: '',
        intake: '',
        creditHours: '',
        price: ''
      }));
    } else if (name === 'programme') {
      // Auto-fill creditHours and price from the matched programme object
      const matched = allProgrammes.find(
        p => p.department === formData.department && p.programme === value
      );
      setFormData(prev => ({
        ...prev,
        programme: value,
        courseStartDate: matched?.courseStartDate || '',
        courseEndDate: matched?.courseEndDate || '',
        intake: '',
        creditHours: matched?.creditHours || '',
        price: matched?.price || ''
      }));
    } else if (name === 'intake') {
      setFormData(prev => ({ ...prev, intake: value }));
    } else if (name === 'registrationViaCentre') {
      setFormData(prev => ({
        ...prev,
        registrationViaCentre: value,
        centreEmail: '',
        centrePhone: '',
        centreName: ''
      }));
    } else if (name === 'centreName') {
      // Auto-fill centreEmail and centrePhone from centres list
      const matched = centres.find(c => c.name === value);
      setFormData(prev => ({
        ...prev,
        centreName: value,
        centreEmail: matched?.email || '',
        centrePhone: matched?.phone || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Initialize timer from localStorage if present (helps on refresh)
  useEffect(() => {
    if (!submissionTime) {
      try {
        const raw = localStorage.getItem('lastApplication');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.submissionTime) setSubmissionTime(parsed.submissionTime);
          if (typeof parsed?.docsUploaded === 'boolean') setDocsUploaded(parsed.docsUploaded);
        }
      } catch (e) {}
    }
  }, [submissionTime]);

  // Timer effect for pending documents
  useEffect(() => {
    if (!isSuccess || docsUploaded || !submissionTime) return;

    // Calculate deadline: add 2 months to submissionTime
    const deadline = new Date(submissionTime);
    deadline.setMonth(deadline.getMonth() + 2);

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
  }, [isSuccess, docsUploaded, submissionTime]);

  // If user uploads files later while viewing the form (after initial submission), mark docsUploaded true
  useEffect(() => {
    if (isSuccess && !docsUploaded) {
      const nowUploaded = !!(profilePicture && passportCopy && resume && transcript1);
      if (nowUploaded) {
        setDocsUploaded(true);
        // update localStorage record
        try {
          const raw = localStorage.getItem('lastApplication');
          const parsed = raw ? JSON.parse(raw) : {};
          parsed.docsUploaded = true;
          localStorage.setItem('lastApplication', JSON.stringify(parsed));
        } catch (e) {}
      }
    }
  }, [profilePicture, passportCopy, resume, transcript1, isSuccess, docsUploaded]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const name = e.target.name;
    if (name === 'profilePicture') setProfilePicture(file);
    else if (name === 'passportCopy') setPassportCopy(file);
    else if (name === 'resume') setResume(file);
    else if (name === 'transcript1') setTranscript1(file);
    else if (name === 'transcript2') setTranscript2(file);
    else if (name === 'transcript3') setTranscript3(file);
  };

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.certificateName || !formData.dob || !formData.gender) {
        setErrorMsg('Please fill out all required fields.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.email || !formData.phone || !formData.passportNumber || !formData.country || !formData.address) {
        setErrorMsg('Please fill out all required fields.');
        return;
      }
    }
    if (step === 3) {
      if (!formData.department || !formData.programme || !formData.courseStartDate || !formData.courseEndDate || !formData.highestQualification) {
        setErrorMsg('Please select your programme type, course name, dates, and highest qualification.');
        return;
      }
    }
    if (step === 4) {
      if (!formData.registrationViaCentre) {
        setErrorMsg('Please indicate if you are registering via an Approved Centre.');
        return;
      }
      if (formData.registrationViaCentre === 'Yes' && (!formData.centreName || !formData.centreEmail)) {
        setErrorMsg('Please select an Approved Centre.');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    if (!privacyConsent) {
      setErrorMsg('Please read and agree to the Data Privacy Notice and consent to the processing of your personal data.');
      setIsSubmitting(false);
      return;
    }

    // If user is returning to upload documents for an already-submitted application
    if (submittedAppId) {
      const data = new FormData();
      if (profilePicture) data.append('profilePicture', profilePicture);
      if (passportCopy) data.append('passportCopy', passportCopy);
      if (resume) data.append('resume', resume);
      if (transcript1) data.append('transcript1', transcript1);
      if (transcript2) data.append('transcript2', transcript2);
      if (transcript3) data.append('transcript3', transcript3);

      try {
        await axios.post(`${API_URL}/api/applications/${submittedAppId}/documents`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploaded = !!(profilePicture && passportCopy && resume && transcript1);
        setDocsUploaded(uploaded);
        setIsSuccess(true);
        if (uploaded) {
          setTimeout(() => { navigate('/'); }, 5000);
        }
      } catch (error) {
        console.error('Document upload failed', error);
        setErrorMsg(error.response?.data?.message || 'Failed to upload documents. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Documents are now optional - no file validation needed

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    
    // Append all documents - both required and optional
    // Only append if file exists (not null/undefined)
    if (profilePicture) data.append('profilePicture', profilePicture);
    if (passportCopy) data.append('passportCopy', passportCopy);
    if (resume) data.append('resume', resume);
    if (transcript1) data.append('transcript1', transcript1);
    if (transcript2) data.append('transcript2', transcript2);
    if (transcript3) data.append('transcript3', transcript3);

    try {
      const res = await axios.post(`${API_URL}/api/applications`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Determine whether user uploaded documents in the documents step
      const uploaded = !!(profilePicture && passportCopy && resume && transcript1);
      setDocsUploaded(uploaded);

      // Save the MongoDB _id so the upload button can use it
      if (res?.data?._id) setSubmittedAppId(res.data._id);

      // Use server submission timestamp when available, otherwise now
      const submittedAt = res?.data?.submissionDate ? new Date(res.data.submissionDate).getTime() : Date.now();
      setSubmissionTime(submittedAt);

      // Persist minimal submission info so timer survives refresh
      try {
        localStorage.setItem('lastApplication', JSON.stringify({ submissionTime: submittedAt, docsUploaded: uploaded }));
      } catch (e) {
        // ignore localStorage errors
      }

      setIsSuccess(true);

      // If all docs uploaded, redirect after brief delay
      if (uploaded) {
        setTimeout(() => {
          navigate('/');
        }, 5000);
      }
    } catch (error) {
      console.error('Submission failed', error);
      setErrorMsg(error.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative Skewed Banner */}
        <div className="absolute top-0 left-0 w-full h-40 sm:h-80 bg-uniboRed transform -skew-y-3 origin-top-left -z-10 shadow-lg"></div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 relative">

          {/* Header */}
          <div className="bg-gray-900 text-white p-4 sm:p-8 md:p-10 border-b-4 border-uniboRed flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/" className="bg-white rounded-lg p-1.5 sm:p-2 h-12 sm:h-18 flex items-center justify-center shadow-lg border border-gray-800 hover:scale-105 transition-transform duration-350 cursor-pointer">
                <img src={logo} alt="Logo" className="h-10 sm:h-14 w-auto object-contain" />
              </Link>
              <div>
                <p className="text-gray-400 text-xs mt-0.5">Academic Admission Application Portal</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 md:mt-0 px-3 py-1 bg-uniboRed text-xs font-extrabold uppercase rounded-full">
              Step {step} of 6
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-2">
            <div
              className="bg-uniboRed h-2 transition-all duration-500 ease-out"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>

          <div className="p-4 sm:p-8 md:p-10">
            {isSuccess ? (
              // CASE: Submission completed
              docsUploaded ? (
                // All documents uploaded — show original success and redirect
                <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in-up">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-inner">
                    <svg className="w-8 sm:w-10 h-8 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">Application Received!</h3>
                  <p className="text-sm sm:text-base text-gray-500 max-w-md">Your full academic profile and uploaded files have been logged. We will review your academic qualifications shortly.</p>
                  <div className="mt-4">
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">All Documents Submitted ✅</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-6">Redirecting to Home page...</p>
                </div>
              ) : (
                // Documents missing — show pending UI with warning, timer and upload button
                <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in-up">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-2 shadow-inner">
                    <svg className="w-8 sm:w-10 h-8 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">Application Received!</h3>
                  <p className="text-sm sm:text-base text-gray-700 max-w-md">Your application has been submitted. However, your documents are still pending.</p>

                  {/* Orange warning banner */}
                  <div className="w-full max-w-2xl bg-[#f97316] text-white p-4 rounded-lg shadow-md mt-2">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚠️</div>
                      <div className="text-left">
                        <div className="font-bold">Documents Not Uploaded — Status: PENDING</div>
                        <div className="text-sm mt-1">Please upload your required documents within 2 months to complete your application process.</div>
                      </div>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="w-full max-w-md bg-[#0d1b2a] text-white p-4 rounded-lg shadow-inner">
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
                          Upload deadline: {submissionTime ? new Date(submissionTime).setMonth(new Date(submissionTime).getMonth() + 2) && new Date(new Date(submissionTime).setMonth(new Date(submissionTime).getMonth() + 2)).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full max-w-md">
                    <button
                      onClick={() => {
                        navigate(`/upload-documents/${submittedAppId}`);
                      }}
                      className="w-full bg-[#f97316] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-95 transition-colors"
                    >
                      Upload Documents Now →
                    </button>
                  </div>
                </div>
              )
            ) : isSubmitting ? (
              <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-uniboRed/20 border-t-uniboRed rounded-full animate-spin"></div>
                  <div className="absolute w-12 h-12 bg-uniboRed/10 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Submitting Your Application</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">Please wait while we upload your files and process your application. This may take a moment...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {errorMsg && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1: Personal Details */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-2">Step 1: Personal Details</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Please provide your legal personal information as shown in your identity documents.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          First Name <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                          placeholder="e.g. Leonardo"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Last Name <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                          placeholder="e.g. da Vinci"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Name to be printed on the certificate <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="text"
                          name="certificateName"
                          required
                          value={formData.certificateName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                          placeholder="e.g. Leonardo da Vinci"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Date of Birth <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="date"
                          name="dob"
                          required
                          value={formData.dob}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Gender <span className="text-uniboRed">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none appearance-none font-medium"
                          >
                            <option value="">-- Select Gender --</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Prefer Not to Say">Prefer Not to Say</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Contact & Identification */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-2">Step 2: Contact &amp; Identification</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Please provide verified contact details so that our registry can reach you.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Email Address <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Contact Telephone Number <span className="text-uniboRed">*</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="relative w-[110px] shrink-0">
                            <select
                              value={phonePrefix}
                              onChange={(e) => setPhonePrefix(e.target.value)}
                              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none font-medium appearance-none cursor-pointer"
                            >
                              {phoneCodes.map((c) => (
                                <option key={c.code} value={c.dial_code}>
                                  {c.flag} {c.dial_code}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                          </div>
                          <input
                            type="tel"
                            name="phoneBody"
                            required
                            value={phoneBody}
                            onChange={(e) => setPhoneBody(e.target.value)}
                            className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                            placeholder="333 123 4567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Passport/ID Number <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="text"
                          name="passportNumber"
                          required
                          value={formData.passportNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                          placeholder="YA123456"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Country of Residence <span className="text-uniboRed">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="country"
                            required
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none appearance-none font-medium"
                          >
                            <option value="">-- Select Country --</option>
                            {countries.map((c) => (
                              <option key={c.code} value={c.name}>
                                {c.flag} {c.name}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Full Home Address <span className="text-uniboRed">*</span>
                        </label>
                        <textarea
                          name="address"
                          required
                          rows="3"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none resize-none"
                          placeholder="Piazza di Porta Ravegnana, BO, Italy"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Academic Information */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-2">Step 3: Academic Information</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Select your programme type, course name, dates and intake. Credit hours and price will be filled automatically.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Programme Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Programme Type <span className="text-uniboRed">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none appearance-none font-medium"
                          >
                            <option value="">Choose</option>
                            {departments.map((dept, i) => (
                              <option key={i} value={dept}>{dept}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>
                      </div>

                      {/* Course Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Course Name <span className="text-uniboRed">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="programme"
                            value={formData.programme}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none appearance-none font-medium"
                          >
                            <option value="">Choose</option>
                            {uniqueProgrammes.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>
                      </div>

                      {/* Course Start Date — read-only, auto-filled */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Course Start Date <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="text"
                          name="courseStartDate"
                          value={formData.courseStartDate}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none font-medium cursor-not-allowed text-gray-600"
                          placeholder="Auto-filled from course"
                        />
                      </div>

                      {/* Course End Date — read-only, auto-filled */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Course End Date <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="text"
                          name="courseEndDate"
                          value={formData.courseEndDate}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none font-medium cursor-not-allowed text-gray-600"
                          placeholder="Auto-filled from course"
                        />
                      </div>

                      {/* Intake */}
                      {/* <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Intake <span className="text-uniboRed">*</span>
                        </label>
                        <div className="relative"> */}
                      {/* <select
                            name="intake"
                            value={formData.intake}
                            onChange={handleChange}
                            disabled={!formData.programme}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none appearance-none font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="">-- Select Intake --</option>
                            {filteredIntakes.map((intake) => (
                              <option key={intake} value={intake}>{intake}</option>
                            ))}
                          </select> */}
                      {/* <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                      </div>
                    </div>
                  </div> */}

                      {/* Credit Hours & Price — auto-filled read-only */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Credits
                    </label>
                    <input
                      type="text"
                      name="credits"
                      value={formData.creditHours ? String(formData.creditHours).split(' ')[0] : ''}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none font-medium cursor-not-allowed text-gray-600"
                      placeholder="Auto-filled"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Hours
                    </label>
                    <input
                      type="text"
                      name="hours"
                      value={formData.creditHours ? String(formData.creditHours).split(' ').slice(1).join(' ') : ''}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none font-medium cursor-not-allowed text-gray-600"
                      placeholder="Auto-filled"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none font-medium cursor-not-allowed text-gray-600"
                      placeholder="Auto-filled"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs sm:text-sm text-gray-600">
                  Credit hours, price, and course dates are automatically filled from the selected course.
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Highest Qualification <span className="text-uniboRed">*</span>
                  </label>
                  <input
                    type="text"
                    name="highestQualification"
                    required
                    value={formData.highestQualification}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                    placeholder="e.g. Master of Science in Informatics"
                  />
                </div>
              </div>
                  </div>
                )}

          {/* STEP 4: Registration via Approved Centre */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-2">Step 4: Registration via Approved Centre</h3>
                <p className="text-xs sm:text-sm text-gray-500">Please indicate if you are applying through a university-approved regional study centre.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Are you registering via an Approved Centre? <span className="text-uniboRed">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-800">
                      <input
                        type="radio"
                        name="registrationViaCentre"
                        value="Yes"
                        checked={formData.registrationViaCentre === 'Yes'}
                        onChange={handleChange}
                        className="w-4 h-4 text-uniboRed focus:ring-uniboRed border-gray-300"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-800">
                      <input
                        type="radio"
                        name="registrationViaCentre"
                        value="No"
                        checked={formData.registrationViaCentre === 'No'}
                        onChange={handleChange}
                        className="w-4 h-4 text-uniboRed focus:ring-uniboRed border-gray-300"
                      />
                      No
                    </label>
                  </div>
                </div>

                {formData.registrationViaCentre === 'Yes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200 animate-fade-in-up">
                    {/* Centre Name Dropdown */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Select Approved Centre <span className="text-uniboRed">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="centreName"
                          value={formData.centreName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed transition-all text-sm outline-none appearance-none font-medium"
                        >
                          <option value="">-- Select a Centre --</option>
                          {centres.map((c) => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                      {centres.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1 font-medium">No approved centres available. Please contact the institution.</p>
                      )}
                    </div>

                    {/* Centre Email (auto-filled, read-only) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Centre Email
                      </label>
                      <input
                        type="email"
                        name="centreEmail"
                        value={formData.centreEmail}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none font-medium cursor-not-allowed text-gray-600"
                        placeholder="Auto-filled from selected centre"
                      />
                    </div>

                    {/* Centre Phone (auto-filled, read-only) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Centre Contact Number
                      </label>
                      <input
                        type="tel"
                        name="centrePhone"
                        value={formData.centrePhone}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none font-medium cursor-not-allowed text-gray-600"
                        placeholder="Auto-filled from selected centre"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Required Document Uploads */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-2">Step 5: Document Uploads</h3>
                <p className="text-xs sm:text-sm text-gray-500">Upload high-resolution scans of your certifications. Max file size: 10MB per document.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Profile Picture */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Profile Picture (Optional)</label>
                  <input
                    type="file"
                    name="profilePicture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                  />
                  {profilePicture && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {profilePicture.name}</p>}
                </div>

                {/* 2. Passport Copy */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Copy of ID / Passport (Optional)</label>
                  <input
                    type="file"
                    name="passportCopy"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                  />
                  {passportCopy && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {passportCopy.name}</p>}
                </div>

                {/* 3. Resume */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Resume / CV (Optional)</label>
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                  />
                  {resume && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {resume.name}</p>}
                </div>

                {/* 4. Transcript 1 */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Certified Certificate/Transcript 1 (Optional)</label>
                  <input
                    type="file"
                    name="transcript1"
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                  />
                  {transcript1 && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {transcript1.name}</p>}
                </div>

                {/* 5. Transcript 2 */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Certified Certificate/Transcript 2 (Optional)</label>
                  <input
                    type="file"
                    name="transcript2"
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                  />
                  {transcript2 && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {transcript2.name}</p>}
                </div>

                {/* 6. Transcript 3 */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Certified Certificate/Transcript 3 (Optional)</label>
                  <input
                    type="file"
                    name="transcript3"
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                  />
                  {transcript3 && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {transcript3.name}</p>}
                </div>

              </div>

              {/* Data Privacy and Consent Notice */}
              <div className="mt-8 border border-gray-200 rounded-xl p-6 bg-gray-50 space-y-4">
                <h4 className="text-md sm:text-lg font-serif font-bold text-gray-900">Data Privacy and Consent Notice</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  We respect and protect your personal data. The information collected in this application form will be used only for admission, enrollment, academic, and administrative purposes.
                </p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  By submitting this form, you agree that the institution may collect, process, store, and use your personal information in accordance with its Data Privacy Policy.
                </p>
                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    required
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 text-uniboRed focus:ring-uniboRed border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 font-medium select-none">
                    I have read and agree to the Data Privacy Notice and consent to the processing of my personal data. <span className="text-uniboRed">*</span>
                  </span>
                </label>
              </div>

            </div>
          )}

          {/* STEP 6: REVIEW ALL APPLICATION DETAILS */}
          {step === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-1">Step 6: Review Your Application</h3>
                <p className="text-xs sm:text-sm text-gray-500">Please carefully review all details below. Click <strong>Edit</strong> on any section to go back and make changes. When satisfied, click <strong>Confirm &amp; Submit Application</strong>.</p>
              </div>

              {/* Section 1: Personal Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white">
                  <h4 className="text-sm font-bold uppercase tracking-wide">1. Personal Details</h4>
                  <button type="button" onClick={() => setStep(1)} className="text-xs bg-uniboRed hover:bg-red-700 text-white px-3 py-1 rounded-md font-bold transition-colors cursor-pointer">Edit</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 p-5 text-sm">
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">First Name</span><span className="text-gray-800 font-semibold">{formData.firstName || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Last Name</span><span className="text-gray-800 font-semibold">{formData.lastName || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Certificate Name</span><span className="text-gray-800 font-semibold">{formData.certificateName || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Date of Birth</span><span className="text-gray-800 font-semibold">{formData.dob ? new Date(formData.dob).toLocaleDateString() : '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Gender</span><span className="text-gray-800 font-semibold">{formData.gender || '—'}</span></div>
                </div>
              </div>

              {/* Section 2: Contact & Identification */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white">
                  <h4 className="text-sm font-bold uppercase tracking-wide">2. Contact &amp; Identification</h4>
                  <button type="button" onClick={() => setStep(2)} className="text-xs bg-uniboRed hover:bg-red-700 text-white px-3 py-1 rounded-md font-bold transition-colors cursor-pointer">Edit</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 p-5 text-sm">
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Email Address</span><span className="text-gray-800 font-semibold">{formData.email || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Phone Number</span><span className="text-gray-800 font-semibold">{formData.phone || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Passport / ID Number</span><span className="text-gray-800 font-semibold">{formData.passportNumber || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Country of Residence</span><span className="text-gray-800 font-semibold">{formData.country || '—'}</span></div>
                  <div className="sm:col-span-2"><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Full Address</span><span className="text-gray-800 font-semibold">{formData.address || '—'}</span></div>
                </div>
              </div>

              {/* Section 3: Academic Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white">
                  <h4 className="text-sm font-bold uppercase tracking-wide">3. Academic Information</h4>
                  <button type="button" onClick={() => setStep(3)} className="text-xs bg-uniboRed hover:bg-red-700 text-white px-3 py-1 rounded-md font-bold transition-colors cursor-pointer">Edit</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 p-5 text-sm">
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Programme Type</span><span className="text-gray-800 font-semibold">{formData.department || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Course Name</span><span className="text-gray-800 font-semibold">{formData.programme || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Course Start Date</span><span className="text-gray-800 font-semibold">{formData.courseStartDate || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Course End Date</span><span className="text-gray-800 font-semibold">{formData.courseEndDate || '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Credits</span><span className="text-gray-800 font-semibold">{formData.creditHours ? String(formData.creditHours).split(' ')[0] : '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Hours</span><span className="text-gray-800 font-semibold">{formData.creditHours ? String(formData.creditHours).split(' ').slice(1).join(' ') : '—'}</span></div>
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Price</span><span className="text-gray-800 font-semibold">{formData.price || '—'}</span></div>
                  <div className="sm:col-span-2"><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Highest Qualification</span><span className="text-gray-800 font-semibold">{formData.highestQualification || '—'}</span></div>
                </div>
              </div>

              {/* Section 4: Approved Centre */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white">
                  <h4 className="text-sm font-bold uppercase tracking-wide">4. Registration Method</h4>
                  <button type="button" onClick={() => setStep(4)} className="text-xs bg-uniboRed hover:bg-red-700 text-white px-3 py-1 rounded-md font-bold transition-colors cursor-pointer">Edit</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 p-5 text-sm">
                  <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Via Approved Centre?</span><span className={`font-semibold ${formData.registrationViaCentre === 'Yes' ? 'text-amber-700' : 'text-gray-800'}`}>{formData.registrationViaCentre || '—'}</span></div>
                  {formData.registrationViaCentre === 'Yes' && (
                    <>
                      <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Centre Name</span><span className="text-gray-800 font-semibold">{formData.centreName || '—'}</span></div>
                      <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Centre Email</span><span className="text-gray-800 font-semibold">{formData.centreEmail || '—'}</span></div>
                      <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">Centre Phone</span><span className="text-gray-800 font-semibold">{formData.centrePhone || '—'}</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 5: Uploaded Documents */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white">
                  <h4 className="text-sm font-bold uppercase tracking-wide">5. Uploaded Documents</h4>
                  <button type="button" onClick={() => setStep(5)} className="text-xs bg-uniboRed hover:bg-red-700 text-white px-3 py-1 rounded-md font-bold transition-colors cursor-pointer">Edit</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 text-sm">
                  {[
                    { label: 'Profile Picture', file: profilePicture },
                    { label: 'Passport / ID Copy', file: passportCopy },
                    { label: 'Resume / CV', file: resume },
                    { label: 'Transcript 1', file: transcript1 },
                    { label: 'Transcript 2 (Optional)', file: transcript2 },
                    { label: 'Transcript 3 (Optional)', file: transcript3 },
                  ].map(({ label, file }) => (
                    <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${file ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-dashed border-gray-200 text-gray-400'}`}>
                      {file ? (
                        <><span className="text-green-500 text-base">✓</span><span className="truncate">{label}: <em>{file.name}</em></span></>
                      ) : (
                        <><span className="text-gray-300 text-base">○</span><span>{label}: Not uploaded</span></>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Consent Reminder */}
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  By clicking <strong>Confirm &amp; Submit Application</strong>, you confirm that all information provided is accurate and that you have read and agreed to the <strong>Data Privacy Notice</strong> on the previous step.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-xs sm:text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                &larr; Previous Step
              </button>
            ) : (
              <Link to="/" className="w-full sm:w-auto text-xs sm:text-sm font-semibold text-gray-500 hover:text-uniboRed transition-colors text-center">
                &larr; Cancel Application
              </Link>
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepComplete}
                title={!isStepComplete ? 'Please fill all required fields before proceeding' : ''}
                className={`w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 text-white text-xs sm:text-sm font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm ${
                  isStepComplete
                    ? 'bg-uniboRed hover:bg-uniboDarkRed cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                {step === 5 ? 'Review Application →' : 'Next Step →'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !isStepComplete}
                onClick={handleSubmit}
                title={!isStepComplete ? 'Please review your application before submitting' : ''}
                className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3.5 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg transition-all shadow-md hover:shadow-lg ${
                  isStepComplete && !isSubmitting
                    ? 'bg-uniboRed hover:bg-uniboDarkRed cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? 'Submitting Application...' : '✓ Confirm & Submit Application'}
              </button>
            )}
          </div>

        </div>
            )}
    </div>
        </div >
      </main >

  <Footer />
    </div >
  );
};

export default Apply;
