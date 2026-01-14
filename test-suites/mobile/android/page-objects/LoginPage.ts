import { Browser } from 'webdriverio';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(driver: Browser) {
    super(driver, 'loginPage');
  }

  /**
   * Enter username
   */
  async enterUsername(username: string): Promise<void> {
    await this.enterText('username', username);
  }

  /**
   * Enter password
   */
  async enterPassword(password: string): Promise<void> {
    await this.enterText('password', password);
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await this.clickElement('loginButton');
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText('errorMessage');
  }

  /**
   * Check if error message is displayed
   */
  async isErrorDisplayed(): Promise<boolean> {
    return await this.elementExists('errorMessage');
  }

  /**
   * Complete login flow
   */
  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  /**
   * Wait for login page to be loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.waitForElement('username');
    await this.waitForElement('password');
    await this.waitForElement('loginButton');
  }

  /**
   * Check if on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    return await this.elementExists('loginButton');
  }
}
