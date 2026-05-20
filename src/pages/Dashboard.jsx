import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import API_URL from '../config/api';
import logo from '../assets/logo.png';


const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null); // For details modal
  const [activeTab, setActiveTab] = useState('applications'); // 'overview' or 'applications'
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Dynamic Academic Customization States
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [intakes, setIntakes] = useState([]);

  const [newDepartment, setNewDepartment] = useState('');
  const [newProgramme, setNewProgramme] = useState('');
  const [newIntake, setNewIntake] = useState('');
  const [newDeptProgrammes, setNewDeptProgrammes] = useState('');

  // Dropdown states for linking intake and programme to department
  const [selectedDeptForIntake, setSelectedDeptForIntake] = useState('');
  const [selectedProgForIntake, setSelectedProgForIntake] = useState('');
  const [selectedDeptForProg, setSelectedDeptForProg] = useState('');

  // Modal Card Visibility States
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddProgModal, setShowAddProgModal] = useState(false);
  const [showAddIntkModal, setShowAddIntkModal] = useState(false);

  // Inline Editing States
  const [editingDeptIdx, setEditingDeptIdx] = useState(null);
  const [editingDeptVal, setEditingDeptVal] = useState('');

  const [editingProgIdx, setEditingProgIdx] = useState(null);
  const [editingProgVal, setEditingProgVal] = useState('');

  const [editingIntkIdx, setEditingIntkIdx] = useState(null);
  const [editingIntkVal, setEditingIntkVal] = useState('');

  const [savingOptions, setSavingOptions] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [updatingAppId, setUpdatingAppId] = useState(null);

  useEffect(() => {
    fetchApplications();
    fetchAcademicOptions();
  }, []);

  // Sync default options select dropdown values
  useEffect(() => {
    if (departments.length > 0 && !selectedDeptForIntake) {
      setSelectedDeptForIntake(departments[0]);
    }
  }, [departments, selectedDeptForIntake]);

  useEffect(() => {
    if (departments.length > 0 && !selectedDeptForProg) {
      setSelectedDeptForProg(departments[0]);
    }
  }, [departments, selectedDeptForProg]);

  // When intake dept changes, reset selected programme to first matching one
  useEffect(() => {
    if (selectedDeptForIntake && programmes.length > 0) {
      const firstMatch = programmes.find(p =>
        p && typeof p === 'object' ? p.department === selectedDeptForIntake : false
      );
      if (firstMatch) {
        setSelectedProgForIntake(typeof firstMatch === 'object' ? firstMatch.programme : firstMatch);
      } else {
        setSelectedProgForIntake('');
      }
    }
  }, [selectedDeptForIntake, programmes]);

  useEffect(() => {
    if (programmes.length > 0 && !selectedProgForIntake) {
      const firstProg = typeof programmes[0] === 'object' ? programmes[0].programme : programmes[0];
      setSelectedProgForIntake(firstProg);
    }
  }, [programmes, selectedProgForIntake]);

  const fetchAcademicOptions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/options`);
      if (response.data) {
        setDepartments(response.data.departments || []);
        setProgrammes(response.data.programmes || []);
        setIntakes(response.data.intakes || []);
        if (response.data.departments?.length > 0) {
          setSelectedDeptForIntake(response.data.departments[0]);
          setSelectedDeptForProg(response.data.departments[0]);
        }
        if (response.data.programmes?.length > 0) {
          const firstProg = typeof response.data.programmes[0] === 'object' ? response.data.programmes[0].programme : response.data.programmes[0];
          setSelectedProgForIntake(firstProg);
        }
      }
    } catch (error) {
      console.error('Error fetching dynamic academic options:', error);
    }
  };

  const saveToDatabase = async (updatedDeps, updatedProgs, updatedIntks) => {
    setSavingOptions(true);
    setSaveSuccessMsg('');
    try {
      await axios.put(`${API_URL}/api/options`, {
        departments: updatedDeps,
        programmes: updatedProgs,
        intakes: updatedIntks
      });
      setSaveSuccessMsg('Changes auto-saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 2000);
    } catch (error) {
      console.error('Error auto-saving configurations:', error);
      alert('Failed to auto-save configuration to database.');
    } finally {
      setSavingOptions(false);
    }
  };

  const addDepartment = async () => {
    const deptName = newDepartment.trim();
    if (!deptName) return;
    if (departments.includes(deptName)) {
      alert('Department already exists.');
      return;
    }
    const updatedDeps = [...departments, deptName];
    setDepartments(updatedDeps);
    setNewDepartment('');

    // Parse programmes entered (comma separated)
    let updatedProgs = [...programmes];
    if (newDeptProgrammes.trim()) {
      const parsedProgs = newDeptProgrammes
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      
      parsedProgs.forEach(progName => {
        const isDuplicate = updatedProgs.some(p => 
          p && typeof p === 'object'
            ? (p.department === deptName && p.programme.toLowerCase() === progName.toLowerCase())
            : p.toLowerCase() === progName.toLowerCase()
        );
        if (!isDuplicate) {
          updatedProgs.push({ department: deptName, programme: progName });
        }
      });
      setProgrammes(updatedProgs);
      setNewDeptProgrammes('');
    }

    await saveToDatabase(updatedDeps, updatedProgs, intakes);
    setShowAddDeptModal(false);
  };

  const removeDepartment = async (index) => {
    const updated = departments.filter((_, i) => i !== index);
    setDepartments(updated);
    await saveToDatabase(updated, programmes, intakes);
  };

  const removeSpecificProgramme = async (dept, progName) => {
    if (!window.confirm(`Are you sure you want to delete the programme "${progName}" from department "${dept}"?`)) {
      return;
    }
    const updatedProgs = programmes.filter(p => {
      if (p && typeof p === 'object') {
        return !(p.department === dept && p.programme.toLowerCase() === progName.toLowerCase());
      }
      return p.toLowerCase() !== progName.toLowerCase();
    });
    setProgrammes(updatedProgs);
    await saveToDatabase(departments, updatedProgs, intakes);
  };

  const saveDeptEdit = async (index) => {
    if (!editingDeptVal.trim()) return;
    const updated = [...departments];
    updated[index] = editingDeptVal.trim();
    setDepartments(updated);
    setEditingDeptIdx(null);
    await saveToDatabase(updated, programmes, intakes);
  };

  const addProgramme = async () => {
    if (!newProgramme.trim()) return;
    const dept = selectedDeptForProg || departments[0] || 'Level 5 Higher Diploma';

    const isDuplicate = programmes.some(p => 
      p && typeof p === 'object'
        ? (p.department === dept && p.programme.toLowerCase() === newProgramme.trim().toLowerCase())
        : p.toLowerCase() === newProgramme.trim().toLowerCase()
    );
    if (isDuplicate) {
      alert('Programme link already exists for this department.');
      return;
    }

    const newProgObj = { department: dept, programme: newProgramme.trim() };
    const updated = [...programmes, newProgObj];
    setProgrammes(updated);
    setNewProgramme('');
    await saveToDatabase(departments, updated, intakes);
    setShowAddProgModal(false);
  };

  const removeProgramme = async (index) => {
    const updated = programmes.filter((_, i) => i !== index);
    setProgrammes(updated);
    await saveToDatabase(departments, updated, intakes);
  };

  const saveProgEdit = async (index) => {
    if (!editingProgVal.trim()) return;
    const updated = [...programmes];
    const current = updated[index];
    if (current && typeof current === 'object') {
      updated[index] = {
        ...current,
        programme: editingProgVal.trim()
      };
    } else {
      updated[index] = {
        department: departments[0] || 'Level 5 Higher Diploma',
        programme: editingProgVal.trim()
      };
    }
    setProgrammes(updated);
    setEditingProgIdx(null);
    await saveToDatabase(departments, updated, intakes);
  };

  const addIntake = async () => {
    if (!newIntake.trim()) return;
    const dept = selectedDeptForIntake || departments[0] || '';
    const prog = selectedProgForIntake || programmes[0] || '';
    if (!dept || !prog) {
      alert('Please configure at least one department and programme first.');
      return;
    }

    // Check for exact matching duplicates
    const duplicate = intakes.some(item => 
      typeof item === 'object' && item !== null &&
      item.department === dept &&
      item.programme === prog &&
      item.intake.trim().toLowerCase() === newIntake.trim().toLowerCase()
    );
    if (duplicate) {
      alert('This exact intake mapping already exists.');
      return;
    }

    const newObj = {
      department: dept,
      programme: prog,
      intake: newIntake.trim()
    };

    const updated = [...intakes, newObj];
    setIntakes(updated);
    setNewIntake('');
    await saveToDatabase(departments, programmes, updated);
    setShowAddIntkModal(false);
  };

  const removeIntake = async (index) => {
    const updated = intakes.filter((_, i) => i !== index);
    setIntakes(updated);
    await saveToDatabase(departments, programmes, updated);
  };

  const saveIntkEdit = async (index) => {
    if (!editingIntkVal.trim()) return;
    const updated = [...intakes];
    // Check if it's currently an object, if so, preserve department/programme
    if (typeof updated[index] === 'object' && updated[index] !== null) {
      updated[index] = {
        ...updated[index],
        intake: editingIntkVal.trim()
      };
    } else {
      updated[index] = {
        department: departments[0] || 'Level 5 Higher Diploma',
        programme: programmes[0] || 'Executive Diploma in Marketing',
        intake: editingIntkVal.trim()
      };
    }
    setIntakes(updated);
    setEditingIntkIdx(null);
    await saveToDatabase(departments, programmes, updated);
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/applications/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setApplications(applications.map(app => 
        app._id === id ? { ...app, status: newStatus } : app
      ));

      // Update selected app state if it's currently open in the modal
      if (selectedApp && selectedApp._id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Seeded images
    return `${API_URL}${path}`;
  };

  // Analytics helper metrics
  const totalApps = applications.length;
  const pendingApps = applications.filter(app => app.status === 'Pending').length;
  const acceptedApps = applications.filter(app => app.status === 'Accepted').length;
  const rejectedApps = applications.filter(app => app.status === 'Rejected').length;
  const reviewedApps = applications.filter(app => app.status === 'Reviewed').length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between shrink-0 hidden md:flex border-r border-gray-800">
        
        {/* Sidebar Header / Branding */}
        <div>
          <div className="p-5 border-b border-gray-800 flex items-center gap-3">
            <div className="h-16 bg-white rounded-lg p-1.5 flex items-center justify-center shadow-md">
              <img src={logo} alt="Institute Bologna" className="h-13 w-auto object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xs tracking-wider font-serif">INSTITUTE</span>
              <span className="text-gray-400 text-[10px] font-bold">Admissions Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'overview' 
                  ? 'bg-uniboRed text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'applications' 
                  ? 'bg-uniboRed text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Applications List
              {pendingApps > 0 && (
                <span className="ml-auto bg-uniboRed text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-gray-900 animate-pulse">
                  {pendingApps}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('departments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'departments' 
                  ? 'bg-uniboRed text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              Departments
            </button>

            <button
              onClick={() => setActiveTab('programmes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'programmes' 
                  ? 'bg-uniboRed text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              Programmes
            </button>

            <button
              onClick={() => setActiveTab('intakes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'intakes' 
                  ? 'bg-uniboRed text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Intakes
            </button>

            <div className="pt-4 border-t border-gray-800 mt-4">
              <Link
                to="/"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Home
              </Link>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-white">Registry Officer</p>
              <p className="text-[10px] text-gray-500 font-medium">admin@bologno.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-gray-800 hover:bg-uniboRed text-white text-xs font-bold uppercase rounded-md transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-2 md:hidden">
            {/* Logo on Mobile */}
            <div className="h-12 bg-white rounded-md p-1 flex items-center justify-center border border-gray-200 shadow-sm">
              <img src={logo} alt="Institute Bologna" className="h-10 w-auto object-contain" />
            </div>
            <span className="text-gray-900 font-bold text-sm">Institute Bologna Admin</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-gray-500 font-semibold text-xs tracking-wider uppercase">Institute Bologna</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-900 font-bold text-sm">Admissions Portal</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
              <Link 
                to="/" 
                className="px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-200 flex items-center gap-1"
              >
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 bg-uniboRed text-white text-xs font-bold rounded-md hover:bg-uniboDarkRed"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-serif">Executive Registry Dashboard</h1>
                <p className="mt-1.5 text-sm text-gray-600">Analytical review of admission profiles, candidate distribution, and processing progress.</p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-gray-100 rounded-lg text-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Profiles</p>
                    <p className="text-2xl font-bold text-gray-900">{totalApps}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Evaluation</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingApps}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-green-50 rounded-lg text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Accepted Offers</p>
                    <p className="text-2xl font-bold text-gray-900">{acceptedApps}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reviewed / Evaluated</p>
                    <p className="text-2xl font-bold text-gray-900">{reviewedApps + rejectedApps}</p>
                  </div>
                </div>

              </div>

              {/* Academic Highlights & Charts Block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
                  <h3 className="text-lg font-bold font-serif text-gray-900 mb-4">Admissions Progression</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-500">Evaluation Completion Rate</span>
                        <span className="text-gray-900">{totalApps > 0 ? Math.round(((totalApps - pendingApps) / totalApps) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-uniboRed h-full transition-all duration-500" 
                          style={{ width: `${totalApps > 0 ? ((totalApps - pendingApps) / totalApps) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-500">Candidate Offer Success Rate</span>
                        <span className="text-gray-900">{totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-green-600 h-full transition-all duration-500" 
                          style={{ width: `${totalApps > 0 ? (acceptedApps / totalApps) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold font-serif text-gray-900 mb-2">Regional Partner Hub</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Evaluation distribution based on authorized regional student registration centres.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-600">Approved Centre Applicants</span>
                    <span className="font-extrabold text-uniboRed">{applications.filter(app => app.registrationViaCentre === 'Yes').length}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS LIST */}
          {activeTab === 'applications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-serif">Applicant Directory</h1>
                  <p className="mt-1 text-sm text-gray-600">Review student credentials, check legal names, and evaluate transcripts.</p>
                </div>
              </div>

              {/* Table section inside scroll viewport */}
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                  <div className="p-10 text-center text-gray-500">
                    Loading applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 font-medium">
                    No student submissions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Applicant details
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Academic Programme
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Via Centre?
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((app) => (
                          <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={getFileUrl(app.profilePicture)} 
                                  alt={app.fullName} 
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm"
                                  onError={(e) => { e.target.src = 'https://via.placeholder.com/40' }}
                                />
                                <div>
                                  <div className="text-sm font-bold text-gray-900 leading-tight">{app.fullName}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">Cert: {app.certificateName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">{app.programme}</div>
                              <div className="text-xs text-gray-500">{app.department}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">{app.country}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {app.registrationViaCentre === 'Yes' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                  Centre
                                </span>
                              ) : (
                                <span className="text-gray-400 font-medium text-xs">Direct</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(app.status)}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right flex items-center justify-end gap-3 h-[73px]">
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                className="pl-2 pr-7 py-1 text-xs border border-gray-300 focus:outline-none focus:ring-uniboRed focus:border-uniboRed rounded-md bg-white font-semibold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              
                              <button
                                onClick={() => setSelectedApp(app)}
                                className="px-3 py-1 bg-gray-900 hover:bg-uniboRed text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-md shadow-sm"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENTS SECTION */}
          {activeTab === 'departments' && (
            <div className="space-y-6 animate-fade-in pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-serif">Academic Configurator</h1>
                  <p className="mt-1 text-sm text-gray-600 font-medium text-gray-500">Configure application forms in real-time. Changes auto-save instantly.</p>
                </div>
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-uniboRed text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add Department
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-fade-in-up">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <p className="ml-3 text-sm text-green-700 font-semibold">{saveSuccessMsg}</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-4xl">
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 text-uniboRed rounded-xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 font-serif">Registered Departments/Levels</h4>
                      <p className="text-xs text-gray-500">Configure academic certificates and their linked programmes</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-red-100 text-uniboRed text-xs font-bold rounded-full">{departments.length} Options</span>
                </div>

                {/* Registered Departments & Programmes Table */}
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Associated Programmes</th>
                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {departments.map((dept, idx) => {
                        const isEditing = editingDeptIdx === idx;
                        const deptProgs = programmes
                          .filter(p => p && typeof p === 'object' ? p.department === dept : false)
                          .map(p => p.programme);

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingDeptVal}
                                  onChange={(e) => setEditingDeptVal(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveDeptEdit(idx)}
                                  className="w-full max-w-xs px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                                />
                              ) : (
                                <span className="text-sm font-bold text-gray-900">{dept}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {deptProgs.length > 0 ? (
                                  deptProgs.map((p, pIdx) => (
                                    <span key={pIdx} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                                      {p}
                                      <button
                                        onClick={() => removeSpecificProgramme(dept, p)}
                                        className="text-blue-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors p-0.5"
                                        title={`Delete ${p}`}
                                      >
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400 italic font-medium">No programmes linked yet</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => saveDeptEdit(idx)}
                                    className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-md"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingDeptIdx(null)}
                                    className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-md"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-3 items-center">
                                  <button
                                    onClick={() => {
                                      setEditingDeptIdx(idx);
                                      setEditingDeptVal(dept);
                                    }}
                                    className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md font-semibold transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeDepartment(idx)}
                                    className="text-gray-400 hover:text-uniboRed transition-colors p-1 hover:bg-red-50 rounded-md"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {departments.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center text-sm text-gray-400 py-12">No departments added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROGRAMMES SECTION */}
          {activeTab === 'programmes' && (
            <div className="space-y-6 animate-fade-in pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-serif">Academic Configurator</h1>
                  <p className="mt-1 text-sm text-gray-600 font-medium text-gray-500">Link and configure all student admission options in real-time. Changes auto-save instantly.</p>
                </div>
                <button
                  onClick={() => setShowAddProgModal(true)}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-uniboRed text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add Programme
                </button>
              </div>


              {saveSuccessMsg && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-fade-in-up">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <p className="ml-3 text-sm text-green-700 font-semibold">{saveSuccessMsg}</p>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-4xl">
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 font-serif">Registered Programmes</h4>
                      <p className="text-xs text-gray-500">Configure academic specializations mapped to departments</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">{programmes.length} Options</span>
                </div>

                {/* Registered Programmes Table */}
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Programme</th>
                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {programmes.map((prog, idx) => {
                        const isEditing = editingProgIdx === idx;
                        const itemDept = typeof prog === 'object' && prog !== null ? prog.department : (departments[0] || 'Level 5 Higher Diploma');
                        const itemVal = typeof prog === 'object' && prog !== null ? prog.programme : prog;

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                              {itemDept}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingProgVal}
                                  onChange={(e) => setEditingProgVal(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveProgEdit(idx)}
                                  className="w-full max-w-xs px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                                />
                              ) : (
                                <span className="text-sm font-bold text-gray-900">{itemVal}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => saveProgEdit(idx)}
                                    className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-md"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingProgIdx(null)}
                                    className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-md"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-3 items-center">
                                  <button
                                    onClick={() => {
                                      setEditingProgIdx(idx);
                                      setEditingProgVal(itemVal);
                                    }}
                                    className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md font-semibold transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeProgramme(idx)}
                                    className="text-gray-400 hover:text-uniboRed transition-colors p-1 hover:bg-red-50 rounded-md"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {programmes.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center text-sm text-gray-400 py-12">No programmes added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTAKES SECTION */}
          {activeTab === 'intakes' && (
            <div className="space-y-6 animate-fade-in pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 font-serif">Academic Configurator</h1>
                  <p className="mt-1 text-sm text-gray-600 font-medium text-gray-500">Link and configure all student admission options in real-time. Changes auto-save instantly.</p>
                </div>
                <button
                  onClick={() => setShowAddIntkModal(true)}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-uniboRed text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add Intake
                </button>
              </div>


              {saveSuccessMsg && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-fade-in-up">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <p className="ml-3 text-sm text-green-700 font-semibold">{saveSuccessMsg}</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-4xl">
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 font-serif">Registered Intake Mappings</h4>
                      <p className="text-xs text-gray-500">Configure academic session cycles mapped to departments and programmes</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">{intakes.length} Options</span>
                </div>

                {/* Registered Intakes Table */}
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Programme</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Intake Session</th>
                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {intakes.map((intk, idx) => {
                        const isEditing = editingIntkIdx === idx;
                        const itemDept = typeof intk === 'object' && intk !== null ? intk.department : (departments[0] || 'Level 5 Higher Diploma');
                        const itemProg = typeof intk === 'object' && intk !== null ? intk.programme : (programmes[0] || 'Executive Diploma in Marketing');
                        const itemVal = typeof intk === 'object' && intk !== null ? intk.intake : intk;

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                              {itemDept}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                              {itemProg}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingIntkVal}
                                  onChange={(e) => setEditingIntkVal(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveIntkEdit(idx)}
                                  className="w-full max-w-xs px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                                />
                              ) : (
                                <span className="text-sm font-bold text-gray-900">{itemVal}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => saveIntkEdit(idx)}
                                    className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-md"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingIntkIdx(null)}
                                    className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-md"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-3 items-center">
                                  <button
                                    onClick={() => {
                                      setEditingIntkIdx(idx);
                                      setEditingIntkVal(itemVal);
                                    }}
                                    className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md font-semibold transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeIntake(idx)}
                                    className="text-gray-400 hover:text-uniboRed transition-colors p-1 hover:bg-red-50 rounded-md"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {intakes.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center text-sm text-gray-400 py-12">No intakes added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Expandable Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-8 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gray-900 text-white p-6 border-b-4 border-uniboRed flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold font-serif">Registry Candidate Verification</h3>
                <p className="text-xs text-gray-400">Application Reference ID: {selectedApp._id}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-gray-100 pb-6">
                <img 
                  src={getFileUrl(selectedApp.profilePicture)} 
                  alt={selectedApp.fullName} 
                  className="h-24 w-24 rounded-2xl object-cover border-2 border-gray-200 shadow-md"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/96' }}
                />
                <div className="text-center sm:text-left">
                  <h4 className="text-2xl font-serif font-bold text-gray-900">{selectedApp.fullName}</h4>
                  <p className="text-sm text-gray-500 font-semibold mt-0.5">Certificate Name: <span className="text-gray-800">{selectedApp.certificateName}</span></p>
                  <p className="text-xs text-gray-400 font-mono mt-1">Submitted On: {new Date(selectedApp.submissionDate).toLocaleString()}</p>
                </div>
                <div className="sm:ml-auto">
                  <span className={`px-4 py-1.5 inline-flex text-xs leading-5 font-bold uppercase tracking-wider rounded-full border ${getStatusColor(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                
                {/* Column 1: Personal */}
                <div className="space-y-4">
                  <h5 className="font-serif font-bold text-gray-900 border-b border-gray-100 pb-1.5 text-base">Personal Registry</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date of Birth</p>
                      <p className="text-gray-800 font-medium">{new Date(selectedApp.dob).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gender</p>
                      <p className="text-gray-800 font-medium">{selectedApp.gender}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Passport/ID Number</p>
                    <p className="text-gray-800 font-mono font-medium">{selectedApp.passportNumber}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Country of Residence</p>
                    <p className="text-gray-800 font-medium">{selectedApp.country}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Address</p>
                    <p className="text-gray-800 font-medium leading-relaxed">{selectedApp.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-gray-800 font-medium break-all">{selectedApp.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Telephone Number</p>
                      <p className="text-gray-800 font-medium">{selectedApp.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Academic */}
                <div className="space-y-4">
                  <h5 className="font-serif font-bold text-gray-900 border-b border-gray-100 pb-1.5 text-base">Academic & Program Profile</h5>
                  
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Department</p>
                    <p className="text-gray-800 font-medium">{selectedApp.department}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Programme</p>
                    <p className="text-gray-800 font-medium">{selectedApp.programme}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Intake</p>
                      <p className="text-gray-800 font-medium">{selectedApp.intake}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Credit Hours</p>
                      <p className="text-gray-800 font-medium">{selectedApp.creditHours}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price</p>
                      <p className="text-gray-800 font-medium">{selectedApp.price}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Highest Qualification</p>
                    <p className="text-gray-800 font-medium">{selectedApp.highestQualification}</p>
                  </div>

                  <div className="border border-gray-100 bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registration Method</p>
                    {selectedApp.registrationViaCentre === 'Yes' ? (
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-purple-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                          Via Approved Centre
                        </p>
                        <p className="text-gray-500 font-medium">Email: <span className="text-gray-700">{selectedApp.centreEmail}</span></p>
                        <p className="text-gray-500 font-medium">Contact: <span className="text-gray-700">{selectedApp.centrePhone}</span></p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                        Direct Candidate Submission
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Certified Files Grid */}
              <div className="border-t border-gray-100 pt-6 border-b pb-6">
                <h5 className="font-serif font-bold text-gray-900 mb-4 text-base">Certified Registration Documents</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  
                  <a 
                    href={getFileUrl(selectedApp.profilePicture)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs transition-all text-uniboRed font-bold shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Profile Picture
                  </a>

                  <a 
                    href={getFileUrl(selectedApp.passportCopy)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs transition-all text-uniboRed font-bold shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 00-2 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5z"></path></svg>
                    Passport/ID Copy
                  </a>

                  <a 
                    href={getFileUrl(selectedApp.resume)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs transition-all text-uniboRed font-bold shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Resume / CV
                  </a>

                  <a 
                    href={getFileUrl(selectedApp.transcript1)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs transition-all text-uniboRed font-bold shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Transcript 1 <span className="text-red-500 font-extrabold">*</span>
                  </a>

                  {selectedApp.transcript2 ? (
                    <a 
                      href={getFileUrl(selectedApp.transcript2)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs transition-all text-uniboRed font-bold shadow-sm"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Transcript 2
                    </a>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 bg-gray-100 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 font-semibold cursor-not-allowed">
                      Transcript 2 (Not Provided)
                    </div>
                  )}

                  {selectedApp.transcript3 ? (
                    <a 
                      href={getFileUrl(selectedApp.transcript3)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs transition-all text-uniboRed font-bold shadow-sm"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Transcript 3
                    </a>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 bg-gray-100 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 font-semibold cursor-not-allowed">
                      Transcript 3 (Not Provided)
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status Action:</label>
                <select
                  value={selectedApp.status}
                  onChange={(e) => handleStatusChange(selectedApp._id, e.target.value)}
                  className="pl-3 pr-8 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-uniboRed focus:border-uniboRed rounded-md bg-white font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              
              <button 
                onClick={() => setSelectedApp(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-sm font-semibold transition-colors shadow-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Popup Card Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-fade-in-up">
            {/* Modal Header */}
            <div className="bg-gray-900 text-white p-5 border-b-4 border-uniboRed flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold font-serif">Add New Department</h3>
                <p className="text-xs text-gray-400">Configure a new academic certification level</p>
              </div>
              <button 
                onClick={() => setShowAddDeptModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Level 5 Higher Diploma"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Associated Programmes (Comma Separated)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. MBA, MSc Marketing, Diploma in HRM"
                  value={newDeptProgrammes}
                  onChange={(e) => setNewDeptProgrammes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">Separate multiple programs with a comma (,)</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowAddDeptModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={addDepartment}
                className="px-5 py-2 bg-gray-900 hover:bg-uniboRed text-white text-xs font-bold uppercase rounded-lg transition-colors shadow-sm"
              >
                Create Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Programme Popup Card Modal */}
      {showAddProgModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-fade-in-up">
            {/* Modal Header */}
            <div className="bg-gray-900 text-white p-5 border-b-4 border-uniboRed flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold font-serif">Add New Programme</h3>
                <p className="text-xs text-gray-400">Configure specializations linked to departments</p>
              </div>
              <button 
                onClick={() => setShowAddProgModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Select Department</label>
                <select
                  value={selectedDeptForProg}
                  onChange={(e) => setSelectedDeptForProg(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d, index) => (
                    <option key={index} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Programme Name</label>
                <input
                  type="text"
                  placeholder="e.g. Executive Diploma in Marketing"
                  value={newProgramme}
                  onChange={(e) => setNewProgramme(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowAddProgModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={addProgramme}
                className="px-5 py-2 bg-gray-900 hover:bg-uniboRed text-white text-xs font-bold uppercase rounded-lg transition-colors shadow-sm"
              >
                Create Programme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Intake Popup Card Modal */}
      {showAddIntkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-fade-in-up">
            {/* Modal Header */}
            <div className="bg-gray-900 text-white p-5 border-b-4 border-uniboRed flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold font-serif">Add Intake Mapping</h3>
                <p className="text-xs text-gray-400">Map custom intakes to departments and programmes</p>
              </div>
              <button 
                onClick={() => setShowAddIntkModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Select Department</label>
                <select
                  value={selectedDeptForIntake}
                  onChange={(e) => {
                    setSelectedDeptForIntake(e.target.value);
                    setSelectedProgForIntake('');
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d, index) => (
                    <option key={index} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Select Programme</label>
                <select
                  value={selectedProgForIntake}
                  onChange={(e) => setSelectedProgForIntake(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                >
                  <option value="">-- Choose Programme --</option>
                  {programmes
                    .filter(p =>
                      p && typeof p === 'object'
                        ? p.department === selectedDeptForIntake
                        : true
                    )
                    .map((p, index) => {
                      const name = typeof p === 'object' && p !== null ? p.programme : p;
                      return (
                        <option key={index} value={name}>{name}</option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Intake Session</label>
                <input
                  type="text"
                  placeholder="e.g. January 2026 - July 2026"
                  value={newIntake}
                  onChange={(e) => setNewIntake(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-uniboRed font-semibold"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowAddIntkModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={addIntake}
                className="px-5 py-2 bg-gray-900 hover:bg-uniboRed text-white text-xs font-bold uppercase rounded-lg transition-colors shadow-sm"
              >
                Create Intake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
