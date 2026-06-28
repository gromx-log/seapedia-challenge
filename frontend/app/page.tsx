"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MessageSquarePlus, Store, ShoppingBag, Shield } from "lucide-react";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function LandingPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewerName, rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setReviewerName("");
      setComment("");
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 text-white selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36 bg-radial from-neutral-900 via-neutral-950 to-neutral-950">
        {/* Decorative Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 uppercase tracking-wider">
            COMPFEST 18 SEA Academy Challenge
          </span>
          <h1 className="text-5xl lg:text-7xl font-extrabold font-serif tracking-tight leading-none bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent">
            Unified Multi-Role <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              E-Commerce Marketplace
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-neutral-400 font-sans leading-relaxed">
            Experience a robust ecosystem connecting Buyers, Sellers, and Drivers. Complete transactions with custom vouchers, instant role-switching, and integrated dashboards.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-200 shadow-xl shadow-indigo-900/30 hover:scale-[1.02] cursor-pointer"
            >
              Browse Public Catalog
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-white rounded-2xl font-bold transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            >
              Register Account
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Platform Roles / Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold font-serif tracking-tight text-white">
            One Username, Multiple Roles
          </h2>
          <p className="mt-2 text-neutral-400 max-w-xl mx-auto text-sm">
            Swap roles instantly during your session. Every role is specialized.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Buyer */}
          <div className="bg-neutral-900/50 border border-neutral-900 p-8 rounded-3xl relative overflow-hidden group hover:border-neutral-800 transition-all duration-200">
            <div className="w-12 h-12 bg-blue-950/40 border border-blue-900/40 rounded-2xl flex items-center justify-center text-blue-400 mb-6">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Buyer Role</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Top up your digital wallet, register multiple delivery addresses, build single-store carts, and apply discount vouchers or promos at checkout.
            </p>
          </div>

          {/* Seller */}
          <div className="bg-neutral-900/50 border border-neutral-900 p-8 rounded-3xl relative overflow-hidden group hover:border-neutral-800 transition-all duration-200">
            <div className="w-12 h-12 bg-indigo-950/40 border border-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-400 mb-6">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Seller Role</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Launch your store, list products, configure active catalog items, process incoming orders, and track your total earnings through details reports.
            </p>
          </div>

          {/* Driver */}
          <div className="bg-neutral-900/50 border border-neutral-900 p-8 rounded-3xl relative overflow-hidden group hover:border-neutral-800 transition-all duration-200">
            <div className="w-12 h-12 bg-purple-950/40 border border-purple-900/40 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Driver & Admin</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Accept jobs, pick up packages, update deliveries (coming in Level 5). Admin can generate vouchers and promos via the back-office API.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Public Reviews Section */}
      <section className="bg-neutral-900/20 border-t border-neutral-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Review Form */}
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-2 mb-6">
                <MessageSquarePlus className="w-6 h-6 text-indigo-400" />
                <h3 className="text-2xl font-bold text-white font-serif">Leave a Review</h3>
              </div>

              {success && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 text-sm text-emerald-400 mb-6">
                  Thank you! Your public review has been posted.
                </div>
              )}

              {error && (
                <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-sm text-rose-400 mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                    placeholder="E.g. Filbert"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Rating (Stars)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 cursor-pointer transition-colors duration-150 ${
                            star <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Comments
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors duration-200 resize-none"
                    placeholder="Write your feedback..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg transition-colors cursor-pointer"
                >
                  {submitting ? "Posting..." : "Post Review"}
                </button>
              </form>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-3xl font-extrabold font-serif text-white mb-2">Recent Reviews</h3>
                <p className="text-neutral-400 text-sm">
                  What our users say about the SEAPEDIA platform.
                </p>
              </div>

              {reviews.length === 0 ? (
                <div className="bg-neutral-900/30 border border-neutral-900/60 p-12 text-center rounded-3xl text-neutral-500 text-sm">
                  No reviews posted yet. Be the first to share your experience!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-neutral-900 border border-neutral-850 p-6 rounded-2xl hover:border-neutral-800 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-white text-sm">{rev.reviewerName}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-neutral-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-neutral-400 text-xs leading-relaxed italic mb-3 break-words whitespace-pre-wrap overflow-hidden">
                        "{rev.comment}"
                      </p>
                      <span className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider block">
                        {new Date(rev.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
