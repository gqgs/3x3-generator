import { SearchResult } from "../types"

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
    const resp = await fetch(url, options)
    const data = await resp.json()
    if (this.last_id > id) return []
    const results = this.processResult(data, tab)
    return this.filterValidResults(results)
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
    const resp = await fetch(url)
    const result = await resp.json()
    if (this.last_id > id) return []
    const results = this.processShowMoreResult({ result, selected })
    return this.filterValidResults(results)
  }
}