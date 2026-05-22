import { test, expect } from '@playwright/test';

// A unique suffix so repeated runs don't clash on usernames
const RUN_ID = Date.now();

test.describe('Registration', () => {
  test('a new user can register and is redirected to the dashboard', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Username').fill(`testuser_${RUN_ID}`);
    await page.getByLabel('Password').first().fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
  });

  test('registration fails when passwords do not match', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Username').fill(`testuser_${RUN_ID}_b`);
    await page.getByLabel('Password').first().fill('securepassword123');
    await page.getByLabel('Confirm password').fill('differentpassword');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.locator('.error')).toContainText('Passwords do not match');
    await expect(page).toHaveURL('/register');
  });

  test('registration fails when username is too short', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Username').fill('ab');
    await page.getByLabel('Password').first().fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.locator('.error')).toContainText('at least 3 characters');
    await expect(page).toHaveURL('/register');
  });

  test('registration fails when username is already taken', async ({ page }) => {
    const username = `taken_${RUN_ID}`;

    // First registration — should succeed
    await page.goto('/register');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').first().fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/dashboard');

    // Log out so we can attempt registration again
    await page.request.post('/logout');
    await page.goto('/register');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').first().fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.locator('.error')).toContainText('already taken');
    await expect(page).toHaveURL('/register');
  });

  test('a logged-in user visiting /register is redirected to the dashboard', async ({ page }) => {
    // Register and land on dashboard
    await page.goto('/register');
    await page.getByLabel('Username').fill(`testuser_${RUN_ID}_c`);
    await page.getByLabel('Password').first().fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/dashboard');

    // Now try to visit /register again
    await page.goto('/register');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Login', () => {
  // Create a shared user once before these tests run
  const LOGIN_USER = `loginuser_${RUN_ID}`;
  const LOGIN_PASS = 'securepassword123';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/register');
    await page.getByLabel('Username').fill(LOGIN_USER);
    await page.getByLabel('Password').first().fill(LOGIN_PASS);
    await page.getByLabel('Confirm password').fill(LOGIN_PASS);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/dashboard');
    await page.close();
  });

  test('a registered user can log in and is redirected to the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(LOGIN_USER);
    await page.getByLabel('Password').fill(LOGIN_PASS);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
  });

  test('login fails with wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(LOGIN_USER);
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.locator('.error')).toContainText('Invalid username or password');
    await expect(page).toHaveURL('/login');
  });

  test('login fails with a non-existent username', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('nobody_at_all');
    await page.getByLabel('Password').fill('somepassword123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.locator('.error')).toContainText('Invalid username or password');
    await expect(page).toHaveURL('/login');
  });

  test('a logged-in user visiting /login is redirected to the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(LOGIN_USER);
    await page.getByLabel('Password').fill(LOGIN_PASS);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL('/dashboard');

    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Logout', () => {
  test('a logged-in user can log out and is redirected to the home page', async ({ page }) => {
    // Register a fresh user
    await page.goto('/register');
    await page.getByLabel('Username').fill(`logoutuser_${RUN_ID}`);
    await page.getByLabel('Password').first().fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/dashboard');

    // Log out via the POST endpoint
    await page.request.post('/logout');
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Confirm session is gone — dashboard should now redirect away
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL('/dashboard');
  });
});
