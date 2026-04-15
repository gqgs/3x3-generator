import { SearchResult } from "../types"

export class APIServerError extends Error {
  readonly status: number

  constructor (status: number) {
    super(`API request failed with status ${status}`)
    this.name = "APIServerError"
    this.status = status
  }
}

export const isAPIServerError = (error: unknown): error is APIServerError => {
  return error instanceof APIServerError
}

export class APIRequestError extends Error {
  constructor (cause?: unknown) {
    super("API request failed")
    this.name = "APIRequestError"
    this.cause = cause
  }
}

export const isAPIRequestError = (error: unknown): error is APIRequestError => {
  return error instanceof APIRequestError
}

export abstract class API<APIResult> {
  protected last_id = 0
  readonly has_show_more: boolean = false
  readonly abstract name: string
  readonly abstract tabs: string[]

  protected abstract fetchURL(tab: string, query: string): { url: string, options?: RequestInit }
  protected abstract processResult(result: APIResult, tab: string): SearchResult[]

  protected denormalizeTab(tab: string): string {
    return tab == "character" ? "characters" : tab
  }

  public async search(query: string, tab: string): Promise<SearchResult[]> {
    if (query.length < 3) {
      return []
    }
    const id = ++this.last_id
    const { url, options } = this.fetchURL(tab, query)
    const resp = await this.fetchResponse(url, options)
    if (this.last_id > id) return []
    this.throwIfServerError(resp)
    const data = await resp.json()
    if (this.last_id > id) return []
    const results = this.processResult(data, tab)
    return this.filterValidResults(results)
  }

  protected throwIfServerError(resp: Response): void {
    if (resp.status >= 500 && resp.status < 600) {
      throw new APIServerError(resp.status)
    }
  }

  protected async fetchResponse(url: string, options?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, options)
    } catch (error) {
      throw new APIRequestError(error)
    }
  }

  protected async filterValidResults(results: SearchResult[]): Promise<SearchResult[]> {
    return results.filter(result => { return result.image_url.length > 0 })
  }
}

export abstract class APIWithShowMore<APIResult, APIShowMoreResult> extends API<APIResult> {
  readonly has_show_more = true

  protected abstract showMoreURL({} : { tab?: string, selected: SearchResult }): { url: string }
  protected abstract processShowMoreResult({} : { result: APIShowMoreResult, selected: SearchResult }) : SearchResult[]

  public async showMore({ tab, selected } : { tab: string, selected: SearchResult}): Promise<SearchResult[]> {
    const id = ++this.last_id
    const { url } = this.showMoreURL({ tab, selected })
    const resp = await this.fetchResponse(url)
    if (this.last_id > id) return []
    this.throwIfServerError(resp)
    const result = await resp.json()
    if (this.last_id > id) return []
    const results = this.processShowMoreResult({ result, selected })
    return this.filterValidResults(results)
  }
}
