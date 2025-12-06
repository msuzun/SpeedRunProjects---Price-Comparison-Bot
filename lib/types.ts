/**
 * Type matching the API response for price comparison
 */
export type ComparisonResult = {
  url1: string
  url2: string
  price1: number | null
  price2: number | null
  currency1?: string | null
  currency2?: string | null
  title1?: string | null
  title2?: string | null
  image1?: string | null
  image2?: string | null
  brand1?: string | null
  brand2?: string | null
  category1?: string[] | null
  category2?: string[] | null
  rawPriceText1?: string | null
  rawPriceText2?: string | null
  sourceHint1?: string | null
  sourceHint2?: string | null
  error1?: string
  error2?: string
  timestamp?: number // Unix timestamp in milliseconds
}

