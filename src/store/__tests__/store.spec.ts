import { describe, it, expect, beforeEach } from "vitest"
import store from "../index"

describe("Vuex Store", () => {
  beforeEach(() => {
    localStorage.clear()
    store.commit("updateSize", 3)
    store.commit("setShowSearch", false)
    store.commit("setSelectedID", 0)
    store.commit("updateColor", "#ffffff")
    store.commit("updateAlpha", 50)
    // Clear images
    Object.keys(store.state.images).forEach(id => {
        delete store.state.images[id]
    })
  })

  it("should have initial state", () => {
    expect(store.state.size).toBe(3)
    expect(store.state.show_search).toBe(false)
    expect(store.state.color).toBe("#ffffff")
    expect(store.state.alpha).toBe(50)
  })

  describe("mutations", () => {
    it("setShowSearch updates show_search", () => {
      store.commit("setShowSearch", true)
      expect(store.state.show_search).toBe(true)
    })

    it("updateSize updates size and removes out of bounds images", () => {
      // Mock some images
      store.state.images["1"] = { bitmap: {} as ImageBitmap, url: "url1" }
      store.state.images["9"] = { bitmap: {} as ImageBitmap, url: "url9" }
      store.state.images["16"] = { bitmap: {} as ImageBitmap, url: "url16" }
      
      store.commit("updateSize", 3) // size 3*3 = 9
      expect(store.state.size).toBe(3)
      expect(store.state.images["1"]).toBeDefined()
      expect(store.state.images["9"]).toBeDefined()
      expect(store.state.images["16"]).toBeUndefined()
    })

    it("moveImage swaps images if both exist", () => {
        const img1 = { bitmap: {} as ImageBitmap, url: "url1" }
        const img2 = { bitmap: {} as ImageBitmap, url: "url2" }
        store.state.images["1"] = img1
        store.state.images["2"] = img2
        
        store.commit("moveImage", { fromId: "1", toId: "2" })
        
        expect(store.state.images["1"]).toEqual(img2)
        expect(store.state.images["2"]).toEqual(img1)
    })

    it("moveImage moves image if destination is empty", () => {
        const img1 = { bitmap: {} as ImageBitmap, url: "url1" }
        store.state.images["1"] = img1
        
        store.commit("moveImage", { fromId: "1", toId: "3" })
        
        expect(store.state.images["1"]).toBeUndefined()
        expect(store.state.images["3"]).toEqual(img1)
    })

    it("updateAlpha updates alpha and localStorage", () => {
        store.commit("updateAlpha", 25)
        expect(store.state.alpha).toBe(25)
        expect(localStorage.getItem("alpha")).toBe("25")
    })

    it("setUpscaleModel updates upscaleModel and localStorage", () => {
        store.commit("setUpscaleModel", "6B")
        expect(store.state.upscaleModel).toBe("6B")
        expect(localStorage.getItem("upscaleModel")).toBe("6B")
    })

    it("setWorkerCount updates workerCount and localStorage", () => {
        store.commit("setWorkerCount", 2)
        expect(store.state.workerCount).toBe(2)
        expect(localStorage.getItem("workerCount")).toBe("2")
    })
  })

  describe("getters", () => {
    it("tiles returns size squared", () => {
      store.commit("updateSize", 4)
      expect(store.getters.tiles).toBe(16)
    })

    it("color returns hexa with alpha", () => {
        store.commit("updateColor", "#ffffff")
        store.commit("updateAlpha", 100)
        expect(store.getters.color.toLowerCase()).toBe("#ffffffff")
        
        store.commit("updateAlpha", 0)
        expect(store.getters.color.toLowerCase()).toBe("#ffffff00")
    })
  })
})
