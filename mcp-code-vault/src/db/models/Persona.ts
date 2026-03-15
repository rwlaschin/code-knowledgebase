import mongoose, { Schema, Document } from 'mongoose';

export interface IPersona extends Document {
  name: string;
  description: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

const PersonaSchema = new Schema<IPersona>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    prompt: { type: String, required: true }
  },
  { timestamps: true }
);

PersonaSchema.index({ name: 1 });

export const Persona =
  mongoose.models?.Persona ?? mongoose.model<IPersona>('Persona', PersonaSchema);
