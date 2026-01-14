import { Browser } from 'webdriverio';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor(driver: Browser) {
    super(driver, 'homePage');
  }

  /**
   * Check if welcome message is displayed
   */
  async isWelcomeMessageDisplayed(): Promise<boolean> {
    return await this.elementExists('welcomeText');
  }

  /**
   * Get welcome message text
   */
  async getWelcomeText(): Promise<string> {
    return await this.getText('welcomeText');
  }

  /**
   * Click logout button
   */
  async clickLogout(): Promise<void> {
    await this.clickElement('logoutButton');
  }

  /**
   * Wait for home page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.waitForElement('welcomeText', 15000);
  }

  /**
   * Check if user is logged in (home page is visible)
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.isWelcomeMessageDisplayed();
  }
}
