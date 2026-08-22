/**
 * LandStack — Auth & RBAC Types
 */

export type Role = 
  | 'CITIZEN'
  | 'SURVEYOR'
  | 'LAND_OFFICER'
  | 'REGISTRATION_OFFICER'
  | 'PLANNING_OFFICER'
  | 'TAX_OFFICER'
  | 'ADMIN';

export type Permission =
  | 'parcel.read'
  | 'parcel.verify'
  | 'parcel.update'
  | 'ownership.read'
  | 'ownership.update'
  | 'ror.read'
  | 'ror.update'
  | 'registration.read'
  | 'registration.create'
  | 'registration.update'
  | 'encumbrance.read'
  | 'encumbrance.update'
  | 'building.read'
  | 'building.approve'
  | 'planning.read'
  | 'planning.update'
  | 'tax.read'
  | 'tax.update'
  | 'dispute.read'
  | 'dispute.update'
  | 'restriction.read'
  | 'restriction.update'
  | 'admin.users'
  | 'admin.roles'
  | 'admin.audit'
  | 'admin.system'
  | 'data.export'
  | 'data.import';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string;
  jurisdiction?: {
    state: string;
    district?: string;
    subdistrict?: string;
  };
}

/** Role → permissions mapping */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CITIZEN: [
    'parcel.read', 'ownership.read', 'ror.read',
    'registration.read', 'encumbrance.read', 'building.read',
    'planning.read', 'tax.read', 'dispute.read', 'restriction.read',
  ],
  SURVEYOR: [
    'parcel.read', 'parcel.verify', 'ownership.read', 'ror.read',
    'registration.read', 'restriction.read', 'planning.read',
  ],
  LAND_OFFICER: [
    'parcel.read', 'parcel.verify', 'parcel.update',
    'ownership.read', 'ownership.update',
    'ror.read', 'ror.update',
    'registration.read', 'encumbrance.read',
    'dispute.read', 'dispute.update', 'restriction.read',
  ],
  REGISTRATION_OFFICER: [
    'parcel.read', 'ownership.read',
    'registration.read', 'registration.create', 'registration.update',
    'encumbrance.read', 'encumbrance.update',
  ],
  PLANNING_OFFICER: [
    'parcel.read', 'planning.read', 'planning.update',
    'building.read', 'building.approve',
    'restriction.read', 'restriction.update',
  ],
  TAX_OFFICER: [
    'parcel.read', 'ownership.read',
    'tax.read', 'tax.update',
    'registration.read',
  ],
  ADMIN: [
    'parcel.read', 'parcel.verify', 'parcel.update',
    'ownership.read', 'ownership.update',
    'ror.read', 'ror.update',
    'registration.read', 'registration.create', 'registration.update',
    'encumbrance.read', 'encumbrance.update',
    'building.read', 'building.approve',
    'planning.read', 'planning.update',
    'tax.read', 'tax.update',
    'dispute.read', 'dispute.update',
    'restriction.read', 'restriction.update',
    'admin.users', 'admin.roles', 'admin.audit', 'admin.system',
    'data.export', 'data.import',
  ],
};

/** Check if a role has a permission */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Demo users for hackathon prototype */
export const DEMO_USERS: User[] = [
  {
    id: 'citizen-001',
    email: 'citizen@landstack.in',
    name: 'Ramesh Kumar',
    role: 'CITIZEN',
  },
  {
    id: 'surveyor-001',
    email: 'surveyor@landstack.in',
    name: 'Priya Sharma',
    role: 'SURVEYOR',
    department: 'Survey Department',
    jurisdiction: { state: 'Bihar', district: 'Madhubani' },
  },
  {
    id: 'officer-001',
    email: 'officer@landstack.in',
    name: 'Vikram Singh',
    role: 'LAND_OFFICER',
    department: 'Land Records',
    jurisdiction: { state: 'Bihar', district: 'Madhubani' },
  },
  {
    id: 'admin-001',
    email: 'admin@landstack.in',
    name: 'Akash Admin',
    role: 'ADMIN',
    department: 'IT',
    jurisdiction: { state: 'Bihar' },
  },
];
