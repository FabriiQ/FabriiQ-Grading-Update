/**
 * Content Moderation Utilities
 * Provides content filtering and moderation capabilities for social wall
 */

import moderationConfig from '@/config/content-moderation.json';

export interface ModerationResult {
  isAllowed: boolean;
  blockedWords: string[];
  severity: 'low' | 'medium' | 'high';
  reason?: string;
  suggestedAction: 'allow' | 'warn' | 'block' | 'review';
  confidence: number; // 0-1 confidence score
  categories: string[]; // Categories of violations (profanity, harassment, etc.)
  cleanedText?: string; // Auto-cleaned version if applicable
  metadata?: {
    wordPositions: Array<{ word: string; start: number; end: number }>;
    contextAnalysis?: string;
    riskScore: number;
  };
}

export interface ModerationConfig {
  bannedWords: string[];
  blockedSubstrings: string[];
  allowedExceptions: string[];
  moderationSettings: {
    caseSensitive: boolean;
    checkSubstrings: boolean;
    allowPartialMatches: boolean;
    maxWarnings: number;
    autoModerate: boolean;
    enableContextAnalysis: boolean;
    enableSpamDetection: boolean;
    enableToxicityDetection: boolean;
  };
  severityLevels: {
    high: string[];
    medium: string[];
    low: string[];
  };
  categories: {
    profanity: string[];
    harassment: string[];
    spam: string[];
    inappropriate: string[];
    violence: string[];
    drugs: string[];
    sexual: string[];
  };
}

class ContentModerator {
  private config: ModerationConfig;

  constructor() {
    this.config = moderationConfig as ModerationConfig;
  }

  /**
   * Moderate text content for banned words and inappropriate content
   */
  moderateText(text: string): ModerationResult {
    if (!text || typeof text !== 'string') {
      return {
        isAllowed: true,
        blockedWords: [],
        severity: 'low',
        suggestedAction: 'allow',
        confidence: 1.0,
        categories: []
      };
    }

    const normalizedText = this.config.moderationSettings.caseSensitive
      ? text
      : text.toLowerCase();

    const blockedWords: string[] = [];
    const categories: string[] = [];
    const wordPositions: Array<{ word: string; start: number; end: number }> = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let riskScore = 0;

    // Check banned words with category detection
    for (const word of this.config.bannedWords) {
      const normalizedWord = this.config.moderationSettings.caseSensitive
        ? word
        : word.toLowerCase();

      if (this.containsWord(normalizedText, normalizedWord)) {
        // Only add word if it's not already in the blockedWords array (prevent duplicates)
        if (!blockedWords.includes(word)) {
          blockedWords.push(word);
        }

        const wordSeverity = this.getSeverity(word);
        const wordCategory = this.getWordCategory(word);

        if (wordCategory && !categories.includes(wordCategory)) {
          categories.push(wordCategory);
        }

        // Update severity to highest found
        if (wordSeverity === 'high' || (wordSeverity === 'medium' && severity === 'low')) {
          severity = wordSeverity;
        }

        // Find word positions for metadata
        const regex = new RegExp(`\\b${this.escapeRegExp(word)}\\b`, 'gi');
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          wordPositions.push({
            word: word,
            start: match.index,
            end: match.index + word.length
          });
        }

        // Calculate risk score (only add once per unique word)
        if (blockedWords.filter(w => w === word).length === 1) {
          riskScore += this.getWordRiskScore(word);
        }
      }
    }

    // Check blocked substrings if enabled
    if (this.config.moderationSettings.checkSubstrings) {
      for (const substring of this.config.blockedSubstrings) {
        const normalizedSubstring = this.config.moderationSettings.caseSensitive
          ? substring
          : substring.toLowerCase();

        if (normalizedText.includes(normalizedSubstring)) {
          // Check if it's an allowed exception
          const isException = this.config.allowedExceptions.some(exception => {
            const normalizedText = this.config.moderationSettings.caseSensitive
              ? text
              : text.toLowerCase();
            const normalizedException = this.config.moderationSettings.caseSensitive
              ? exception
              : exception.toLowerCase();
            return normalizedText.includes(normalizedException);
          });

          if (!isException) {
            blockedWords.push(substring);
            const substringCategory = this.getWordCategory(substring);
            if (substringCategory && !categories.includes(substringCategory)) {
              categories.push(substringCategory);
            }
            riskScore += 0.3; // Lower risk for substring matches
          }
        }
      }
    }

