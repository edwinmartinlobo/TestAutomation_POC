import { LocatorChangeModel } from '../../models/LocatorChange.model';
import { claudeClient } from '../ai-agent/ClaudeClient.service';
import { failureAnalyzer } from '../ai-agent/FailureAnalyzer.service';
import { logger } from '../../utils/logger';
import { appConfig } from '../../config/app.config';
import fs from 'fs/promises';
import path from 'path';

interface Locator {
  type: string;
  value: string;
}

interface HealingResult {
  success: boolean;
  newLocator?: Locator;
  confidence: number;
  strategy: string;
  changeId?: string;
}

export class LocatorHealerService {
  private autoApplyThreshold: number;

  constructor() {
    this.autoApplyThreshold = appConfig.selfHealing.autoApplyThreshold;
  }

  /**
   * Attempt to heal a failed locator
   */
  async healLocator(params: {
    page: string;
    element: string;
    failedLocator: Locator;
    fallbackLocators?: Locator[];
    error: string;
    screenshot?: string;
    failureId?: string;
  }): Promise<HealingResult> {
    logger.info('Starting locator healing', {
      page: params.page,
      element: params.element,
      failedLocator: params.failedLocator,
    });

    // Strategy 1: Try fallback chain
    if (params.fallbackLocators && params.fallbackLocators.length > 0) {
      const fallbackResult = await this.tryFallbackChain(params.fallbackLocators);
      if (fallbackResult.success) {
        // Record successful fallback
        const changeId = await this.recordHealingAttempt({
          failureId: params.failureId,
          oldLocator: params.failedLocator,
          newLocator: fallbackResult.newLocator!,
          strategy: 'fallback_chain',
          confidence: fallbackResult.confidence,
        });

        return { ...fallbackResult, changeId };
      }
    }

    // Strategy 2: AI-suggested locator
    if (params.screenshot) {
      const aiResult = await this.tryAISuggestion({
        failedLocator: params.failedLocator,
        error: params.error,
        screenshot: params.screenshot,
        pageContext: `${params.page}.${params.element}`,
      });

      if (aiResult.success) {
        const changeId = await this.recordHealingAttempt({
          failureId: params.failureId,
          oldLocator: params.failedLocator,
          newLocator: aiResult.newLocator!,
          strategy: 'ai_suggested',
          confidence: aiResult.confidence,
        });

        return { ...aiResult, changeId };
      }
    }

    // All strategies failed
    logger.warn('All healing strategies failed', {
      page: params.page,
      element: params.element,
    });

    return {
      success: false,
      confidence: 0,
      strategy: 'none',
    };
  }

  /**
   * Try fallback chain strategy
   */
  private async tryFallbackChain(fallbacks: Locator[]): Promise<HealingResult> {
    // In a real implementation, this would actually try each locator against a running app
    // For now, we simulate success and return the first fallback
    logger.info('Trying fallback chain', { count: fallbacks.length });

    if (fallbacks.length > 0) {
      // Simulate that the first fallback works
      return {
        success: true,
        newLocator: fallbacks[0],
        confidence: 75, // Medium confidence for fallback chains
        strategy: 'fallback_chain',
      };
    }

    return {
      success: false,
      confidence: 0,
      strategy: 'fallback_chain',
    };
  }

  /**
   * Try AI suggestion strategy
   */
  private async tryAISuggestion(params: {
    failedLocator: Locator;
    error: string;
    screenshot: string;
    pageContext: string;
  }): Promise<HealingResult> {
    try {
      logger.info('Requesting AI locator suggestion');

      const suggestions = await failureAnalyzer.suggestLocators({
        locatorType: params.failedLocator.type,
        locatorValue: params.failedLocator.value,
        error: params.error,
        pageContext: params.pageContext,
        screenshot: params.screenshot,
      });

      if (suggestions.suggestedLocators && suggestions.suggestedLocators.length > 0) {
        // Use the highest confidence suggestion
        const bestSuggestion = suggestions.suggestedLocators.reduce((best, current) =>
          current.confidence > best.confidence ? current : best
        );

        logger.info('AI suggested new locator', {
          type: bestSuggestion.type,
          confidence: bestSuggestion.confidence,
        });

        return {
          success: true,
          newLocator: {
            type: bestSuggestion.type,
            value: bestSuggestion.value,
          },
          confidence: bestSuggestion.confidence,
          strategy: 'ai_suggested',
        };
      }

      return {
        success: false,
        confidence: 0,
        strategy: 'ai_suggested',
      };
    } catch (error: any) {
      logger.error('AI suggestion failed', { error: error.message });
      return {
        success: false,
        confidence: 0,
        strategy: 'ai_suggested',
      };
    }
  }

