import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAgentTools {
  file_watch: boolean;
  db_read_write: boolean;
  web_search: boolean;
  run_shell: boolean;
}

export interface IAgent extends Document {
  name: string;
  description: string;
  system_prompt: string;
  focus: string;
  project_id: Types.ObjectId;
  model_ids: Types.ObjectId[];
  persona_ids: Types.ObjectId[];
  tools: IAgentTools;
  createdAt: Date;
  updatedAt: Date;
}

const AgentToolsSchema = new Schema<IAgentTools>(
  {
    file_watch: { type: Boolean, default: false },
    db_read_write: { type: Boolean, default: false },
    web_search: { type: Boolean, default: false },
    run_shell: { type: Boolean, default: false }
  },
  { _id: false }
);

const AgentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    system_prompt: { type: String, required: true },
    focus: { type: String, required: true },
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    model_ids: [{ type: Schema.Types.ObjectId, ref: 'LLMModel' }],
    persona_ids: [{ type: Schema.Types.ObjectId, ref: 'Persona' }],
    tools: { type: AgentToolsSchema, default: () => ({}) }
  },
  { timestamps: true }
);

AgentSchema.index({ project_id: 1 });
AgentSchema.index({ project_id: 1, name: 1 });

export const Agent =
  mongoose.models?.Agent ?? mongoose.model<IAgent>('Agent', AgentSchema);
