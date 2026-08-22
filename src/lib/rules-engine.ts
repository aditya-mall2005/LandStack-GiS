/**
 * LandStack — Land Rules Engine
 * Evaluates development status based on parcel context
 */

export interface RuleContext {
  landUse: string[];
  masterPlan: string[];
  restrictions: Array<{ type: string; severity: string }>;
  encumbrances: Array<{ type: string; status: string }>;
  buildingPermissions: Array<{ status: string; expiry_date?: string }>;
  disputes: Array<{ status: string }>;
  ror: { revenue_status?: string } | null;
}

export type DevelopmentStatus =
  | 'PERMITTED'
  | 'CONDITIONAL'
  | 'REVIEW_REQUIRED'
  | 'RESTRICTED'
  | 'BLOCKED';

export interface RuleResult {
  status: DevelopmentStatus;
  alerts: Array<{
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    code: string;
    message: string;
  }>;
  compliance_score: number;
  summary: string;
}

interface Rule {
  id: string;
  name: string;
  evaluate: (ctx: RuleContext) => { passed: boolean; alert?: RuleResult['alerts'][0] };
}

const RULES: Rule[] = [
  {
    id: 'R001',
    name: 'Active Dispute Check',
    evaluate: (ctx) => {
      const active = ctx.disputes.filter(d => !['Disposed', 'Settled', 'Withdrawn'].includes(d.status));
      if (active.length > 0) {
        return {
          passed: false,
          alert: { severity: 'CRITICAL', code: 'DISPUTE_ACTIVE', message: `${active.length} active dispute(s) — transactions may be restricted` },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R002',
    name: 'Encumbrance Check',
    evaluate: (ctx) => {
      const active = ctx.encumbrances.filter(e => e.status === 'Active');
      if (active.length > 0) {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'ENCUMBRANCE_ACTIVE', message: `${active.length} active encumbrance(s) — mortgage/lien on property` },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R003',
    name: 'Restriction Zone Check',
    evaluate: (ctx) => {
      const high = ctx.restrictions.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
      if (high.length > 0) {
        return {
          passed: false,
          alert: { severity: 'CRITICAL', code: 'RESTRICTION_HIGH', message: `Parcel falls in restricted zone: ${high.map(r => r.type).join(', ')}` },
        };
      }
      if (ctx.restrictions.length > 0) {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'RESTRICTION_MODERATE', message: `Parcel intersects ${ctx.restrictions.length} restriction zone(s)` },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R004',
    name: 'Land Use Conformity',
    evaluate: (ctx) => {
      if (ctx.landUse.length === 0 || ctx.masterPlan.length === 0) return { passed: true };
      const mismatch = ctx.landUse.some(lu => !ctx.masterPlan.some(mp => mp.toLowerCase().includes(lu.toLowerCase())));
      if (mismatch) {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'LANDUSE_MISMATCH', message: `Current use (${ctx.landUse.join(', ')}) may not align with master plan (${ctx.masterPlan.join(', ')})` },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R005',
    name: 'Building Permission Check',
    evaluate: (ctx) => {
      const expired = ctx.buildingPermissions.filter(bp => {
        if (bp.status === 'Expired') return true;
        if (bp.expiry_date && new Date(bp.expiry_date) < new Date()) return true;
        return false;
      });
      if (expired.length > 0) {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'BP_EXPIRED', message: 'Building permission has expired — renewal required' },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R006',
    name: 'Revenue Arrears Check',
    evaluate: (ctx) => {
      if (ctx.ror?.revenue_status === 'Arrears') {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'REVENUE_ARREARS', message: 'Land revenue is in arrears — clearance may be required' },
        };
      }
      return { passed: true };
    },
  },
];

export function evaluateRules(ctx: RuleContext): RuleResult {
  const alerts: RuleResult['alerts'] = [];
  let passedCount = 0;

  for (const rule of RULES) {
    const result = rule.evaluate(ctx);
    if (result.passed) {
      passedCount++;
    } else if (result.alert) {
      alerts.push(result.alert);
    }
  }

  const complianceScore = Math.round((passedCount / RULES.length) * 100);

  const hasCritical = alerts.some(a => a.severity === 'CRITICAL');
  const hasWarning = alerts.some(a => a.severity === 'WARNING');

  let status: DevelopmentStatus;
  let summary: string;

  if (hasCritical) {
    status = 'BLOCKED';
    summary = 'Development blocked — critical issues require resolution';
  } else if (alerts.length >= 3) {
    status = 'RESTRICTED';
    summary = 'Multiple issues detected — restricted development';
  } else if (hasWarning) {
    status = 'REVIEW_REQUIRED';
    summary = 'Review required — minor issues detected';
  } else if (alerts.length > 0) {
    status = 'CONDITIONAL';
    summary = 'Conditional development — conditions must be met';
  } else {
    status = 'PERMITTED';
    summary = 'No restrictions detected — development may proceed';
  }

  return { status, alerts, compliance_score: complianceScore, summary };
}
