import { beforeEach, describe, expect, it, vi } from "vitest"
import { copyShareUrl, uploadImage } from "../share"

describe("uploadImage", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("uploads a PNG for 48 hours and returns its direct preview URL", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      files: [{ id: "abc123", url: "https://tempfile.org/abc123/" }]
    }), { status: 200, headers: { "Content-Type": "application/json" } }))

    const blob = new Blob(["image"], { type: "image/png" })
    await expect(uploadImage(blob, "3x3.png"))
      .resolves.toBe("https://tempfile.org/abc123/preview")

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe("https://tempfile.org/api/upload/local")
    expect(options?.method).toBe("POST")
    const form = options?.body as FormData
    expect(form.get("expiryHours")).toBe("48")
    expect(form.get("files")).toBeInstanceOf(Blob)
  })

  it("surfaces an upload API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: false,
      error: "Rate limit reached"
    }), { status: 429, headers: { "Content-Type": "application/json" } }))

    await expect(uploadImage(new Blob(), "3x3.png"))
      .rejects.toThrow("Rate limit reached")
  })
})

describe("copyShareUrl", () => {
  it("copies the URL with the Clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    })

    await copyShareUrl("https://tempfile.org/abc123/preview")
    expect(writeText).toHaveBeenCalledWith("https://tempfile.org/abc123/preview")
  })

  it("falls back when clipboard permission expires during the upload", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("NotAllowedError")) }
    })
    const copy = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: copy
    })

    await copyShareUrl("https://tempfile.org/abc123/preview")
    expect(copy).toHaveBeenCalledWith("copy")
  })
})
