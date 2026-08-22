/**
 * LandStack — Workflow Engine & SLA Monitor (Step 13)
 */

export interface WorkflowStep {
  order: number;
  name: string;
  department: string;
  required_role: string;
}

export interface WorkflowDefinition {
  workflow_id: string;
  workflow_name: string;
  description: string;
  target_sla_days: number;
  steps: WorkflowStep[];
}

export const WORKFLOWS: Record<string, WorkflowDefinition> = {
  ownership_verification: {
    workflow_id: "ownership_verification",
    workflow_name: "Ownership Verification",
    description: "Cross-verifies Record of Rights (Jamabandi), registered deeds, and cadastral boundary.",
    target_sla_days: 3,
    steps: [
      { order: 1, name: "Document Verification", department: "Revenue", required_role: "LAND_OFFICER" },
      { order: 2, name: "Spatial & RoR Cross-Check", department: "Revenue", required_role: "LAND_OFFICER" },
      { order: 3, name: "Final Certification", department: "Revenue", required_role: "LAND_OFFICER" }
    ]
  },
  mutation: {
    workflow_id: "mutation",
    workflow_name: "Property Mutation",
    description: "Ownership title transfer following sale, inheritance, or partition with dispute checks.",
    target_sla_days: 7,
    steps: [
      { order: 1, name: "Application & Deed Intake", department: "Revenue", required_role: "LAND_OFFICER" },
      { order: 2, name: "Dispute & Encumbrance Clearance", department: "Registration", required_role: "REGISTRATION_OFFICER" },
      { order: 3, name: "Field Inspection & Notice", department: "Revenue", required_role: "SURVEYOR" },
      { order: 4, name: "RoR Jamabandi Update", department: "Revenue", required_role: "LAND_OFFICER" }
    ]
  },
  building_permission: {
    workflow_id: "building_permission",
    workflow_name: "Building Construction Permission",
    description: "Multi-department statutory approval across Planning, Municipality, and Environment.",
    target_sla_days: 10,
    steps: [
      { order: 1, name: "Zoning & Land Use Check", department: "Planning", required_role: "PLANNING_OFFICER" },
      { order: 2, name: "Structural & FAR Compliance", department: "Municipality", required_role: "MUNICIPALITY_OFFICER" },
      { order: 3, name: "Environmental Buffer Clearance", department: "Environment", required_role: "PLANNING_OFFICER" },
      { order: 4, name: "Sanction Order Issuance", department: "Municipality", required_role: "MUNICIPALITY_OFFICER" }
    ]
  },
  encumbrance_certificate: {
    workflow_id: "encumbrance_certificate",
    workflow_name: "Encumbrance Certificate",
    description: "Search and certification of registered liabilities, mortgages, and bank attachments.",
    target_sla_days: 2,
    steps: [
      { order: 1, name: "Deed Index Search (13+ Yrs)", department: "Registration", required_role: "REGISTRATION_OFFICER" },
      { order: 2, name: "Bank Charge Clearance", department: "Registration", required_role: "REGISTRATION_OFFICER" },
      { order: 3, name: "Digital Certificate Issuance", department: "Registration", required_role: "REGISTRATION_OFFICER" }
    ]
  }
};

export function calculateSlaStatus(createdAt: string | Date, targetDays: number): {
  deadline: Date;
  daysRemaining: number;
  status: "ON_TRACK" | "APPROACHING_SLA" | "SLA_BREACHED";
  badgeClass: string;
} {
  const created = new Date(createdAt);
  const deadline = new Date(created.getTime() + targetDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const daysRemaining = Math.round(diffMs / (24 * 60 * 60 * 1000) * 10) / 10;

  if (diffMs < 0) {
    return { deadline, daysRemaining, status: "SLA_BREACHED", badgeClass: "badge-error" };
  } else if (daysRemaining <= 1) {
    return { deadline, daysRemaining, status: "APPROACHING_SLA", badgeClass: "badge-warning" };
  } else {
    return { deadline, daysRemaining, status: "ON_TRACK", badgeClass: "badge-success" };
  }
}
