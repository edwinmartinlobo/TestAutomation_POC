import { Browser } from 'webdriverio';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

interface Locator {
  type: string;
  value: string;
}

interface LocatorDefinition {
  primary: Locator;
  fallbacks: Locator[];
  metadata: {
    lastVerified: string;
    healingHistory: any[];
    elementDescription: string;
  };
}

interface LocatorMap {
  [page: string]: {
    [element: string]: LocatorDefinition;
  };
}

export class BasePage {
  protected driver: Browser;
  protected locators: LocatorMap;
  protected pageName: string;
  private backendUrl: string;

  constructor(driver: Browser, pageName: string) {
    this.driver = driver;
    this.pageName = pageName;
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    // Load locators from JSON file
    const locatorsPath = path.join(__dirname, '../locators/locators.json');
    this.locators = JSON.parse(fs.readFileSync(locatorsPath, 'utf-8'));
  }

  /**
   * Find element with self-healing capability
   * Tries primary locator first, then fallbacks if primary fails
   * Reports failures to backend for AI analysis
   */
  protected async findElement(elementName: string): Promise<WebdriverIO.Element> {
    const locatorDef = this.locators[this.pageName]?.[elementName];

    if (!locatorDef) {
      throw new Error(`Locator definition not found for ${this.pageName}.${elementName}`);
    }

    // Try primary locator
    try {
      const element = await this.findByLocator(locatorDef.primary);
      console.log(`✓ Found element ${elementName} using primary locator`);
      return element;
    } catch (primaryError) {
      console.warn(`✗ Primary locator failed for ${elementName}, trying fallbacks...`);

      // Try fallback locators
      for (let i = 0; i < locatorDef.fallbacks.length; i++) {
        try {
          const element = await this.findByLocator(locatorDef.fallbacks[i]);
          console.log(`✓ Found element ${elementName} using fallback #${i + 1}`);

          // Report successful healing to backend
          await this.reportHealing(elementName, locatorDef.primary, locatorDef.fallbacks[i], 'fallback_chain');

          return element;
        } catch (fallbackError) {
          console.warn(`✗ Fallback #${i + 1} failed for ${elementName}`);
        }
      }

      // All locators failed - capture screenshot and report to backend
      const screenshot = await this.driver.takeScreenshot();
      await this.reportLocatorFailure(elementName, locatorDef, screenshot);

      throw new Error(`Could not find element ${elementName} with any locator strategy`);
    }
  }

  /**
   * Find element by locator definition
   */
  private async findByLocator(locator: Locator): Promise<WebdriverIO.Element> {
    const selector = this.buildSelector(locator);
    return await this.driver.$(selector);
  }

  /**
   * Build WebDriverIO selector from locator definition
   */
  private buildSelector(locator: Locator): string {
    switch (locator.type) {
      case 'id':
        return `id=${locator.value}`;
      case 'xpath':
        return locator.value;
      case 'accessibilityId':
        return `~${locator.value}`;
      case 'class':
        return `android.widget.${locator.value}`;
      case 'androidUIAutomator':
        return `android=${locator.value}`;
      default:
        return locator.value;
    }
  }

  /**
   * Report successful healing to backend
   */
  private async reportHealing(
    elementName: string,
    oldLocator: Locator,
    newLocator: Locator,
    strategy: string
  ): Promise<void> {
    try {
      await axios.post(`${this.backendUrl}/api/healing/report`, {
        page: this.pageName,
        element: elementName,
        oldLocator,
        newLocator,
        strategy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to report healing:', error);
    }
  }

  /**
   * Report locator failure to backend for AI analysis
   */
  private async reportLocatorFailure(
    elementName: string,
    locatorDef: LocatorDefinition,
    screenshot: string
  ): Promise<void> {
    try {
      await axios.post(`${this.backendUrl}/api/failures/locator`, {
        page: this.pageName,
        element: elementName,
        locatorDefinition: locatorDef,
        screenshot,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to report locator failure:', error);
    }
  }

  /**
   * Click element with self-healing
   */
  protected async clickElement(elementName: string): Promise<void> {
    const element = await this.findElement(elementName);
    await element.waitForDisplayed({ timeout: 10000 });
    await element.click();
  }

  /**
   * Enter text into element with self-healing
   */
  protected async enterText(elementName: string, text: string): Promise<void> {
    const element = await this.findElement(elementName);
    await element.waitForDisplayed({ timeout: 10000 });
    await element.clearValue();
    await element.setValue(text);
  }

  /**
   * Get text from element with self-healing
   */
  protected async getText(elementName: string): Promise<string> {
    const element = await this.findElement(elementName);
    await element.waitForDisplayed({ timeout: 10000 });
    return await element.getText();
  }

  /**
   * Check if element exists
   */
  protected async elementExists(elementName: string): Promise<boolean> {
    try {
      const element = await this.findElement(elementName);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to be visible
   */
  protected async waitForElement(elementName: string, timeout = 10000): Promise<void> {
    const element = await this.findElement(elementName);
    await element.waitForDisplayed({ timeout });
  }
}
