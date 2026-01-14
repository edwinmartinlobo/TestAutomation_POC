import { LoginPage } from '../page-objects/LoginPage';
import { HomePage } from '../page-objects/HomePage';

describe('Login Flow Tests', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;

  beforeEach(async () => {
    // Initialize page objects
    loginPage = new LoginPage(driver);
    homePage = new HomePage(driver);

    // Wait for login page to load
    await loginPage.waitForPageLoad();
  });

  it('should login successfully with valid credentials', async () => {
    // Enter credentials
    await loginPage.enterUsername('testuser@example.com');
    await loginPage.enterPassword('SecurePassword123');

    // Click login
    await loginPage.clickLogin();

    // Verify successful login
    const isLoggedIn = await homePage.isWelcomeMessageDisplayed();
    expect(isLoggedIn).toBe(true);

    const welcomeText = await homePage.getWelcomeText();
    expect(welcomeText).toContain('Welcome');
  });

  it('should show error message with invalid credentials', async () => {
    // Enter invalid credentials
    await loginPage.enterUsername('invalid@example.com');
    await loginPage.enterPassword('WrongPassword');

    // Click login
    await loginPage.clickLogin();

    // Verify error is displayed
    const errorDisplayed = await loginPage.isErrorDisplayed();
    expect(errorDisplayed).toBe(true);

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Invalid credentials');
  });

  it('should show error with empty fields', async () => {
    // Try to login without entering credentials
    await loginPage.clickLogin();

    // Verify error is displayed
    const errorDisplayed = await loginPage.isErrorDisplayed();
    expect(errorDisplayed).toBe(true);
  });

  it('should successfully login and logout', async () => {
    // Login
    await loginPage.login('testuser@example.com', 'SecurePassword123');

    // Verify logged in
    const isLoggedIn = await homePage.isWelcomeMessageDisplayed();
    expect(isLoggedIn).toBe(true);

    // Logout
    await homePage.clickLogout();

    // Verify back on login page
    await loginPage.waitForPageLoad();
    const onLoginPage = await loginPage.isOnLoginPage();
    expect(onLoginPage).toBe(true);
  });

  afterEach(async () => {
    // Take screenshot on failure
    const testState = await driver.execute('mobile: getCurrentActivity');
    if (testState) {
      console.log('Test completed, current activity:', testState);
    }
  });
});
