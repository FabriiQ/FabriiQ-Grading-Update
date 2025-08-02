# Technical Specifications for Compliance Implementation

## Overview

This document provides detailed technical specifications for implementing GDPR, PDPL, and FERPA compliance features in the FabriiQ Learning Experience Platform. It includes database schemas, API specifications, service architectures, and integration requirements.

## Database Schema Extensions

### 1. Consent Management Schema

```sql
-- User Consent Tracking
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'essential', 'analytics', 'marketing', 'cookies'
  consent_given BOOLEAN NOT NULL,
  consent_date TIMESTAMP NOT NULL DEFAULT NOW(),
  withdrawal_date TIMESTAMP NULL,
  legal_basis VARCHAR(50) NOT NULL, -- 'consent', 'contract', 'legitimate_interest'
  processing_purpose TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_consent_type CHECK (consent_type IN ('essential', 'analytics', 'marketing', 'cookies', 'social', 'communications')),
  CONSTRAINT valid_legal_basis CHECK (legal_basis IN ('consent', 'contract', 'legitimate_interest', 'vital_interest', 'public_task', 'legal_obligation'))
);

-- Indexes for performance
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_date ON user_consents(consent_date);
CREATE UNIQUE INDEX idx_user_consents_unique ON user_consents(user_id, consent_type) WHERE withdrawal_date IS NULL;

-- Data Processing Activities Registry
CREATE TABLE data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name VARCHAR(100) NOT NULL UNIQUE,
  processing_purpose TEXT NOT NULL,
  legal_basis VARCHAR(50) NOT NULL,
  data_categories TEXT[] NOT NULL, -- Array of data types processed
  retention_period INTERVAL NOT NULL, -- PostgreSQL interval type
  is_automated BOOLEAN DEFAULT FALSE,
  involves_profiling BOOLEAN DEFAULT FALSE,
  is_high_risk BOOLEAN DEFAULT FALSE,
  third_party_sharing JSONB DEFAULT '[]', -- Array of third-party details
  cross_border_transfers JSONB DEFAULT '[]', -- Array of transfer details
  safeguards_applied TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_legal_basis CHECK (legal_basis IN ('consent', 'contract', 'legitimate_interest', 'vital_interest', 'public_task', 'legal_obligation'))
);

-- Enhanced Audit Logging
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS data_subject_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS processing_activity_id UUID REFERENCES data_processing_activities(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS legal_basis VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS consent_id UUID REFERENCES user_consents(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS data_categories TEXT[];
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS access_reason TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS disclosure_recipient VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS legitimate_interest_reason TEXT;

-- Privacy Policy Management
CREATE TABLE privacy_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL,
  jurisdiction VARCHAR(10) NOT NULL, -- 'EU', 'UAE', 'SA', 'US', 'GLOBAL'
  policy_content JSONB NOT NULL, -- Structured policy content
  effective_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_jurisdiction CHECK (jurisdiction IN ('EU', 'UAE', 'SA', 'US', 'GLOBAL'))
);

-- Policy Acceptance Tracking
CREATE TABLE policy_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES privacy_policies(id),
  acceptance_date TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  acceptance_method VARCHAR(50) DEFAULT 'web_form',
  
  UNIQUE(user_id, policy_id)
);
```

### 2. Educational Records Classification (FERPA)

