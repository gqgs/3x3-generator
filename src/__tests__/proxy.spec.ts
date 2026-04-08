import { describe, it, expect } from "vitest"
import { proxyImage } from "../proxy"

describe("proxyImage", () => {
  it("should change the host of the URL to one of the proxies", () => {
    const url = "https://example.com/image.jpg"
    const proxied = proxyImage(url)
    const parsed = new URL(proxied)
    
    const proxies = [
      "d16oqhcwx61zqh.cloudfront.net",
      "d18oynqa97z70b.cloudfront.net",
      "d1j7g7lrvvlssb.cloudfront.net",
    ]
    
    expect(proxies).toContain(parsed.host)
    expect(parsed.pathname).toBe("/image.jpg")
    expect(parsed.protocol).toBe("https:")
  })

  it("should throw error for invalid URL", () => {
    expect(() => proxyImage("not-a-url")).toThrow()
  })
})
