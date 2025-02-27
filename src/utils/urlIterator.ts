import { httpGet } from './utils';

export const baseUrl = 'https://nftscan.com/nftscan/nftSearch'

export default class UrlIterator {
  private preUrls: string[];
  private url: string;
  private pageIndex: number;
  private pageSize: number;
  private tx: string;
  private readonly pageSizeLimit = 20

  constructor(url: string, tx: string, pageSize: number) {
    this.preUrls = []
    this.url = url;
    this.pageIndex = 0;
    this.pageSize = pageSize;
    this.tx = tx;
  }

  async hasNext(): Promise<boolean> {
    if (this.preUrls.length !== 0 ) {
      return true
    }
    const reqUrl = `${baseUrl}?searchValue=${this.tx}&pageIndex=${this.pageIndex}&pageSize=${this.pageSizeLimit}`
    const getRes = await httpGet(reqUrl)
    if (!getRes.status) {
      console.error(`Request ${reqUrl} failed`)
      return false
    }
    let metaJson = JSON.parse(getRes.data)
    return metaJson.data.nftList.length !== 0
  }

  async nextUrls(): Promise<string[]> {
    let nftUrls = this.preUrls.splice(0, this.pageSize)
    while (nftUrls.length < this.pageSize) {
      const reqUrl = `${baseUrl}?searchValue=${this.tx}&pageIndex=${this.pageIndex}&pageSize=${this.pageSizeLimit}`
      const getRes = await httpGet(reqUrl)
      if (!getRes.status) {
        console.error(`Request ${reqUrl} failed`)
        return []
      }
      let metaJson = JSON.parse(getRes.data)
      const nftList = metaJson.data.nftList
      if (nftList.length === 0){
        break
      }
      nftList.forEach((e: any) => {
        if (nftUrls.length < this.pageSize) {
          nftUrls.push(e.cover)
        } else {
          this.preUrls.push(e.cover)
        }
      })
      this.pageIndex++
    }
    return nftUrls
  }
}
