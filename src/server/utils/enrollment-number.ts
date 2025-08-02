/**
 * Enrollment Number Generation Utility
 * 
 * Generates unique enrollment numbers in the format:
 * INSTITUTION-CAMPUS-YYYYMMDD-SEQUENCE
 * 
 * Example: INST-CAMP-20240101-001
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a unique enrollment number
 * @param institutionCode - Institution code (e.g., "INST")
 * @param campusCode - Campus code (e.g., "CAMP") 
 * @param date - Date for the enrollment (defaults to current date)
 * @returns Promise<string> - Unique enrollment number
 */
export async function generateEnrollmentNumber(
  institutionCode: string,
  campusCode: string,
  date: Date = new Date()
): Promise<string> {
  // Format date as YYYYMMDD
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Create base prefix
  const prefix = `${institutionCode}-${campusCode}-${dateStr}`;
  
  // Find the highest sequence number for this prefix
  const existingEnrollments = await prisma.studentProfile.findMany({
    where: {
      enrollmentNumber: {
        startsWith: prefix
      }
    },
    select: {
      enrollmentNumber: true
    },
    orderBy: {
      enrollmentNumber: 'desc'
    },
    take: 1
  });
  
  let sequence = 1;
  
  if (existingEnrollments.length > 0) {
    const lastEnrollment = existingEnrollments[0]?.enrollmentNumber;
    if (lastEnrollment) {
      // Extract sequence number from the last enrollment
      const parts = lastEnrollment.split('-');
      if (parts.length >= 4) {
        const lastSequence = parseInt(parts[parts.length - 1] || '0', 10);
        sequence = lastSequence + 1;
      }
    }
  }
  
  // Format sequence with leading zeros (3 digits)
  const sequenceStr = sequence.toString().padStart(3, '0');
  
  return `${prefix}-${sequenceStr}`;
}

/**
 * Generate enrollment number with fallback for missing codes
 * @param institutionCode - Institution code
 * @param campusCode - Campus code
 * @param fallbackInstitution - Fallback institution code
 * @param fallbackCampus - Fallback campus code
 * @returns Promise<string> - Unique enrollment number
 */
export async function generateEnrollmentNumberWithFallback(
  institutionCode?: string,
  campusCode?: string,
  fallbackInstitution: string = 'INST',
  fallbackCampus: string = 'MAIN'
): Promise<string> {
  const instCode = institutionCode || fallbackInstitution;
  const campCode = campusCode || fallbackCampus;
  
  return generateEnrollmentNumber(instCode, campCode);
}

/**
 * Validate enrollment number format
 * @param enrollmentNumber - Enrollment number to validate
 * @returns boolean - True if valid format
 */
export function validateEnrollmentNumber(enrollmentNumber: string): boolean {
  // Expected format: INST-CAMP-YYYYMMDD-XXX
  const pattern = /^[A-Z0-9]+-[A-Z0-9]+-\d{8}-\d{3}$/;
  return pattern.test(enrollmentNumber);
}

/**
 * Parse enrollment number into components
 * @param enrollmentNumber - Enrollment number to parse
 * @returns Object with parsed components or null if invalid
 */
export function parseEnrollmentNumber(enrollmentNumber: string): {
  institutionCode: string;
  campusCode: string;
  date: string;
  sequence: string;
} | null {
  if (!validateEnrollmentNumber(enrollmentNumber)) {
    return null;
  }
  
  const parts = enrollmentNumber.split('-');
  if (parts.length !== 4) {
    return null;
  }
  
  return {
    institutionCode: parts[0]!,
    campusCode: parts[1]!,
    date: parts[2]!,
    sequence: parts[3]!
  };
}
