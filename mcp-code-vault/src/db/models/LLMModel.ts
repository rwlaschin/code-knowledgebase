import mongoose, { Schema, Document } from 'mongoose';

export interface ILLMModel extends Document {
  name: string;
  provider: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

const LLMModelSchema = new Schema<ILLMModel>(
  {
    name: { type: String, required: true },
    provider: { type: String, required: true },
    label: { type: String, required: true }
  },
  { timestamps: true, collection: 'models' }
);

LLMModelSchema.index({ name: 1, provider: 1 });

export const LLMModel =
  mongoose.models?.LLMModel ??
  mongoose.model<ILLMModel>('LLMModel', LLMModelSchema);
