export interface HeroBackground {
  url: string
  position: string
}

export interface HeroBackgroundConfig {
  mode?: 'bing' | 'custom'
  url?: string
  position?: string
}

export interface HomeConfig {
  hero?: HeroBackgroundConfig
}
