"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Truck, DollarSign, List, CheckCircle, Clock, Navigation, AlertCircle } from "lucide-react";

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
}

interface Order {
  id: string;
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  store: { name: string };
  items: OrderItem[];
}

interface DeliveryJob {
  id: string;
  orderId: string;
  status: "AVAILABLE" | "TAKEN" | "COMPLETED" | "CANCELLED";
  takenAt: string | null;
  completedAt: string | null;
  earningAmount: number | null;
  createdAt: string;
  order: Order;
}

interface DriverEarnings {
  totalEarnings: number;
  completedCount: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DriverDashboard() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"available" | "active" | "history" | "earnings">("available");
  const [availableJobs, setAvailableJobs] = useState<DeliveryJob[]>([]);
  const [activeJobs, setActiveJobs] = useState<DeliveryJob[]>([]);
  const [jobHistory, setJobHistory] = useState<DeliveryJob[]>([]);
  const [earnings, setEarnings] = useState<DriverEarnings>({ totalEarnings: 0, completedCount: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Available jobs
      const availRes = await fetch(`${API_URL}/api/driver/jobs`, { credentials: "include" });
      const availData = await availRes.json();
      setAvailableJobs(Array.isArray(availData) ? availData : []);

      // 2. Earnings
      const earnRes = await fetch(`${API_URL}/api/driver/jobs/earnings`, { credentials: "include" });
      if (earnRes.ok) {
        const earnData = await earnRes.json();
        setEarnings(earnData);
      }

      // 3. History
      const histRes = await fetch(`${API_URL}/api/driver/jobs/history`, { credentials: "include" });
      const histData = await histRes.json();
      const allHist = Array.isArray(histData) ? histData : [];
      setJobHistory(allHist);

      // 4. Find active job (TAKEN but not completed) from history or details
      // Wait, let's fetch active jobs by looking for TAKEN jobs from historical records, 
      // or we can fetch job details for jobs taken by the driver. Let's see: 
      // If a job is taken, it won't show in AVAILABLE. It might show in driver's own job list.
      // Let's call GET /api/driver/jobs/history and filter jobs where status is TAKEN.
      // Oh wait, does GET /api/driver/jobs/history only return COMPLETED and CANCELLED?
      // Yes, in driverService.ts, getDriverHistory filtered by COMPLETED and CANCELLED.
      // So how do we find currently TAKEN jobs? We can query all delivery jobs from the admin/monitoring endpoint, 
      // or we can just fetch driver history without status constraint, or we can fetch a specific job.
      // Wait! Let's check how we retrieve TAKEN jobs. In driverService.ts, we did not have a special "active job" endpoint,
      // but a driver can only have one active job at a time, or list of taken jobs.
      // Let's modify driverService.ts to support retrieving active jobs, or let's check:
      // Can we fetch from /api/driver/jobs/history by adding active jobs there, or query active jobs?
      // Wait, in `driverService.ts` we have:
      // `static async getDriverHistory(driverId: string) { return prisma.deliveryJob.findMany({ where: { driverId, status: { in: ['COMPLETED', 'CANCELLED'] } } ... }) }`
      // Let's edit `driverService.ts` to return all jobs for the driver: `where: { driverId }` so the frontend can split TAKEN vs COMPLETED/CANCELLED!
      // Yes, that is much cleaner and makes it easy to show the active job and history in the dashboard!
    } catch (e: any) {
      console.error(e);
      setError("Failed to load driver dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Let's write a function to handle taking a job
  const handleTakeJob = async (jobId: string) => {
    setActionLoading(jobId);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/driver/jobs/${jobId}/take`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept job");
      }
      alert("Delivery job accepted!");
      setActiveTab("active");
      await loadDashboardData();
      await refreshUser();
    } catch (err: any) {
      alert(err.message);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Function to complete a job
  const handleCompleteJob = async (jobId: string) => {
    setActionLoading(jobId);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/driver/jobs/${jobId}/complete`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete delivery");
      }
      alert("Delivery completed successfully! Earning credited.");
      setActiveTab("earnings");
      await loadDashboardData();
      await refreshUser();
    } catch (err: any) {
      alert(err.message);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter history list for COMPLETED/CANCELLED vs ACTIVE (TAKEN)
  const activeJobsList = jobHistory.filter(j => j.status === "TAKEN");
  const completedJobsList = jobHistory.filter(j => j.status === "COMPLETED" || j.status === "CANCELLED");

  return (
    <div className="flex-1 bg-neutral-950 text-neutral-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-serif flex items-center gap-3">
              <Truck className="w-8 h-8 text-indigo-400" />
              Driver Console
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Manage your delivery tasks, view incoming jobs, and track your wallet earnings.
            </p>
          </div>
          <div className="flex items-center gap-6 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-lg">
            <div className="space-y-1">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block">Total Earning</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {formatCurrency(earnings.totalEarnings)}
              </span>
            </div>
            <div className="w-px h-8 bg-neutral-800"></div>
            <div className="space-y-1">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block">Deliveries Done</span>
              <span className="text-xl font-bold text-white font-mono">
                {earnings.completedCount}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-850 gap-6 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("available")}
            className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === "available"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Available Jobs ({availableJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === "active"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Active Delivery ({activeJobsList.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === "history"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Job History ({completedJobsList.length})
          </button>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-neutral-400">Loading delivery details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Tab: Available Jobs */}
            {activeTab === "available" && (
              availableJobs.length === 0 ? (
                <div className="text-center py-16 bg-neutral-900/50 border border-neutral-850 rounded-2xl">
                  <List className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 font-semibold">No available jobs at the moment</p>
                  <p className="text-xs text-neutral-500 mt-1">Check back later once sellers prepare packages.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableJobs.map((job) => (
                    <div key={job.id} className="bg-neutral-900 border border-neutral-850 hover:border-neutral-750 p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-all duration-300">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase bg-indigo-950 border border-indigo-900 text-indigo-400 px-2.5 py-1 rounded-md">
                            {job.order.deliveryMethod}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">
                            {new Date(job.createdAt).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{job.order.store.name}</h3>
                        <div className="space-y-1.5 mb-6 text-sm text-neutral-400">
                          <div className="flex justify-between">
                            <span>Delivery Fee:</span>
                            <span className="font-semibold text-neutral-200">{formatCurrency(job.order.deliveryFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-emerald-400 font-semibold">Your Cut (80%):</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              {formatCurrency(Math.round(job.order.deliveryFee * 0.8))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTakeJob(job.id)}
                        disabled={actionLoading !== null}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-indigo-950/40 flex items-center justify-center gap-2"
                      >
                        {actionLoading === job.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4" />
                            Accept Job
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Tab: Active Delivery */}
            {activeTab === "active" && (
              activeJobsList.length === 0 ? (
                <div className="text-center py-16 bg-neutral-900/50 border border-neutral-850 rounded-2xl">
                  <Navigation className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 font-semibold">You have no active deliveries</p>
                  <p className="text-xs text-neutral-500 mt-1">Accept a job from the Available Jobs board first.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeJobsList.map((job) => (
                    <div key={job.id} className="bg-neutral-900 border border-neutral-800 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold uppercase bg-amber-950 border border-amber-900 text-amber-400 px-2.5 py-1 rounded-md">
                            ACTIVE DELIVERY
                          </span>
                          <span className="text-sm font-semibold text-neutral-400">
                            Accepted at {job.takenAt ? new Date(job.takenAt).toLocaleTimeString("id-ID") : ""}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">{job.order.store.name}</h2>
                          <p className="text-xs text-neutral-500 font-mono mt-0.5">Job ID: {job.id}</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-y border-neutral-800 py-4 text-sm text-neutral-400">
                          <div>
                            <span className="block text-xs text-neutral-500">Method</span>
                            <span className="font-bold text-white">{job.order.deliveryMethod}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-neutral-500">Earning Cut</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              {formatCurrency(Math.round(job.order.deliveryFee * 0.8))}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="block text-xs text-neutral-500">Total Order Value</span>
                            <span className="font-bold text-neutral-200">{formatCurrency(job.order.total)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCompleteJob(job.id)}
                        disabled={actionLoading !== null}
                        className="w-full md:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2"
                      >
                        {actionLoading === job.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Complete Delivery
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Tab: Job History */}
            {activeTab === "history" && (
              completedJobsList.length === 0 ? (
                <div className="text-center py-16 bg-neutral-900/50 border border-neutral-850 rounded-2xl">
                  <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 font-semibold">No finished jobs found</p>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                          <th className="p-4">Store</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Finished Time</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Earning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                        {completedJobsList.map((job) => (
                          <tr key={job.id} className="hover:bg-neutral-900/40 transition-colors">
                            <td className="p-4 font-semibold text-white">{job.order.store.name}</td>
                            <td className="p-4">
                              <span className="text-xs bg-neutral-800 border border-neutral-750 px-2 py-0.5 rounded text-neutral-400 font-semibold">
                                {job.order.deliveryMethod}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-neutral-500">
                              {job.completedAt ? new Date(job.completedAt).toLocaleString("id-ID") : "-"}
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                job.status === "COMPLETED"
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                                  : "bg-rose-950/40 text-rose-400 border border-rose-900/40"
                              }`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="p-4 text-right font-bold font-mono text-emerald-400">
                              {job.earningAmount ? formatCurrency(job.earningAmount) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* Tab: Earnings Details */}
            {activeTab === "earnings" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Earning Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-neutral-400">
                      <span>Completed Deliveries:</span>
                      <span className="font-bold text-white">{earnings.completedCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-neutral-400">
                      <span>Total Earnings:</span>
                      <span className="font-bold text-emerald-400 font-mono">{formatCurrency(earnings.totalEarnings)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-850 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Earning Policy</h3>
                  <div className="text-neutral-400 text-sm space-y-3 leading-relaxed">
                    <p>
                      Drivers are paid a flat <strong className="text-white">80% cut of the delivery fee</strong> for every completed job.
                    </p>
                    <p>
                      The payout structure is snapshotted inside the delivery record immediately upon completion, ensuring pricing changes do not retroactively affect your earnings.
                    </p>
                    <table className="w-full mt-4 text-left border-collapse border border-neutral-800 text-xs rounded-xl overflow-hidden">
                      <thead>
                        <tr className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                          <th className="p-3">Method</th>
                          <th className="p-3">Order Delivery Fee</th>
                          <th className="p-3 text-emerald-400">Driver Earning Cut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        <tr>
                          <td className="p-3 font-semibold text-white">INSTANT</td>
                          <td className="p-3">Rp 15.000</td>
                          <td className="p-3 text-emerald-400 font-bold">Rp 12.000</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">NEXT DAY</td>
                          <td className="p-3">Rp 8.000</td>
                          <td className="p-3 text-emerald-400 font-bold">Rp 6.400</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">REGULAR</td>
                          <td className="p-3">Rp 5.000</td>
                          <td className="p-3 text-emerald-400 font-bold">Rp 4.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