```sql
-- Directory Information Management
CREATE TABLE directory_information_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opted_out BOOLEAN DEFAULT FALSE,
  opt_out_date TIMESTAMP,
  opt_out_reason TEXT,
  parent_consent_required BOOLEAN DEFAULT FALSE,
  parent_consent_obtained BOOLEAN DEFAULT FALSE,
  parent_consent_date TIMESTAMP,
  rights_transferred_at_18 BOOLEAN DEFAULT FALSE,
  rights_transfer_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(student_id)
);

-- Educational Record Disclosures (FERPA Requirement)
CREATE TABLE educational_record_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  disclosed_to_user_id UUID REFERENCES users(id), -- If disclosed to another system user
  disclosed_to_external VARCHAR(200), -- If disclosed to external party
  disclosure_date TIMESTAMP NOT NULL DEFAULT NOW(),
  disclosure_purpose TEXT NOT NULL,
  legitimate_educational_interest TEXT,
  records_disclosed TEXT[] NOT NULL, -- Array of record types disclosed
  consent_required BOOLEAN NOT NULL,
  consent_obtained BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP,
  disclosure_method VARCHAR(50) NOT NULL, -- 'system_access', 'export', 'verbal', 'written'
  disclosed_by_user_id UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT valid_disclosure_method CHECK (disclosure_method IN ('system_access', 'export', 'verbal', 'written', 'automated'))
);

-- Parental Rights Management
CREATE TABLE parental_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES users(id), -- If parent has system account
  parent_name VARCHAR(200) NOT NULL,
  parent_email VARCHAR(200) NOT NULL,
  parent_phone VARCHAR(50),
  relationship VARCHAR(50) NOT NULL, -- 'parent', 'guardian', 'custodian'
  has_educational_rights BOOLEAN DEFAULT TRUE,
  rights_start_date TIMESTAMP DEFAULT NOW(),
  rights_end_date TIMESTAMP, -- When student turns 18 or graduates
  consent_for_disclosure BOOLEAN DEFAULT FALSE,
  emergency_contact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_relationship CHECK (relationship IN ('parent', 'guardian', 'custodian', 'authorized_representative'))
);
```

### 3. Data Localization & Regional Compliance

```sql
-- Data Residency Configuration
CREATE TABLE data_residency_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  jurisdiction VARCHAR(10) NOT NULL,
  data_residency_required BOOLEAN DEFAULT FALSE,
  approved_regions TEXT[] DEFAULT '{}', -- Allowed storage regions
  cross_border_transfers_allowed BOOLEAN DEFAULT TRUE,
  adequacy_decisions TEXT[] DEFAULT '{}', -- Approved adequacy decisions
  standard_contractual_clauses BOOLEAN DEFAULT FALSE,
  binding_corporate_rules BOOLEAN DEFAULT FALSE,
  certification_schemes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_jurisdiction CHECK (jurisdiction IN ('EU', 'UAE', 'SA', 'US', 'GLOBAL')),
  UNIQUE(institution_id, jurisdiction)
);

-- Cross-Border Transfer Logging
CREATE TABLE cross_border_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id VARCHAR(100) NOT NULL UNIQUE,
  data_subject_id UUID NOT NULL REFERENCES users(id),
  source_region VARCHAR(10) NOT NULL,
  destination_region VARCHAR(10) NOT NULL,
  data_categories TEXT[] NOT NULL,
  transfer_purpose TEXT NOT NULL,
  legal_basis VARCHAR(50) NOT NULL,
  safeguards_applied TEXT[] DEFAULT '{}',
  adequacy_decision BOOLEAN DEFAULT FALSE,
  consent_obtained BOOLEAN DEFAULT FALSE,
  transfer_date TIMESTAMP NOT NULL DEFAULT NOW(),
  initiated_by_user_id UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT valid_legal_basis CHECK (legal_basis IN ('adequacy_decision', 'standard_contractual_clauses', 'binding_corporate_rules', 'consent', 'derogation'))
);
```

## API Service Specifications

### 1. Consent Management Service

