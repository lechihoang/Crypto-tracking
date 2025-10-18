export interface SourceSelector {
  title: string;
  content: string;
  articles: string;
  link: string;
}

export interface CryptoSource {
  name: string;
  baseUrl: string;
  newsUrl: string;
  selector: SourceSelector;
}
