import { describe, it, expect, vi } from "vitest"
import Anilist from "../anilist"

vi.mock("../../proxy", () => ({
  proxyImage: (url: string) => `proxied-${url}`
}))

describe("Anilist API", () => {
  const anilist = new Anilist()

  it("should have the correct name", () => {
    expect(anilist.name).toBe("Anilist")
  })

  it("should have the correct tabs", () => {
    expect(anilist.tabs).toEqual(["anime", "manga", "character"])
  })

  describe("fetchURL", () => {
    it("should return correct URL and options for anime", () => {
      const { url, options } = anilist.fetchURL("anime", "Cowboy Bebop")
      expect(url).toBe("https://graphql.anilist.co")
      expect(options.method).toBe("POST")
      const body = JSON.parse(options.body as string)
      expect(body.variables.search).toBe("Cowboy Bebop")
      expect(body.variables.type).toBe("ANIME")
    })

    it("should return correct URL and options for character", () => {
      const { url, options } = anilist.fetchURL("character", "Spike")
      expect(url).toBe("https://graphql.anilist.co")
      const body = JSON.parse(options.body as string)
      expect(body.variables.search).toBe("Spike")
      expect(body.variables.type).toBe("CHARACTER")
    })
  })

  describe("processResult", () => {
    it("should parse media results correctly", () => {
      const mockResult = {
        data: {
          Page: {
            media: [
              {
                id: 1,
                title: { romaji: "Cowboy Bebop" },
                coverImage: { extraLarge: "https://example.com/image.jpg" }
              }
            ],
            characters: []
          }
        }
      }
      const results = anilist.processResult(mockResult as any, "anime")
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        mal_id: 1,
        title: "Cowboy Bebop",
        image_url: "proxied-https://example.com/image.jpg"
      })
    })

    it("should parse character results correctly", () => {
      const mockResult = {
        data: {
          Page: {
            media: [],
            characters: [
              {
                id: 10,
                name: { full: "Spike Spiegel" },
                image: { large: "https://example.com/spike.jpg" }
              }
            ]
          }
        }
      }
      const results = anilist.processResult(mockResult as any, "character")
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        mal_id: 10,
        title: "Spike Spiegel",
        image_url: "proxied-https://example.com/spike.jpg"
      })
    })

    it("should return empty array if no data", () => {
        const results = anilist.processResult({ data: { Page: { media: [], characters: [] } } } as any, "anime")
        expect(results).toEqual([])
    })
  })
})
