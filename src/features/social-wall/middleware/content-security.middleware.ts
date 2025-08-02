/**
 * Content Security Middleware
 * Handles content filtering, spam detection, and security validation
 */

import { logger } from '@/server/api/utils/logger';

export interface ContentSecurityResult {
  isValid: boolean;
  violations: string[];
  filteredContent?: string;
  riskScore: number; // 0-100, higher is riskier
}

export interface SecurityConfig {
  enableProfanityFilter: boolean;
  enableSpamDetection: boolean;
  enableLinkValidation: boolean;
  maxLinkCount: number;
  maxMentionCount: number;
  minContentLength: number;
  maxContentLength: number;
}

export class ContentSecurityMiddleware {
  private config: SecurityConfig;
  private profanityWords: Set<string>;
  private spamPatterns: RegExp[];

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableProfanityFilter: true,
      enableSpamDetection: true,
      enableLinkValidation: true,
      maxLinkCount: 3,
      maxMentionCount: 10,
      minContentLength: 1,
      maxContentLength: 5000,
      ...config,
    };

    this.initializeProfanityFilter();
    this.initializeSpamDetection();
  }

  /**
   * Validate and filter content
   */
  async validateContent(content: string, contentType: 'post' | 'comment' = 'post'): Promise<ContentSecurityResult> {
    const violations: string[] = [];
    let riskScore = 0;
    let filteredContent = content;

    try {
      // Basic length validation
      if (content.length < this.config.minContentLength) {
        violations.push('Content is too short');
        riskScore += 20;
      }

      if (content.length > this.config.maxContentLength) {
        violations.push('Content exceeds maximum length');
        riskScore += 30;
      }

      // Profanity filter
      if (this.config.enableProfanityFilter) {
        const profanityResult = this.checkProfanity(content);
        if (profanityResult.hasProfanity) {
          violations.push('Content contains inappropriate language');
          riskScore += 40;
          filteredContent = profanityResult.filteredContent;
        }
      }

      // Spam detection
      if (this.config.enableSpamDetection) {
        const spamResult = this.detectSpam(content);
        if (spamResult.isSpam) {
          violations.push('Content appears to be spam');
          riskScore += spamResult.confidence;
        }
      }

      // Link validation
      if (this.config.enableLinkValidation) {
        const linkResult = this.validateLinks(content);
        if (linkResult.violations.length > 0) {
          violations.push(...linkResult.violations);
          riskScore += linkResult.riskScore;
        }
      }

      // Mention validation
      const mentionResult = this.validateMentions(content);
      if (mentionResult.violations.length > 0) {
        violations.push(...mentionResult.violations);
        riskScore += mentionResult.riskScore;
      }

      // Additional checks for posts vs comments
      if (contentType === 'post') {
        const postSpecificResult = this.validatePostSpecific(content);
        violations.push(...postSpecificResult.violations);
        riskScore += postSpecificResult.riskScore;
      }

      const isValid = violations.length === 0 && riskScore < 70; // Threshold for blocking

      return {
        isValid,
        violations,
        filteredContent: isValid ? filteredContent : undefined,
        riskScore: Math.min(100, riskScore),
      };
    } catch (error) {
      logger.error('Content validation failed', { error, content: content.substring(0, 100) });
      return {
        isValid: false,
        violations: ['Content validation error'],
        riskScore: 100,
      };
    }
  }

  /**
   * Check for profanity and filter it
   */
  private checkProfanity(content: string): { hasProfanity: boolean; filteredContent: string } {
    let hasProfanity = false;
    let filteredContent = content;

    const words = content.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.profanityWords.has(cleanWord)) {
        hasProfanity = true;
        const replacement = '*'.repeat(word.length);
        filteredContent = filteredContent.replace(new RegExp(word, 'gi'), replacement);
      }
    }

    return { hasProfanity, filteredContent };
  }

  /**
   * Detect spam patterns
   */
  private detectSpam(content: string): { isSpam: boolean; confidence: number } {
    let confidence = 0;

    // Check against spam patterns
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        confidence += 25;
      }
    }

    // Check for excessive repetition
    const words = content.split(/\s+/);
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      const count = wordCount.get(word.toLowerCase()) || 0;
      wordCount.set(word.toLowerCase(), count + 1);
    }

    const maxRepetition = Math.max(...wordCount.values());
    if (maxRepetition > words.length * 0.3) {
      confidence += 30;
    }

    // Check for excessive capitalization
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.5) {
      confidence += 20;
    }

    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?.,;:]/g) || []).length / content.length;
    if (punctuationRatio > 0.2) {
      confidence += 15;
    }

    return {
      isSpam: confidence >= 50,
      confidence: Math.min(100, confidence),
    };
  }

  /**
   * Validate links in content
   */
  private validateLinks(content: string): { violations: string[]; riskScore: number } {
    const violations: string[] = [];
    let riskScore = 0;

    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = content.match(urlRegex) || [];

    if (urls.length > this.config.maxLinkCount) {
      violations.push(`Too many links (max ${this.config.maxLinkCount})`);
      riskScore += 25;
    }

    // Check for suspicious domains
    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', // URL shorteners
      'example.com', 'test.com', // Test domains
    ];

    for (const url of urls) {
      try {
        const domain = new URL(url).hostname.toLowerCase();
        if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
          violations.push('Suspicious link detected');
          riskScore += 20;
        }
      } catch {
        violations.push('Invalid URL format');
        riskScore += 15;
      }
    }

    return { violations, riskScore };
  }

  /**
   * Validate mentions in content
   */
  private validateMentions(content: string): { violations: string[]; riskScore: number } {
    const violations: string[] = [];
    let riskScore = 0;

    // Extract mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex) || [];

    if (mentions.length > this.config.maxMentionCount) {
      violations.push(`Too many mentions (max ${this.config.maxMentionCount})`);
      riskScore += 20;
    }

    // Check for mention spam (same user mentioned multiple times)
    const mentionCount = new Map<string, number>();
    for (const mention of mentions) {
      const username = mention.toLowerCase();
      const count = mentionCount.get(username) || 0;
      mentionCount.set(username, count + 1);
    }

    const maxMentionRepetition = Math.max(...mentionCount.values());
    if (maxMentionRepetition > 3) {
      violations.push('Excessive mention repetition');
      riskScore += 15;
    }

    return { violations, riskScore };
  }

  /**
   * Post-specific validation
   */
  private validatePostSpecific(content: string): { violations: string[]; riskScore: number } {
    const violations: string[] = [];
    let riskScore = 0;

    // Check for promotional content patterns
    const promotionalPatterns = [
      /buy now/gi,
      /limited time/gi,
      /click here/gi,
      /free money/gi,
      /guaranteed/gi,
    ];

    for (const pattern of promotionalPatterns) {
      if (pattern.test(content)) {
        violations.push('Promotional content detected');
        riskScore += 10;
        break;
      }
    }

    return { violations, riskScore };
  }

  /**
   * Initialize profanity filter with common inappropriate words
   */
  private initializeProfanityFilter(): void {
    // Basic profanity list - in production, use a comprehensive filter service
    const profanityList = [
      'spam', 'scam', 'fake', 'fraud',
      // Add more words as needed
    ];

    this.profanityWords = new Set(profanityList.map(word => word.toLowerCase()));
  }

  /**
   * Initialize spam detection patterns
   */
  private initializeSpamDetection(): void {
    this.spamPatterns = [
      /(.)\1{4,}/g, // Repeated characters (aaaaa)
      /\b(free|win|winner|prize|money|cash|earn|make)\b.*\b(now|today|click|here)\b/gi,
      /\b(viagra|cialis|pharmacy|pills|medication)\b/gi,
      /\b(casino|gambling|poker|lottery|jackpot)\b/gi,
      /\b(investment|trading|crypto|bitcoin|forex)\b.*\b(guaranteed|profit|returns)\b/gi,
    ];
  }
}
