import { expect, test } from "@playwright/test";

test("farmer can complete role-aware onboarding",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/launch app/i}).click();
  await expect(page.getByRole("heading",{name:/choose your agroshield login/i})).toBeVisible();
  await page.getByRole("button",{name:/login as farmer/i}).click();
  await expect(page.getByRole("heading",{name:/configure your farmer workspace/i})).toBeVisible();
  await page.getByPlaceholder("Your name or organization").fill("Demo Farmer");
  await page.getByRole("button",{name:/enter farmer dashboard/i}).click();
  await expect(page.getByText("Farmer · AgroShield")).toBeVisible();
  await expect(page.getByRole("heading",{name:/good morning/i})).toBeVisible();
  await expect(page.getByRole("button",{name:"Insurance"})).toBeVisible();
});

test("underwriter sees only the relevant workspace",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/launch app/i}).click();
  await page.getByRole("button",{name:/login as underwriter/i}).click();
  await page.getByPlaceholder("Your name or organization").fill("Demo Underwriter");
  await page.getByRole("button",{name:/enter underwriter dashboard/i}).click();
  await expect(page.getByRole("heading",{name:"Underwriter pool"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Insurance"})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Climate lab"})).toBeVisible();
});

for(const portal of [
  {role:"Verifier",heading:"Verifier workbench",allowed:"Evidence"},
  {role:"Business Buyer",heading:"Green credit marketplace",allowed:"Business"},
  {role:"Administrator",heading:"Protocol administration",allowed:"Underwriter"},
]) test(`${portal.role} has a separate login and dashboard`,async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:/launch app/i}).click();
  await page.getByRole("button",{name:new RegExp(`login as ${portal.role}`,"i")}).click();
  await page.locator("input").first().fill(`Demo ${portal.role}`);
  await page.getByRole("button",{name:new RegExp(`enter ${portal.role} dashboard`,"i")}).click();
  await expect(page.getByRole("heading",{name:portal.heading})).toBeVisible();
  await expect(page.getByRole("button",{name:portal.allowed,exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Insurance",exact:true})).toHaveCount(0);
});
