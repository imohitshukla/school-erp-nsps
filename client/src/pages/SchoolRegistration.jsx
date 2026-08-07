import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const SchoolRegistration = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    subdomain: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubdomainChange = (e) => {
    // Basic formatting for a slug
    const formatted = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain: formatted });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/tenant/register', formData);
      // Registration successful, redirect to login
      navigate('/login', { state: { message: 'School registered successfully! Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register school.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600">
          <ShieldCheck size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Register your School
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set up your workspace in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">School Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="schoolName"
                  type="text"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="Greenwood High School"
                  value={formData.schoolName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Workspace Subdomain</label>
              <div className="mt-1 relative rounded-md shadow-sm flex items-center">
                <input
                  name="subdomain"
                  type="text"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-l-md py-2 px-3 border border-r-0"
                  placeholder="greenwood"
                  value={formData.subdomain}
                  onChange={handleSubdomainChange}
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm py-2 h-full">
                  .schoolerp.com
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="adminEmail"
                  type="email"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="admin@school.com"
                  value={formData.adminEmail}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="adminPassword"
                  type="password"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="••••••••"
                  value={formData.adminPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 items-center transition-colors"
              >
                {loading ? 'Creating workspace...' : 'Create Workspace'} <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have a workspace?</span>
              </div>
            </div>
            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolRegistration;
