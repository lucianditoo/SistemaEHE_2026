import { NextRequest, NextResponse } from "next/server";
import { Browser, chromium } from "playwright";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LaunchAttempt = {
  label: string;
  launch: () => Promise<Browser>;
};

async function launchBrowser(): Promise<Browser> {
  const attempts: LaunchAttempt[] = [
    {
      label: "Playwright Chromium",
      launch: () => chromium.launch({ headless: true })
    },
    {
      label: "Microsoft Edge instalado",
      launch: () => chromium.launch({ channel: "msedge", headless: true })
    },
    {
      label: "Google Chrome instalado",
      launch: () => chromium.launch({ channel: "chrome", headless: true })
    }
  ];

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      return await attempt.launch();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(attempt.label + ": " + detail);
    }
  }

  throw new Error(
    "No se pudo abrir un navegador para generar el PDF. Ejecuta instalar-pdf.ps1 o pnpm exec playwright install chromium.\n" +
      errors.join("\n")
  );
}

export async function GET(request: NextRequest) {
  const targetUrl = new URL("/planillas/print", request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1403, height: 992 } });
    await page.goto(targetUrl.toString(), { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });

    const pdfBytes = Uint8Array.from(pdf);

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=planillas-ehe.pdf"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido al generar el PDF.";
    console.error(message);

    return NextResponse.json(
      {
        error: "No se pudo generar el PDF.",
        detail: message
      },
      { status: 500 }
    );
  } finally {
    await browser?.close();
  }
}
