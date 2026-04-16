import { describe, expect, it } from "vitest"
import { maximizeSquareCrop } from "../smart-crop"

describe("smart crop helpers", () => {
  it("keeps square crops as the full image", () => {
    expect(maximizeSquareCrop({ x: 10, y: 12, width: 20, height: 20 }, 100, 100)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })
  })

  it("maximizes a wide image crop around the detected area", () => {
    expect(maximizeSquareCrop({ x: 210, y: 0, width: 100, height: 100 }, 400, 100)).toEqual({
      x: 210,
      y: 0,
      width: 100,
      height: 100,
    })
  })

  it("clamps a tall image crop to the image bounds", () => {
    expect(maximizeSquareCrop({ x: 0, y: 360, width: 100, height: 100 }, 100, 400)).toEqual({
      x: 0,
      y: 300,
      width: 100,
      height: 100,
    })
  })
})