    // Advanced analysis
    const contextAnalysis = this.analyzeContext(text, blockedWords);
    const spamScore = this.detectSpam(text);
    const toxicityScore = this.detectToxicity(text);

    // Adjust risk score based on additional factors
    riskScore += spamScore + toxicityScore;

    // Calculate confidence based on various factors
    const confidence = this.calculateConfidence(blockedWords.length, riskScore, text.length);

    const isAllowed = blockedWords.length === 0 && riskScore < 0.5;
    const suggestedAction = this.getSuggestedAction(severity, blockedWords.length, riskScore);

    return {
      isAllowed,
      blockedWords,
      severity,
      reason: blockedWords.length > 0 ? `Content contains inappropriate language: ${blockedWords.join(', ')}` : undefined,
      suggestedAction,
      confidence,
      categories,
      cleanedText: this.cleanText(text),
      metadata: {
        wordPositions,
        contextAnalysis,
        riskScore: Math.min(riskScore, 1.0)
      }
    };
  }

  /**
   * Check if text contains a specific word (whole word matching)
   */
  private containsWord(text: string, word: string): boolean {
    if (this.config.moderationSettings.allowPartialMatches) {
      return text.includes(word);
    }

    // Use word boundaries for exact word matching
    const regex = new RegExp(`\\b${this.escapeRegExp(word)}\\b`, 'gi');
    return regex.test(text);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Determine severity based on the word
   */
  private getSeverity(word: string): 'low' | 'medium' | 'high' {
    // This is a simplified severity assessment
    // In a real implementation, you might have different severity levels for different words
    const highSeverityWords = ['placeholder1']; // Add actual high severity words
    const mediumSeverityWords = ['placeholder2']; // Add actual medium severity words

    if (highSeverityWords.includes(word.toLowerCase())) {
      return 'high';
    } else if (mediumSeverityWords.includes(word.toLowerCase())) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get suggested action based on severity, violations, and risk score
   */
  private getSuggestedAction(severity: 'low' | 'medium' | 'high', violationCount: number, riskScore: number = 0): 'allow' | 'warn' | 'block' | 'review' {
    if (violationCount === 0 && riskScore < 0.3) return 'allow';

    if (severity === 'high' || violationCount >= 3 || riskScore >= 0.8) {
      return 'block';
    } else if (severity === 'medium' || violationCount >= 2 || riskScore >= 0.5) {
      return 'review';
    } else {
      return 'warn';
    }
  }

  /**
   * Get the category of a word based on predefined categories
   */
  private getWordCategory(word: string): string | null {
    const normalizedWord = word.toLowerCase();

    // Check if config has categories defined
    if (this.config.categories) {
      for (const [category, words] of Object.entries(this.config.categories)) {
        if (words.some(w => w.toLowerCase() === normalizedWord)) {
          return category;
        }
      }
    }

    // Fallback categorization based on word patterns
    const profanityPatterns = ['fuck', 'shit', 'bitch', 'damn', 'hell', 'ass'];
    const harassmentPatterns = ['idiot', 'moron', 'loser', 'ugly', 'stupid'];
    const violencePatterns = ['kill', 'murder', 'bomb', 'gun'];
    const sexualPatterns = ['sex', 'porn', 'anal', 'oral'];
    const drugPatterns = ['weed', 'meth', 'cocaine', 'heroin'];

    if (profanityPatterns.some(p => normalizedWord.includes(p))) return 'profanity';
    if (harassmentPatterns.some(p => normalizedWord.includes(p))) return 'harassment';
    if (violencePatterns.some(p => normalizedWord.includes(p))) return 'violence';
    if (sexualPatterns.some(p => normalizedWord.includes(p))) return 'sexual';
    if (drugPatterns.some(p => normalizedWord.includes(p))) return 'drugs';

    return 'inappropriate';
  }

  /**
   * Calculate risk score for a specific word
   */
  private getWordRiskScore(word: string): number {
    const normalizedWord = word.toLowerCase();

    // High risk words
    const highRiskWords = ['kill', 'murder', 'rape', 'bomb', 'gun', 'nigger', 'faggot'];
    if (highRiskWords.includes(normalizedWord)) return 1.0;

    // Medium risk words
    const mediumRiskWords = ['fuck', 'shit', 'bitch', 'cunt', 'motherfucker'];
    if (mediumRiskWords.includes(normalizedWord)) return 0.7;

    // Low risk words
    const lowRiskWords = ['damn', 'hell', 'idiot', 'stupid'];
    if (lowRiskWords.includes(normalizedWord)) return 0.3;

    return 0.5; // Default risk for other banned words
  }

  /**
   * Analyze context around blocked words
   */
  private analyzeContext(text: string, blockedWords: string[]): string {
    if (blockedWords.length === 0) return 'No violations detected';

    const sentences = text.split(/[.!?]+/);
    const violationSentences = sentences.filter(sentence =>
      blockedWords.some(word => sentence.toLowerCase().includes(word.toLowerCase()))
    );

    if (violationSentences.length > 1) {
      return 'Multiple violations across sentences - potential pattern of inappropriate behavior';
    } else if (violationSentences.length === 1) {
      return 'Single violation detected - may be isolated incident';
    }

    return 'Context analysis inconclusive';
  }

  /**
   * Detect spam patterns in text
   */
  private detectSpam(text: string): number {
    let spamScore = 0;

    // Check for excessive repetition
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxRepetition = Math.max(...Object.values(wordCounts));
    if (maxRepetition > 3) spamScore += 0.3;

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5) spamScore += 0.2;

    // Check for excessive punctuation
    const punctRatio = (text.match(/[!?.,;:]/g) || []).length / text.length;
    if (punctRatio > 0.3) spamScore += 0.2;

    // Check for URL patterns (basic)
    if (/https?:\/\/|www\./i.test(text)) spamScore += 0.1;

    return Math.min(spamScore, 1.0);
  }

  /**
   * Detect toxicity patterns in text
   */
  private detectToxicity(text: string): number {
    let toxicityScore = 0;
    const normalizedText = text.toLowerCase();

    // Check for personal attacks
    const attackPatterns = ['you are', 'you\'re', 'ur such', 'you suck'];
    if (attackPatterns.some(pattern => normalizedText.includes(pattern))) {
      toxicityScore += 0.4;
    }

    // Check for threatening language
    const threatPatterns = ['i will', 'gonna get', 'watch out', 'you better'];
    if (threatPatterns.some(pattern => normalizedText.includes(pattern))) {
      toxicityScore += 0.5;
    }

    // Check for discriminatory language patterns
    const discriminatoryPatterns = ['all [group] are', 'typical [group]', '[group] people'];
    // This is a simplified check - in production, you'd want more sophisticated NLP

    return Math.min(toxicityScore, 1.0);
  }

  /**
   * Calculate confidence score for moderation decision
   */
  private calculateConfidence(violationCount: number, riskScore: number, textLength: number): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence with more violations
    confidence += violationCount * 0.2;

    // Higher confidence with higher risk score
    confidence += riskScore * 0.3;

    // Lower confidence for very short texts (might be false positives)
    if (textLength < 10) confidence -= 0.2;

    // Higher confidence for longer texts with violations
    if (textLength > 50 && violationCount > 0) confidence += 0.1;

    return Math.max(0.1, Math.min(confidence, 1.0));
  }

  /**
   * Clean text by replacing banned words with asterisks
   */
  cleanText(text: string): string {
    let cleanedText = text;
    const normalizedText = this.config.moderationSettings.caseSensitive 
      ? text 
      : text.toLowerCase();

    // Replace banned words
    for (const word of this.config.bannedWords) {
      const normalizedWord = this.config.moderationSettings.caseSensitive 
        ? word 
        : word.toLowerCase();

      if (this.containsWord(normalizedText, normalizedWord)) {
        const replacement = '*'.repeat(word.length);
        const regex = new RegExp(`\\b${this.escapeRegExp(word)}\\b`, 'gi');
        cleanedText = cleanedText.replace(regex, replacement);
      }
    }

    return cleanedText;
  }

  /**
   * Update moderation configuration
   */
  updateConfig(newConfig: Partial<ModerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const contentModerator = new ContentModerator();

// Export utility functions
export const moderateText = (text: string): ModerationResult => {
  return contentModerator.moderateText(text);
};

export const cleanText = (text: string): string => {
  return contentModerator.cleanText(text);
};

export const isTextAllowed = (text: string): boolean => {
  return contentModerator.moderateText(text).isAllowed;
};
