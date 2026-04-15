import { describe, it, expect, vi } from "vitest"
import { API, APIRequestError, APIServerError } from "../api"
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

    it("should throw a server error for 5xx search responses", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            status: 503,
            json: vi.fn()
        }))

        await expect(api.search("query", "anime")).rejects.toBeInstanceOf(APIServerError)
        vi.unstubAllGlobals()
    })

    it("should throw a request error when fetch fails before returning a response", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

        await expect(api.search("query", "anime")).rejects.toBeInstanceOf(APIRequestError)
        vi.unstubAllGlobals()
    })
})
