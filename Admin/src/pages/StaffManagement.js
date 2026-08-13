import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../utils/axiosconfig";
import {
  FaUsers,
  FaUserPlus,
  FaMoneyBillWave,
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaHandHoldingUsd,
  FaBuilding,
  FaPhoneAlt,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
  FaClipboardList,
  FaCalendarCheck,
  FaCalendarDay,
} from "react-icons/fa";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const todayStr = () => new Date().toISOString().split("T")[0];

const currentMonthStr = () => {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${yr}-${mo}`;
};

const STATUS_BADGES = {
  ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Active" },
  ON_LEAVE: { bg: "bg-amber-100", text: "text-amber-800", label: "On Leave" },
  RESIGNED: { bg: "bg-gray-100", text: "text-gray-700", label: "Resigned" },
  TERMINATED: { bg: "bg-red-100", text: "text-red-800", label: "Terminated" },
};

export default function StaffManagement() {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    totalMonthlyPayroll: 0,
    totalAdvancePending: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [desigFilter, setDesigFilter] = useState("");

  // Drawer / View Staff State
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState("PROFILE"); // PROFILE | SALARY | ADVANCE

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [targetStaffForSalary, setTargetStaffForSalary] = useState(null);

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [targetStaffForAdvance, setTargetStaffForAdvance] = useState(null);

  // Form states
  const [staffForm, setStaffForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    designation: "Sales Staff",
    joiningDate: todayStr(),
    status: "ACTIVE",
    salaryType: "MONTHLY",
    baseSalary: "",
    aadharNumber: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    accountNo: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    holderName: "",
    notes: "",
  });

  const [salaryForm, setSalaryForm] = useState({
    monthYear: currentMonthStr(),
    baseAmount: "",
    bonus: "0",
    deduction: "0",
    advanceDeducted: "0",
    paymentMode: "CASH",
    paymentDate: todayStr(),
    remarks: "",
  });

  const [advanceForm, setAdvanceForm] = useState({
    amount: "",
    type: "GIVEN", // GIVEN | REPAID
    mode: "CASH",
    date: todayStr(),
    remarks: "",
  });

  // Top level views state: DIRECTORY | DAILY | SHEET
  const [mainTab, setMainTab] = useState("DIRECTORY");

  // Daily attendance state
  const [attendanceDate, setAttendanceDate] = useState(todayStr());
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Monthly sheet state
  const [attendanceMonth, setAttendanceMonth] = useState(currentMonthStr());
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [sheetLoading, setSheetLoading] = useState(false);

  // Individual staff attendance drawer history state
  const [staffAttendanceHistory, setStaffAttendanceHistory] = useState([]);
  const [staffAttendanceSummary, setStaffAttendanceSummary] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(currentMonthStr());

  // Daily Attendance Fetch
  const fetchDailyAttendance = useCallback(async () => {
    setDailyLoading(true);
    try {
      const res = await api.get(`/staff/attendance/day?dateStr=${attendanceDate}`);
      if (res.data.success) {
        // Pre-fill unmarked records as PRESENT by default (user requirement)
        const defaultPresentList = res.data.data.map((item) => {
          if (!item.attendance) {
            return {
              ...item,
              attendance: {
                status: "PRESENT",
                checkIn: "09:00 AM",
                checkOut: "06:00 PM",
                remarks: "",
              },
            };
          }
          return item;
        });
        setDailyAttendance(defaultPresentList);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load daily attendance");
    } finally {
      setDailyLoading(false);
    }
  }, [attendanceDate]);

  // Monthly Attendance Fetch
  const fetchMonthlyAttendance = useCallback(async () => {
    setSheetLoading(true);
    try {
      const res = await api.get(`/staff/attendance/monthly-summary?month=${attendanceMonth}`);
      if (res.data.success) {
        setMonthlyAttendance(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load monthly attendance summary");
    } finally {
      setSheetLoading(false);
    }
  }, [attendanceMonth]);

  // Fetch individual staff history
  const fetchStaffAttendanceHistory = useCallback(async (staffId) => {
    if (!staffId) return;
    setHistoryLoading(true);
    try {
      const res = await api.get(`/staff/${staffId}/attendance?month=${historyMonth}`);
      if (res.data.success) {
        setStaffAttendanceHistory(res.data.data);
        setStaffAttendanceSummary(res.data.summary);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load staff attendance logs");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyMonth]);

  // Effects to trigger fetches based on active main tab and selected date/month
  useEffect(() => {
    if (mainTab === "DAILY") {
      fetchDailyAttendance();
    }
  }, [mainTab, fetchDailyAttendance]);

  useEffect(() => {
    if (mainTab === "SHEET") {
      fetchMonthlyAttendance();
    }
  }, [mainTab, fetchMonthlyAttendance]);

  useEffect(() => {
    if (selectedStaff && activeTab === "ATTENDANCE") {
      fetchStaffAttendanceHistory(selectedStaff._id);
    }
  }, [selectedStaff, activeTab, fetchStaffAttendanceHistory]);

  // Daily attendance handlers
  const handleMarkStatus = (staffId, status) => {
    setDailyAttendance((prev) =>
      prev.map((item) => {
        if (item.staff._id === staffId) {
          const currentRec = item.attendance || { checkIn: "", checkOut: "", remarks: "" };
          let checkIn = currentRec.checkIn;
          let checkOut = currentRec.checkOut;
          
          if (status === "PRESENT" && !checkIn) {
            checkIn = "09:00 AM";
            checkOut = "06:00 PM";
          } else if (status === "HALF_DAY" && !checkIn) {
            checkIn = "09:00 AM";
            checkOut = "01:30 PM";
          } else if (status === "ABSENT" || status === "ON_LEAVE") {
            checkIn = "";
            checkOut = "";
          }

          return {
            ...item,
            attendance: {
              ...currentRec,
              status,
              checkIn,
              checkOut,
            },
          };
        }
        return item;
      })
    );
  };

  const handleTimeChange = (staffId, field, value) => {
    setDailyAttendance((prev) =>
      prev.map((item) => {
        if (item.staff._id === staffId) {
          const currentRec = item.attendance || { status: "PRESENT", checkIn: "", checkOut: "", remarks: "" };
          return {
            ...item,
            attendance: {
              ...currentRec,
              [field]: value,
            },
          };
        }
        return item;
      })
    );
  };

  const handleRemarksChange = (staffId, remarks) => {
    setDailyAttendance((prev) =>
      prev.map((item) => {
        if (item.staff._id === staffId) {
          const currentRec = item.attendance || { status: "PRESENT", checkIn: "", checkOut: "", remarks: "" };
          return {
            ...item,
            attendance: {
              ...currentRec,
              remarks,
            },
          };
        }
        return item;
      })
    );
  };

  const handleMarkAllPresent = () => {
    setDailyAttendance((prev) =>
      prev.map((item) => {
        const currentRec = item.attendance || { checkIn: "09:00 AM", checkOut: "06:00 PM", remarks: "" };
        return {
          ...item,
          attendance: {
            ...currentRec,
            status: "PRESENT",
            checkIn: currentRec.checkIn || "09:00 AM",
            checkOut: currentRec.checkOut || "06:00 PM",
          },
        };
      })
    );
    toast.success("Marked all staff as Present locally. Don't forget to save changes!");
  };

  const handleSaveDailyAttendance = async () => {
    try {
      const records = dailyAttendance
        .filter((item) => item.attendance && item.attendance.status)
        .map((item) => ({
          staffId: item.staff._id,
          status: item.attendance.status,
          checkIn: item.attendance.checkIn || "",
          checkOut: item.attendance.checkOut || "",
          remarks: item.attendance.remarks || "",
        }));

      if (records.length === 0) {
        toast.info("No attendance records to save");
        return;
      }

      const res = await api.post("/staff/attendance/save", {
        dateStr: attendanceDate,
        records,
      });

      if (res.data.success) {
        toast.success("Attendance saved successfully!");
        fetchDailyAttendance();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save daily attendance");
    }
  };

  // Fetch Staff List
  const fetchStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (desigFilter) params.designation = desigFilter;

      const res = await api.get("/staff", { params });
      if (res.data.success) {
        setStaffList(res.data.data);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load staff list");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, desigFilter]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Open Form for Add / Edit
  const openAddStaffModal = () => {
    setEditingStaffId(null);
    setStaffForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      designation: "Sales Staff",
      joiningDate: todayStr(),
      terminationDate: "",
      status: "ACTIVE",
      salaryType: "MONTHLY",
      baseSalary: "",
      aadharNumber: "",
      emergencyName: "",
      emergencyRelation: "",
      emergencyPhone: "",
      accountNo: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
      holderName: "",
      notes: "",
    });
    setShowFormModal(true);
  };

  const openEditStaffModal = (st) => {
    setEditingStaffId(st._id);
    setStaffForm({
      name: st.name || "",
      phone: st.phone || "",
      email: st.email || "",
      address: st.address || "",
      designation: st.designation || "Sales Staff",
      joiningDate: st.joiningDate ? st.joiningDate.split("T")[0] : todayStr(),
      terminationDate: st.terminationDate ? st.terminationDate.split("T")[0] : "",
      status: st.status || "ACTIVE",
      salaryType: st.salaryType || "MONTHLY",
      baseSalary: st.baseSalary || "",
      aadharNumber: st.aadharNumber || "",
      emergencyName: st.emergencyContact?.name || "",
      emergencyRelation: st.emergencyContact?.relation || "",
      emergencyPhone: st.emergencyContact?.phone || "",
      accountNo: st.bankDetails?.accountNo || "",
      ifscCode: st.bankDetails?.ifscCode || "",
      bankName: st.bankDetails?.bankName || "",
      upiId: st.bankDetails?.upiId || "",
      holderName: st.bankDetails?.holderName || "",
      notes: st.notes || "",
    });
    setShowFormModal(true);
  };

  // Submit Add / Edit Staff
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.phone || !staffForm.designation) {
      toast.error("Please fill Name, Phone, and Designation");
      return;
    }

    const payload = {
      name: staffForm.name,
      phone: staffForm.phone,
      email: staffForm.email,
      address: staffForm.address,
      designation: staffForm.designation,
      joiningDate: staffForm.joiningDate,
      terminationDate: (staffForm.status === "RESIGNED" || staffForm.status === "TERMINATED") 
        ? (staffForm.terminationDate || todayStr()) 
        : null,
      status: staffForm.status,
      salaryType: staffForm.salaryType,
      baseSalary: Number(staffForm.baseSalary) || 0,
      aadharNumber: staffForm.aadharNumber,
      emergencyContact: {
        name: staffForm.emergencyName,
        relation: staffForm.emergencyRelation,
        phone: staffForm.emergencyPhone,
      },
      bankDetails: {
        accountNo: staffForm.accountNo,
        ifscCode: staffForm.ifscCode,
        bankName: staffForm.bankName,
        upiId: staffForm.upiId,
        holderName: staffForm.holderName,
      },
      notes: staffForm.notes,
    };

    try {
      if (editingStaffId) {
        await api.put(`/staff/${editingStaffId}`, payload);
        toast.success("Staff details updated");
      } else {
        await api.post("/staff", payload);
        toast.success("Staff member added successfully");
      }
      setShowFormModal(false);
      fetchStaffData();
      if (selectedStaff && selectedStaff._id === editingStaffId) {
        refreshSelectedStaff(editingStaffId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save staff record");
    }
  };

  // Delete Staff
  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff member removed");
      if (selectedStaff && selectedStaff._id === id) setSelectedStaff(null);
      fetchStaffData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete staff record");
    }
  };

// Helper to safely parse local date components without timezone shifts
const parseLocalDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return {
      yr: dateInput.getFullYear(),
      mo: dateInput.getMonth() + 1,
      day: dateInput.getDate(),
    };
  }
  const str = String(dateInput).split("T")[0]; // Get YYYY-MM-DD part
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return {
      yr: parseInt(match[1], 10),
      mo: parseInt(match[2], 10),
      day: parseInt(match[3], 10),
    };
  }
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    return {
      yr: d.getFullYear(),
      mo: d.getMonth() + 1,
      day: d.getDate(),
    };
  }
  return null;
};

// Helper for Mid-Month Joining/Termination Proration & Auto-suggestion
const calcMidMonthProration = (joiningDateStr, terminationDateStr, monthYearStr, baseSalary) => {
  if (!joiningDateStr || !monthYearStr || !baseSalary) return null;
  
  const parsedJoin = parseLocalDate(joiningDateStr);
  if (!parsedJoin) return null;
  const { yr: joinYr, mo: joinMo, day: joinDay } = parsedJoin;

  const [salYr, salMo] = monthYearStr.split("-").map(Number);
  if (!salYr || !salMo) return null;

  const totalDaysInMonth = new Date(salYr, salMo, 0).getDate();

  // Get date limits
  const monthStartStr = `${salYr}-${String(salMo).padStart(2, "0")}-01`;
  const monthEndStr = `${salYr}-${String(salMo).padStart(2, "0")}-${String(totalDaysInMonth).padStart(2, "0")}`;

  const joinDateOnlyStr = `${joinYr}-${String(joinMo).padStart(2, "0")}-${String(joinDay).padStart(2, "0")}`;

  let termDateOnlyStr = "";
  if (terminationDateStr) {
    const parsedTerm = parseLocalDate(terminationDateStr);
    if (parsedTerm) {
      termDateOnlyStr = `${parsedTerm.yr}-${String(parsedTerm.mo).padStart(2, "0")}-${String(parsedTerm.day).padStart(2, "0")}`;
    }
  }

  // Calculate effective start day in the month
  let effectiveStartDay = 1;
  if (joinDateOnlyStr > monthEndStr) {
    // Joined after this month
    return {
      joinDateStr: `${String(joinDay).padStart(2, "0")}/${String(joinMo).padStart(2, "0")}/${joinYr}`,
      joinDay,
      totalDaysInMonth,
      workedDays: 0,
      fullSalary: Number(baseSalary) || 0,
      proratedAmount: 0,
      remarks: "Staff member had not joined yet during this month",
    };
  } else if (joinDateOnlyStr >= monthStartStr) {
    effectiveStartDay = joinDay;
  }

  // Calculate effective end day in the month
  let effectiveEndDay = totalDaysInMonth;
  if (termDateOnlyStr) {
    if (termDateOnlyStr < monthStartStr) {
      // Terminated before this month started
      return {
        joinDateStr: `${String(joinDay).padStart(2, "0")}/${String(joinMo).padStart(2, "0")}/${joinYr}`,
        joinDay,
        totalDaysInMonth,
        workedDays: 0,
        fullSalary: Number(baseSalary) || 0,
        proratedAmount: 0,
        remarks: "Staff member was already terminated before this month",
      };
    } else if (termDateOnlyStr <= monthEndStr) {
      const parsedTerm = parseLocalDate(terminationDateStr);
      effectiveEndDay = parsedTerm.day;
    }
  }

  // If effective start is after effective end
  if (effectiveStartDay > effectiveEndDay) {
    return {
      joinDateStr: `${String(joinDay).padStart(2, "0")}/${String(joinMo).padStart(2, "0")}/${joinYr}`,
      joinDay,
      totalDaysInMonth,
      workedDays: 0,
      fullSalary: Number(baseSalary) || 0,
      proratedAmount: 0,
      remarks: "No active working days in this month",
    };
  }

  const workedDays = effectiveEndDay - effectiveStartDay + 1;
  
  // If they worked the full month, no proration suggestion needed
  if (workedDays === totalDaysInMonth) {
    return null;
  }

  const fullSalary = Number(baseSalary) || 0;
  const proratedAmount = Math.round((fullSalary / totalDaysInMonth) * workedDays);

  let remarksStr = `Prorated salary for ${workedDays} days worked`;
  if (joinDateOnlyStr >= monthStartStr) {
    remarksStr += ` (Joined ${String(joinDay).padStart(2, "0")}/${String(joinMo).padStart(2, "0")})`;
  }
  if (termDateOnlyStr && termDateOnlyStr <= monthEndStr) {
    const parsedTerm = parseLocalDate(terminationDateStr);
    remarksStr += ` (Terminated ${String(parsedTerm.day).padStart(2, "0")}/${String(parsedTerm.mo).padStart(2, "0")})`;
  }

  return {
    joinDateStr: `${String(joinDay).padStart(2, "0")}/${String(joinMo).padStart(2, "0")}/${joinYr}`,
    joinDay,
    totalDaysInMonth,
    workedDays,
    fullSalary,
    proratedAmount,
    remarks: remarksStr,
  };
};

// Open Salary Payout Modal
const openPaySalaryModal = (st) => {
  setTargetStaffForSalary(st);
  const mStr = currentMonthStr();
  const proration = calcMidMonthProration(st.joiningDate, st.terminationDate, mStr, st.baseSalary);

  setSalaryForm({
    monthYear: mStr,
    baseAmount: proration ? proration.proratedAmount : st.baseSalary || 0,
    bonus: "0",
    deduction: "0",
    advanceDeducted: "0",
    paymentMode: "CASH",
    paymentDate: todayStr(),
    remarks: proration
      ? `Prorated salary for ${proration.workedDays} days (Joined on ${proration.joinDateStr})`
      : "",
  });
  setShowSalaryModal(true);
};

  // Submit Salary Payout
  const handleRecordSalary = async (e) => {
    e.preventDefault();
    if (!targetStaffForSalary) return;

    try {
      await api.post(`/staff/${targetStaffForSalary._id}/salary`, salaryForm);
      toast.success(`Salary payment recorded for ${targetStaffForSalary.name}`);
      setShowSalaryModal(false);
      fetchStaffData();
      if (selectedStaff && selectedStaff._id === targetStaffForSalary._id) {
        refreshSelectedStaff(targetStaffForSalary._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record salary payment");
    }
  };

  // Open Advance Modal
  const openRecordAdvanceModal = (st) => {
    setTargetStaffForAdvance(st);
    setAdvanceForm({
      amount: "",
      type: "GIVEN",
      mode: "CASH",
      date: todayStr(),
      remarks: "",
    });
    setShowAdvanceModal(true);
  };

  // Submit Advance Payout / Repayment
  const handleRecordAdvance = async (e) => {
    e.preventDefault();
    if (!targetStaffForAdvance) return;
    if (!advanceForm.amount || Number(advanceForm.amount) <= 0) {
      toast.error("Enter a valid advance amount");
      return;
    }

    try {
      await api.post(`/staff/${targetStaffForAdvance._id}/advance`, advanceForm);
      toast.success(`Advance transaction recorded for ${targetStaffForAdvance.name}`);
      setShowAdvanceModal(false);
      fetchStaffData();
      if (selectedStaff && selectedStaff._id === targetStaffForAdvance._id) {
        refreshSelectedStaff(targetStaffForAdvance._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record advance transaction");
    }
  };

  // Refresh Selected Staff Drawer Data
  const refreshSelectedStaff = async (id) => {
    try {
      const res = await api.get(`/staff/${id}`);
      if (res.data.success) {
        setSelectedStaff(res.data.data);
      }
    } catch {
      // silent
    }
  };

  // Helper for staff advance balance calculation
  const getStaffAdvanceBalance = (st) => {
    let bal = 0;
    if (st?.advanceHistory) {
      st.advanceHistory.forEach((a) => {
        if (a.type === "GIVEN") bal += Number(a.amount) || 0;
        else if (a.type === "DEDUCTED" || a.type === "REPAID") bal -= Number(a.amount) || 0;
      });
    }
    return bal;
  };
  // Helper to calculate daily attendance counts
  const getDailyStats = () => {
    let present = 0, absent = 0, halfDay = 0, leave = 0, unmarked = 0;
    dailyAttendance.forEach((item) => {
      if (!item.attendance || !item.attendance.status) unmarked++;
      else if (item.attendance.status === "PRESENT") present++;
      else if (item.attendance.status === "ABSENT") absent++;
      else if (item.attendance.status === "HALF_DAY") halfDay++;
      else if (item.attendance.status === "ON_LEAVE") leave++;
    });
    return { present, absent, halfDay, leave, unmarked };
  };

  const dailyStats = getDailyStats();

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <FaUsers className="text-indigo-600" /> Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage staff profiles, joining records, monthly salary payouts, advance loans, and bank details.
          </p>
        </div>
        <button
          onClick={openAddStaffModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
        >
          <FaUserPlus /> Add New Staff
        </button>
      </div>

      {/* Main Page Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white p-1.5 rounded-xl shadow-xs gap-2">
        <button
          onClick={() => setMainTab("DIRECTORY")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            mainTab === "DIRECTORY"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <FaUsers /> Staff Directory
        </button>
        <button
          onClick={() => setMainTab("DAILY")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            mainTab === "DAILY"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <FaCalendarCheck /> Daily Attendance
        </button>
        <button
          onClick={() => setMainTab("SHEET")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            mainTab === "SHEET"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <FaClipboardList /> Monthly Grid Sheet
        </button>
      </div>

      {mainTab === "DIRECTORY" && (
        <>
          {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            <FaUsers />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Staff</p>
            <h3 className="text-xl font-bold text-slate-800">{stats.totalStaff}</h3>
            <p className="text-xs text-indigo-600 mt-0.5">{stats.activeStaff} Active Currently</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Staff</p>
            <h3 className="text-xl font-bold text-slate-800">{stats.activeStaff}</h3>
            <p className="text-xs text-emerald-600 mt-0.5">Working Staff</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <FaMoneyBillWave />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly Base Payroll</p>
            <h3 className="text-xl font-bold text-slate-800">{fmt(stats.totalMonthlyPayroll)}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Active Monthly Salaries</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <FaHandHoldingUsd />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Advances</p>
            <h3 className="text-xl font-bold text-amber-700">{fmt(stats.totalAdvancePending)}</h3>
            <p className="text-xs text-amber-600 mt-0.5">Staff Loans / Advances</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search staff by name, phone, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="RESIGNED">Resigned</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          <select
            value={desigFilter}
            onChange={(e) => setDesigFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Designations</option>
            <option value="Sales Staff">Sales Staff</option>
            <option value="Manager">Manager</option>
            <option value="Accountant">Accountant</option>
            <option value="Billing Staff">Billing Staff</option>
            <option value="Tailor / Worker">Tailor / Worker</option>
            <option value="Helper">Helper</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Designation & Role</th>
                <th className="p-4">Joining Date</th>
                <th className="p-4">Base Salary</th>
                <th className="p-4">Advance Pending</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
                      <span>Loading staff records...</span>
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No staff records found matching criteria.
                  </td>
                </tr>
              ) : (
                staffList.map((st) => {
                  const advBal = getStaffAdvanceBalance(st);
                  const stBadge = STATUS_BADGES[st.status] || STATUS_BADGES.ACTIVE;

                  return (
                    <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base uppercase">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{st.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <FaPhoneAlt className="text-[10px]" /> {st.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-medium text-slate-700">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                          {st.designation}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 text-xs">
                        <span className="flex items-center gap-1.5">
                          <FaCalendarAlt className="text-slate-400" /> {fmtDate(st.joiningDate)}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-slate-800">
                        {fmt(st.baseSalary)}{" "}
                        <span className="text-[10px] font-normal text-slate-400">/{st.salaryType.toLowerCase()}</span>
                      </td>

                      <td className="p-4">
                        {advBal > 0 ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                            {fmt(advBal)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">₹0</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stBadge.bg} ${stBadge.text}`}>
                          {stBadge.label}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStaff(st);
                              setActiveTab("PROFILE");
                            }}
                            title="View Staff Profile & Logs"
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                          >
                            <FaEye /> View
                          </button>

                          <button
                            onClick={() => openPaySalaryModal(st)}
                            title="Pay Monthly Salary"
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                          >
                            <FaFileInvoiceDollar /> Pay Salary
                          </button>

                          <button
                            onClick={() => openRecordAdvanceModal(st)}
                            title="Give or Repay Advance"
                            className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                          >
                            <FaHandHoldingUsd /> Advance
                          </button>

                          <button
                            onClick={() => openEditStaffModal(st)}
                            title="Edit Staff Info"
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <FaEdit />
                          </button>

                          <button
                            onClick={() => handleDeleteStaff(st._id, st.name)}
                            title="Delete Staff Record"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* DAILY ATTENDANCE VIEW */}
      {mainTab === "DAILY" && (
        <div className="space-y-6">
          {/* Daily Controls & Stats */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Attendance Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 sm:mt-5">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailyAttendance}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  Save Attendance
                </button>
              </div>
            </div>

            {/* Daily Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full lg:w-auto">
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60 text-center">
                <span className="text-[10px] text-emerald-800 font-bold block uppercase">Present</span>
                <strong className="text-emerald-700 text-base font-bold">{dailyStats.present}</strong>
              </div>
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/60 text-center">
                <span className="text-[10px] text-blue-800 font-bold block uppercase">Half Day</span>
                <strong className="text-blue-700 text-base font-bold">{dailyStats.halfDay}</strong>
              </div>
              <div className="bg-red-50/50 p-3 rounded-xl border border-red-100/60 text-center">
                <span className="text-[10px] text-red-800 font-bold block uppercase">Absent</span>
                <strong className="text-red-700 text-base font-bold">{dailyStats.absent}</strong>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 text-center">
                <span className="text-[10px] text-amber-800 font-bold block uppercase">On Leave</span>
                <strong className="text-amber-700 text-base font-bold">{dailyStats.leave}</strong>
              </div>
              <div className="bg-slate-100 p-3 rounded-xl text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Unmarked</span>
                <strong className="text-slate-600 text-base font-bold">{dailyStats.unmarked}</strong>
              </div>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Attendance Status</th>
                    <th className="p-4">Check-In</th>
                    <th className="p-4">Check-Out</th>
                    <th className="p-4">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {dailyLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
                          <span>Loading daily attendance...</span>
                        </div>
                      </td>
                    </tr>
                  ) : dailyAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        No active staff members found.
                      </td>
                    </tr>
                  ) : (
                    dailyAttendance.map((item) => {
                      const staff = item.staff;
                      const att = item.attendance || {};
                      return (
                        <tr key={staff._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm uppercase">
                                {staff.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{staff.name}</p>
                                <p className="text-xs text-slate-500">{staff.designation}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(staff._id, "PRESENT")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  att.status === "PRESENT"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(staff._id, "HALF_DAY")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  att.status === "HALF_DAY"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                Half Day
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(staff._id, "ABSENT")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  att.status === "ABSENT"
                                    ? "bg-red-600 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkStatus(staff._id, "ON_LEAVE")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  att.status === "ON_LEAVE"
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                Leave
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              placeholder="e.g. 09:00 AM"
                              value={att.checkIn || ""}
                              onChange={(e) => handleTimeChange(staff._id, "checkIn", e.target.value)}
                              disabled={att.status === "ABSENT" || att.status === "ON_LEAVE"}
                              className="w-28 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              placeholder="e.g. 06:00 PM"
                              value={att.checkOut || ""}
                              onChange={(e) => handleTimeChange(staff._id, "checkOut", e.target.value)}
                              disabled={att.status === "ABSENT" || att.status === "ON_LEAVE"}
                              className="w-28 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              placeholder="Add remarks..."
                              value={att.remarks || ""}
                              onChange={(e) => handleRemarksChange(staff._id, e.target.value)}
                              className="w-full min-w-[150px] px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {dailyAttendance.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDailyAttendance}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
                >
                  Save Daily Attendance
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MONTHLY GRID SHEET VIEW */}
      {mainTab === "SHEET" && (
        <div className="space-y-6">
          {/* Month Selection */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Month & Year</label>
              <input
                type="month"
                value={attendanceMonth}
                onChange={(e) => setAttendanceMonth(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Legend:</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Present (P)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Half Day (H)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500"></span> Absent (A)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Leave (L)</span>
              <span className="flex items-center gap-1"><span className="text-slate-400 font-bold">-</span> Unmarked</span>
            </div>
          </div>

          {/* Grid Sheet Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3 pl-4 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">Staff Member</th>
                    {(() => {
                      const getDaysInMonth = (monthStr) => {
                        if (!monthStr) return [];
                        const [yr, mo] = monthStr.split("-").map(Number);
                        const totalDays = new Date(yr, mo, 0).getDate();
                        const days = [];
                        for (let i = 1; i <= totalDays; i++) {
                          days.push(i);
                        }
                        return days;
                      };
                      const monthDays = getDaysInMonth(attendanceMonth);
                      return monthDays.map((day) => (
                        <th key={day} className="p-1.5 text-center text-[10px] min-w-[28px] border-r border-slate-200/60">
                          {day}
                        </th>
                      ));
                    })()}
                    <th className="p-3 text-center bg-emerald-50 text-emerald-800 border-l border-slate-200">P</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-800">H</th>
                    <th className="p-3 text-center bg-red-50 text-red-800">A</th>
                    <th className="p-3 text-center bg-amber-50 text-amber-800">L</th>
                    <th className="p-3 text-center bg-slate-100 font-extrabold text-slate-800">Worked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sheetLoading ? (
                    <tr>
                      <td colSpan="40" className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
                          <span>Loading attendance sheet...</span>
                        </div>
                      </td>
                    </tr>
                  ) : monthlyAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="40" className="p-8 text-center text-slate-500">
                        No active staff records found.
                      </td>
                    </tr>
                  ) : (
                    monthlyAttendance.map((item) => {
                      const staff = item.staff;
                      const records = item.records || {};
                      const summary = item.summary || {};
                      const [yr, mo] = attendanceMonth.split("-");
                      const getDaysInMonth = (monthStr) => {
                        if (!monthStr) return [];
                        const [yr, mo] = monthStr.split("-").map(Number);
                        const totalDays = new Date(yr, mo, 0).getDate();
                        const days = [];
                        for (let i = 1; i <= totalDays; i++) {
                          days.push(i);
                        }
                        return days;
                      };
                      const monthDays = getDaysInMonth(attendanceMonth);

                      return (
                        <tr key={staff._id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 pl-4 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                            <div>
                              <p className="font-semibold text-slate-800 truncate max-w-[120px]">{staff.name}</p>
                              <p className="text-[9px] text-slate-400 font-normal">{staff.designation}</p>
                            </div>
                          </td>
                          {monthDays.map((day) => {
                            const dateString = `${yr}-${mo}-${String(day).padStart(2, "0")}`;
                            const dayRec = records[dateString];

                            let statusChar = "-";
                            let statusColor = "text-slate-300 font-normal";
                            let tooltip = `${dateString} - Unmarked`;

                            if (dayRec) {
                              if (dayRec.status === "PRESENT") {
                                statusChar = "P";
                                statusColor = "text-emerald-600 bg-emerald-50 font-bold rounded";
                                tooltip = `${dateString} - Present\nTime: ${dayRec.checkIn || "N/A"} - ${dayRec.checkOut || "N/A"}${dayRec.remarks ? `\nRemarks: ${dayRec.remarks}` : ""}`;
                              } else if (dayRec.status === "ABSENT") {
                                statusChar = "A";
                                statusColor = "text-red-600 bg-red-50 font-bold rounded";
                                tooltip = `${dateString} - Absent${dayRec.remarks ? `\nRemarks: ${dayRec.remarks}` : ""}`;
                              } else if (dayRec.status === "HALF_DAY") {
                                statusChar = "H";
                                statusColor = "text-blue-600 bg-blue-50 font-bold rounded";
                                tooltip = `${dateString} - Half Day\nTime: ${dayRec.checkIn || "N/A"} - ${dayRec.checkOut || "N/A"}${dayRec.remarks ? `\nRemarks: ${dayRec.remarks}` : ""}`;
                              } else if (dayRec.status === "ON_LEAVE") {
                                statusChar = "L";
                                statusColor = "text-amber-600 bg-amber-50 font-bold rounded";
                                tooltip = `${dateString} - On Leave${dayRec.remarks ? `\nRemarks: ${dayRec.remarks}` : ""}`;
                              }
                            } else {
                              const joiningDateStr = staff.joiningDate ? staff.joiningDate.split("T")[0] : "";
                              const terminationDateStr = staff.terminationDate ? staff.terminationDate.split("T")[0] : "";
                              const currentTodayStr = todayStr();
                              if (
                                dateString <= currentTodayStr && 
                                (!joiningDateStr || dateString >= joiningDateStr) &&
                                (!terminationDateStr || dateString <= terminationDateStr)
                              ) {
                                statusChar = "P";
                                statusColor = "text-emerald-600 bg-emerald-50 font-bold rounded";
                                tooltip = `${dateString} - Present (Default)\nTime: 09:00 AM - 06:00 PM`;
                              }
                            }

                            return (
                              <td
                                key={day}
                                title={tooltip}
                                className={`p-1.5 text-center cursor-help border-r border-slate-100 text-[10px] min-w-[28px] ${statusColor}`}
                              >
                                {statusChar}
                              </td>
                            );
                          })}
                          <td className="p-3 text-center bg-emerald-50/50 text-emerald-700 font-bold border-l border-slate-200">{summary.present}</td>
                          <td className="p-3 text-center bg-blue-50/50 text-blue-700 font-bold">{summary.halfDay}</td>
                          <td className="p-3 text-center bg-red-50/50 text-red-700 font-bold">{summary.absent}</td>
                          <td className="p-3 text-center bg-amber-50/50 text-amber-700 font-bold">{summary.onLeave}</td>
                          <td className="p-3 text-center bg-slate-100 text-slate-800 font-extrabold">{summary.totalWorked}d</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Staff Details Drawer */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xl uppercase border border-indigo-500/30">
                  {selectedStaff.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedStaff.name}</h3>
                  <p className="text-xs text-slate-300 flex items-center gap-2">
                    <span>{selectedStaff.designation}</span> • <span>Joining: {fmtDate(selectedStaff.joiningDate)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 text-sm font-semibold">
              <button
                onClick={() => setActiveTab("PROFILE")}
                className={`py-3 px-4 border-b-2 transition-all ${
                  activeTab === "PROFILE"
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Profile & Bank Details
              </button>
              <button
                onClick={() => setActiveTab("SALARY")}
                className={`py-3 px-4 border-b-2 transition-all ${
                  activeTab === "SALARY"
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Salary History ({selectedStaff.salaryHistory?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("ADVANCE")}
                className={`py-3 px-4 border-b-2 transition-all ${
                  activeTab === "ADVANCE"
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Advance Ledger ({selectedStaff.advanceHistory?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("ATTENDANCE")}
                className={`py-3 px-4 border-b-2 transition-all ${
                  activeTab === "ATTENDANCE"
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Attendance Logs
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activeTab === "PROFILE" && (
                <div className="space-y-6">
                  {/* Basic & Emergency Info */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Personal & Contact Info
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Aadhar / ID Number</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.aadharNumber || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.address || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FaExclamationCircle className="text-amber-500" /> Emergency Contact
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Contact Person</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.emergencyContact?.name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Relation</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.emergencyContact?.relation || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone Number</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.emergencyContact?.phone || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Structure & Bank Info */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FaBuilding className="text-indigo-500" /> Bank & Salary Payout Setup
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-xs text-slate-500">Salary Contract</p>
                        <p className="font-bold text-indigo-700 text-base">
                          {fmt(selectedStaff.baseSalary)}{" "}
                          <span className="text-xs font-normal text-slate-500">/{selectedStaff.salaryType.toLowerCase()}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">UPI ID</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.bankDetails?.upiId || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500">Bank Name</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.bankDetails?.bankName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Account No.</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.bankDetails?.accountNo || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">IFSC Code</p>
                        <p className="font-semibold text-slate-800">{selectedStaff.bankDetails?.ifscCode || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {selectedStaff.notes && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Notes / Remarks</p>
                      <p className="text-slate-700">{selectedStaff.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "SALARY" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm">Salary Payment Records</h4>
                    <button
                      onClick={() => openPaySalaryModal(selectedStaff)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FaFileInvoiceDollar /> Record New Payout
                    </button>
                  </div>

                  {selectedStaff.salaryHistory && selectedStaff.salaryHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStaff.salaryHistory.map((s) => (
                        <div key={s._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-base">{s.monthYear}</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                {s.paymentMode}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Paid on {fmtDate(s.paymentDate)} • Base: {fmt(s.baseAmount)}
                              {s.bonus > 0 && ` + Bonus: ${fmt(s.bonus)}`}
                              {s.deduction > 0 && ` - Ded: ${fmt(s.deduction)}`}
                              {s.advanceDeducted > 0 && ` - Adv: ${fmt(s.advanceDeducted)}`}
                            </p>
                            {s.remarks && <p className="text-xs text-slate-600 mt-1 italic">"{s.remarks}"</p>}
                          </div>
                          <div className="text-right">
                            <span className="text-base font-extrabold text-emerald-700 block">{fmt(s.netPaid)}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Payout</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                      No salary payouts logged yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ADVANCE" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Staff Advance Ledger</h4>
                      <p className="text-xs text-slate-500">
                        Current Outstanding Balance:{" "}
                        <span className="font-bold text-amber-600">{fmt(getStaffAdvanceBalance(selectedStaff))}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => openRecordAdvanceModal(selectedStaff)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FaHandHoldingUsd /> Record Advance
                    </button>
                  </div>

                  {selectedStaff.advanceHistory && selectedStaff.advanceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStaff.advanceHistory.map((a) => (
                        <div key={a._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  a.type === "GIVEN"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {a.type}
                              </span>
                              <span className="text-xs font-medium text-slate-600">{fmtDate(a.date)}</span>
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                {a.mode}
                              </span>
                            </div>
                            {a.remarks && <p className="text-xs text-slate-600 mt-1">{a.remarks}</p>}
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-base font-bold ${
                                a.type === "GIVEN" ? "text-amber-700" : "text-emerald-700"
                              }`}
                            >
                              {a.type === "GIVEN" ? "+" : "-"}
                              {fmt(a.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                      No advance transactions recorded.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ATTENDANCE" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Attendance Logs</h4>
                      <p className="text-xs text-slate-500">
                        History for selected month
                      </p>
                    </div>
                    <div>
                      <input
                        type="month"
                        value={historyMonth}
                        onChange={(e) => setHistoryMonth(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Summary badges */}
                  {staffAttendanceSummary && (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">Present</span>
                        <strong className="text-emerald-700 text-lg font-extrabold">{staffAttendanceSummary.present}</strong>
                      </div>
                      <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-blue-800 font-bold block uppercase tracking-wider">Half Day</span>
                        <strong className="text-blue-700 text-lg font-extrabold">{staffAttendanceSummary.halfDay}</strong>
                      </div>
                      <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
                        <span className="text-[10px] text-red-800 font-bold block uppercase tracking-wider">Absent</span>
                        <strong className="text-red-700 text-lg font-extrabold">{staffAttendanceSummary.absent}</strong>
                      </div>
                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                        <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">Leave</span>
                        <strong className="text-amber-700 text-lg font-extrabold">{staffAttendanceSummary.onLeave}</strong>
                      </div>
                    </div>
                  )}

                  {historyLoading ? (
                    <div className="p-8 text-center text-slate-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                      <span>Loading logs...</span>
                    </div>
                  ) : staffAttendanceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {staffAttendanceHistory.map((item) => (
                        <div key={item._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{fmtDate(item.date)}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                item.status === "PRESENT" ? "bg-emerald-100 text-emerald-800" :
                                item.status === "HALF_DAY" ? "bg-blue-100 text-blue-800" :
                                item.status === "ABSENT" ? "bg-red-100 text-red-800" :
                                "bg-amber-100 text-amber-800"
                              }`}>
                                {item.status.replace("_", " ")}
                              </span>
                            </div>
                            {item.remarks && <p className="text-xs text-slate-600 mt-1 italic">"{item.remarks}"</p>}
                          </div>
                          {(item.checkIn || item.checkOut) && (
                            <div className="text-right text-xs text-slate-500 font-medium">
                              <div className="flex items-center gap-1.5 justify-end">
                                <FaClock className="text-[10px] text-slate-400" />
                                <span>{item.checkIn || "-"} to {item.checkOut || "-"}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                      No attendance logs found for this month.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-scale-up">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaUserPlus /> {editingStaffId ? "Edit Staff Member" : "Add New Staff Member"}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-white">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Role *</label>
                  <select
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Sales Staff">Sales Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Billing Staff">Billing Staff</option>
                    <option value="Tailor / Worker">Tailor / Worker</option>
                    <option value="Helper">Helper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={staffForm.joiningDate}
                    onChange={(e) => setStaffForm({ ...staffForm, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salary Payout Type</label>
                  <select
                    value={staffForm.salaryType}
                    onChange={(e) => setStaffForm({ ...staffForm, salaryType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="DAILY">Daily</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 18000"
                    value={staffForm.baseSalary}
                    onChange={(e) => setStaffForm({ ...staffForm, baseSalary: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>

                {(staffForm.status === "RESIGNED" || staffForm.status === "TERMINATED") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Resignation / Termination Date *</label>
                    <input
                      type="date"
                      required
                      value={staffForm.terminationDate}
                      onChange={(e) => setStaffForm({ ...staffForm, terminationDate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aadhar / ID Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234 5678 9012"
                    value={staffForm.aadharNumber}
                    onChange={(e) => setStaffForm({ ...staffForm, aadharNumber: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Emergency Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Contact Person Name"
                    value={staffForm.emergencyName}
                    onChange={(e) => setStaffForm({ ...staffForm, emergencyName: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Relation (Father/Spouse)"
                    value={staffForm.emergencyRelation}
                    onChange={(e) => setStaffForm({ ...staffForm, emergencyRelation: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Contact Phone"
                    value={staffForm.emergencyPhone}
                    onChange={(e) => setStaffForm({ ...staffForm, emergencyPhone: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bank & UPI Payout Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Bank Account Number"
                    value={staffForm.accountNo}
                    onChange={(e) => setStaffForm({ ...staffForm, accountNo: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={staffForm.ifscCode}
                    onChange={(e) => setStaffForm({ ...staffForm, ifscCode: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={staffForm.bankName}
                    onChange={(e) => setStaffForm({ ...staffForm, bankName: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="UPI ID (e.g. name@upi)"
                    value={staffForm.upiId}
                    onChange={(e) => setStaffForm({ ...staffForm, upiId: e.target.value })}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Additional Info</label>
                <textarea
                  rows="2"
                  placeholder="Any extra notes or address details..."
                  value={staffForm.notes}
                  onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  {editingStaffId ? "Update Staff" : "Save Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {showSalaryModal && targetStaffForSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaFileInvoiceDollar /> Record Salary Payout: {targetStaffForSalary.name}
              </h3>
              <button onClick={() => setShowSalaryModal(false)} className="text-emerald-200 hover:text-white">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleRecordSalary} className="p-6 space-y-4">
              {(() => {
                const proration = calcMidMonthProration(
                  targetStaffForSalary.joiningDate,
                  targetStaffForSalary.terminationDate,
                  salaryForm.monthYear,
                  targetStaffForSalary.baseSalary
                );
                if (!proration) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center justify-between font-bold text-amber-800">
                      <span className="flex items-center gap-1.5">
                        <FaExclamationCircle className="text-amber-600 text-sm" />
                        {proration.remarks.includes("Terminated") ? "Partial Month (Termination) Detected" : "Partial Month Payout Suggested"}
                      </span>
                      <span className="bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded text-[10px]">
                        Joined: {proration.joinDateStr}
                      </span>
                    </div>
                    <p className="text-slate-700">
                      {proration.remarks}. Worked <strong>{proration.workedDays}</strong> out of <strong>{proration.totalDaysInMonth}</strong> days in this month.
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                      <div>
                        <span className="text-slate-500">Suggested Salary: </span>
                        <strong className="text-emerald-700 text-sm">{fmt(proration.proratedAmount)}</strong>
                        <span className="text-[10px] text-slate-400"> (Full: {fmt(proration.fullSalary)})</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSalaryForm((prev) => ({
                              ...prev,
                              baseAmount: proration.proratedAmount,
                              remarks: proration.remarks,
                            }))
                          }
                          className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          Use Suggested ({fmt(proration.proratedAmount)})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSalaryForm((prev) => ({
                              ...prev,
                              baseAmount: targetStaffForSalary.baseSalary,
                              remarks: "Full monthly salary",
                            }))
                          }
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] hover:bg-slate-300 transition-colors"
                        >
                          Use Full ({fmt(targetStaffForSalary.baseSalary)})
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Month & Year *</label>
                  <input
                    type="month"
                    required
                    value={salaryForm.monthYear}
                    onChange={(e) => {
                      const newMo = e.target.value;
                      const proration = calcMidMonthProration(
                        targetStaffForSalary.joiningDate,
                        targetStaffForSalary.terminationDate,
                        newMo,
                        targetStaffForSalary.baseSalary
                      );
                      setSalaryForm((prev) => ({
                        ...prev,
                        monthYear: newMo,
                        baseAmount: proration ? proration.proratedAmount : targetStaffForSalary.baseSalary || 0,
                        remarks: proration ? proration.remarks : "",
                      }));
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.baseAmount}
                    onChange={(e) => setSalaryForm({ ...salaryForm, baseAmount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bonus / Allowance (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.bonus}
                    onChange={(e) => setSalaryForm({ ...salaryForm, bonus: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Other Deductions (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.deduction}
                    onChange={(e) => setSalaryForm({ ...salaryForm, deduction: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Advance Deducted (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    value={salaryForm.advanceDeducted}
                    onChange={(e) => setSalaryForm({ ...salaryForm, advanceDeducted: e.target.value })}
                    className="w-full px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={salaryForm.paymentMode}
                    onChange={(e) => setSalaryForm({ ...salaryForm, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Calculated Net Amount Card */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase">Calculated Net Payout</p>
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {fmt(
                      (Number(salaryForm.baseAmount) || 0) +
                        (Number(salaryForm.bonus) || 0) -
                        (Number(salaryForm.deduction) || 0) -
                        (Number(salaryForm.advanceDeducted) || 0)
                    )}
                  </p>
                </div>
                <FaCheckCircle className="text-2xl text-emerald-600" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Salary paid via UPI on 1st of month"
                  value={salaryForm.remarks}
                  onChange={(e) => setSalaryForm({ ...salaryForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Advance Modal */}
      {showAdvanceModal && targetStaffForAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 bg-amber-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaHandHoldingUsd /> Record Advance: {targetStaffForAdvance.name}
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-amber-200 hover:text-white">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleRecordAdvance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={advanceForm.type}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, type: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="GIVEN">Given to Staff (+ Advance Loan)</option>
                  <option value="REPAID">Repaid by Staff (- Decrease Loan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Advance Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={advanceForm.mode}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, mode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={advanceForm.date}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency advance for festival"
                  value={advanceForm.remarks}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-md"
                >
                  Save Advance Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
