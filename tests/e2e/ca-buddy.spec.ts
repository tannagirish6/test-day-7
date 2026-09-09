import { expect, test, type Page } from '@playwright/test';

type GeminiRequest = {
  contents?: Array<{
    role?: string;
    parts?: Array<{ text?: string }>;
  }>;
  systemInstruction?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiStub = {
  requests: GeminiRequest[];
  releaseSlow: () => void;
  slowCompleted: Promise<void>;
};

async function installGeminiStub(page: Page): Promise<GeminiStub> {
  const requests: GeminiRequest[] = [];
  let releaseSlow!: () => void;
  let completeSlow!: () => void;
  const slowGate = new Promise<void>((resolve) => {
    releaseSlow = resolve;
  });
  const slowCompleted = new Promise<void>((resolve) => {
    completeSlow = resolve;
  });

  await page.route('**/generativelanguage.googleapis.com/**', async (route) => {
    const request = route.request();
    const body = JSON.parse(request.postData() ?? '{}') as GeminiRequest;
    requests.push(body);

    const contents = body.contents ?? [];
    const latestQuestion = contents.at(-1)?.parts?.map((part) => part.text ?? '').join('') ?? '';
    const isSlow = latestQuestion.includes('slow test');

    if (isSlow) {
      await slowGate;
    } else if (requests.length === 1) {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    let answer = 'For many monthly GST filers, the return is due by the 20th of the following month. Verify the current rule for your filing period.';
    if (/does that apply|follow-up/i.test(latestQuestion)) {
      answer = 'That depends on the filing frequency and facts from your first question.';
    } else if (/outside|personal|file my return|pet|stock tip/i.test(latestQuestion)) {
      answer = 'This is outside CA Buddy\'s safe scope. Please consult a Chartered Accountant for personal advice.';
    } else if (/tds/i.test(latestQuestion)) {
      answer = 'TDS deadlines depend on the deduction and period. Check the current official calendar.';
    } else if (isSlow) {
      answer = 'This delayed answer must not appear after reset.';
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            content: { parts: [{ text: answer }], role: 'model' },
            finishReason: 'STOP',
            index: 0,
          },
        ],
      }),
    });

    if (isSlow) {
      completeSlow();
    }
  });

  return { requests, releaseSlow, slowCompleted };
}

test.describe('CA Buddy browser acceptance', () => {
  test('completes the first answer, contextual follow-up, safety fallback, and reset flow', async ({
    page,
  }) => {
    const stub = await installGeminiStub(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'CA Buddy' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Conversation' })).toBeVisible();
    await expect(page.getByText(/general information, not professional advice/i)).toBeVisible();

    const input = page.getByRole('textbox', { name: 'Ask a question' });
    await input.fill('When is my GST return due?');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByRole('status')).toHaveText(/preparing/i);
    await expect(page.getByText(/monthly GST filers/i)).toBeVisible();

    await input.fill('Does that apply to a small shop?');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText(/depends on the filing frequency/i)).toBeVisible();

    expect(stub.requests).toHaveLength(2);
    expect(JSON.stringify(stub.requests[1].contents)).toContain('When is my GST return due?');
    expect(JSON.stringify(stub.requests[1].systemInstruction)).toContain('Chartered Accountant');

    await input.fill('Can you file my personal return for me?');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText(/outside CA Buddy.*consult a Chartered Accountant/i)).toBeVisible();
    await expect(page.getByText(/general information, not professional advice/i)).toBeVisible();

    await page.getByRole('button', { name: /new chat/i }).click();
    await expect(page.getByText('When is my GST return due?')).toHaveCount(0);
    await expect(page.getByText(/ask about GST, TDS, ITR deadlines/i)).toBeVisible();

    await input.fill('What is TDS?');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText(/TDS deadlines depend/i)).toBeVisible();
    expect(JSON.stringify(stub.requests.at(-1)?.contents)).not.toContain('When is my GST return due?');
  });

  test('ignores empty input and does not restore turns after reload', async ({ page }) => {
    const stub = await installGeminiStub(page);
    await page.goto('/');

    const input = page.getByRole('textbox', { name: 'Ask a question' });
    const send = page.getByRole('button', { name: /send/i });
    await input.fill('   ');
    await expect(send).toBeDisabled();
    expect(stub.requests).toHaveLength(0);

    await input.fill('What is an audit?');
    await send.click();
    await expect(page.getByText(/monthly GST filers/i)).toBeVisible();
    await page.reload();

    await expect(page.getByText('What is an audit?')).toHaveCount(0);
    await expect(page.getByText(/ask about GST, TDS, ITR deadlines/i)).toBeVisible();
  });

  test('does not render a pending answer after New chat', async ({ page }) => {
    const stub = await installGeminiStub(page);
    await page.goto('/');

    const input = page.getByRole('textbox', { name: 'Ask a question' });
    await input.fill('slow test question');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByRole('status')).toHaveText(/preparing/i);

    await page.getByRole('button', { name: /new chat/i }).click();
    await expect(page.getByText(/ask about GST, TDS, ITR deadlines/i)).toBeVisible();
    stub.releaseSlow();
    await stub.slowCompleted;

    await expect(page.getByText('This delayed answer must not appear after reset.')).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveCount(0);
  });
});
