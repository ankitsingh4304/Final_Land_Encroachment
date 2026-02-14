import mongoose, { Schema, model, models } from "mongoose";

// Define the structure of a Plot document in your MongoDB
const PlotSchema = new Schema({
  plotId: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  points: { 
    type: String, 
    required: true 
  },
  bought: { 
    type: Boolean, 
    default: false 
  },
  leasePrice: { 
    type: Number, 
    required: true 
  },
  leaseDuration: { 
    type: Number, 
    required: true 
  },
  boughtBy: { 
    type: String, 
    default: null 
  },
  /** User email (e.g. Gmail) mapped to this plot. */
  user_gmail: { type: String, default: null },
  allotmentDateTime: { 
    type: Date, 
    default: null 
  }
});

// Important: Next.js uses hot-reloading. 
// We check if the model already exists to prevent re-defining it.
const Plot = models.Plot || model("Plot", PlotSchema);

export default Plot;