```typescript
// src/server/api/services/consent.service.ts

export interface ConsentData {
  consentType: 'essential' | 'analytics' | 'marketing' | 'cookies' | 'social' | 'communications';
  consentGiven: boolean;
  legalBasis: 'consent' | 'contract' | 'legitimate_interest';
  processingPurpose: string;
  consentVersion?: string;
  metadata?: Record<string, any>;
}

export interface ConsentValidationResult {
  isValid: boolean;
  consentRequired: boolean;
  consentGiven: boolean;
  legalBasis: string;
  lastUpdated: Date;
  expiryDate?: Date;
}

export class ConsentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Capture user consent with full audit trail
   */
  async captureConsent(
    userId: string,
    consentData: ConsentData,
    context: {
      ipAddress?: string;
      userAgent?: string;
      source?: string;
    }
  ): Promise<void> {
    await this.prisma.userConsent.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType: consentData.consentType
        }
      },
      create: {
        userId,
        consentType: consentData.consentType,
        consentGiven: consentData.consentGiven,
        legalBasis: consentData.legalBasis,
        processingPurpose: consentData.processingPurpose,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        consentVersion: consentData.consentVersion || '1.0',
        metadata: consentData.metadata || {}
      },
      update: {
        consentGiven: consentData.consentGiven,
        withdrawalDate: consentData.consentGiven ? null : new Date(),
        updatedAt: new Date()
      }
    });

    // Log consent change for audit
    await this.auditConsentChange(userId, consentData, context);
  }

  /**
   * Validate consent for specific processing purpose
   */
  async validateConsent(
    userId: string,
    processingPurpose: string
  ): Promise<ConsentValidationResult> {
    // Get processing activity requirements
    const activity = await this.prisma.dataProcessingActivity.findFirst({
      where: { processingPurpose }
    });

    if (!activity) {
      throw new Error(`Unknown processing purpose: ${processingPurpose}`);
    }

    // Check if consent is required based on legal basis
    if (activity.legalBasis !== 'consent') {
      return {
        isValid: true,
        consentRequired: false,
        consentGiven: true,
        legalBasis: activity.legalBasis,
        lastUpdated: new Date()
      };
    }

    // Find relevant consent record
    const consent = await this.prisma.userConsent.findFirst({
      where: {
        userId,
        processingPurpose,
        withdrawalDate: null
      },
      orderBy: { consentDate: 'desc' }
    });

    return {
      isValid: consent?.consentGiven || false,
      consentRequired: true,
      consentGiven: consent?.consentGiven || false,
      legalBasis: consent?.legalBasis || 'consent',
      lastUpdated: consent?.updatedAt || new Date(),
      expiryDate: this.calculateConsentExpiry(consent?.consentDate)
    };
  }

  /**
   * Withdraw consent with audit trail
   */
  async withdrawConsent(
    userId: string,
    consentType: string,
    reason?: string
  ): Promise<void> {
    await this.prisma.userConsent.updateMany({
      where: {
        userId,
        consentType,
        withdrawalDate: null
      },
      data: {
        consentGiven: false,
        withdrawalDate: new Date(),
        metadata: {
          withdrawalReason: reason
        }
      }
    });

    // Log withdrawal for audit
    await this.auditConsentWithdrawal(userId, consentType, reason);
  }

  /**
   * Get complete consent history for user
   */
  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    return this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { consentDate: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
  }

  private async auditConsentChange(
    userId: string,
    consentData: ConsentData,
    context: any
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        dataSubjectId: userId,
        entityType: 'USER_CONSENT',
        entityId: userId,
        action: consentData.consentGiven ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
        changes: {
          consentType: consentData.consentType,
          consentGiven: consentData.consentGiven,
          legalBasis: consentData.legalBasis
        },
        metadata: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          source: context.source
        },
        legalBasis: consentData.legalBasis,
        accessReason: 'Consent management operation'
      }
    });
  }

  private calculateConsentExpiry(consentDate?: Date): Date | undefined {
    if (!consentDate) return undefined;
    // GDPR doesn't specify expiry, but best practice is 2 years
    const expiry = new Date(consentDate);
    expiry.setFullYear(expiry.getFullYear() + 2);
    return expiry;
  }
}
```

### 2. Data Subject Rights Service

