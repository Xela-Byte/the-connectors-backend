import mongoose, { Document, Schema } from 'mongoose';

interface IProperty extends Document {
  flyerImage: string;
  name: string;
  slug: string;
  location: string;
  title?: string;
  landmark?: string;
  pricing: string[];
  highlight?: string;
  features: string[];
  category: 'land' | 'house';
}

const propertySchema = new Schema<IProperty>(
  {
    flyerImage: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    landmark: {
      type: String,
    },
    pricing: {
      type: [String], // Array of strings (e.g., pricing could be an array of price strings)
      required: true,
    },
    highlight: {
      type: String,
    },
    features: {
      type: [String], // Array of strings (e.g., features could be a list of strings)
      required: true,
    },
    category: {
      type: String,
      enum: ['land', 'house'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Property = mongoose.model<IProperty>('Property', propertySchema);

export { Property };

