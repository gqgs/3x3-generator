import { describe, expect, it } from "vitest"
import MyAnimeList from "../myanimelist"

describe("MyAnimeList API", () => {
  const api = new MyAnimeList("http://127.0.0.1:8081/")

  it("has the expected name and tabs", () => {
    expect(api.name).toBe("MAL")
    expect(api.tabs).toEqual(["anime", "manga", "character"])
  })

  it("builds the type-specific search URL and escapes the query", () => {
    expect(api.fetchURL("anime", "Fullmetal Alchemist & more").url)
      .toBe("http://127.0.0.1:8081/search/anime?q=Fullmetal%20Alchemist%20%26%20more")
  })

  it("parses search results", () => {
    const results = api.processResult([{
      id: 5114,
      type: "anime",
      name: "Fullmetal Alchemist: Brotherhood",
      image_url: "https://cdn.myanimelist.net/images/anime/1208/94745.jpg"
    }])

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      mal_id: 5114,
      title: "Fullmetal Alchemist: Brotherhood"
    })
    expect(results[0].image_url)
      .toMatch(/^https:\/\/d(16oqhcwx61zqh|18oynqa97z70b|1j7g7lrvvlssb)\.cloudfront\.net\/images\/anime\/1208\/94745\.jpg$/)
  })

  it("only offers additional pictures for characters", () => {
    expect(api.supportsShowMore("anime")).toBe(false)
    expect(api.supportsShowMore("manga")).toBe(false)
    expect(api.supportsShowMore("character")).toBe(true)
  })

  it("builds the character pictures URL", () => {
    const selected = { mal_id: 17, title: "Naruto Uzumaki", image_url: "" }
    expect(api.showMoreURL({ tab: "character", selected }).url)
      .toBe("http://127.0.0.1:8081/character/17/images")
  })

  it("parses character pictures", () => {
    const selected = { mal_id: 17, title: "Naruto Uzumaki", image_url: "" }
    const results = api.processShowMoreResult({
      selected,
      result: {
        character_id: 17,
        images: [
          "https://cdn.myanimelist.net/images/characters/12/61330.jpg",
          "https://cdn.myanimelist.net/images/characters/16/101039.jpg"
        ]
      }
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      mal_id: 17000,
      title: "Naruto Uzumaki"
    })
  })
})