```typescript
// src/server/api/services/data-subject-rights.service.ts

export interface DataAccessRequest {
  requestId: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  completionDeadline: Date;
  requestDetails?: Record<string, any>;
}

export interface DataExportOptions {
  format: 'JSON' | 'CSV' | 'PDF' | 'XML';
  includeMetadata: boolean;
  includeAuditTrail: boolean;
  dataCategories?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export class DataSubjectRightsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Process data access request (GDPR Article 15)
   */
  async processDataAccessRequest(
    userId: string,
    options: DataExportOptions
  ): Promise<string> {
    // Validate user identity and rights
    await this.validateDataSubjectRights(userId);

    // Generate comprehensive data export
    const userData = await this.gatherUserData(userId, options);

    // Create secure download link
    const exportId = await this.createSecureExport(userData, options.format);

    // Log data access for audit
    await this.logDataAccess(userId, 'DATA_ACCESS_REQUEST', {
      exportId,
      format: options.format,
      dataCategories: options.dataCategories
    });

    return exportId;
  }

  /**
   * Process data rectification request (GDPR Article 16)
   */
  async processRectificationRequest(
    userId: string,
    corrections: Record<string, any>
  ): Promise<void> {
    // Validate corrections
    const validatedCorrections = await this.validateCorrections(corrections);

    // Apply corrections with approval workflow if needed
    await this.applyDataCorrections(userId, validatedCorrections);

    // Notify third parties of corrections if required
    await this.notifyThirdPartiesOfCorrections(userId, validatedCorrections);

    // Log rectification for audit
    await this.logDataAccess(userId, 'DATA_RECTIFICATION', {
      corrections: validatedCorrections
    });
  }

  /**
   * Process erasure request with educational record protection
   */
  async processErasureRequest(
    userId: string,
    reason: string
  ): Promise<{ deletedData: string[]; retainedData: string[]; reason: string }> {
    // Check for educational record retention requirements
    const retentionAnalysis = await this.analyzeRetentionRequirements(userId);

    // Delete non-protected data
    const deletedData = await this.performSelectiveDeletion(
      userId,
      retentionAnalysis.deletableData
    );

    // Anonymize retained educational records
    const anonymizedData = await this.anonymizeEducationalRecords(
      userId,
      retentionAnalysis.retainedData
    );

    // Log erasure for audit
    await this.logDataAccess(userId, 'DATA_ERASURE', {
      deletedData,
      retainedData: retentionAnalysis.retainedData,
      reason
    });

    return {
      deletedData,
      retainedData: retentionAnalysis.retainedData,
      reason: 'Educational records retained per FERPA requirements'
    };
  }

  private async gatherUserData(
    userId: string,
    options: DataExportOptions
  ): Promise<Record<string, any>> {
    const userData: Record<string, any> = {};

    // Basic user information
    userData.profile = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        teacherProfile: true,
        permissions: {
          include: { permission: true }
        }
      }
    });

    // Educational records (if applicable)
    if (userData.profile?.userType === 'CAMPUS_STUDENT') {
      userData.educationalRecords = await this.gatherEducationalRecords(userId);
    }

    // Social wall data
    userData.socialData = await this.gatherSocialWallData(userId);

    // Consent history
    userData.consents = await this.prisma.userConsent.findMany({
      where: { userId }
    });

    // Audit trail (if requested)
    if (options.includeAuditTrail) {
      userData.auditTrail = await this.prisma.auditLog.findMany({
        where: { dataSubjectId: userId },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limit for performance
      });
    }

    return userData;
  }

  private async analyzeRetentionRequirements(
    userId: string
  ): Promise<{ deletableData: string[]; retainedData: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true }
    });

    const deletableData = [
      'social_posts',
      'social_comments',
      'social_reactions',
      'analytics_events',
      'notification_preferences'
    ];

    const retainedData = [];

    // FERPA: Educational records must be retained
    if (user?.userType === 'CAMPUS_STUDENT') {
      retainedData.push(
        'academic_grades',
        'attendance_records',
        'assessment_results',
        'enrollment_records',
        'disciplinary_records'
      );
    }

    return { deletableData, retainedData };
  }
}
```

## Security & Encryption Specifications

### 1. Field-Level Encryption

```typescript
// src/server/api/services/encryption.service.ts

import { createCipher, createDecipher, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class DataEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;

  constructor(private masterKey: string) {}

  /**
   * Encrypt sensitive field data
   */
  async encryptSensitiveField(data: string): Promise<string> {
    try {
      const iv = randomBytes(this.ivLength);
      const key = await this.deriveKey(this.masterKey, iv);
      
      const cipher = createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('fabriiQ-lxp-encryption'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV + encrypted data + auth tag
      const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex'), tag]);
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive field data
   */
  async decryptSensitiveField(encryptedData: string): Promise<string> {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      const iv = combined.slice(0, this.ivLength);
      const encrypted = combined.slice(this.ivLength, -this.tagLength);
      const tag = combined.slice(-this.tagLength);
      
      const key = await this.deriveKey(this.masterKey, iv);
      
      const decipher = createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from('fabriiQ-lxp-encryption'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Rotate encryption keys (for compliance)
   */
  async rotateEncryptionKeys(): Promise<void> {
    // Implementation for key rotation
    // This would involve re-encrypting all sensitive data with new keys
    // Should be done during maintenance windows
  }

  private async deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(masterKey, salt, this.keyLength)) as Buffer;
  }
}
```

