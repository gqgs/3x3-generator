import { describe, expect, it, vi } from "vitest"
import { createProject, hydrateProject, parseProject } from "../project"
import { State } from "../store"

const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="

const baseState = (): State => ({
  show_search: false,
  selected_id: 1,
  updater: vi.fn(),
  images: {
    "1": {
      bitmap: {} as ImageBitmap,
      url: dataUrl,
      title: "One",
      sourceUrl: "https://example.com/one.png",
      sourceDataUrl: dataUrl,
      cropData: { x: 0, y: 0, width: 1, height: 1, rotate: 0, scaleX: 1, scaleY: 1 },
      cropBoxData: { left: 0, top: 0, width: 100, height: 100 },
      canvasData: { left: 0, top: 0, width: 100, height: 100, naturalWidth: 1, naturalHeight: 1 }
    }
  },
  size: 3,
  cached_source: null,
  color: "#ffffff",
  alpha: 50,
  draggedImage: null,
  downloading: false,
  progress: 0,
  upscaleModel: "Swin2SR",
  workerCount: 3,
  forceUpscale: false,
  includeTitles: false
})

describe("project files", () => {
  it("serializes settings and selected images", () => {
    const state = baseState()
    state.upscaleModel = "HFA2kShallowESRGAN"
    const project = createProject(state, {
      cellSize: 400,
      search: { api: "Anilist", tab: "anime", query: "lain" }
    })

    expect(project.app).toBe("3x3-generator")
    expect(project.version).toBe(1)
    expect(project.settings.size).toBe(3)
    expect(project.settings.cellSize).toBe(400)
    expect(project.settings.upscaleModel).toBe("HFA2kShallowESRGAN")
    expect(project.settings.includeTitles).toBe(false)
    expect(project.search.query).toBe("lain")
    expect(project.images["1"]).toMatchObject({
      title: "One",
      croppedDataUrl: dataUrl,
      sourceDataUrl: dataUrl
    })
  })

  it("parses a valid project", () => {
    const project = createProject(baseState(), {
      cellSize: 200,
      search: { api: "Jikan", tab: "manga", query: "" }
    })

    expect(parseProject(JSON.stringify(project)).settings.cellSize).toBe(200)
  })

  it("serializes and parses the title overlay setting", () => {
    const state = baseState()
    state.includeTitles = true
    const project = createProject(state, {
      cellSize: 400,
      search: { api: "Jikan", tab: "manga", query: "" }
    })

    expect(project.settings.includeTitles).toBe(true)
    expect(parseProject(JSON.stringify(project)).settings.includeTitles).toBe(true)
  })

  it("defaults missing title overlay settings to disabled", () => {
    const project = createProject(baseState(), {
      cellSize: 400,
      search: { api: "Jikan", tab: "manga", query: "" }
    }) as any
    delete project.settings.includeTitles

    expect(parseProject(JSON.stringify(project)).settings.includeTitles).toBe(false)
  })

  it("accepts numeric strings from earlier project exports", () => {
    const project = createProject(baseState(), {
      cellSize: 400,
      search: { api: "Jikan", tab: "manga", query: "" }
    }) as any
    project.settings.cellSize = "400"
    project.settings.workerCount = "9"

    const parsed = parseProject(JSON.stringify(project))

    expect(parsed.settings.cellSize).toBe(400)
    expect(parsed.settings.workerCount).toBe(9)
  })

  it("rejects unsupported project files", () => {
    expect(() => parseProject(JSON.stringify({ app: "other", version: 1 }))).toThrow("Unsupported project file")
  })

  it("rejects images outside the grid", () => {
    const project = createProject(baseState(), {
      cellSize: 400,
      search: { api: "Anilist", tab: "anime", query: "" }
    })
    project.images["10"] = project.images["1"]

    expect(() => parseProject(JSON.stringify(project))).toThrow("Project image id is invalid")
  })

  it("hydrates image bitmaps after validation", async () => {
    const previousCreateImageBitmap = globalThis.createImageBitmap
    const createImageBitmapMock = vi.fn(async () => ({} as ImageBitmap))
    vi.stubGlobal("createImageBitmap", createImageBitmapMock)
    const project = createProject(baseState(), {
      cellSize: 400,
      search: { api: "Anilist", tab: "anime", query: "" }
    })

    const hydrated = await hydrateProject(parseProject(JSON.stringify(project)))

    expect(createImageBitmapMock).toHaveBeenCalledTimes(1)
    expect(hydrated.images["1"].url).toBe(dataUrl)
    if (previousCreateImageBitmap) {
      vi.stubGlobal("createImageBitmap", previousCreateImageBitmap)
    } else {
      Reflect.deleteProperty(globalThis, "createImageBitmap")
    }
  })
})
