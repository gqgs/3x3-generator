import { describe, it, expect } from "vitest"
import { API } from "../api"
import { SearchResult } from "../../types"

class MockAPI extends API<any> {
    name = "Mock"
    tabs = ["anime", "character"]
    fetchURL(tab: string, query: string) { return { url: "" } }
    processResult(result: any, tab: string) { return [] }
    
    public testDenormalize(tab: string) {
        return this.denormalizeTab(tab)
    }
}

describe("Base API class", () => {
    const api = new MockAPI()

    it("should denormalize character to characters", () => {
        expect(api.testDenormalize("character")).toBe("characters")
    })

    it("should not denormalize anime", () => {
        expect(api.testDenormalize("anime")).toBe("anime")
    })
})
