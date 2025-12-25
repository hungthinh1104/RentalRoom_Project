import api from '@/lib/api/client';
import type { AIAnalysisResult, AIChatResponse } from '@/types';

export const aiApi = {
	async healthCheck() {
		const { data } = await api.get<{
			status: string;
			models: { chat: string; embedding: string };
			apiKey: { configured: boolean; valid: boolean };
			timestamp: string;
		}>('/ai/health');
		return data;
	},

	async generateEmbedding(text: string) {
		const { data } = await api.post<{
			embedding: number[];
			dimensions: number;
			model: string;
		}>('/ai/embeddings/generate', { text });
		return data;
	},

	async batchGenerateEmbeddings(texts: string[], batchSize = 10) {
		const { data } = await api.post<{
			embeddings: number[][];
			count: number;
			dimensions: number;
			model: string;
			processingTime: string;
		}>('/ai/embeddings/batch', { texts, batchSize });
		return data;
	},

	async analyzeRoomDescription(description: string) {
		const { data } = await api.post<{
			analysis: AIAnalysisResult;
			model: string;
			processingTime: string;
		}>('/ai/analyze/room-description', { description });
		return data;
	},

	async chat(message: string, context?: string) {
		const { data } = await api.post<AIChatResponse>('/ai/chat', {
			message,
			context,
		});
		return data;
	},
};
