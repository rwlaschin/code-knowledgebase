import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  key: string;
  /** Project root path (e.g. from MCP cwd). Resolved at runtime; single source of truth for scanner. */
  root_path?: string;
  default_model_id?: Types.ObjectId;
  /** File processing batch size (default 30). */
  file_processing_batch_size?: number;
  /** Pause in ms between batches (default 100). */
  file_processing_pause_ms?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    root_path: { type: String, required: false },
    default_model_id: { type: Schema.Types.ObjectId, ref: 'LLMModel', default: null },
    file_processing_batch_size: { type: Number, required: false },
    file_processing_pause_ms: { type: Number, required: false }
  },
  { timestamps: true }
);

export const Project =
  mongoose.models?.Project ?? mongoose.model<IProject>('Project', ProjectSchema);