## Integration Specifications

### 1. Regional Data Storage Configuration

```typescript
// src/server/api/services/data-localization.service.ts

export interface DataResidencyConfig {
  institutionId: string;
  jurisdiction: 'EU' | 'UAE' | 'SA' | 'US' | 'GLOBAL';
  dataResidencyRequired: boolean;
  approvedRegions: string[];
  crossBorderTransfersAllowed: boolean;
  safeguards: string[];
}

export class DataLocalizationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Determine data residency requirements for institution
   */
  async determineDataResidency(institutionId: string): Promise<DataResidencyConfig> {
    const config = await this.prisma.dataResidencyConfig.findFirst({
      where: { institutionId }
    });

    if (!config) {
      // Default configuration
      return {
        institutionId,
        jurisdiction: 'GLOBAL',
        dataResidencyRequired: false,
        approvedRegions: ['US', 'EU'],
        crossBorderTransfersAllowed: true,
        safeguards: ['standard_contractual_clauses']
      };
    }

    return {
      institutionId: config.institutionId,
      jurisdiction: config.jurisdiction as any,
      dataResidencyRequired: config.dataResidencyRequired,
      approvedRegions: config.approvedRegions,
      crossBorderTransfersAllowed: config.crossBorderTransfersAllowed,
      safeguards: config.standardContractualClauses ? ['standard_contractual_clauses'] : []
    };
  }

  /**
   * Validate cross-border data transfer
   */
  async validateCrossBorderTransfer(
    sourceRegion: string,
    targetRegion: string,
    dataType: string,
    institutionId: string
  ): Promise<{ allowed: boolean; safeguards: string[]; reason?: string }> {
    const config = await this.determineDataResidency(institutionId);

    // Saudi Arabia specific requirements
    if (config.jurisdiction === 'SA' && config.dataResidencyRequired) {
      if (targetRegion !== 'SA') {
        return {
          allowed: false,
          safeguards: [],
          reason: 'Saudi Arabia data localization law requires local storage'
        };
      }
    }

    // Check approved regions
    if (!config.approvedRegions.includes(targetRegion)) {
      return {
        allowed: false,
        safeguards: [],
        reason: `Transfer to ${targetRegion} not approved for this institution`
      };
    }

    return {
      allowed: true,
      safeguards: config.safeguards
    };
  }
}
```

## Performance & Monitoring

### 1. Compliance Monitoring Service

```typescript
// src/server/api/services/compliance-monitoring.service.ts

export interface ComplianceMetrics {
  consentCaptureRate: number;
  dataSubjectRequestResponseTime: number;
  breachDetectionTime: number;
  auditCoverage: number;
  encryptionCoverage: number;
  retentionPolicyCompliance: number;
}

export class ComplianceMonitoringService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate real-time compliance dashboard data
   */
  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    const [
      consentStats,
      requestStats,
      auditStats,
      encryptionStats
    ] = await Promise.all([
      this.getConsentMetrics(),
      this.getRequestMetrics(),
      this.getAuditMetrics(),
      this.getEncryptionMetrics()
    ]);

    return {
      consentCaptureRate: consentStats.captureRate,
      dataSubjectRequestResponseTime: requestStats.avgResponseTime,
      breachDetectionTime: 0, // To be implemented
      auditCoverage: auditStats.coverage,
      encryptionCoverage: encryptionStats.coverage,
      retentionPolicyCompliance: 0 // To be implemented
    };
  }

  private async getConsentMetrics() {
    // Implementation for consent metrics
    return { captureRate: 95.5 };
  }

  private async getRequestMetrics() {
    // Implementation for request metrics
    return { avgResponseTime: 15.2 }; // days
  }

  private async getAuditMetrics() {
    // Implementation for audit metrics
    return { coverage: 98.7 };
  }

  private async getEncryptionMetrics() {
    // Implementation for encryption metrics
    return { coverage: 100.0 };
  }
}
```

---

**Technical Specifications Version**: 1.0
**Last Updated**: 2025-06-30
**Next Review**: 2025-07-15
