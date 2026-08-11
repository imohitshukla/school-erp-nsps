import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, Award, Edit3, Save, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

const TERMS = ['PT1', 'Half Yearly', 'PT2', 'Annual'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Computer', 'Sanskrit', 'Physical Education'];
const CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];

const Academic = () => {
  const [activeTab, setActiveTab] = useState('marks');
  // Marks Entry
  const [className, setClassName] = useState(CLASSES[9]); // Class 10
  const [term, setTerm] = useState(TERMS[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [maxMarks, setMaxMarks] = useState('100');
  const [students, setStudents] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Report Card view
  const [reportStudents, setReportStudents] = useState([]);
  const [reportClass, setReportClass] = useState(CLASSES[9]);
  const [reportLoading, setReportLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchExamAndStudents = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      let currentExam = null;
      const examRes = await api.get(`/api/academics/exams?className=${encodeURIComponent(className)}&term=${encodeURIComponent(term)}&subject=${encodeURIComponent(subject)}`);

      if (examRes.data.data) {
        currentExam = examRes.data.data;
        setMaxMarks(String(currentExam.max_marks));
      } else {
        const newExamRes = await api.post('/api/academics/exams', { className, term, subject, maxMarks });
        currentExam = newExamRes.data.data;
      }
      setExam(currentExam);

      const studentsRes = await api.get(`/api/students?class_name=${encodeURIComponent(className)}`);
      const classStudents = studentsRes.data.data || [];

      if (classStudents.length === 0) {
        showMsg(`No students found in ${className}. Please import students first.`, 'warning');
        setStudents([]);
        setLoading(false);
        return;
      }

      const marksRes = await api.get(`/api/academics/marks/${currentExam.id}`);
      const existingMarks = marksRes.data.data || [];
      const marksMap = {};
      existingMarks.forEach(m => { marksMap[m.student_adm_no] = m.score; });

      const merged = classStudents.map(s => ({ ...s, score: marksMap[s.adm_no] !== undefined ? marksMap[s.adm_no] : '' }));
      setStudents(merged);
    } catch (error) {
      console.error('Error fetching academic data', error);
      showMsg('Failed to load data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (adm_no, value) => {
    setStudents(prev => prev.map(s => s.adm_no === adm_no ? { ...s, score: value } : s));
  };

  const saveMarks = async () => {
    if (!exam) return;
    setSaving(true);
    try {
      const payload = students.map(s => ({ student_adm_no: s.adm_no, score: s.score }));
      await api.post('/api/academics/marks', { examId: exam.id, marks: payload });
      showMsg('Marks saved successfully!', 'success');
    } catch (error) {
      showMsg('Failed to save marks. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchReportCard = async () => {
    setReportLoading(true);
    try {
      const studentsRes = await api.get(`/api/students?class_name=${encodeURIComponent(reportClass)}`);
      const classStudents = studentsRes.data.data || [];

      if (classStudents.length === 0) {
        setReportStudents([]);
        setReportLoading(false);
        return;
      }

      // For each student, fetch marks from all terms
      const enriched = await Promise.all(classStudents.map(async (s) => {
        return { ...s, marks: {} };
      }));
      setReportStudents(enriched);
    } catch (error) {
      console.error('Error fetching report card', error);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Academic Center</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Enter marks, view results, and manage exam records.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
          {['marks', 'results'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'marks' ? '📝 Marks Entry' : '📊 Results / Report Card'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'marks' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-3">Select Exam Details</p>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Class</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={className} onChange={e => { setClassName(e.target.value); setStudents([]); setExam(null); }}>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Term / Exam</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={term} onChange={e => { setTerm(e.target.value); setStudents([]); setExam(null); }}>
                  {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Subject</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={subject} onChange={e => { setSubject(e.target.value); setStudents([]); setExam(null); }}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Max Marks</label>
                <input type="number" min="1" max="200" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-24" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
              </div>
              <button onClick={fetchExamAndStudents} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shadow-sm">
                {loading ? 'Loading…' : 'Load Students'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {message.text && (
            <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <AlertCircle size={16} />
              {message.text}
            </div>
          )}

          {/* Marks Table */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="font-semibold text-gray-900">{className} — {subject} ({term})</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{students.length} students loaded &bull; Max: {maxMarks} marks</p>
                </div>
                <button onClick={saveMarks} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                  <Save size={15} />
                  {saving ? 'Saving…' : 'Save All Marks'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-3 text-left font-medium text-gray-500 w-24">Adm No</th>
                      <th className="p-3 text-left font-medium text-gray-500">Student Name</th>
                      <th className="p-3 text-right font-medium text-gray-500 w-48">Marks (out of {maxMarks})</th>
                      <th className="p-3 text-center font-medium text-gray-500 w-24">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student, i) => {
                      const score = parseFloat(student.score);
                      const pct = score / parseFloat(maxMarks) * 100;
                      const grade = isNaN(pct) ? '–' : pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 45 ? 'C' : 'D';
                      const gradeColor = grade === 'A+' ? 'text-green-700 bg-green-50' : grade === 'A' ? 'text-blue-700 bg-blue-50' : grade === 'B' ? 'text-indigo-700 bg-indigo-50' : grade === 'C' ? 'text-amber-700 bg-amber-50' : grade === 'D' ? 'text-red-700 bg-red-50' : 'text-gray-400 bg-gray-50';
                      return (
                        <tr key={student.adm_no} className={`hover:bg-gray-50/70 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                          <td className="p-3 text-gray-500 font-mono text-xs">{student.adm_no}</td>
                          <td className="p-3 font-medium text-gray-900">{student.name}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number" min="0" max={maxMarks}
                              className="border border-gray-300 rounded-lg p-2 w-28 text-right text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-400 transition"
                              value={student.score}
                              onChange={(e) => handleScoreChange(student.adm_no, e.target.value)}
                              placeholder="–"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${gradeColor}`}>{grade}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
                <span>{students.filter(s => s.score !== '').length} of {students.length} marks entered</span>
                <button onClick={saveMarks} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                  <Save size={15} />{saving ? 'Saving…' : 'Save All Marks'}
                </button>
              </div>
            </div>
          )}

          {!loading && students.length === 0 && !exam && (
            <div className="text-center py-20 text-gray-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select exam details above and click <strong>Load Students</strong> to begin entering marks.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Class</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={reportClass} onChange={e => setReportClass(e.target.value)}>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={fetchReportCard} disabled={reportLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {reportLoading ? 'Loading…' : 'Show Results'}
            </button>
          </div>

          {reportStudents.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {reportStudents.map(s => (
                <div key={s.adm_no} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedStudent(expandedStudent === s.adm_no ? null : s.adm_no)}>
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">Adm No: {s.adm_no}</p>
                    </div>
                    {expandedStudent === s.adm_no ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                  {expandedStudent === s.adm_no && (
                    <div className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                      Enter marks in the <strong>Marks Entry</strong> tab to view detailed report cards here.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <Award size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a class and click <strong>Show Results</strong>.</p>
              <p className="text-sm mt-1">Results are pulled from the marks you enter in the Marks Entry tab.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Academic;
