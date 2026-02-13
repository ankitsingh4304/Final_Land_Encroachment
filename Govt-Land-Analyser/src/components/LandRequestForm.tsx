"use client";
import React, { useState } from "react";
import type { IndustrialAreaId } from "@/lib/config/areas";

interface LandRequestFormProps {
  selectedPlot: any;
  onSuccess: () => void;
  /**
   * Currently selected industrial area (kept in sync with MapPicker).
   */
  areaId: IndustrialAreaId;
  /**
   * Called when the user changes the industrial sector from the dropdown.
   */
  onAreaChange: (areaId: IndustrialAreaId) => void;
}

export function LandRequestForm({
  selectedPlot,
  onSuccess,
  areaId,
  onAreaChange,
}: LandRequestFormProps) {
  const [purpose, setPurpose] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedPlot) {
    return (
      <div className="p-8 border border-gray-300 bg-gray-50 text-gray-600 text-center space-y-4">
        <div>
          Select an industrial sector and then click a plot on the map to begin your application.
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-medium text-gray-700">
            Industrial Sector
          </span>
          <select
            className="border border-gray-400 bg-white px-3 py-1 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            value={areaId}
            onChange={(e) => onAreaChange(e.target.value as IndustrialAreaId)}
          >
            <option value="area-1">Industrial Sector 1</option>
            <option value="area-2">Industrial Sector 2</option>
            <option value="area-3">Industrial Sector 3</option>
          </select>
        </div>
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
    <div className="bg-gray-50 p-8 border border-gray-300 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-blue-700 font-bold text-sm uppercase tracking-wide">
          Plot #{selectedPlot.plotId} Application
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-700">Industrial Sector</span>
          <select
            className="border border-gray-400 bg-white px-3 py-1 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            value={areaId}
            onChange={(e) => onAreaChange(e.target.value as IndustrialAreaId)}
          >
            <option value="area-1">Industrial Sector 1</option>
            <option value="area-2">Industrial Sector 2</option>
            <option value="area-3">Industrial Sector 3</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
          <textarea 
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe your intended use (e.g., Textile Factory)..."
            className="w-full bg-white border border-gray-400 p-4 text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Quoted Price (₹)</label>
          <input 
            type="number"
            value={quotedPrice}
            onChange={(e) => setQuotedPrice(e.target.value)}
            placeholder={`Base Price: ₹${selectedPlot.leasePrice.toLocaleString()}`}
            className="w-full bg-white border border-gray-400 p-4 text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 shadow-md disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Processing..." : "Submit land request"}
        </button>
      </div>
    </div>
  );
}