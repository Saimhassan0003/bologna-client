import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import logo from '../assets/logo.png';

const Apply = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: '',
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Academic Options from DB
  const [departments, setDepartments] = useState([]);
  const [allProgrammes, setAllProgrammes] = useState([]); // [{department, programme, creditHours, price}]
  const [allIntakes, setAllIntakes] = useState([]);       // [{department, programme, intake}]

  // Centres list
  const [centres, setCentres] = useState([]);

  useEffect(() => {
    const fetchAcademicOptions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/options`);
        if (response.data) {
          const { departments: dbDeps, programmes: dbProgs, intakes: dbIntakes } = response.data;
          if (dbDeps?.length > 0) setDepartments(dbDeps);
          if (dbProgs?.length > 0) setAllProgrammes(dbProgs);
          if (dbIntakes?.length > 0) setAllIntakes(dbIntakes);
        }
      } catch (err) {
        console.error('Failed to load customizable academic options:', err);
      }
    };

    const fetchCentres = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/centres/public`);
        if (response.data) setCentres(response.data);
      } catch (err) {
        console.error('Failed to load centres:', err);
      }
    };

    fetchAcademicOptions();
    fetchCentres();
  }, []);

  // Filtered programmes based on selected department
  const filteredProgrammes = allProgrammes
    .filter(p => p.department === formData.department)
    .map(p => p.programme)
    .filter(Boolean);
  const uniqueProgrammes = Array.from(new Set(filteredProgrammes));

  // Filtered intakes based on selected department + programme
  const filteredIntakes = allIntakes
    .filter(i => i.department === formData.department && i.programme === formData.programme)
    .map(i => i.intake)
    .filter(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'department') {
      // Reset programme, intake, creditHours, price when department changes
      setFormData(prev => ({
        ...prev,
        department: value,
        programme: '',
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
      if (!formData.fullName || !formData.certificateName || !formData.dob || !formData.gender) {
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
      if (!formData.department || !formData.programme || !formData.intake || !formData.highestQualification) {
        setErrorMsg('Please select your department, programme, intake, and highest qualification.');
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

    if (!profilePicture || !passportCopy || !resume || !transcript1) {
      setErrorMsg('Please upload all required files (Profile Picture, ID Copy, Resume, and Transcript 1).');
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    data.append('profilePicture', profilePicture);
    data.append('passportCopy', passportCopy);
    data.append('resume', resume);
    data.append('transcript1', transcript1);
    if (transcript2) data.append('transcript2', transcript2);
    if (transcript3) data.append('transcript3', transcript3);

    try {
      await axios.post(`${API_URL}/api/applications`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 5000);
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
                <img src={logo} alt="Institute Bologna Logo" className="h-10 sm:h-14 w-auto object-contain" />
              </Link>
              <div>
                <h2 className="text-lg sm:text-2xl font-serif font-bold tracking-wide">Institute Bologna</h2>
                <p className="text-gray-400 text-xs mt-0.5">Academic Admission Application Portal</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 md:mt-0 px-3 py-1 bg-uniboRed text-xs font-extrabold uppercase rounded-full">
              Step {step} of 5
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-2">
            <div
              className="bg-uniboRed h-2 transition-all duration-500 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>

          <div className="p-4 sm:p-8 md:p-10">
            {isSuccess ? (
              <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in-up">
                <div className="w-16 sm:w-20 h-16 sm:h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-inner">
                  <svg className="w-8 sm:w-10 h-8 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">Application Received!</h3>
                <p className="text-sm sm:text-base text-gray-500 max-w-md">Your full academic profile and uploaded files have been logged. We will review your academic qualifications shortly.</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-8">Redirecting to Home page...</p>
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
                          Name (in Full as per ID/Passport) <span className="text-uniboRed">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                          placeholder="e.g. Leonardo da Vinci"
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
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
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
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                          placeholder="+39 333 123 4567"
                        />
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
                        <input
                          type="text"
                          name="country"
                          required
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none"
                          placeholder="Italy"
                        />
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
                          placeholder="Piazza di Porta Ravegnana, Bologna, BO, Italy"
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
                      <p className="text-xs sm:text-sm text-gray-500">Select your desired department, programme and intake. Credit hours and price will be filled automatically.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Department */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Department <span className="text-uniboRed">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none appearance-none font-medium"
                          >
                            <option value="">-- Select Department --</option>
                            {departments.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                        </div>
                      </div>

                      {/* Programme */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Programme <span className="text-uniboRed">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="programme"
                            value={formData.programme}
                            onChange={handleChange}
                            disabled={!formData.department}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uniboRed focus:border-uniboRed focus:bg-white transition-all text-sm outline-none appearance-none font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="">-- Select Programme --</option>
                            {uniqueProgrammes.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                        </div>
                      </div>

                      {/* Intake */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Intake <span className="text-uniboRed">*</span>
                        </label>
                        <div className="relative">
                          <select
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
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                        </div>
                      </div>

                      {/* Credit Hours & Price — auto-filled read-only */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Credit Hours
                          </label>
                          <input
                            type="text"
                            name="creditHours"
                            value={formData.creditHours}
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
                        Credit hours and price are automatically filled from the selected programme.
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
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
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
                        <label className="block text-xs font-bold text-gray-700 mb-1">Profile Picture <span className="text-uniboRed">*</span></label>
                        <input
                          type="file"
                          name="profilePicture"
                          accept="image/*"
                          required
                          onChange={handleFileChange}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                        />
                        {profilePicture && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {profilePicture.name}</p>}
                      </div>

                      {/* 2. Passport Copy */}
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Copy of ID / Passport <span className="text-uniboRed">*</span></label>
                        <input
                          type="file"
                          name="passportCopy"
                          accept="image/*,application/pdf"
                          required
                          onChange={handleFileChange}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                        />
                        {passportCopy && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {passportCopy.name}</p>}
                      </div>

                      {/* 3. Resume */}
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Resume / CV <span className="text-uniboRed">*</span></label>
                        <input
                          type="file"
                          name="resume"
                          accept=".pdf,.doc,.docx"
                          required
                          onChange={handleFileChange}
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-uniboRed file:text-white hover:file:bg-uniboDarkRed cursor-pointer"
                        />
                        {resume && <p className="mt-1 text-xs text-green-600 font-semibold">✓ {resume.name}</p>}
                      </div>

                      {/* 4. Transcript 1 */}
                      <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-all">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Certified Certificate/Transcript 1 <span className="text-uniboRed">*</span></label>
                        <input
                          type="file"
                          name="transcript1"
                          accept="image/*,application/pdf,.doc,.docx"
                          required
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

                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 bg-uniboRed hover:bg-uniboDarkRed text-white text-xs sm:text-sm font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm"
                    >
                      Next Step &rarr;
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3.5 bg-uniboRed hover:bg-uniboDarkRed text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting Application...' : 'Submit Profile'}
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Apply;
