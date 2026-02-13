"use client";
import React, { useState } from "react";

interface LandRequestFormProps {
  selectedPlot: any;
  onSuccess: () => void;
}

export function LandRequestForm({ selectedPlot, onSuccess }: LandRequestFormProps) {
  const [purpose, setPurpose] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedPlot) {
    return (
      <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/20 text-slate-500 text-center italic">
        Select a plot on the map to begin your application.
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!purpose || !quotedPrice) return alert("Please fill all fields");
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId: selectedPlot.plotId,
          points: selectedPlot.points,
          quotedPrice: Number(quotedPrice),
          purpose: purpose,
        }),
      });

      if (res.ok) {
        alert("Application submitted successfully!");
        setPurpose("");
        setQuotedPrice("");
        onSuccess(); // Trigger the parent reload
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Submission failed"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 space-y-6">
      <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
        Plot #{selectedPlot.plotId} Application
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Purpose</label>
          <textarea 
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe your intended use (e.g., Textile Factory)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 outline-none focus:border-emerald-500/50 transition-all"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Your Quoted Price (₹)</label>
          <input 
            type="number"
            value={quotedPrice}
            onChange={(e) => setQuotedPrice(e.target.value)}
            placeholder={`Base Price: ₹${selectedPlot.leasePrice.toLocaleString()}`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-10 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all active:scale-95"
        >
          {isSubmitting ? "Processing..." : "Submit land request"}
        </button>
      </div>
    </div>
  );
}