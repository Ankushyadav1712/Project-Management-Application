import mongoose, { Document, Schema } from "mongoose";

export type MemberRole = "owner" | "admin" | "member";

export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
}

export interface IWorkspace extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: {
    type: String,
    enum: ["owner", "admin", "member"],
    default: "member",
  },
  joinedAt: { type: Date, default: Date.now },
});

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [workspaceMemberSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IWorkspace>("Workspace", workspaceSchema);