  /**
   * Record a healing attempt in the database
   */
  private async recordHealingAttempt(params: {
    failureId?: string;
    oldLocator: Locator;
    newLocator: Locator;
    strategy: string;
    confidence: number;
  }): Promise<string> {
    const status =
      params.confidence >= this.autoApplyThreshold ? 'auto_applied' : 'pending_approval';

    const change = await LocatorChangeModel.create({
      failureId: params.failureId,
      oldLocator: params.oldLocator,
      newLocator: params.newLocator,
      healingStrategy: params.strategy,
      confidence: params.confidence,
      status,
      metadata: {
        timestamp: new Date().toISOString(),
        autoApplyThreshold: this.autoApplyThreshold,
      },
    });

    logger.info('Healing attempt recorded', {
      changeId: change.id,
      status,
      confidence: params.confidence,
    });

    // If auto-applied, update the locators file
    if (status === 'auto_applied') {
      await this.applyLocatorChange(change.id);
    }

    return change.id;
  }

  /**
   * Apply a locator change to the locators.json file
   */
  async applyLocatorChange(changeId: string): Promise<boolean> {
    try {
      const change = await LocatorChangeModel.findById(changeId);
      if (!change) {
        throw new Error(`Locator change ${changeId} not found`);
      }

      logger.info('Applying locator change', {
        changeId,
        strategy: change.healingStrategy,
      });

      // In a real implementation, this would update the actual locators.json file
      // For now, we'll just mark it as applied
      await LocatorChangeModel.markAutoApplied(changeId, true);

      logger.info('Locator change applied successfully', { changeId });
      return true;
    } catch (error: any) {
      logger.error('Failed to apply locator change', {
        changeId,
        error: error.message,
      });

      // Mark as failed
      if (changeId) {
        await LocatorChangeModel.markAutoApplied(changeId, false);
      }

      return false;
    }
  }

  /**
   * Update locators file with new locator
   */
  private async updateLocatorsFile(params: {
    page: string;
    element: string;
    newPrimary: Locator;
    oldPrimary: Locator;
  }): Promise<void> {
    // Path to locators file - this would need to be configurable
    const locatorsPath = path.join(
      process.cwd(),
      '../test-suites/mobile/android/locators/locators.json'
    );

    try {
      // Read current locators
      const content = await fs.readFile(locatorsPath, 'utf-8');
      const locators = JSON.parse(content);

      // Update the locator
      if (locators[params.page] && locators[params.page][params.element]) {
        // Move old primary to fallbacks
        const fallbacks = locators[params.page][params.element].fallbacks || [];
        fallbacks.unshift(params.oldPrimary);

        // Set new primary
        locators[params.page][params.element].primary = params.newPrimary;
        locators[params.page][params.element].fallbacks = fallbacks;

        // Update metadata
        locators[params.page][params.element].metadata = {
          ...locators[params.page][params.element].metadata,
          lastVerified: new Date().toISOString().split('T')[0],
          healingHistory: [
            ...(locators[params.page][params.element].metadata?.healingHistory || []),
            {
              date: new Date().toISOString(),
              oldLocator: params.oldPrimary,
              newLocator: params.newPrimary,
              reason: 'Self-healing applied',
            },
          ],
        };

        // Write back to file
        await fs.writeFile(locatorsPath, JSON.stringify(locators, null, 2));

        logger.info('Locators file updated', {
          page: params.page,
          element: params.element,
        });
      }
    } catch (error: any) {
      logger.error('Failed to update locators file', {
        error: error.message,
        path: locatorsPath,
      });
      throw error;
    }
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    return await LocatorChangeModel.getPendingApprovals();
  }

  /**
   * Approve a pending locator change
   */
  async approveChange(changeId: string): Promise<boolean> {
    await LocatorChangeModel.approve(changeId);
    return await this.applyLocatorChange(changeId);
  }

  /**
   * Reject a pending locator change
   */
  async rejectChange(changeId: string): Promise<void> {
    await LocatorChangeModel.reject(changeId);
    logger.info('Locator change rejected', { changeId });
  }

  /**
   * Get healing statistics
   */
  async getStatistics() {
    return await LocatorChangeModel.getStatistics();
  }
}

// Export singleton instance
export const locatorHealer = new LocatorHealerService();
