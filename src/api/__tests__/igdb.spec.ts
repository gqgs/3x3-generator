import { describe, it, expect } from "vitest"
import IGDB from "../igdb"

describe("IGDB API", () => {
  const igdb = new IGDB()

  it("should have the correct name", () => {
    expect(igdb.name).toBe("IGDB")
  })

  it("should have the correct tabs", () => {
    expect(igdb.tabs).toEqual(["game", "character"])
  })

  describe("fetchURL", () => {
    it("should return correct URL and options for game search using the proxy", () => {
      const { url, options } = igdb.fetchURL("game", "Halo")
      expect(url).toBe("https://pwh1z9812k.execute-api.us-west-2.amazonaws.com/prod/games")
      expect(options.method).toBe("POST")
      expect(options.headers).toMatchObject({
        "Accept": "application/json",
        "Content-Type": "text/plain"
      })
      expect(options.body).toBe('search "Halo"; fields name, cover.image_id; limit 40;')
    })

    it("should return correct URL and options for character search using the proxy", () => {
      const { url, options } = igdb.fetchURL("character", "Link")
      expect(url).toBe("https://pwh1z9812k.execute-api.us-west-2.amazonaws.com/prod/characters")
      expect(options.body).toBe('search "Link"; fields name, mug_shot.image_id; limit 40;')
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
      const results = igdb.processResult(mockResult as any, "game")
      expect(results).toHaveLength(1)
      expect(results[0].mal_id).toBe(123)
      expect(results[0].title).toBe("Halo: Combat Evolved")
      expect(results[0].image_url).toBe("https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1r8f.jpg")
    })

    it("should parse character results correctly", () => {
      const mockResult = [
        {
          id: 456,
          name: "Master Chief",
          mug_shot: {
            image_id: "sc6h5v"
          }
        }
      ]
      const results = igdb.processResult(mockResult as any, "character")
      expect(results).toHaveLength(1)
      expect(results[0].mal_id).toBe(456)
      expect(results[0].title).toBe("Master Chief")
      expect(results[0].image_url).toBe("https://images.igdb.com/igdb/image/upload/t_cover_big_2x/sc6h5v.jpg")
    })
  })
})
