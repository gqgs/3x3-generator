import { describe, expect, it } from "vitest"
import { wrapCaptionLines } from "../captions"

const fixedMeasure = (text: string) => text.length * 10

describe("caption layout", () => {
  it("returns no lines for empty titles", () => {
    expect(wrapCaptionLines("", 100, fixedMeasure)).toEqual([])
    expect(wrapCaptionLines(undefined, 100, fixedMeasure)).toEqual([])
  })

  it("keeps short titles on one line", () => {
    expect(wrapCaptionLines("Kind of Blue", 120, fixedMeasure)).toEqual(["Kind of Blue"])
  })

  it("wraps long titles to two lines", () => {
    expect(wrapCaptionLines("The Shape of Jazz to Come", 120, fixedMeasure)).toEqual([
      "The Shape of",
      "Jazz to Come"
    ])
  })

  it("ellipsizes overflow on the final line", () => {
    expect(wrapCaptionLines("This title has far too many words for the caption", 110, fixedMeasure)).toEqual([
      "This title",
      "has far..."
    ])
  })

  it("ellipsizes a single long word", () => {
    expect(wrapCaptionLines("Supercalifragilistic", 80, fixedMeasure)).toEqual(["Super..."])
  })

  it("ellipsizes a long word after a wrapped first line", () => {
    expect(wrapCaptionLines("Blue Supercalifragilistic", 80, fixedMeasure)).toEqual([
      "Blue",
      "Super..."
    ])
  })
})
