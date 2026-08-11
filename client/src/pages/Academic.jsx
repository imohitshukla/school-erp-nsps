import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, Calendar, Shield, Award, Edit3, Save } from 'lucide-react';
import api from '../services/api';

const Academic = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'marks'
  
  // Marks Entry State
  const [className, setClassName] = useState('Class 10');
  const [term, setTerm] = useState('PT1');
  const [subject, setSubject] = useState('Mathematics');
  const [maxMarks, setMaxMarks] = useState('100');
  const [students, setStudents] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const stats = [
    { name: 'Total Classes', value: '24', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
    { name: 'Total Subjects', value: '45', icon: Award, color: 'bg-purple-100 text-purple-600' },
    { name: 'Active Teachers', value: '62', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
    { name: 'Exams Scheduled', value: '8', icon: Calendar, color: 'bg-amber-100 text-amber-600' },
  ];

  const fetchExamAndStudents = async () => {
    setLoading(true);
    setMessage('');
    try {
      // 1. Check if exam exists
      let currentExam = null;
      const examRes = await api.get(`/api/academics/exams?className=${className}&term=${term}&subject=${subject}`);
      
      if (examRes.data.data) {
        currentExam = examRes.data.data;
        setMaxMarks(currentExam.max_marks);
      } else {
        // Create it
        const newExamRes = await api.post('/api/academics/exams', {
          className, term, subject, maxMarks
        });
        currentExam = newExamRes.data.data;
      }
      setExam(currentExam);

      // 2. Fetch students for the class
      const studentsRes = await api.get(`/api/students?class_name=${className}`);
      const classStudents = studentsRes.data.data || [];

      // 3. Fetch existing marks if any
      const marksRes = await api.get(`/api/academics/marks/${currentExam.id}`);
      const existingMarks = marksRes.data.data || [];
      const marksMap = {};
      existingMarks.forEach(m => {
        marksMap[m.student_adm_no] = m.score;
      });

      // 4. Merge
      const merged = classStudents.map(s => ({
        ...s,
        score: marksMap[s.adm_no] !== undefined ? marksMap[s.adm_no] : ''
      }));
      setStudents(merged);

    } catch (error) {
      console.error('Error fetching academic data', error);
      setMessage('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (adm_no, value) => {
    setStudents(prev => prev.map(s => 
      s.adm_no === adm_no ? { ...s, score: value } : s
    ));
  };

  const saveMarks = async () => {
    if (!exam) return;
    setSaving(true);
    setMessage('');
    try {
      const payload = students.map(s => ({
        student_adm_no: s.adm_no,
        score: s.score
      }));
      await api.post('/api/academics/marks', {
        examId: exam.id,
        marks: payload
      });
      setMessage('Marks saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving marks', error);
      setMessage('Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Academic Center</h1>
          <p className="text-gray-500 mt-1">Manage curriculum, timetable, and marks entry.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('marks')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'marks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Marks Entry
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${stat.color}`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Timetable and Notices (Same as before) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Today's Timetable
              </h2>
              <div className="space-y-4">
                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                  <div className="w-24 text-sm font-medium text-gray-500">08:00 AM</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Mathematics - Class 10A</p>
                    <p className="text-sm text-gray-500">Room 101 • Mr. Sharma</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Ongoing</span>
                </div>
                {/* Add more timeline items if needed */}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-indigo-500" /> Recent Academic Notices
              </h2>
              <div className="space-y-4">
                 <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                   <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                     <BookOpen size={20} />
                   </div>
                   <div>
                     <p className="font-medium text-gray-900">Half-Yearly Syllabus Published</p>
                     <p className="text-sm text-gray-500 mt-1">Syllabus for classes 6 to 12 has been published on the portal.</p>
                     <p className="text-xs text-gray-400 mt-2">2 hours ago</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'marks' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap gap-4 items-end mb-6 bg-gray-50 p-4 rounded-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select className="border-gray-300 rounded-lg text-sm" value={className} onChange={e => setClassName(e.target.value)}>
                <option value="Class 1">Class 1</option>
                <option value="Class 5">Class 5</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term / Exam</label>
              <select className="border-gray-300 rounded-lg text-sm" value={term} onChange={e => setTerm(e.target.value)}>
                <option value="PT1">PT1</option>
                <option value="Half Yearly">Half Yearly</option>
                <option value="PT2">PT2</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="border-gray-300 rounded-lg text-sm" value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
              <input type="number" className="border-gray-300 rounded-lg text-sm w-24" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
            </div>
            <button 
              onClick={fetchExamAndStudents}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch Students'}
            </button>
          </div>

          {message && (
            <div className={`p-4 mb-4 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          {exam && students.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Enter Marks for {className} - {subject} ({term})
                </h3>
                <button 
                  onClick={saveMarks}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save All Marks'}
                </button>
              </div>
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-3 font-medium text-gray-600">Adm No</th>
                      <th className="p-3 font-medium text-gray-600">Student Name</th>
                      <th className="p-3 font-medium text-gray-600 text-right">Marks Obtained (out of {maxMarks})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student) => (
                      <tr key={student.adm_no} className="hover:bg-gray-50/50">
                        <td className="p-3 text-gray-600">{student.adm_no}</td>
                        <td className="p-3 font-medium text-gray-900">{student.name}</td>
                        <td className="p-3 text-right">
                          <input 
                            type="number"
                            min="0"
                            max={maxMarks}
                            className="border border-gray-300 rounded-lg p-1.5 w-24 text-right text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={student.score}
                            onChange={(e) => handleScoreChange(student.adm_no, e.target.value)}
                            placeholder="-"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {exam && students.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No students found in {className}.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Academic;
