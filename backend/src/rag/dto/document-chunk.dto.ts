export interface DocumentChunk {
  id?: number;
  content: string;
  title: string;
  url: string;
  source: string;
  embedding?: number[];
  metadata?: any;
}
