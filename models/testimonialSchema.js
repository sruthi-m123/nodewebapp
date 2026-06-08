import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    title: { type: String, required: true },
    img: { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;