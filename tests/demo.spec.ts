import { test, expect, type Page } from "@playwright/test";
async function nav(page: Page, label: string) {
  if (await page.getByRole("button", { name: "메뉴 열기" }).isVisible())
    await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: label, exact: true })
    .click();
}
test("profile, reservation, persistence, cancellation and user isolation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "행복하도록",
  );
  await nav(page, "우리 아이");
  await page.getByRole("button", { name: "보미 프로필 수정" }).click();
  await page.getByLabel("이름", { exact: true }).fill("콩이");
  await page.getByLabel("알아두면 좋은 점 (선택)").fill("가상 프로필 메모");
  await page.getByRole("button", { name: "프로필 저장" }).click();
  await page.reload();
  await nav(page, "우리 아이");
  await expect(page.getByRole("heading", { name: "콩이" })).toBeVisible();
  await nav(page, "서비스 찾기");
  await page.getByRole("button", { name: "산책", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "신나는 동네 한 바퀴 상세 보기" })
    .click();
  await page.getByRole("button", { name: "이 서비스 예약하기" }).click();
  await page.getByLabel("날짜", { exact: true }).fill("2099-01-01");
  await page.getByRole("button", { name: "데모 예약 확정" }).click();
  await expect(page.getByRole("status")).toContainText("완료");
  await page.reload();
  await nav(page, "예약 내역");
  await expect(page.getByRole("article")).toContainText("콩이 · 2099-01-01");
  await page.getByRole("button", { name: "예약 취소", exact: true }).click();
  await page.getByRole("button", { name: "예약 유지" }).click();
  await expect(page.getByRole("article")).toContainText("데모 예약 완료");
  await page.getByRole("button", { name: "예약 취소", exact: true }).click();
  await page.getByRole("button", { name: "취소 확정" }).click();
  await page.reload();
  await nav(page, "예약 내역");
  await expect(page.getByRole("article")).toContainText("취소 완료");
  await page.getByLabel("데모 사용자", { exact: true }).selectOption("juni");
  await expect(
    page.getByRole("heading", { name: "아직 예약한 하루가 없어요" }),
  ).toBeVisible();
  await nav(page, "우리 아이");
  await page
    .getByRole("button", { name: "프로필 등록하기", exact: true })
    .click();
  await page.getByLabel("이름", { exact: true }).fill("나비");
  await page.getByLabel("종류", { exact: true }).selectOption("고양이");
  await page.getByLabel("나이 (살)").fill("2");
  await page.getByRole("button", { name: "프로필 저장" }).click();
  await expect(
    page.getByRole("heading", { name: "나비", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/profile-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("duplicate error, keyboard dialog, empty profile and storage recovery", async ({
  page,
}) => {
  await page.goto("/");
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await nav(page, "서비스 찾기");
  await page
    .getByRole("button", { name: "예약하기", exact: true })
    .first()
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  for (let i = 0; i < 2; i++) {
    await nav(page, "서비스 찾기");
    await page
      .getByRole("button", { name: "예약하기", exact: true })
      .first()
      .click();
    await page.getByLabel("날짜", { exact: true }).fill("2099-01-02");
    await page.getByRole("button", { name: "데모 예약 확정" }).click();
  }
  await expect(page.getByRole("alert")).toContainText("같은 날짜");
  await page.keyboard.press("Escape");
  await page.getByLabel("데모 사용자", { exact: true }).selectOption("juni");
  await page
    .getByRole("button", { name: "예약하기", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("프로필이 필요해요");
  await page.keyboard.press("Escape");
  await page.evaluate(() => localStorage.setItem("pawday.demo.v1", "invalid"));
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("읽지 못했어요");
  await page.getByRole("button", { name: "저장 초기화", exact: true }).click();
  await page.getByRole("button", { name: "초기화 확정" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("keyboard focus stays in dialog and unavailable storage reports temporary mode", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Demo storage unavailable", "QuotaExceededError");
    };
  });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await nav(page, "우리 아이");
  await page.getByRole("button", { name: "보미 프로필 수정" }).click();
  await page.getByLabel("이름", { exact: true }).fill("임시 보미");
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "프로필 저장" }).click();
  await expect(page.getByRole("alert")).toContainText("이번 화면에서만 유지");
  await expect(
    page.getByRole("heading", { name: "임시 보미", exact: true }),
  ).toBeVisible();
  await page.reload();
  await nav(page, "우리 아이");
  await expect(
    page.getByRole("heading", { name: "보미", exact: true }),
  ).toBeVisible();
});
