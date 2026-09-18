export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 100_000)
      return Response.json(
        { error: "Architecture is too large" },
        { status: 413 },
      );
    JSON.parse(body);
    const response = await fetch(
      process.env.PRISM_API_URL || "http://127.0.0.1:8000/simulate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      },
    );
    return Response.json(await response.json(), { status: response.status });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof SyntaxError
            ? "Invalid JSON"
            : "Simulation engine unavailable. Start the Python backend and retry.",
      },
      { status: error instanceof SyntaxError ? 400 : 503 },
    );
  }
}
