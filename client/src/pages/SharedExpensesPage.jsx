import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Receipt,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  DollarSign,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  X,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useSocket } from '../context/SocketContext';
import SkeletonLoader from '../components/SkeletonLoader';

export default function SharedExpensesPage() {
  const { user } = useAuth();
  const { format, symbol } = useCurrency();
  const { socket, joinGroup, leaveGroup } = useSocket();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modals
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  // Forms
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  // Add Shared Expense Form
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'Bills',
    paidBy: user?._id || '',
    splitType: 'equal',
    notes: '',
    selectedMemberIds: []
  });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      setGroups(res.data.data);
      if (res.data.data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.data.data[0]._id);
      }
    } catch (e) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    if (!groupId) return;
    setDetailsLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroupDetails(res.data.data);
    } catch (e) {
      toast.error('Failed to load group details');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
      joinGroup(selectedGroupId);

      // Listen for socket events
      if (socket) {
        socket.on('expense_added', () => fetchGroupDetails(selectedGroupId));
        socket.on('settlement_recorded', () => fetchGroupDetails(selectedGroupId));
        socket.on('member_joined', () => fetchGroupDetails(selectedGroupId));
      }

      return () => {
        leaveGroup(selectedGroupId);
        if (socket) {
          socket.off('expense_added');
          socket.off('settlement_recorded');
          socket.off('member_joined');
        }
      };
    }
  }, [selectedGroupId, socket]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await api.post('/groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim()
      });
      toast.success('Group created successfully!');
      setNewGroupName('');
      setNewGroupDesc('');
      setCreateGroupModalOpen(false);
      fetchGroups();
      setSelectedGroupId(res.data.data._id);
    } catch (e) {
      toast.error('Failed to create group');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      await api.post(`/groups/${selectedGroupId}/invite`, {
        email: inviteEmail.trim(),
        name: inviteName.trim()
      });
      toast.success('Member invited successfully!');
      setInviteEmail('');
      setInviteName('');
      setInviteModalOpen(false);
      fetchGroupDetails(selectedGroupId);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleAddSharedExpense = async (e) => {
    e.preventDefault();
    const amount = Number(expenseForm.amount);
    if (!amount || amount <= 0 || !expenseForm.title.trim()) {
      toast.error('Please enter a valid title and amount');
      return;
    }

    const membersToSplit = expenseForm.selectedMemberIds.length > 0
      ? expenseForm.selectedMemberIds
      : groupDetails.group.members.map(m => m.userId || m._id);

    const splits = membersToSplit.map(id => ({ userId: id }));

    try {
      await api.post(`/groups/${selectedGroupId}/expenses`, {
        title: expenseForm.title.trim(),
        amount,
        category: expenseForm.category,
        paidBy: expenseForm.paidBy || user._id,
        splitType: expenseForm.splitType,
        splits,
        notes: expenseForm.notes
      });

      toast.success('Shared expense recorded and split calculated!');
      setAddExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        amount: '',
        category: 'Bills',
        paidBy: user?._id || '',
        splitType: 'equal',
        notes: '',
        selectedMemberIds: []
      });
      fetchGroupDetails(selectedGroupId);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to record expense');
    }
  };

  const handleRecordSettlement = async (settle) => {
    try {
      await api.post(`/groups/${selectedGroupId}/settlements`, {
        payerId: settle.from,
        payeeId: settle.to,
        amount: settle.amount,
        paymentMethod: 'UPI'
      });
      toast.success(`Settlement of ${format(settle.amount)} marked as paid!`);
      setSettleModalOpen(false);
      fetchGroupDetails(selectedGroupId);
    } catch (e) {
      toast.error('Failed to record settlement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Shared Expenses & Roommates</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Split bills, track who owes whom, and simplify debt settlements
          </p>
        </div>

        <button
          onClick={() => setCreateGroupModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Group</span>
        </button>
      </div>

      {/* Group Selector Pill Bar */}
      {groups.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {groups.map((g) => (
            <button
              key={g._id}
              onClick={() => setSelectedGroupId(g._id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedGroupId === g._id
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm'
                  : 'bg-[#141E30] text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>{g.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded-md">
                {g.members?.length || 0}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="card-glass p-8 text-center rounded-2xl">
          <Users2 className="w-10 h-10 text-purple-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">No Shared Groups Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Create an apartment, trip, or roommate group to easily split bills with exact or equal shares.
          </p>
          <button
            onClick={() => setCreateGroupModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
          >
            Create Your First Group
          </button>
        </div>
      )}

      {/* Selected Group Active Workspace */}
      {groupDetails && (
        <div className="space-y-6">
          {/* Group Header & Actions */}
          <div className="card-glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{groupDetails.group.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                  {groupDetails.group.members.length} members
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {groupDetails.group.description || 'Apartment & roommate bill splitting'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </button>
              <button
                onClick={() => {
                  setExpenseForm({
                    title: '',
                    amount: '',
                    category: 'Bills',
                    paidBy: user?._id || groupDetails.group.members[0]?.userId || '',
                    splitType: 'equal',
                    notes: '',
                    selectedMemberIds: groupDetails.group.members.map(m => m.userId || m._id)
                  });
                  setAddExpenseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Shared Expense</span>
              </button>
            </div>
          </div>

          {/* Net Balances and Simplified Debt Settlement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Member Balances */}
            <div className="card-glass p-5 rounded-2xl lg:col-span-1 space-y-3">
              <h3 className="text-sm font-bold text-white mb-2">Member Net Balances</h3>
              <div className="divide-y divide-slate-800">
                {groupDetails.balances.map((b, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{b.member.name}</div>
                      <div className="text-[10px] text-slate-400">{b.member.email}</div>
                    </div>
                    <div
                      className={`font-bold ${
                        b.netBalance > 0
                          ? 'text-green-400'
                          : b.netBalance < 0
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {b.netBalance > 0
                        ? `+${format(b.netBalance)} (gets back)`
                        : b.netBalance < 0
                        ? `${format(b.netBalance)} (owes)`
                        : 'Settled'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simplified Settlements */}
            <div className="card-glass p-5 rounded-2xl lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Suggested Debt Settlements</h3>
                  <p className="text-xs text-slate-400">Minimal transactions to clear all group balances</p>
                </div>
              </div>

              {groupDetails.suggestedSettlements.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {groupDetails.suggestedSettlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#090D18] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-red-400">{s.fromName}</span>
                        <span className="text-slate-500">owes</span>
                        <span className="font-bold text-green-400">{s.toName}</span>
                        <span className="text-white font-extrabold ml-1">{format(s.amount)}</span>
                      </div>

                      <button
                        onClick={() => handleRecordSettlement(s)}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 font-semibold border border-green-500/30 transition shrink-0"
                      >
                        Settle Up
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  All balances in this group are currently settled up!
                </div>
              )}
            </div>
          </div>

          {/* Group Expenses List */}
          <div className="card-glass p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Group Expense History</h3>
            {groupDetails.expenses.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {groupDetails.expenses.map((exp) => (
                  <div key={exp._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">{exp.title}</div>
                      <div className="text-[11px] text-slate-400">
                        Paid by <strong className="text-purple-300">{exp.paidBy?.name || 'Member'}</strong> • {new Date(exp.date).toLocaleDateString()} • {exp.splitType} split across {exp.splits.length} members
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-white text-base">{format(exp.amount)}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{exp.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No shared expenses added yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {createGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141E30] border border-slate-700 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm">Create New Shared Group</h3>
              <button onClick={() => setCreateGroupModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Group Name *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Skyline Roommates, Goa Trip"
                  className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Rent, utilities, groceries..."
                  className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setCreateGroupModalOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 rounded-xl font-semibold text-white">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141E30] border border-slate-700 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm">Invite Roommate to Group</h3>
              <button onClick={() => setInviteModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleInviteMember} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="roommate@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Display Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Rahul"
                  className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setInviteModalOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 rounded-xl font-semibold text-white">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shared Expense Modal */}
      {addExpenseModalOpen && groupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141E30] border border-slate-700 rounded-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm">Add Shared Expense in {groupDetails.group.name}</h3>
              <button onClick={() => setAddExpenseModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddSharedExpense} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Title *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Electricity Bill, Groceries, WiFi"
                  className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Amount ({symbol}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="3000"
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
                  >
                    <option value="Bills">Bills & Utilities</option>
                    <option value="Food">Food & Groceries</option>
                    <option value="Housing">Rent & Housing</option>
                    <option value="Transportation">Travel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Paid By</label>
                <select
                  value={expenseForm.paidBy}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
                >
                  {groupDetails.group.members.map((m) => (
                    <option key={m.userId || m._id} value={m.userId || m._id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setAddExpenseModalOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 rounded-xl font-semibold text-white">Save & Split Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
