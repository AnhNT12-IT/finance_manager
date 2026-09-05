import { test, expect } from '@playwright/test'

const hasSupabaseEnv = Boolean(
  process.env.NUXT_PUBLIC_SUPABASE_URL && process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
)

test.describe('critical auth and expense flows', () => {
  test.skip(!hasSupabaseEnv, 'Requires NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY')

  const stamp = Date.now()
  const ownerEmail = `owner.${stamp}@example.com`
  const otherEmail = `other.${stamp}@example.com`
  const password = 'TestPass123!'

  test('register, create family, expense CRUD, dashboard, logout', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Tên hiển thị').fill('Owner')
    await page.getByLabel('Email').fill(ownerEmail)
    await page.getByLabel('Mật khẩu').fill(password)
    await page.getByRole('button', { name: 'Đăng ký' }).click()

    await expect(page.getByRole('heading', { name: 'Tạo gia đình' })).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Tên gia đình').fill('My Family')
    await page.getByRole('button', { name: 'Tạo gia đình' }).click()

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 })

    await page.goto('/expenses')
    await page.getByRole('button', { name: 'Thêm chi tiêu' }).click()
    await page.getByLabel('Số tiền (VND)').fill('500000')
    await page.getByLabel('Mô tả (tuỳ chọn)').fill('Lunch test')
    await page.getByRole('button', { name: 'Lưu' }).click()

    await expect(page.getByText('Lunch test')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('500.000 ₫').first()).toBeVisible()

    await page.getByRole('button', { name: 'Sửa' }).first().click()
    await page.getByLabel('Số tiền (VND)').fill('600000')
    await page.getByRole('button', { name: 'Lưu' }).click()
    await expect(page.getByText('600.000 ₫').first()).toBeVisible({ timeout: 15000 })

    await page.getByLabel('Tìm mô tả').fill('Lunch')
    await page.getByRole('button', { name: 'Lọc' }).click()
    await expect(page.getByText('Lunch test')).toBeVisible()

    await page.getByRole('button', { name: 'Xóa' }).first().click()
    await page.getByRole('button', { name: 'Xóa' }).last().click()
    await expect(page.getByText('Chưa có khoản chi phù hợp')).toBeVisible({ timeout: 15000 })

    await page.goto('/')
    await expect(page.getByText(/Tổng chi tiêu tháng/)).toBeVisible()

    await page.getByRole('button', { name: 'Đăng xuất' }).click()
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  })

  test('cross-family isolation: other family cannot see owner expenses', async ({ page, browser }) => {
    await page.goto('/register')
    await page.getByLabel('Tên hiển thị').fill('Other')
    await page.getByLabel('Email').fill(otherEmail)
    await page.getByLabel('Mật khẩu').fill(password)
    await page.getByRole('button', { name: 'Đăng ký' }).click()
    await expect(page.getByRole('heading', { name: 'Tạo gia đình' })).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Tên gia đình').fill('Other Family')
    await page.getByRole('button', { name: 'Tạo gia đình' }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 })

    await page.goto('/expenses')
    await page.getByRole('button', { name: 'Thêm chi tiêu' }).click()
    await page.getByLabel('Số tiền (VND)').fill('999000')
    await page.getByLabel('Mô tả (tuỳ chọn)').fill('Secret other family')
    await page.getByRole('button', { name: 'Lưu' }).click()
    await expect(page.getByText('Secret other family')).toBeVisible({ timeout: 15000 })

    const ownerContext = await browser.newContext()
    const ownerPage = await ownerContext.newPage()
    await ownerPage.goto('/login')
    await ownerPage.getByLabel('Email').fill(ownerEmail)
    await ownerPage.getByLabel('Mật khẩu').fill(password)
    await ownerPage.getByRole('button', { name: 'Đăng nhập' }).click()
    await ownerPage.goto('/expenses')
    await expect(ownerPage.getByText('Secret other family')).toHaveCount(0)
    await ownerContext.close()
  })
})
