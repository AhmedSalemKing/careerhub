export class NextRequest {}
export class NextResponse {
  static json(body: unknown, init?: { status?: number }) {
    return { body, status: init?.status ?? 200 }
  }
}
