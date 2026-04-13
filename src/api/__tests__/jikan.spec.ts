import { describe, it, expect } from "vitest"
import Jikan from "../jikan"

describe("Jikan API", () => {
  const jikan = new Jikan()

  it("should have the correct name", () => {
    expect(jikan.name).toBe("Jikan")
  })

  it("should have the correct tabs", () => {
    expect(jikan.tabs).toEqual(["anime", "manga", "character"])
  })

  describe("fetchURL", () => {
    it("should return correct URL for anime", () => {
      const { url } = jikan.fetchURL("anime", "Naruto")
      expect(url).toContain("https://api.jikan.moe/v4/anime")
      expect(url).toContain("q=Naruto")
    })

    it("should denormalize character tab", () => {
      const { url } = jikan.fetchURL("character", "Luffy")
      expect(url).toContain("https://api.jikan.moe/v4/characters")
    })
  })

  describe("processResult", () => {
    it("should parse anime results correctly", () => {
      const mockResult = {
        data: [
          {
            mal_id: 1,
            title: "Naruto",
            images: {
              jpg: {
                large_image_url: "https://example.com/large.jpg",
                image_url: "https://example.com/small.jpg"
              }
            }
          }
        ]
      }
      const results = jikan.processResult(mockResult as any)
      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        mal_id: 1,
        title: "Naruto"
      })
      expect(results[0].image_url).toMatch(/^https:\/\/d(16oqhcwx61zqh|18oynqa97z70b|1j7g7lrvvlssb)\.cloudfront\.net\/large\.jpg$/)
    })

    it("should use name for characters", () => {
        const mockResult = {
          data: [
            {
              mal_id: 2,
              name: "Monkey D. Luffy",
              images: {
                jpg: {
                  image_url: "https://example.com/luffy.jpg"
                }
              }
            }
          ]
        }
        const results = jikan.processResult(mockResult as any)
        expect(results[0].title).toBe("Monkey D. Luffy")
      })
  })

  describe("showMoreURL", () => {
    it("should return correct pictures URL", () => {
      const { url } = jikan.showMoreURL({ tab: "anime", selected: { mal_id: 1, title: "Test", image_url: "" } })
      expect(url).toBe("https://api.jikan.moe/v4/anime/1/pictures")
    })
  })
})
