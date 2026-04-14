import { describe, it, expect } from "vitest"
import IGDB from "../igdb"

describe("IGDB API", () => {
  const igdb = new IGDB()

  it("should have the correct name", () => {
    expect(igdb.name).toBe("IGDB")
  })

  it("should have the correct tabs", () => {
    expect(igdb.tabs).toEqual(["game"])
  })

  describe("fetchURL", () => {
    it("should return correct URL and options for game search using the proxy", () => {
      const { url, options } = igdb.fetchURL("game", "Halo")
      expect(url).toBe("https://5l145ak96e.execute-api.sa-east-1.amazonaws.com/prod/games")
      expect(options.method).toBe("POST")
      expect(options.headers).toMatchObject({
        "Accept": "application/json",
        "Content-Type": "text/plain"
      })
      expect(options.body).toBe('search "Halo"; fields name, cover.image_id; limit 40;')
    })
  })

  describe("processResult", () => {
    it("should parse game results correctly", () => {
      const mockResult = [
        {
          id: 123,
          name: "Halo: Combat Evolved",
          cover: {
            image_id: "co1r8f"
          }
        }
      ]
      const results = igdb.processResult(mockResult as any)
      expect(results).toHaveLength(1)
      expect(results[0].mal_id).toBe(123)
      expect(results[0].title).toBe("Halo: Combat Evolved")
      expect(results[0].image_url).toBe("https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8f.jpg")
    })
  })
})
