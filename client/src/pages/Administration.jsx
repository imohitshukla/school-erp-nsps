import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Briefcase, FileText, TrendingUp, Plus, X, Save, Trash2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const DEPARTMENTS = ['Academic', 'Administration', 'Accounts', 'Transport', 'Sports', 'Library', 'Housekeeping', 'Security'];
const ROLES = ['Principal', 'Vice Principal', 'Senior Teacher', 'Teacher', 'Assistant Teacher', 'Accountant', 'Clerk', 'Driver', 'Guard', 'Peon'];

const emptyForm = { name: '', department: DEPARTMENTS[0], role: ROLES[2], phone: '', email: '', status: 'Active', joining_date: '' };

const Administration = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/staff');
      setStaff(res.data.data || []);
    } catch (error) {
      console.error('Error fetching staff', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/staff', form);
      showMsg(`${form.name} added successfully!`, 'success');
      setIsModalOpen(false);
      setForm(emptyForm);
      fetchStaff();
    } catch (error) {
      showMsg(error.response?.data?.error || 'Failed to add employee.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from staff?`)) return;
    try {
      await api.delete(`/api/staff/${id}`);
      showMsg(`${name} removed.`, 'success');
      fetchStaff();
    } catch (error) {
      showMsg('Failed to remove employee.', 'error');
    }
  };

  const stats = [
    { name: 'Total Employees', value: staff.length, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { name: 'Active', value: staff.filter(s => s.status === 'Active').length, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600' },
    { name: 'On Leave', value: staff.filter(s => s.status === 'On Leave').length, icon: Briefcase, color: 'bg-rose-100 text-rose-600' },
    { name: 'Departments', value: [...new Set(staff.map(s => s.department))].length, icon: FileText, color: 'bg-amber-100 text-amber-600' },
  ];

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['bg-indigo-100 text-indigo-600', 'bg-pink-100 text-pink-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Administration</h1>
          <p className="text-gray-500 text-sm mt-0.5">Staff records, attendance, and HR management.</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <AlertCircle size={16} />{message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '—' : stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}><Icon size={22} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-indigo-500" size={18} /> Employee Directory
          </h2>
          <span className="text-xs text-gray-400">{staff.length} record{staff.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading staff records…</div>
        ) : staff.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">No staff records yet</p>
            <p className="text-gray-400 text-sm mt-1">Click <strong>Add Employee</strong> to add your first staff member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-500">Employee</th>
                  <th className="p-3 text-left font-medium text-gray-500">Department</th>
                  <th className="p-3 text-left font-medium text-gray-500">Role</th>
                  <th className="p-3 text-left font-medium text-gray-500">Contact</th>
                  <th className="p-3 text-left font-medium text-gray-500">Status</th>
                  <th className="p-3 text-right font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staff.map((member, i) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                          {getInitials(member.name)}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{member.department}</td>
                    <td className="p-3 text-gray-600">{member.role}</td>
                    <td className="p-3 text-gray-500 text-xs">{member.phone || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-700' : member.status === 'On Leave' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDelete(member.id, member.name)} className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Add New Employee</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Employee name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Department *</label>
                  <select required value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Role *</label>
                  <select required value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Phone number" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Joining Date</label>
                  <input type="date" value={form.joining_date} onChange={e => setForm(p => ({...p, joining_date: e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors">
                  <Save size={15} />{saving ? 'Saving…' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Administration;
